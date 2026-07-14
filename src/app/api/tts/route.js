import { NextResponse } from 'next/server';
import { safeAuth } from '@/lib/safeAuth';
import { createOpenAIClient, validateOpenAIEnvForRoute, openAIErrorToJsonResponse } from '@/lib/openaiServer.js';
import { requireAuthenticatedAiAccess } from '@/lib/aiRouteGuard.js';
import { alignWordTimingsForAudio } from '@/lib/alignWordTimingsServer.js';

/** WhisperX + long essays need more than the default serverless window. */
export const maxDuration = 60;

export async function POST(req) {
  try {
    const envError = validateOpenAIEnvForRoute();
    if (envError) return envError;

    const session = await safeAuth();
    const access = await requireAuthenticatedAiAccess(req, session, 'tts');
    if (!access.ok) return access.response;

    const clientResult = createOpenAIClient();
    if (clientResult.error) return clientResult.error;
    const openai = clientResult.openai;

    const { text, filename } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing "text"' }, { status: 400 });
    }
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Missing "filename"' }, { status: 400 });
    }

    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (!cleanText) {
      return NextResponse.json({ error: 'Text is empty' }, { status: 400 });
    }

    // gpt-4o-mini-tts hard limit is ~2000 input chars; keep headroom.
    const TTS_MAX_CHARS = 2000;
    const ttsInput =
      cleanText.length > TTS_MAX_CHARS
        ? `${cleanText.slice(0, TTS_MAX_CHARS - 1).trim()}…`
        : cleanText;

    const ttsModel = (process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts').trim();

    let buffer;
    try {
      const mp3 = await openai.audio.speech.create({
        model: ttsModel,
        voice: 'alloy',
        input: ttsInput,
      });
      buffer = Buffer.from(await mp3.arrayBuffer());
    } catch (ttsErr) {
      console.error('[api/tts] speech.create failed:', {
        status: ttsErr?.status ?? ttsErr?.statusCode,
        code: ttsErr?.code ?? ttsErr?.error?.code,
        message: ttsErr?.message ?? ttsErr?.error?.message,
        ttsModel,
        chars: ttsInput.length,
      });
      const mapped = openAIErrorToJsonResponse(ttsErr);
      if (mapped) return mapped;
      return NextResponse.json(
        { error: ttsErr?.message || 'TTS speech generation failed' },
        { status: 502 }
      );
    }

    let wordTimestamps = [];
    let alignment = null;
    let duration = null;
    try {
      const aligned = await alignWordTimingsForAudio({
        text: ttsInput,
        audioBuffer: buffer,
        openai,
        fileName: 'tts.mp3',
      });
      wordTimestamps = Array.isArray(aligned.words) ? aligned.words : [];
      alignment = aligned.alignment || null;
      duration = aligned.duration || null;
      if (!alignment) {
        console.warn('TTS karaoke align failed; client may use proportional timings:', aligned.error);
      }
    } catch (alignErr) {
      // Never fail the whole TTS response because karaoke alignment failed.
      console.warn('[api/tts] align threw (audio still returned):', alignErr?.message || alignErr);
    }

    return NextResponse.json({
      audioBase64: buffer.toString('base64'),
      wordTimestamps,
      alignment,
      duration,
    });
  } catch (error) {
    console.error('[api/tts] unexpected:', {
      status: error?.status ?? error?.statusCode,
      code: error?.code ?? error?.error?.code,
      message: error?.message ?? error?.error?.message,
    });
    const mapped = openAIErrorToJsonResponse(error);
    if (mapped) return mapped;
    return NextResponse.json({ error: error.message || 'TTS failed' }, { status: 500 });
  }
}
