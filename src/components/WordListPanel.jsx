'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List } from 'lucide-react';
import { useWordList } from '@/context/WordListContext';

const WORD_LIST_HREF = '/word-list';

const sidebarBtnClass =
  'group relative flex items-center justify-center sm:justify-start gap-3 w-full min-h-[44px] sm:min-h-[48px] px-3 py-3 rounded-xl font-semibold tracking-tight transition-all duration-200';

export default function WordListPanel({ isMobile = false, variant = 'sidebar' }) {
  const { words } = useWordList();
  const pathname = usePathname();
  const isActive = pathname === WORD_LIST_HREF;

  const activeCls = isActive
    ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400'
    : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-[0_0_20px_rgba(79,70,229,0.15)]';

  const countBadge =
    words.length > 0 ? (
      <span className="tabular-nums text-[10px] font-bold text-indigo-500">{words.length}</span>
    ) : null;

  if (variant === 'inline') {
    return (
      <Link
        href={WORD_LIST_HREF}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700/80 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-indigo-500/50 dark:hover:text-indigo-400"
      >
        <span className="inline-flex items-center gap-2">
          <List className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          Word list
          {countBadge}
        </span>
      </Link>
    );
  }

  if (isMobile) {
    return (
      <Link
        href={WORD_LIST_HREF}
        className={`flex flex-1 flex-col items-center justify-center transition-colors ${activeCls}`}
      >
        <span className="group flex items-center justify-center w-10 h-10 rounded-xl transition-transform duration-200 hover:scale-110">
          <List className="w-5 h-5" strokeWidth={1.5} />
        </span>
        <span className="text-[10px] font-medium mt-0.5 truncate max-w-[56px]">
          Words{words.length > 0 ? ` (${words.length})` : ''}
        </span>
      </Link>
    );
  }

  return (
    <Link href={WORD_LIST_HREF} className={`${sidebarBtnClass} ${activeCls}`}>
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-full bg-indigo-600 dark:bg-indigo-400"
          aria-hidden
        />
      )}
      <List className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />
      <span className="hidden sm:inline flex-1 text-left">
        Word list
        {countBadge && <span className="ml-2">{countBadge}</span>}
      </span>
    </Link>
  );
}
