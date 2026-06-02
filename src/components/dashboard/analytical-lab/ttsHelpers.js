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
  const wordTimestamps = Array.isArray(data.wordTimestamps) ? data.wordTimestamps : [];
  return { blob, wordTimestamps };
}
