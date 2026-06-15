import { NextResponse } from 'next/server';
import { safeAuth } from '@/lib/safeAuth';
import { createOpenAIClient, validateOpenAIEnvForRoute, openAIErrorToJsonResponse } from '@/lib/openaiServer.js';
import { requireAuthenticatedAiAccess } from '@/lib/aiRouteGuard.js';
import {
  alignTextTokensToWhisper,
  tokenizePlainText,
} from '@/lib/karaokeWordAlign.js';

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

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const audioFile = new File([buffer], 'tts.mp3', { type: 'audio/mpeg' });

    let wordTimestamps = [];
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['word'],
        // Guide Whisper with the source script so word boundaries match the TTS input.
        prompt: text.slice(0, 800),
      });
      if (transcription?.words?.length) {
        const whisperWords = transcription.words.map((w) => ({
          word: w.word,
          start: Number(w.start),
          end: Number(w.end),
        }));
        const inputTokens = tokenizePlainText(text);
        const aligned = alignTextTokensToWhisper(inputTokens, whisperWords);
        wordTimestamps = aligned.length > 0 ? aligned : whisperWords;
      }
    } catch (whisperErr) {
      console.warn('Whisper word timestamps failed, continuing without:', whisperErr?.message);
    }

    const audioBase64 = buffer.toString('base64');
    return NextResponse.json({
      audioBase64,
      wordTimestamps,
    });
  } catch (error) {
    const mapped = openAIErrorToJsonResponse(error);
    if (mapped) return mapped;
    return NextResponse.json({ error: error.message || 'TTS failed' }, { status: 500 });
  }
}
