import { getFirstUpgradeSynonym } from '@/lib/lexicalUpgrade';

export function buildLexicalReplacements(mergedLexicalUpgrade, currentText) {
  const entries = mergedLexicalUpgrade
    .map((row) => {
      const firstSyn = getFirstUpgradeSynonym(row);
      const w = (row.band_56_word || '').trim();
      return w && firstSyn ? { weakWord: w, firstSyn } : null;
    })
    .filter(Boolean);

  if (entries.length === 0) return null;

  const lower = currentText.toLowerCase();
  const replacements = [];
  entries.forEach(({ weakWord, firstSyn }) => {
    const idx = lower.indexOf(weakWord.toLowerCase());
    if (idx !== -1) replacements.push({ idx, firstSyn, len: weakWord.length });
  });
  replacements.sort((a, b) => b.idx - a.idx);

  let result = currentText;
  replacements.forEach(({ idx, firstSyn, len }) => {
    result = result.slice(0, idx) + firstSyn + result.slice(idx + len);
  });
  return result;
}
