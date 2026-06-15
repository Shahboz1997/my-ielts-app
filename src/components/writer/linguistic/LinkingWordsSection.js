'use client';

import { Search, Sparkles } from 'lucide-react';
import AddToWordListButton from '@/components/AddToWordListButton';

export default function LinkingWordsSection({ activeTab, activeResult, triggerHighlight, insertLinkingWord }) {
  const linkingWords = activeResult.analysis?.linking_words;
  const score = linkingWords?.score;

  return (
    <article className="rounded-2xl border border-slate-100/90 bg-slate-50/70 p-4 shadow-inner shadow-slate-900/[0.02] dark:border-white/5 dark:bg-slate-950/50 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500 animate-pulse" aria-hidden />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-800 dark:text-slate-100">
            Linking words
          </span>
        </div>
        {score != null && (
          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">{score}/9.0</span>
        )}
      </div>

      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Found in your essay
      </p>
      <div className="flex flex-wrap gap-2">
        {(linkingWords?.found?.length ?? 0) > 0 ? (
          linkingWords.found.map((w, i) => (
            <span key={`${w}-${i}`} className="inline-flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => triggerHighlight(w)}
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-800 shadow-sm transition-all hover:border-amber-500 active:scale-95 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-500"
              >
                <span className="max-w-[10rem] truncate underline decoration-transparent underline-offset-4 transition-all group-hover:decoration-amber-500 sm:max-w-none">
                  {w}
                </span>
                <Search className="h-3.5 w-3.5 shrink-0 opacity-60 text-amber-600 group-hover:opacity-100 dark:text-amber-400" />
              </button>
              <AddToWordListButton
                word={w}
                taskType={activeTab === 'Task 1' ? 'task1' : 'task2'}
                source="linking_word"
                compact
                className="shrink-0"
              />
            </span>
          ))
        ) : (
          <span className="text-xs italic text-slate-500 dark:text-slate-400">No linking words detected yet.</span>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-amber-300/50 bg-amber-50/70 p-3 dark:border-amber-800/40 dark:bg-amber-950/20 sm:p-4">
        <p className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-amber-800 dark:text-amber-300">
          <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse" aria-hidden />
          Suggested additions
        </p>
        <div className="flex flex-wrap gap-2">
          {(() => {
            const suggestions = linkingWords?.suggestions;
            if (!suggestions?.length) {
              return (
                <span className="text-xs font-medium italic text-slate-600 dark:text-slate-400">
                  Great flow — no extra suggestions needed.
                </span>
              );
            }
            return suggestions.map((s, i) => (
              <span key={`${s}-${i}`} className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertLinkingWord(s)}
                  className="inline-flex max-w-full items-center gap-1 rounded-xl border border-amber-200/80 bg-white px-2.5 py-2 text-[10px] font-bold text-amber-800 shadow-sm transition-all hover:border-amber-500 active:scale-95 dark:border-amber-800/50 dark:bg-slate-800 dark:text-amber-200 dark:hover:border-amber-500 sm:px-3 sm:text-[11px]"
                  title={`Insert "${s}"`}
                >
                  <span className="opacity-50">+</span>
                  <span className="truncate">{s}</span>
                </button>
                <AddToWordListButton
                  word={s}
                  taskType={activeTab === 'Task 1' ? 'task1' : 'task2'}
                  source="linking_suggestion"
                  compact
                />
              </span>
            ));
          })()}
        </div>
      </div>
    </article>
  );
}
