'use client';

import { Bookmark, CheckCircle, Download, Loader2, Share2 } from 'lucide-react';

/**
 * Unified Save / Share / PDF actions — single source used under tutor notes (and elsewhere).
 */
export default function ReportActionButtons({
  onSave,
  onShare,
  onPdf,
  saveDisabled,
  isSaved,
  isSaving,
  shareLoading,
  pdfDisabled,
  hasSavedAnalysis,
  compact = false,
  className = '',
}) {
  const btnBase = compact
    ? 'min-h-[2.75rem] flex-1 min-[480px]:flex-none rounded-xl px-4 py-2.5 text-xs'
    : 'min-h-[3.25rem] w-full min-[400px]:w-auto rounded-2xl px-4 py-3.5 text-[11px] sm:min-h-0 sm:py-3.5 sm:text-xs';

  return (
    <div
      className={`grid grid-cols-1 gap-2 min-[400px]:grid-cols-[1fr_auto_auto] ${className}`}
      role="group"
      aria-label="Report actions"
    >
      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled || isSaving || isSaved}
        className={`group/btn inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
          isSaved
            ? 'bg-green-600 text-white'
            : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700'
        } ${btnBase}`}
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin sm:h-5 sm:w-5" aria-hidden />
        ) : isSaved ? (
          <CheckCircle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
        ) : (
          <Bookmark className="h-4 w-4 shrink-0 transition-transform group-hover/btn:-translate-y-0.5 sm:h-5 sm:w-5" aria-hidden />
        )}
        <span className="truncate">{isSaving ? 'Saving…' : isSaved ? 'Saved' : 'Save to Archive'}</span>
      </button>

      <button
        type="button"
        onClick={onShare}
        disabled={shareLoading || saveDisabled}
        className={`inline-flex items-center justify-center gap-2 border border-slate-200 bg-white font-black uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${btnBase}`}
        title={
          hasSavedAnalysis
            ? 'Share full analysis with tutor notes'
            : 'Save to archive first, then share'
        }
        aria-label="Share analysis"
      >
        {shareLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin sm:h-5 sm:w-5" aria-hidden />
        ) : (
          <Share2 className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
        )}
        <span className="truncate">{shareLoading ? 'Loading…' : 'Share'}</span>
      </button>

      <button
        type="button"
        onClick={onPdf}
        disabled={pdfDisabled}
        className={`group/btn inline-flex items-center justify-center gap-2 bg-indigo-600 font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-500 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${btnBase}`}
      >
        <Download className="h-4 w-4 shrink-0 transition-transform group-hover/btn:translate-y-0.5 sm:h-5 sm:w-5" aria-hidden />
        <span className="truncate">Official PDF</span>
      </button>
    </div>
  );
}
