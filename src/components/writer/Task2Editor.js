'use client';

export default function Task2Editor({ currentTopic }) {
  if (!currentTopic) return null;

  return (
    <div className="mb-6 p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 tracking-tight">Selected Prompt</p>
      <p className="text-lg font-medium text-slate-900 dark:text-white">
        &quot;{currentTopic.q}&quot;
      </p>
    </div>
  );
}
