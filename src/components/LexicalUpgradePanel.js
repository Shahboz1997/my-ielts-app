'use client';

import { getFirstUpgradeSynonym, normalizeLexicalRow } from '@/lib/lexicalUpgrade';
import AddToWordListButton from '@/components/AddToWordListButton';

/**
 * Lexical upgrade: weak word → C1 / C2 synonym chips.
 */
export default function LexicalUpgradePanel({
  rows = [],
  onReplaceWord,
  setUserText,
  userText = '',
  taskType = null,
  className = '',
  embedded = false,
}) {
  const list = (Array.isArray(rows) ? rows : [])
    .map((row) => normalizeLexicalRow(row))
    .filter((r) => r.band_56_word && (r.c1_synonyms.length > 0 || r.c2_synonyms.length > 0));

  const handleApplyAll = () => {
    if (!setUserText || !userText || list.length === 0) return;
    const entries = list
      .map((row) => {
        const first = getFirstUpgradeSynonym(row);
        return first ? { weakWord: row.band_56_word, firstSyn: first } : null;
      })
      .filter(Boolean);
    if (entries.length === 0) return;
    const lower = userText.toLowerCase();
    const replacements = entries
      .map(({ weakWord, firstSyn }) => {
        const idx = lower.indexOf(weakWord.toLowerCase());
        return idx === -1 ? null : { idx, len: weakWord.length, firstSyn };
      })
      .filter(Boolean)
      .sort((a, b) => b.idx - a.idx);
    let result = userText;
    replacements.forEach(({ idx, len, firstSyn }) => {
      result = result.slice(0, idx) + firstSyn + result.slice(idx + len);
    });
    setUserText(result);
  };

  const gridContent =
    list.length === 0 ? (
      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic py-4 text-center">
        No upgrades needed yet. Use more academic language to see suggestions.
      </p>
    ) : (
      <div className={`grid grid-cols-1 gap-3 ${embedded ? '' : 'xl:grid-cols-2'}`}>
        {list.map((row, i) => {
          const { band_56_word: weakWord, c1_synonyms: c1, c2_synonyms: c2 } = row;
          return (
            <div
              key={`${weakWord}-${i}`}
              className="flex flex-col gap-2 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-slate-900/60 px-2.5 py-2"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-medium shrink-0">
                  B5–6
                </span>
                <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-100 italic">
                  {weakWord}
                </span>
                <AddToWordListButton
                  word={weakWord}
                  taskType={taskType}
                  source="lexical_upgrade"
                  synonyms={[...c1, ...c2]}
                  compact
                  className="ml-auto shrink-0"
                />
              </div>
              {c1.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 shrink-0 w-6">
                    C1
                  </span>
                  {c1.map((syn, idx) => (
                    <SynonymChip
                      key={`c1-${weakWord}-${syn}-${idx}`}
                      weakWord={weakWord}
                      syn={syn}
                      tier="c1"
                      rowIndex={i}
                      onReplaceWord={onReplaceWord}
                    />
                  ))}
                </div>
              )}
              {c2.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 shrink-0 w-6">
                    C2
                  </span>
                  {c2.map((syn, idx) => (
                    <SynonymChip
                      key={`c2-${weakWord}-${syn}-${idx}`}
                      weakWord={weakWord}
                      syn={syn}
                      tier="c2"
                      rowIndex={i}
                      onReplaceWord={onReplaceWord}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );

  if (embedded) {
    return <div className={className}>{gridContent}</div>;
  }

  return (
    <div
      className={`rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6 sm:py-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xs dark:bg-indigo-500/10 dark:text-indigo-300"
            aria-hidden
          >
            🪄
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Lexical upgrade
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Swap weak words for sharper choices (C1 / C2)
            </span>
          </div>
        </div>
        {list.length > 0 && setUserText && (
          <button
            type="button"
            onClick={handleApplyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-500/90 hover:bg-amber-500 text-white shadow-sm border border-amber-400/50 transition-colors"
            title="Replace first occurrence of each weak word with the top C2/C1 synonym"
          >
            <span aria-hidden>🪄</span>
            Apply all
          </button>
        )}
      </div>
      <div className="p-3 sm:p-4">{gridContent}</div>
    </div>
  );
}

function SynonymChip({ weakWord, syn, tier, rowIndex, onReplaceWord }) {
  const c1Class =
    'bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/20';
  const c2Class =
    'bg-orange-50 text-orange-800 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-200 dark:hover:bg-orange-500/20';
  return (
    <button
      type="button"
      disabled={!onReplaceWord}
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${tier === 'c2' ? c2Class : c1Class}`}
      onClick={() => onReplaceWord?.(weakWord, syn, 1, rowIndex)}
      title={onReplaceWord ? `Replace "${weakWord}" with "${syn}"` : syn}
    >
      {syn}
    </button>
  );
}