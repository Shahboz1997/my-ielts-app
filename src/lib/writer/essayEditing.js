export function replaceOccurrenceInText(text, original, fixed, occurrenceIndex = 1) {
  let count = 0;
  const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'g');
  return text.replace(regex, (match) => {
    count += 1;
    return count === (occurrenceIndex || 1) ? fixed : match;
  });
}

export function replaceWordAtIndex(currentText, oldWord, newWord, targetIndex) {
  const before = currentText.substring(0, targetIndex);
  const after = currentText.substring(targetIndex + oldWord.length);
  return before + newWord + after;
}

export function findWordOccurrences(text, word) {
  const lowerText = text.toLowerCase();
  const lowerWord = word.toLowerCase().trim();
  const indices = [];
  let idx = lowerText.indexOf(lowerWord);
  while (idx !== -1) {
    indices.push(idx);
    idx = lowerText.indexOf(lowerWord, idx + 1);
  }
  return { indices, lowerWord };
}

export function formatWordForSentence(text, targetIndex, lowerWord) {
  const textBefore = text.substring(0, targetIndex).trimEnd();
  const lastChar = textBefore.slice(-1);
  const isStartOfSentence = targetIndex === 0 || ['.', '!', '?'].includes(lastChar);
  return isStartOfSentence
    ? lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1)
    : lowerWord;
}

export function buildLinkingWordInsertion({ before, after, word }) {
  const isStartOfSentence = /(^|[.!?])\s*$/.test(before);
  let processedWord = isStartOfSentence
    ? word.charAt(0).toUpperCase() + word.slice(1)
    : word.toLowerCase();

  const hasCommaBefore = /,\s*$/.test(before);
  const hasCommaAfter = /^\s*,/.test(after);
  processedWord = processedWord.replace(/,/g, '').trim();

  const prefix = before !== '' && !/\s$/.test(before) && !hasCommaBefore ? ' ' : '';
  const suffix = hasCommaAfter ? '' : ', ';
  const formattedWord = `${prefix}${processedWord}${suffix}`;
  const newText = before + formattedWord + after.replace(/^\s+/, '');

  return { formattedWord, newText };
}
