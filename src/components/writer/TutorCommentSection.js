'use client';

import { MessageSquareText } from 'lucide-react';
import ReportActionButtons from '@/components/writer/ReportActionButtons';

const MAX_CHARS = 2000;

export default function TutorCommentSection({
  value,
  onChange,
  onSave,
  onShare,
  onPdf,
  saveDisabled,
  isSaved,
  isSaving,
  shareLoading,
  pdfDisabled,
  hasSavedAnalysis,
  darkMode,
}) {
  const charCount = value?.length ?? 0;

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

      <ReportActionButtons
        className="mt-3"
        onSave={onSave}
        onShare={onShare}
        onPdf={onPdf}
        saveDisabled={saveDisabled}
        isSaved={isSaved}
        isSaving={isSaving}
        shareLoading={shareLoading}
        pdfDisabled={pdfDisabled}
        hasSavedAnalysis={hasSavedAnalysis}
      />
    </section>
  );
}
