/**
 * Server-side word timing alignment for TTS karaoke (analysis / archive / shadowing).
 * Prefers Replicate WhisperX when REPLICATE_API_TOKEN is set; falls back to OpenAI whisper-1.
 */
import { toFile } from 'openai';
import {
  alignTextTokensToWhisper,
  tokenizePlainText,
} from '@/lib/karaokeWordAlign.js';

const WHISPERX_MODEL = 'victor-upmeet/whisperx';
const WHISPERX_POLL_MS = 2000;
const WHISPERX_MAX_WAIT_MS = 90_000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function finalizeAlignedWords(inputTokens, whisperWords, reportedDuration = 0) {
  const durationHint =
    (Number.isFinite(reportedDuration) && reportedDuration > 0 ? reportedDuration : 0) ||
    (whisperWords.length > 0 ? Number(whisperWords[whisperWords.length - 1].end) : 0);

  let words = [];
  if (whisperWords.length > 0) {
    const aligned = alignTextTokensToWhisper(inputTokens, whisperWords, {
      totalDuration: durationHint,
    });
    words =
      aligned.length > 0
        ? aligned
        : whisperWords.map((w) => ({
            word: w.word,
            start: Number(w.start),
            end: Number(w.end),
          }));
  }

  let duration =
    (Number.isFinite(reportedDuration) && reportedDuration > 0 ? reportedDuration : 0) ||
    (words.length > 0 ? Number(words[words.length - 1].end) : 0);

  if (words.length > 0 && Number.isFinite(duration) && duration > 0) {
    const last = words[words.length - 1];
    if (Number.isFinite(last.end) && last.end < duration && duration - last.end <= 2) {
      words = words.map((w, i) => (i === words.length - 1 ? { ...w, end: duration } : w));
    }
  }

  // Reject crushed alignments (truncated Whisper output squeezed into a few seconds).
  if (words.length > 8 && whisperWords.length < inputTokens.length * 0.5) {
    const span = Number(words[words.length - 1].end) - Number(words[0].start);
    const durations = words.map((w) => Number(w.end) - Number(w.start)).sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)] || 0;
    if (span > 0 && median > 0 && median < 0.04) {
      throw new Error(
        `Whisper alignment looks truncated (${whisperWords.length} words → crushed karaoke span ${span.toFixed(2)}s).`
      );
    }
  }

  return {
    words,
    duration: Number.isFinite(duration) ? duration : 0,
    whisperWordCount: whisperWords.length,
  };
}

export async function alignWithOpenAIWhisper(openai, text, audioBuffer, fileName = 'tts.mp3') {
  const mime = fileName.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
  const audioFile = await toFile(audioBuffer, fileName, { type: mime });
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
    prompt: text.slice(0, 800),
  });

  const whisperWords = (transcription?.words || []).map((w) => ({
    word: w.word,
    start: Number(w.start),
    end: Number(w.end),
  }));

  if (whisperWords.length === 0) {
    throw new Error('OpenAI Whisper returned no word timestamps.');
  }

  return {
    ...finalizeAlignedWords(tokenizePlainText(text), whisperWords, Number(transcription?.duration)),
    alignment: 'openai:whisper-1',
  };
}

function extractWhisperXWords(output) {
  const segments = Array.isArray(output?.segments)
    ? output.segments
    : Array.isArray(output)
      ? output
      : [];
  const words = [];
  for (const seg of segments) {
    const segWords = Array.isArray(seg?.words) ? seg.words : [];
    for (const w of segWords) {
      const start = Number(w?.start ?? w?.start_time);
      const end = Number(w?.end ?? w?.end_time);
      const token = String(w?.word ?? w?.text ?? '').trim();
      if (!token || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
      words.push({ word: token, start, end });
    }
  }
  return words;
}

async function uploadReplicateFile(token, audioBuffer, fileName) {
  const mime = fileName.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
  const form = new FormData();
  form.append('content', new Blob([audioBuffer], { type: mime }), fileName);
  const res = await fetch('https://api.replicate.com/v1/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Replicate file upload failed (${res.status}): ${body?.detail || body?.error || res.statusText}`
    );
  }
  const url = body?.urls?.get || body?.url;
  if (!url) throw new Error('Replicate file upload returned no URL');
  return url;
}

async function waitForReplicatePrediction(token, prediction) {
  let current = prediction;
  const started = Date.now();
  while (
    current.status !== 'succeeded' &&
    current.status !== 'failed' &&
    current.status !== 'canceled'
  ) {
    if (Date.now() - started > WHISPERX_MAX_WAIT_MS) {
      throw new Error(`WhisperX timed out after ${WHISPERX_MAX_WAIT_MS}ms (status=${current.status})`);
    }
    await sleep(WHISPERX_POLL_MS);
    const res = await fetch(`https://api.replicate.com/v1/predictions/${current.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    current = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`WhisperX poll failed (${res.status}): ${current?.detail || res.statusText}`);
    }
  }
  if (current.status !== 'succeeded') {
    throw new Error(`WhisperX ${current.status}: ${current.error || 'unknown error'}`);
  }
  return current;
}

export async function alignWithReplicateWhisperX(token, text, audioBuffer, fileName = 'tts.mp3') {
  const audioUrl = await uploadReplicateFile(token, audioBuffer, fileName);

  const modelRes = await fetch(`https://api.replicate.com/v1/models/${WHISPERX_MODEL}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const model = await modelRes.json().catch(() => ({}));
  if (!modelRes.ok) {
    throw new Error(
      `WhisperX model lookup failed (${modelRes.status}): ${model?.detail || modelRes.statusText}`
    );
  }
  const version = model?.latest_version?.id;
  if (!version) throw new Error('WhisperX model has no latest_version.id');

  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version,
      input: {
        audio_file: audioUrl,
        align_output: true,
        diarization: false,
        language: 'en',
      },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`WhisperX create failed (${res.status}): ${body?.detail || body?.error || res.statusText}`);
  }

  const done =
    body.status === 'succeeded' ? body : await waitForReplicatePrediction(token, body);

  const whisperWords = extractWhisperXWords(done.output);
  if (whisperWords.length === 0) {
    throw new Error('WhisperX returned no word timestamps.');
  }

  const lastEnd = whisperWords[whisperWords.length - 1]?.end;
  return {
    ...finalizeAlignedWords(tokenizePlainText(text), whisperWords, Number(lastEnd)),
    alignment: 'replicate:victor-upmeet/whisperx',
  };
}

/**
 * Align display text to spoken audio.
 * Prefer Replicate WhisperX. OpenAI whisper-1 is only used when REPLICATE_API_TOKEN
 * is missing — many project-scoped keys lack whisper-1 access and used to surface
 * false "rejected the API key" errors when misclassified.
 */
export async function alignWordTimingsForAudio({
  text,
  audioBuffer,
  openai = null,
  replicateToken = (process.env.REPLICATE_API_TOKEN || '').trim(),
  fileName = 'tts.mp3',
}) {
  const errors = [];

  if (replicateToken) {
    try {
      return await alignWithReplicateWhisperX(replicateToken, text, audioBuffer, fileName);
    } catch (err) {
      errors.push(`whisperx: ${err?.message || err}`);
      console.warn('Replicate WhisperX align failed:', err?.message || err);
    }
  } else if (openai) {
    try {
      return await alignWithOpenAIWhisper(openai, text, audioBuffer, fileName);
    } catch (err) {
      errors.push(`openai-whisper: ${err?.message || err}`);
      console.warn('OpenAI Whisper align failed:', err?.message || err);
    }
  }

  return {
    words: [],
    duration: 0,
    whisperWordCount: 0,
    alignment: null,
    error: errors.join(' | ') || 'No aligner available',
  };
}
