'use client';

import { motion, AnimatePresence } from 'framer-motion';
import AddToWordListButton from '@/components/AddToWordListButton';
import { SuccessState } from '@/components/stratum';

export default function CorrectionsList({
  activeTab,
  darkMode,
  loadingT1,
  loadingT2,
  activeResult,
  appliedCorrections,
  handleReplaceWord,
  speak,
}) {
  if (activeTab === 'Task 1' ? loadingT1 : loadingT2) return null;

  const correctionItems = (() => {
    const corrections = Array.isArray(activeResult?.corrections) ? activeResult.corrections : [];
    if (corrections.length > 0) return corrections;
    const errors = Array.isArray(activeResult?.errors) ? activeResult.errors : [];
    if (errors.length === 0) return [];
    return errors.map((err) => ({
      ...err,
      category: err.category || err.type || err.rule || 'Grammar',
      fixed: err.fixed ?? err.suggestion ?? '',
      explanation: err.explanation || err.impact || '',
    }));
  })();

  return (
    <section
      className={`w-full min-w-0 overflow-hidden rounded-2xl border shadow-sm sm:rounded-3xl ${
        darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
      }`}
    >
      <header className="border-b border-slate-100 px-4 py-4 dark:border-white/5 sm:px-6 sm:py-5">
        <h3 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg">
          Detailed Corrections
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Grammar, logic, and lexical fixes you can apply to your draft.
        </p>
      </header>

      <div className="p-4 sm:p-6">
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {correctionItems.length > 0 ? (
              correctionItems.map((err, i) => {
                if (appliedCorrections.includes(i)) return null;
                const typeLabel = err.category || err.rule || 'Grammar';
                const recommended = String(err.fixed || err.suggestion || '').trim();
                const canApply =
                  recommended.length > 0 &&
                  recommended.toLowerCase() !== String(err.original || '').trim().toLowerCase();
                return (
                  <motion.div
                    key={err.original + i}
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: 50, scale: 0.9, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.4, ease: 'circOut' }}
                    layout
                    className="group w-full p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-800/30 overflow-hidden"
                  >
                    <div className="flex min-w-0 w-full flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-6">
                      <div className="min-w-0 flex-1 space-y-8">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-indigo-600 uppercase px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border border-indigo-100 dark:border-indigo-800/30">
                              Original Text
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                              {typeLabel}
                            </span>
                          </div>
                          <p className="text-sm sm:text-base font-medium text-slate-400 dark:text-slate-500 line-through decoration-indigo-400/50 leading-relaxed">
                            {err.original}
                          </p>
                          <AddToWordListButton
                            word={err.original}
                            taskType={activeTab === 'Task 1' ? 'task1' : 'task2'}
                            source="correction"
                            note={recommended || err.explanation || null}
                            className="mt-1 ml-0.5"
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-black text-green-600 uppercase px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-800/30">
                              Recommended Correction
                            </span>
                            <button
                              type="button"
                              onClick={() => speak(recommended || err.explanation || '')}
                              className="group/btn p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-green-500 transition-all active:scale-90 shadow-sm"
                            >
                              <svg xmlns="http://www.w3.org" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-slate-400 group-hover/btn:text-white transition-colors">
                                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                <path d="M15.932 7.757a.75.75 0 011.061 0 4.5 4.5 0 010 6.364.75.75 0 01-1.06-1.06 3 3 0 000-4.242.75.75 0 010-1.062z" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-[1.6]">
                            {recommended || '—'}
                          </p>
                          {!canApply && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                              No direct replacement — use the band-score explanation on the right to revise.
                            </p>
                          )}
                          {canApply ? (
                            <button
                              type="button"
                              onClick={() => {
                                const occurrenceIndex = err.occurrenceIndex || 1;
                                handleReplaceWord(err.original, recommended, occurrenceIndex, i);
                              }}
                              className={`mt-4 group/apply flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-extrabold tracking-tight transition-all active:scale-95 shadow-lg
                                ${darkMode
                                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                                  : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-slate-300'
                                }`}
                            >
                              <span className="w-5 h-5 flex items-center justify-center bg-white/20 rounded-lg group-hover/apply:rotate-12 transition-transform">
                                <svg xmlns="http://www.w3.org" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                  <path fillRule="evenodd" d="M15.312 11.424a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 13.586V4a1 1 0 012 0v9.586l1.899-1.899a1 1 0 011.413 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                              Apply & Dismiss
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-col justify-between p-7 sm:p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-inner min-h-[280px] sm:w-[42%] sm:shrink-0">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                              <span className="font-extrabold uppercase text-[10px] text-indigo-600 dark:text-indigo-400 tracking-widest">
                                Type: {typeLabel}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[9px] font-black border border-purple-200 dark:border-purple-800">
                              {err.level || 'B2'}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 leading-[1.7] text-[13px] sm:text-[14px]">
                            <span className="font-extrabold text-indigo-700 dark:text-indigo-300 not-italic">Why? </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{err.explanation || '—'}</span>
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-400 uppercase tracking-widest">Complexity Scale</span>
                            <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 uppercase">Mastery: {err.level === 'C2' ? 'Native' : 'Advanced'}</span>
                          </div>
                          <div className="flex gap-1 h-1">
                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                              <div
                                key={lvl}
                                className={`flex-1 rounded-full transition-all duration-500 ${
                                  err.level === lvl || (lvl === 'B2' && !err.level)
                                    ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)] scale-y-150'
                                    : 'bg-slate-200 dark:bg-slate-800 opacity-30'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 py-8 dark:border-white/5 dark:bg-white/5 sm:py-10">
                <SuccessState message="No corrections found." className="py-0" />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
