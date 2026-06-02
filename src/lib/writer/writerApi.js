import { deleteRequest, postJson } from '@/lib/httpClient';

export async function readImageAsDataUrl(file, maxBytes = 6 * 1024 * 1024) {
  if (file?.size && file.size > maxBytes) {
    throw new Error('Image is too large. Please upload an image under 6MB.');
  }

  const imageData = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  if (typeof imageData === 'string' && imageData.startsWith('data:') && imageData.length > 10_000_000) {
    throw new Error('Image is too large after encoding. Please upload a smaller image (or use a URL).');
  }

  return imageData;
}

export async function describeChartImage(imageData) {
  return postJson('/api/check', { describeImage: true, image: imageData });
}

export async function generateLetterTaskRequest() {
  return postJson('/api/check', { generateLetterTask: true });
}

export async function clearRemoteArchive() {
  await deleteRequest('/api/check');
}

export async function saveArchiveEntry(body) {
  const res = await fetch('/api/archive/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data, status: res.status };
}

export async function patchHistoryCheck(id, body) {
  const res = await fetch(`/api/history/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data, status: res.status };
}

export async function createShareLink({ t1Id, t2Id }) {
  const res = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ t1Id, t2Id }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}
