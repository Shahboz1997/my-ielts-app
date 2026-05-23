'use client';

import { List } from 'lucide-react';
import WordListContent from '@/components/WordListContent';
import { useWordList } from '@/context/WordListContext';

export default function WordListPage() {
  const { words } = useWordList();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-8">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
            <List className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Word list
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {words.length} saved {words.length === 1 ? 'word' : 'words'} from Task 1 & Task 2
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/5 dark:bg-slate-900/40">
        <WordListContent />
      </div>
    </div>
  );
}
