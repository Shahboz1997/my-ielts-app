'use client';

import { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWordList } from '@/context/WordListContext';

export default function AddToWordListButton({
  word,
  taskType = null,
  source = null,
  note = null,
  synonyms = [],
  compact = false,
  className = '',
}) {
  const { addWord, isWordSaved } = useWordList();
  const [justSaved, setJustSaved] = useState(false);
  const trimmed = String(word || '').trim();
  const saved = trimmed ? isWordSaved(trimmed) || justSaved : false;

  if (!trimmed || !/[a-zA-Z]/.test(trimmed)) return null;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const result = addWord({
      word: trimmed,
      taskType,
      source,
      note,
      synonyms: Array.isArray(synonyms) ? synonyms : [],
    });
    if (result.ok) {
      setJustSaved(true);
      toast.success(`Added "${trimmed}" to word list`, { duration: 2200 });
      window.setTimeout(() => setJustSaved(false), 1500);
      return;
    }
    if (result.reason === 'duplicate') {
      toast('Already in your word list', { icon: '📚', duration: 1800 });
    }
  };

  const label = compact ? (saved ? 'Saved' : 'Save') : saved ? 'In word list' : 'Add to word list';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saved}
      className={`inline-flex items-center gap-1 text-[10px] font-semibold transition-colors disabled:cursor-default ${
        saved
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300'
      } ${className}`}
      title={saved ? `"${trimmed}" is in your word list` : `Save "${trimmed}" to word list`}
    >
      {saved ? (
        <BookmarkCheck className="w-3 h-3 shrink-0" strokeWidth={1.5} aria-hidden />
      ) : (
        <Bookmark className="w-3 h-3 shrink-0" strokeWidth={1.5} aria-hidden />
      )}
      <span>{label}</span>
    </button>
  );
}
