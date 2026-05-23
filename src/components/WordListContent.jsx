'use client';

import { useMemo } from 'react';
import { Trash2, BookOpen } from 'lucide-react';
import { openCambridgeLookup } from '@/lib/cambridgeDictionary';
import { useWordList } from '@/context/WordListContext';

export default function WordListContent({ compact = false }) {
  const { words, removeWord } = useWordList();

  const grouped = useMemo(() => {
    const t1 = words.filter((w) => w.taskType === 'task1' || w.taskType === 'Task 1');
    const t2 = words.filter((w) => w.taskType === 'task2' || w.taskType === 'Task 2');
    const other = words.filter(
      (w) => !['task1', 'task2', 'Task 1', 'Task 2'].includes(w.taskType)
    );
    return { t1, t2, other };
  }, [words]);

  if (words.length === 0) {
    return (
      <p className={`text-slate-500 dark:text-slate-400 italic text-center ${compact ? 'px-2 py-6 text-xs' : 'px-4 py-12 text-sm'}`}>
        No words yet. Save words from Task 1/2 analysis or use Add to word list in the sidebar.
      </p>
    );
  }

  return (
    <div className={compact ? 'space-y-4 p-2' : 'space-y-6 p-4 sm:p-6'}>
      {grouped.t1.length > 0 && (
        <WordGroup title="Task 1" items={grouped.t1} onRemove={removeWord} compact={compact} />
      )}
      {grouped.t2.length > 0 && (
        <WordGroup title="Task 2" items={grouped.t2} onRemove={removeWord} compact={compact} />
      )}
      {grouped.other.length > 0 && (
        <WordGroup title="General" items={grouped.other} onRemove={removeWord} compact={compact} />
      )}
    </div>
  );
}

function WordGroup({ title, items, onRemove, compact }) {
  return (
    <section>
      <h2 className={`font-bold uppercase tracking-wider text-slate-400 ${compact ? 'px-2 pb-2 text-[9px]' : 'pb-3 text-[10px]'}`}>
        {title}
        <span className="ml-2 tabular-nums text-indigo-500">{items.length}</span>
      </h2>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/80 dark:border-white/5 dark:bg-slate-900/50 ${
              compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
            }`}
          >
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => openCambridgeLookup(item.word)}
                className={`text-left font-semibold text-slate-800 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400 ${
                  compact ? 'text-[11px]' : 'text-sm'
                }`}
                title={`Look up "${item.word}" in Cambridge`}
              >
                {item.word}
              </button>
              {item.synonyms?.length > 0 && (
                <p className={`mt-0.5 text-slate-500 dark:text-slate-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                  {item.synonyms.slice(0, 4).join(' · ')}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => openCambridgeLookup(item.word)}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400 transition-colors"
              title="Cambridge"
              aria-label={`Look up ${item.word}`}
            >
              <BookOpen className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40 transition-colors"
              title="Remove"
              aria-label={`Remove ${item.word}`}
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
