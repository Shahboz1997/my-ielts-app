import { TASK1_LEXICAL, TASK2_LEXICAL, WEAK_WORDS_FALLBACK } from './lexicalMaps';

/** @param {unknown} val */
function parseSynArray(val) {
  if (val == null) return [];
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  return String(val)
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** @param {string} word */
function normalizeWordKey(word) {
  return String(word || '')
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:()'"]/g, '');
}

/** @param {string} phrase */
function escapeRegExp(phrase) {
  return phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

/** @param {string} essay @param {string} phrase */
export function essayContainsPhrase(essay, phrase) {
  if (!essay || !phrase) return false;
  const trimmed = phrase.trim();
  if (!trimmed) return false;
  if (/\s/.test(trimmed)) {
    const re = new RegExp(`\\b${escapeRegExp(trimmed)}\\b`, 'i');
    return re.test(essay);
  }
  // Single headword: match common inflections (increase → increased, increasing).
  const stem = escapeRegExp(trimmed);
  const re = new RegExp(`\\b${stem}(?:s|ed|ing|es|er|est|ly)?\\b`, 'i');
  return re.test(essay);
}

/**
 * Normalize one lexical_upgrade row (API or static) to c1/c2 + legacy band_89_synonyms.
 * @param {Record<string, unknown>} row
 */
export function normalizeLexicalRow(row) {
  const band_56_word = String(row.band_56_word || row.word || '').trim();
  const c1 = parseSynArray(row.c1_synonyms);
  const c2 = parseSynArray(row.c2_synonyms);
  const legacy = parseSynArray(row.band_89_synonyms ?? row.synonyms);
  const c1_synonyms = c1.length > 0 ? c1 : legacy.slice(0, 2);
  const c2_synonyms =
    c2.length > 0 ? c2 : legacy.length > 2 ? legacy.slice(2) : legacy.slice(0, 2);
  const band_89_synonyms = [...new Set([...c1_synonyms, ...c2_synonyms, ...legacy])];
  const c1_example = row.c1_example ? String(row.c1_example).trim() : undefined;
  const c2_example = row.c2_example ? String(row.c2_example).trim() : undefined;
  const collocation_hint = row.collocation_hint ? String(row.collocation_hint).trim() : undefined;
  return {
    band_56_word,
    c1_synonyms,
    c2_synonyms,
    band_89_synonyms,
    source: row.source || 'api',
    collocation_hint: collocation_hint || undefined,
    c1_example: c1_example || undefined,
    c2_example: c2_example || undefined,
  };
}

/**
 * @param {ReturnType<typeof normalizeLexicalRow>} a
 * @param {ReturnType<typeof normalizeLexicalRow>} b
 */
function mergeRows(a, b) {
  const dedupe = (arr) => [...new Set(arr.map((s) => s.toLowerCase()))].map((lower) => {
    return arr.find((s) => s.toLowerCase() === lower) || lower;
  });
  return normalizeLexicalRow({
    band_56_word: a.band_56_word || b.band_56_word,
    c1_synonyms: dedupe([...a.c1_synonyms, ...b.c1_synonyms]),
    c2_synonyms: dedupe([...a.c2_synonyms, ...b.c2_synonyms]),
    band_89_synonyms: dedupe([...a.band_89_synonyms, ...b.band_89_synonyms]),
    source: a.source === 'api' || b.source === 'api' ? 'api' : 'static',
    collocation_hint: a.collocation_hint || b.collocation_hint,
    c1_example: a.c1_example || b.c1_example,
    c2_example: a.c2_example || b.c2_example,
  });
}

/**
 * Merge API lexical_upgrade with static Task 1/2 map for words present in the essay.
 * @param {{ apiRows?: unknown[], essayText?: string, isT1?: boolean }} opts
 */
export function mergeLexicalUpgrades({ apiRows = [], essayText = '', isT1 = true }) {
  const staticMap = isT1 ? TASK1_LEXICAL : TASK2_LEXICAL;
  /** @type {Map<string, ReturnType<typeof normalizeLexicalRow>>} */
  const byWord = new Map();

  const upsert = (row) => {
    const normalized = normalizeLexicalRow(row);
    const key = normalizeWordKey(normalized.band_56_word);
    if (!key) return;
    const existing = byWord.get(key);
    byWord.set(key, existing ? mergeRows(existing, normalized) : normalized);
  };

  (Array.isArray(apiRows) ? apiRows : []).forEach((row) => {
    const word = row?.band_56_word || row?.word;
    if (!word) return;
    if (essayText && !essayContainsPhrase(essayText, String(word))) return;
    upsert({ ...row, source: 'api' });
  });

  Object.entries(staticMap).forEach(([word, entry]) => {
    if (essayText && !essayContainsPhrase(essayText, word)) return;
    upsert({
      band_56_word: word,
      c1_synonyms: entry.c1,
      c2_synonyms: entry.c2,
      c1_example: entry.c1_example,
      c2_example: entry.c2_example,
      collocation_hint: entry.collocation_hint,
      source: 'static',
    });
  });

  return Array.from(byWord.values())
    .filter((r) => r.band_56_word && (r.c1_synonyms.length > 0 || r.c2_synonyms.length > 0))
    .sort((a, b) => a.band_56_word.localeCompare(b.band_56_word));
}

/** @param {unknown[]} rows */
export function getWeakWordsSet(rows) {
  const set = new Set();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const key = normalizeWordKey(row?.band_56_word);
    if (key) set.add(key);
  });
  if (set.size === 0) WEAK_WORDS_FALLBACK.forEach((w) => set.add(w.toLowerCase()));
  return set;
}

/** Prefer C2, then C1, then legacy list. */
export function getFirstUpgradeSynonym(row) {
  const n = normalizeLexicalRow(row);
  return n.c2_synonyms[0] || n.c1_synonyms[0] || n.band_89_synonyms[0] || null;
}

/** Server-side: normalize API rows only (no static merge). */
export function normalizeLexicalUpgradeFromApi(apiRows) {
  if (!Array.isArray(apiRows)) return [];
  return apiRows
    .map((row) => normalizeLexicalRow(row))
    .filter((r) => r.band_56_word && r.band_89_synonyms.length > 0);
}
