import React from 'react';

/**
 * CEFR-colored essay overlay for the highlight layer behind the textarea.
 */
export function renderColoredEssayText({ text, analysis, weakWordsSet, darkMode }) {
  const safeText = text || '';
  const wordLevels = Array.isArray(analysis?.word_levels) ? analysis.word_levels : [];
  const errorsArray = Array.isArray(analysis?.errors) ? analysis.errors : [];

  const errorWordsSet = new Set();
  const addErrorWords = (val) => {
    if (!val) return;
    String(val)
      .toLowerCase()
      .split(/\s+/)
      .forEach((w) => {
        const clean = w.replace(/[.,!?;:()]/g, '').trim();
        if (clean) errorWordsSet.add(clean);
      });
  };
  errorsArray.forEach((e) => {
    addErrorWords(e.word || e.original || e.text);
  });

  let wordIndex = 0;
  const parts = safeText.split(/(\s+|[.,!?;:()])/);

  return parts.map((part, i) => {
    if (/^(\s+|[.,!?;:()])$/.test(part)) {
      return <span key={i}>{part}</span>;
    }

    const clean = part.toLowerCase().trim().replace(/[.,!?;:()]/g, '');
    if (!clean) {
      return <span key={i}>{part}</span>;
    }

    const wl = wordLevels[wordIndex] || {};
    const level = wl.level;
    const isError = errorWordsSet.has(clean);
    const isWeak = weakWordsSet.has(clean);
    wordIndex += 1;

    let classes = 'inline';
    if (isError) {
      classes += ' line-through decoration-red-500 decoration-2 text-red-500/60';
    } else if (isWeak) {
      classes +=
        ' bg-amber-100/80 dark:bg-amber-900/30 border-b-2 border-amber-400/70 dark:border-amber-500/50 text-amber-800/90 dark:text-amber-200/90 rounded px-0.5';
    } else if (level === 'A1' || level === 'A2') {
      classes += ' text-slate-400';
    } else if (level === 'B1' || level === 'B2') {
      classes += ' text-indigo-500';
    } else if (level === 'C1' || level === 'C2') {
      classes += ' text-orange-500 font-bold';
    } else {
      classes += darkMode ? ' text-slate-100' : ' text-slate-900';
    }

    return (
      <span key={i} className={classes}>
        {part}
      </span>
    );
  });
}
