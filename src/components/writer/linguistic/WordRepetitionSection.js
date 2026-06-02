'use client';

import { Search, Sparkles } from 'lucide-react';
import AddToWordListButton from '@/components/AddToWordListButton';

export default function WordRepetitionSection({
  activeTab,
  darkMode,
  activeResult,
  triggerHighlight,
  playClickSound,
  searchState,
  replaceNext,
}) {
  const items = activeResult?.analysis?.word_repetition;
  if (!items?.length) return null;

  return (
    <article className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-slate-950/30 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-hidden />
        <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-800 dark:text-slate-100">
          Frequency alert
        </span>
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => {
          const wordText = typeof item === 'object' ? item.word : item;
          const count = typeof item === 'object' ? item.count : 0;
          const synonyms = item.alternatives || [];
          const wordKey = String(wordText || '').toLowerCase().trim();
          const isFinding = searchState.word === wordKey;

          return (
            <li
              key={`${wordText}-${i}`}
              className={`rounded-2xl border p-3 sm:p-4 ${
                darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-rose-100/80 bg-white shadow-sm'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    &ldquo;{wordText}&rdquo;
                  </span>
                  <span className="shrink-0 rounded-full border border-rose-200/80 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-300">
                    {count}x
                  </span>
                  <AddToWordListButton
                    word={wordText}
                    taskType={activeTab === 'Task 1' ? 'task1' : 'task2'}
                    source="repetition"
                    synonyms={synonyms}
                    compact
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (typeof playClickSound === 'function') playClickSound();
                    triggerHighlight(wordText);
                    setTimeout(() => {
                      const matches = document.querySelectorAll('.search-match');
                      if (matches.length === 0) return;
                      const targetIndex = isFinding ? (searchState.current + 1) % matches.length : 0;
                      matches[targetIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                  }}
                  className={`inline-flex shrink-0 items-center gap-2 self-start rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 sm:self-center ${
                    isFinding
                      ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                  }`}
                >
                  Find
                  {isFinding && searchState.count > 0 && (
                    <span className="tabular-nums">
                      {searchState.current + 1}/{searchState.count}
                    </span>
                  )}
                  <Search className="h-3.5 w-3.5" />
                </button>
              </div>
              {synonyms.length > 0 && (
                <div className="mt-3 border-t border-slate-200/80 pt-3 dark:border-slate-700">
                  <p className="mb-2 flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                    <Sparkles className="h-3 w-3 text-emerald-500" aria-hidden />
                    Band 8+ replacements
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {synonyms.map((syn) => (
                      <button
                        key={`${wordText}-${syn}`}
                        type="button"
                        onClick={() => replaceNext(wordText, syn)}
                        className={`inline-flex max-w-full items-center rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition-all hover:scale-[1.02] active:scale-95 sm:text-[11px] ${
                          darkMode
                            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        }`}
                      >
                        <span className="truncate">+ {syn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
