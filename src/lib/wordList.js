export const WORD_LIST_STORAGE_KEY = 'stratum_word_list_v1';
export const WORD_LIST_UPDATED_EVENT = 'stratum_word_list_updated';

function normalizeWord(word) {
  return String(word || '').trim().toLowerCase();
}

export function loadWordListRaw() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WORD_LIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistWordList(list) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WORD_LIST_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(WORD_LIST_UPDATED_EVENT));
  } catch {
    /* ignore quota */
  }
}

/**
 * @param {{ word: string, taskType?: string, source?: string, note?: string, synonyms?: string[] }} entry
 */
export function addWordToList(entry) {
  const word = String(entry?.word || '').trim();
  if (!word || !/[a-zA-Z]/.test(word)) return { ok: false, reason: 'invalid' };

  const list = loadWordListRaw();
  const key = normalizeWord(word);
  if (list.some((item) => normalizeWord(item.word) === key)) {
    return { ok: false, reason: 'duplicate', word };
  }

  const item = {
    id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    word,
    taskType: entry.taskType || null,
    source: entry.source || null,
    note: entry.note || null,
    synonyms: Array.isArray(entry.synonyms) ? entry.synonyms.filter(Boolean).slice(0, 8) : [],
    addedAt: new Date().toISOString(),
  };

  const next = [item, ...list].slice(0, 500);
  persistWordList(next);
  return { ok: true, item };
}

export function removeWordFromList(id) {
  const list = loadWordListRaw();
  const next = list.filter((item) => item.id !== id);
  persistWordList(next);
  return next;
}

export function isWordInList(word) {
  const key = normalizeWord(word);
  if (!key) return false;
  return loadWordListRaw().some((item) => normalizeWord(item.word) === key);
}
