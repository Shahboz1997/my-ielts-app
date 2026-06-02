import { loadFavoriteTemplateIds, persistFavoriteTemplateIds } from '@/lib/bankFavorites.js';
import { loadWordListRaw, persistWordList } from '@/lib/wordList.js';
import { mergeFavoriteTemplateIds, mergeWordLists } from '@/lib/userLibraryMerge.js';

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

export async function fetchServerFavoriteTemplateIds() {
  const data = await fetchJson('/api/user/favorite-templates');
  return Array.isArray(data.templateIds) ? data.templateIds : [];
}

export async function putServerFavoriteTemplateIds(templateIds) {
  const data = await fetchJson('/api/user/favorite-templates', {
    method: 'PUT',
    body: JSON.stringify({ templateIds }),
  });
  return Array.isArray(data.templateIds) ? data.templateIds : [];
}

/**
 * Merge localStorage with server, push merged state, refresh cache.
 * Call once after login per user id.
 */
export async function syncUserLibraryOnLogin() {
  const localWords = loadWordListRaw();
  const localFavorites = loadFavoriteTemplateIds();

  let serverWords = [];
  let serverFavorites = [];
  try {
    [serverWords, serverFavorites] = await Promise.all([
      fetchServerWordList(),
      fetchServerFavoriteTemplateIds(),
    ]);
  } catch (e) {
    console.warn('[userLibrary] sync fetch failed', e);
    return { ok: false };
  }

  const mergedWords = mergeWordLists(localWords, serverWords);
  const mergedFavorites = mergeFavoriteTemplateIds(localFavorites, serverFavorites);

  try {
    const [items, templateIds] = await Promise.all([
      putServerWordList(mergedWords),
      putServerFavoriteTemplateIds(mergedFavorites),
    ]);
    persistWordList(items);
    persistFavoriteTemplateIds(templateIds);
    return { ok: true, items, templateIds };
  } catch (e) {
    console.warn('[userLibrary] sync push failed', e);
    persistWordList(mergedWords);
    persistFavoriteTemplateIds(mergedFavorites);
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

export async function pushFavoriteTemplateIdsIfAuthed(templateIds) {
  try {
    const saved = await putServerFavoriteTemplateIds(templateIds);
    persistFavoriteTemplateIds(saved);
    return saved;
  } catch (e) {
    console.warn('[userLibrary] favorites push failed', e);
    persistFavoriteTemplateIds(templateIds);
    return templateIds;
  }
}
