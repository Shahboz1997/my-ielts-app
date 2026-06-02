'use client';

import LetterStrategyPanel from '@/components/LetterStrategyPanel';

export default function TaskStrategySection({ activeTab, activeResult, darkMode, isGtLetter }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-4">
      {activeTab === 'Task 1' && isGtLetter && activeResult?.letter_strategy && (
        <LetterStrategyPanel strategy={activeResult.letter_strategy} />
      )}

      {/* Task 1 Strategy (Academic only): structure + grouping plan */}
      {activeTab === 'Task 1' && !isGtLetter && activeResult?.task1_strategy && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-extrabold tracking-tight text-slate-800 dark:text-slate-100 ml-2">
              Task 1 Strategy
            </h3>
            <div className="shrink-0 rounded-2xl border border-indigo-200/70 dark:border-indigo-500/30 bg-white/80 dark:bg-slate-900/50 px-4 py-2 shadow-sm">
              <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
                Body plan
              </div>
              <div className="text-lg font-black tracking-tight text-indigo-600 dark:text-indigo-300 tabular-nums">
                {Number.isFinite(Number(activeResult.task1_strategy?.recommended_body_count))
                  ? `${Math.max(1, Math.min(3, Number(activeResult.task1_strategy.recommended_body_count)))} body`
                  : '2 body'}
              </div>
            </div>
          </div>

          {Array.isArray(activeResult.task1_strategy?.paragraph_plan) &&
            activeResult.task1_strategy.paragraph_plan.length > 0 && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
                  Recommended paragraph plan
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeResult.task1_strategy.paragraph_plan.slice(0, 8).map((p, i) => (
                    <span
                      key={`plan-${p}-${i}`}
                      className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {Array.isArray(activeResult.task1_strategy?.grouping_plan) &&
            activeResult.task1_strategy.grouping_plan.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                {activeResult.task1_strategy.grouping_plan.slice(0, 2).map((g, idx) => {
                  const label = typeof g?.label === 'string' ? g.label : `Body ${idx + 1}`;
                  const focus = typeof g?.focus === 'string' ? g.focus : '';
                  const comps = Array.isArray(g?.comparisons_to_make) ? g.comparisons_to_make : [];
                  return (
                    <div
                      key={`${label}-${idx}`}
                      className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                          {label}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/70 dark:border-amber-600/30 px-2 py-0.5 rounded-full">
                          Grouping
                        </span>
                      </div>
                      {focus ? (
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">Focus:</span>{' '}
                          {focus}
                        </p>
                      ) : null}
                      {comps.length > 0 && (
                        <ul className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
                          {comps.slice(0, 4).map((c, ci) => (
                            <li key={`${label}-c-${ci}`}>{c}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

          {Array.isArray(activeResult.task1_strategy?.what_to_fix) &&
            activeResult.task1_strategy.what_to_fix.length > 0 && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
                  Quick fixes
                </div>
                <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
                  {activeResult.task1_strategy.what_to_fix.slice(0, 8).map((x, i) => (
                    <li key={`fix-${i}`}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
        </section>
      )}
    </div>
  );
}
