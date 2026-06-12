'use client';

import { Check, Loader2, MessageSquareText, Save } from 'lucide-react';

const MAX_CHARS = 2000;

export default function TutorCommentSection({
  value,
  onChange,
  darkMode,
  onSave,
  saveLoading,
  isSaved,
  saveDisabled,
}) {
  const charCount = value?.length ?? 0;
  const hasComment = Boolean(value?.trim());
  const saveReady = hasComment && !saveDisabled && !saveLoading && !isSaved;

  const btnBase =
    'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium normal-case tracking-normal transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

  const btnNeutral = darkMode
    ? 'border border-amber-500/25 bg-slate-900/60 text-amber-100 hover:bg-slate-900/80'
    : 'border border-amber-200/90 bg-white text-amber-950 hover:bg-amber-50';

  const btnSaveReady =
    'border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-500/35 hover:bg-emerald-500 ring-2 ring-emerald-400/50';

  const btnSaveSaved = darkMode
    ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800';

  return (
    <section
      aria-label="Tutor notes"
      className={`mt-4 rounded-2xl border p-4 sm:p-5 ${
        darkMode
          ? 'border-amber-500/25 bg-amber-950/20'
          : 'border-amber-200/80 bg-amber-50/60'
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <MessageSquareText
          className={`h-4 w-4 shrink-0 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}
          aria-hidden
        />
        <h3
          className={`text-sm font-bold tracking-tight ${darkMode ? 'text-amber-100' : 'text-amber-950'}`}
        >
          Tutor&apos;s notes
        </h3>
        <span
          className={`ml-auto text-[10px] font-semibold tabular-nums ${
            charCount > MAX_CHARS
              ? 'text-rose-600 dark:text-rose-400'
              : darkMode
                ? 'text-amber-400/70'
                : 'text-amber-700/70'
          }`}
        >
          {charCount} / {MAX_CHARS}
        </span>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
        placeholder="Leave feedback for the student — strengths, priorities, homework…"
        rows={4}
        className={`min-h-[120px] w-full resize-y rounded-xl border px-3.5 py-3 text-sm leading-relaxed outline-none transition-colors focus:ring-2 focus:ring-amber-400/40 ${
          darkMode
            ? 'border-amber-500/20 bg-slate-900/50 text-slate-100 placeholder:text-slate-500'
            : 'border-amber-200/90 bg-white text-slate-800 placeholder:text-slate-400'
        }`}
      />

      <div
        className="mt-3 flex flex-row flex-wrap items-center justify-end gap-2"
        role="group"
        aria-label="Tutor notes actions"
      >
        <button
          type="button"
          onClick={onSave}
          disabled={saveLoading || saveDisabled || !hasComment || isSaved}
          className={`${btnBase} w-full sm:w-auto ${
            saveLoading
              ? btnNeutral
              : isSaved
                ? btnSaveSaved
                : saveReady
                  ? btnSaveReady
                  : btnNeutral
          }`}
          title={
            !hasComment
              ? 'Write a comment first'
              : saveDisabled
                ? 'Run Analyze and sign in to save'
                : isSaved
                  ? 'Notes saved'
                  : 'Save tutor notes to archive'
          }
          aria-label={
            saveLoading ? 'Saving tutor notes' : isSaved ? 'Tutor notes saved' : 'Save tutor notes'
          }
        >
          {saveLoading ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
          ) : isSaved ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          ) : (
            <Save className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span>{saveLoading ? 'Saving…' : isSaved ? 'Saved' : 'Save'}</span>
        </button>
      </div>
    </section>
  );
}
