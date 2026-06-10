import { loadWordListRaw, persistWordList } from '@/lib/wordList.js';
import { mergeWordLists } from '@/lib/userLibraryMerge.js';

async function fetchJson(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || res.statusText || 'Request failed');
  }
  return data;
}

export async function fetchServerWordList() {
  const data = await fetchJson('/api/user/word-list');
  return Array.isArray(data.items) ? data.items : [];
}

export async function putServerWordList(items) {
  const data = await fetchJson('/api/user/word-list', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
  return Array.isArray(data.items) ? data.items : [];
}

/**
 * Merge localStorage with server, push merged state, refresh cache.
 * Call once after login per user id.
 */
export async function syncUserLibraryOnLogin() {
  const localWords = loadWordListRaw();

  let serverWords = [];
  try {
    serverWords = await fetchServerWordList();
  } catch (e) {
    console.warn('[userLibrary] sync fetch failed', e);
    return { ok: false };
  }

  const mergedWords = mergeWordLists(localWords, serverWords);

  try {
    const items = await putServerWordList(mergedWords);
    persistWordList(items);
    return { ok: true, items };
  } catch (e) {
    console.warn('[userLibrary] sync push failed', e);
    persistWordList(mergedWords);
    return { ok: false };
  }
}

export async function pushWordListIfAuthed(items) {
  try {
    const saved = await putServerWordList(items);
    persistWordList(saved);
    return saved;
  } catch (e) {
    console.warn('[userLibrary] word list push failed', e);
    persistWordList(items);
    return items;
  }
}
