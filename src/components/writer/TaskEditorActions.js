'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { ErrorState } from '@/components/stratum';

export default function TaskEditorActions({
  error,
  errorIs401,
  onDismissError,
  onAnalyze,
  analyzeLoading,
  analyzeDisabled,
  creditsExhausted,
}) {
  if (creditsExhausted && !error) return null;

  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-end">
      {error && (
        <div className="w-full sm:flex-1 sm:max-w-md">
          <ErrorState message={error} is401={errorIs401} onDismiss={onDismissError} variant="inline" />
        </div>
      )}
      {!creditsExhausted && (
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
            {analyzeLoading ? 'Analyzing…' : 'ANALYZE · STRATUM'}
          </span>
        </button>
      )}
    </div>
  );
}
