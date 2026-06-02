'use client';

export default function PlagiarismAlert({ activeResult }) {
  if (!activeResult.plagiarism) return null;

  const { score, status } = activeResult.plagiarism;

  return (
    <div
      className={`rounded-2xl border-l-4 p-4 sm:p-5 ${
        score > 30
          ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
          : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
          Plagiarism check
        </span>
        <span className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{score}%</span>
      </div>
      <p className="mt-2 text-xs font-medium leading-relaxed text-slate-700 dark:text-slate-300 sm:text-sm">{status}</p>
    </div>
  );
}
