'use client';

import { Bookmark, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { ErrorState } from '@/components/stratum';

export default function TaskEditorActions({
  onSave,
  saveDisabled,
  isSaved,
  isSaving,
  error,
  errorIs401,
  onDismissError,
  onAnalyze,
  analyzeLoading,
  analyzeDisabled,
  creditsExhausted,
}) {
  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled || isSaving || isSaved}
        className={`w-full sm:w-auto group flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-extrabold tracking-tight transition-all duration-300 rounded-2xl shadow-sm active:scale-95 disabled:opacity-50 ${
          isSaved
            ? 'bg-green-600 text-white'
            : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700'
        }`}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Saving…</span>
          </>
        ) : isSaved ? (
          <>
            <CheckCircle className="w-4 h-4 animate-bounce" />
            <span>Saved!</span>
          </>
        ) : (
          <>
            <Bookmark className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 text-white" />
            <span>Save to Archive</span>
          </>
        )}
      </button>
      {error && (
        <div className="w-full sm:flex-1 sm:max-w-md">
          <ErrorState message={error} is401={errorIs401} onDismiss={onDismissError} variant="inline" />
        </div>
      )}
      <button
        type="button"
        data-testid="analyze-button"
        onClick={onAnalyze}
        disabled={analyzeLoading || analyzeDisabled}
        className="btn-stratum w-full sm:w-auto sm:min-w-[220px] py-3.5 rounded-2xl flex items-center justify-center gap-3 hover:shadow-[0_0_25px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:pointer-events-none"
      >
        {!analyzeLoading && !analyzeDisabled && (
          <div className="shimmer-layer animate-shimmer" aria-hidden />
        )}
        {analyzeLoading ? (
          <Loader2 className="w-5 h-5 relative z-10 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="w-5 h-5 relative z-10 opacity-90" />
        )}
        <span className="btn-stratum-text">
          {analyzeLoading ? 'Analyzing…' : creditsExhausted ? 'No credits left' : 'ANALYZE · STRATUM'}
        </span>
      </button>
    </div>
  );
}
