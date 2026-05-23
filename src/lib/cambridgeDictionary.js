export const CAMBRIDGE_LEARNER_DICT_BASE =
  'https://dictionary.cambridge.org/dictionary/learner-english';

export const CAMBRIDGE_GRAMMAR_BASE =
  'https://dictionary.cambridge.org/grammar/british-grammar';

export const CAMBRIDGE_GRAMMAR_SEARCH_BASE =
  'https://dictionary.cambridge.org/search/british-grammar/direct/';

const LOOKUP_STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on', 'at', 'for', 'and', 'or',
  'but', 'it', 'this', 'that', 'with', 'as', 'by', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'not', 'no',
  'so', 'if', 'when', 'which', 'who', 'whom', 'what', 'where', 'there', 'their', 'they', 'them',
  'we', 'you', 'your', 'my', 'our', 'his', 'her', 'its',
]);

export function slugifyForCambridge(term) {
  return String(term || '')
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function cambridgeLookupUrl(term) {
  const slug = slugifyForCambridge(term);
  if (!slug) return CAMBRIDGE_LEARNER_DICT_BASE;
  return `${CAMBRIDGE_LEARNER_DICT_BASE}/${encodeURIComponent(slug)}`;
}

export function cambridgeGrammarUrl(term) {
  const lookup = String(term || '').trim();
  if (!lookup || !/[a-zA-Z]/.test(lookup)) {
    return `${CAMBRIDGE_GRAMMAR_BASE}/`;
  }
  return `${CAMBRIDGE_GRAMMAR_SEARCH_BASE}?q=${encodeURIComponent(lookup)}`;
}

export function getWordAtCaret(text, caretPos) {
  const safePos = Math.max(0, Math.min(caretPos ?? 0, String(text || '').length));
  const left = String(text || '').slice(0, safePos);
  const right = String(text || '').slice(safePos);
  const leftMatch = left.match(/[a-zA-Z']+$/);
  const rightMatch = right.match(/^[a-zA-Z']+/);
  const word = `${leftMatch?.[0] || ''}${rightMatch?.[0] || ''}`.replace(/^'+|'+$/g, '').trim();
  return word;
}

export function resolveLookupTerm({ text, selectionStart, selectionEnd }) {
  const source = String(text || '');
  const start = selectionStart ?? 0;
  const end = selectionEnd ?? start;
  const selected = source.slice(start, end).trim();

  if (selected && /[a-zA-Z]/.test(selected)) {
    if (selected.length <= 40) return selected;
    const first = selected.match(/[a-zA-Z']+/);
    return first?.[0] || '';
  }

  return getWordAtCaret(source, start);
}

export function pickLookupTermFromError(original) {
  const s = String(original || '').trim();
  if (!s) return '';

  const words = s.match(/[a-zA-Z']+/g);
  if (!words?.length) return '';
  if (words.length <= 3) return words.join(' ');

  let best = words[0];
  for (const w of words) {
    const lw = w.toLowerCase();
    if (LOOKUP_STOPWORDS.has(lw)) continue;
    if (w.length > best.length) best = w;
  }
  return best;
}

export function resolvePageLookupTerm() {
  if (typeof document === 'undefined') return '';

  const active = document.activeElement;
  if (
    active instanceof HTMLTextAreaElement ||
    (active instanceof HTMLInputElement && active.type === 'text')
  ) {
    const term = resolveLookupTerm({
      text: active.value,
      selectionStart: active.selectionStart,
      selectionEnd: active.selectionEnd,
    });
    if (term) return term;
  }

  const essayEl = document.querySelector('[data-stratum-essay-input]');
  if (essayEl instanceof HTMLTextAreaElement) {
    const term = resolveLookupTerm({
      text: essayEl.value,
      selectionStart: essayEl.selectionStart,
      selectionEnd: essayEl.selectionEnd,
    });
    if (term) return term;
  }

  const selected = window.getSelection?.()?.toString()?.trim() || '';
  if (selected && /[a-zA-Z]/.test(selected)) {
    if (selected.length <= 40) return selected;
    const first = selected.match(/[a-zA-Z']+/);
    return first?.[0] || '';
  }

  return '';
}

export function openCambridgeLookup(term) {
  const lookup = String(term || '').trim();
  if (!lookup || !/[a-zA-Z]/.test(lookup)) return false;
  window.open(cambridgeLookupUrl(lookup), '_blank', 'noopener,noreferrer');
  return true;
}

export function openCambridgeGrammar(term) {
  window.open(cambridgeGrammarUrl(term), '_blank', 'noopener,noreferrer');
  return true;
}
