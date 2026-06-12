'use client';

import { Download, Loader2, RotateCcw, Share2 } from 'lucide-react';
import { LoadingState, EmptyState } from '@/components/stratum';
import { IELTS_BAND_STEPS, isManualScoringActive } from '@/lib/writer/manualScoring';
import { clampCriterionScore } from '@/lib/ielts/computeOverallBand';

function formatCriterionLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace('Task Achievement', 'TA')
    .replace('Task Response', 'Task Response');
}

export default function WriterResultsPanel({
  resultsRef,
  loading,
  activeResult,
  darkMode,
  onCriteriaScoreChange,
  onResetToAiScores,
  onPdf,
  onShare,
  pdfDisabled,
  shareDisabled,
  shareLoading,
  hasSavedAnalysis,
}) {
  const manualActive = isManualScoringActive(activeResult);
  const aiOverall = activeResult?.scoring?.ai?.overall_band;

  const btnBase =
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium normal-case tracking-normal transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

  const btnNeutral = darkMode
    ? 'border border-amber-500/25 bg-slate-900/60 text-amber-100 hover:bg-slate-900/80'
    : 'border border-amber-200/90 bg-white text-amber-950 hover:bg-amber-50';

  return (
    <aside
      id="stratum-results-score"
      ref={resultsRef}
      className="order-2 flex h-auto w-full min-w-0 max-w-full scroll-mt-24 flex-col gap-5 sm:gap-6 xl:col-start-2 xl:row-start-1 xl:sticky xl:top-20 xl:self-start"
    >
      {loading ? (
        <div
          className={`min-h-0 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/5 ${darkMode ? 'bg-slate-900/30' : 'bg-white shadow-sm'}`}
        >
          <LoadingState />
        </div>
      ) : !activeResult ? (
        <div
          className={`min-h-0 rounded-3xl border border-dashed transition-all ${darkMode ? 'border-slate-700 bg-slate-900/20' : 'border-slate-200 bg-slate-50/80'}`}
        >
          <EmptyState
            message="Submit your essay to receive instant AI feedback and band score."
            className="text-slate-500 dark:text-slate-400"
          />
        </div>
      ) : (
        <div className="flex h-auto min-w-0 w-full flex-1 flex-col gap-5 overflow-visible sm:gap-6">
          <section
            className={`min-w-0 overflow-hidden rounded-2xl border shadow-sm sm:rounded-3xl ${
              darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
            }`}
          >
            <header
              className={`flex flex-row items-center justify-between gap-4 border-b px-4 py-5 sm:px-6 sm:py-6 ${
                darkMode ? 'border-slate-800 bg-slate-900' : 'border-indigo-100 bg-indigo-50/40'
              }`}
            >
              <p className="min-w-0 text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                Results
              </p>
              <div
                className="flex shrink-0 flex-row items-center gap-2"
                role="group"
                aria-label="Results actions"
              >
                <button
                  type="button"
                  onClick={onShare}
                  disabled={shareLoading || shareDisabled}
                  className={`${btnBase} ${btnNeutral}`}
                  title={
                    hasSavedAnalysis
                      ? 'Share full analysis with tutor notes'
                      : 'Run analysis while signed in to share'
                  }
                  aria-label="Share analysis"
                >
                  {shareLoading ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                  ) : (
                    <Share2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  <span>{shareLoading ? 'Loading…' : 'Share'}</span>
                </button>

                <button
                  type="button"
                  onClick={onPdf}
                  disabled={pdfDisabled}
                  className={`group/btn ${btnBase} bg-indigo-600 text-white hover:bg-indigo-500`}
                  title="Download official PDF report with tutor notes"
                  aria-label="Download PDF report"
                >
                  <Download
                    className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/btn:translate-y-0.5"
                    aria-hidden
                  />
                  <span>Official PDF</span>
                </button>
              </div>
            </header>

            <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
              <div className="min-w-0 space-y-1">
                <h4 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-lg">
                  Band Score
                </h4>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0">
                  <span className="font-black leading-none tracking-tighter text-indigo-600 dark:text-indigo-400 text-[2.75rem] min-[380px]:text-5xl sm:text-6xl">
                    <span data-testid="results-overall-band">{activeResult.overall_band}</span>
                  </span>
                  <span className="text-base font-light text-slate-400 dark:text-slate-500 min-[380px]:text-lg sm:text-xl">
                    / 9.0
                  </span>
                </div>
                {manualActive && aiOverall != null && Number(aiOverall) !== Number(activeResult.overall_band) && (
                  <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                    AI estimate: {aiOverall} — adjusted manually
                  </p>
                )}
                {!manualActive && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Tap a criterion score below to adjust (teacher review).
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Criteria Breakdown
                </h3>
                {manualActive && activeResult?.scoring?.ai && onResetToAiScores && (
                  <button
                    type="button"
                    onClick={onResetToAiScores}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden />
                    Reset to AI
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(activeResult.criteria || {}).map(([key, data]) => {
                  const score = data?.score ?? data;
                  const aiScore = activeResult?.scoring?.ai?.criteria?.[key]?.score;
                  return (
                    <article
                      key={key}
                      className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm transition-all duration-300 hover:border-indigo-200 dark:border-white/5 dark:bg-slate-950/40 dark:hover:border-indigo-500/30 sm:p-5"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                          {formatCriterionLabel(key)}
                        </span>
                        <div className="flex flex-col items-end gap-0.5">
                          <label className="sr-only" htmlFor={`criterion-score-${key}`}>
                            {formatCriterionLabel(key)} band score
                          </label>
                          <select
                            id={`criterion-score-${key}`}
                            data-testid={`criterion-score-${key}`}
                            value={score}
                            onChange={(e) =>
                              onCriteriaScoreChange?.(key, parseFloat(e.target.value, 10))
                            }
                            className="cursor-pointer rounded-xl border-0 bg-indigo-600 px-2 py-1 text-base font-semibold tabular-nums text-white shadow-sm outline-none ring-2 ring-transparent focus:ring-indigo-300 dark:focus:ring-indigo-500"
                            aria-label={`${formatCriterionLabel(key)} score`}
                          >
                            {IELTS_BAND_STEPS.map((step) => (
                              <option key={step} value={step}>
                                {step % 1 === 0 ? step.toFixed(0) : step.toFixed(1)}
                              </option>
                            ))}
                          </select>
                          {manualActive && aiScore != null && Number(aiScore) !== Number(score) && (
                            <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">
                              AI: {aiScore}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="border-t border-slate-100 pt-3 text-xs font-medium leading-relaxed text-slate-600 dark:border-white/5 dark:text-slate-400 sm:text-sm">
                        {data?.comment ?? (typeof data === 'string' ? data : '')}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
}
