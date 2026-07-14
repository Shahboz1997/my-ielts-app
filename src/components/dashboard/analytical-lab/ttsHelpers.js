export function getAudioFilenameBase(taskType) {
  return taskType === 'TASK_1' ? 'Stratum_Task1_Model' : 'Stratum_Task2_Model';
}

function base64ToBlob(base64, mimeType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType || 'audio/mpeg' });
}

export async function fetchTtsWithTimestamps({ text, filenameBase }) {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, filename: filenameBase }),
  });

  if (!response.ok) {
    let message = 'TTS failed';
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const data = await response.json();
  const blob = data.audioBase64 ? base64ToBlob(data.audioBase64) : null;
  if (!blob) throw new Error('No audio received from server.');
  const wordTimestamps = Array.isArray(data.wordTimestamps) ? data.wordTimestamps : [];
  const alignment = typeof data.alignment === 'string' ? data.alignment : null;
  return { blob, wordTimestamps, alignment };
}

/** Wait until the <audio> element can start playback (needed after blob URL updates). */
export function waitForAudioCanPlay(audioEl, timeoutMs = 15000) {
  if (!audioEl) return Promise.reject(new Error('Audio element missing'));
  if (audioEl.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('Audio took too long to load'));
    }, timeoutMs);
    const onCanPlay = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(audioEl.error?.message || 'Audio failed to load'));
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      audioEl.removeEventListener('canplay', onCanPlay);
      audioEl.removeEventListener('error', onError);
    };
    audioEl.addEventListener('canplay', onCanPlay);
    audioEl.addEventListener('error', onError);
    audioEl.load();
  });
}

export async function playAudioElement(audioEl) {
  await waitForAudioCanPlay(audioEl);
  await audioEl.play();
}
