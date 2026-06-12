'use client';

export default function Task2Editor({ currentTopic }) {
  if (!currentTopic) return null;

  return (
    <div className="mb-5 sm:mb-6 rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-indigo-50/30 p-5 sm:p-6 dark:border-indigo-800/40 dark:from-indigo-950/30 dark:to-indigo-950/10 ring-1 ring-indigo-500/10">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-500 dark:text-indigo-400">Selected Prompt</p>
      <p className="text-base sm:text-lg font-medium leading-relaxed text-slate-800 dark:text-slate-100">
        &quot;{currentTopic.q}&quot;
      </p>
    </div>
  );
}
