'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, BookmarkPlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { openCambridgeLookup, resolvePageLookupTerm } from '@/lib/cambridgeDictionary';
import { useWordList } from '@/context/WordListContext';

const sidebarBtnClass =
  'group relative flex items-center justify-center sm:justify-start gap-3 w-full min-h-[48px] px-3 py-3 rounded-xl font-semibold tracking-tight text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-[0_0_20px_rgba(79,70,229,0.15)] transition-all duration-200';

/** Compact sheet above the mobile tab bar (Save word / Look up). */
function MobileLookupSheet({ title, onClose, children }) {
  return (
    <motion.div
      key="mobile-lookup-sheet"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-[max(6rem,calc(5.25rem+env(safe-area-inset-bottom)))] sm:hidden"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-lookup-sheet-title"
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-[1] w-full max-w-[19rem] rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-3.5 shadow-2xl shadow-black/20"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3
            id="mobile-lookup-sheet-title"
            className="text-sm font-bold tracking-tight text-slate-900 dark:text-white"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function CambridgeSidebarLookup({ isMobile = false, variant = 'sidebar' }) {
  const { addWord } = useWordList();
  const [showInput, setShowInput] = useState(false);
  const [showWordListInput, setShowWordListInput] = useState(false);
  /** @type {null | 'lookup' | 'wordlist'} */
  const [mobileSheet, setMobileSheet] = useState(null);
  const [word, setWord] = useState('');
  const [wordListDraft, setWordListDraft] = useState('');
  const inputRef = useRef(null);
  const wordListInputRef = useRef(null);

  const closeMobileSheet = () => setMobileSheet(null);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  useEffect(() => {
    if (showWordListInput && wordListInputRef.current) {
      wordListInputRef.current.focus();
    }
  }, [showWordListInput]);

  useEffect(() => {
    if (mobileSheet && mobileSheet === 'wordlist' && wordListInputRef.current) {
      wordListInputRef.current.focus();
    }
    if (mobileSheet && mobileSheet === 'lookup' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mobileSheet]);

  const submit = (raw) => {
    const term = String(raw || '').trim();
    if (openCambridgeLookup(term)) {
      setWord('');
      setShowInput(false);
      closeMobileSheet();
    }
  };

  const handleLookup = () => {
    const fromPage = resolvePageLookupTerm();
    if (fromPage) {
      openCambridgeLookup(fromPage);
      setShowInput(false);
      return;
    }
    if (isMobile) {
      setMobileSheet('lookup');
      return;
    }
    setShowInput((v) => !v);
    setShowWordListInput(false);
  };

  const saveWordToList = (raw, taskType = null) => {
    const term = String(raw || '').trim();
    if (!term || !/[a-zA-Z]/.test(term)) return false;
    const result = addWord({ word: term, taskType, source: 'sidebar' });
    if (result.ok) {
      toast.success(`Added "${term}" to word list`, { duration: 2200 });
      setWordListDraft('');
      setShowWordListInput(false);
      closeMobileSheet();
      return true;
    }
    if (result.reason === 'duplicate') {
      toast('Already in your word list', { icon: '📚', duration: 1800 });
    }
    return false;
  };

  const handleAddToWordList = () => {
    const fromPage = resolvePageLookupTerm();
    if (fromPage) {
      saveWordToList(fromPage);
      return;
    }
    if (isMobile) {
      setMobileSheet('wordlist');
      return;
    }
    setShowWordListInput((v) => !v);
    setShowInput(false);
  };

  const handleWordListSubmit = (e) => {
    e.preventDefault();
    saveWordToList(wordListDraft);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit(word);
  };

  if (variant === 'floating') {
    return (
      <div className="relative flex flex-col items-end gap-2">
        <AnimatePresence>
          {showWordListInput && (
            <motion.form
              key="word-list-input"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              onSubmit={handleWordListSubmit}
              className="w-[min(calc(100vw-2rem),16rem)] overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 p-2 shadow-xl shadow-black/10 backdrop-blur-md"
            >
              <div className="flex gap-1.5">
                <input
                  ref={wordListInputRef}
                  type="text"
                  value={wordListDraft}
                  onChange={(e) => setWordListDraft(e.target.value)}
                  placeholder="Word to save…"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-emerald-500"
                >
                  Save
                </button>
              </div>
            </motion.form>
          )}
          {showInput && (
            <motion.form
              key="lookup-input"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              onSubmit={handleSubmit}
              className="w-[min(calc(100vw-2rem),16rem)] overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 p-2 shadow-xl shadow-black/10 backdrop-blur-md"
            >
              <div className="flex gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="Word or phrase…"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-indigo-500"
                >
                  Go
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleLookup}
            className="group inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-lg shadow-black/10 backdrop-blur-md transition-all hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-[0.98]"
            title="Look up selected text or type a word — Cambridge Learner's Dictionary"
          >
            <BookOpen className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" strokeWidth={1.5} />
            <span>Look up word</span>
          </button>
          <button
            type="button"
            onClick={handleAddToWordList}
            className="group inline-flex items-center gap-2 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-lg shadow-black/10 backdrop-blur-md transition-all hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-[0.98]"
            title="Save selected word to your word list"
          >
            <BookmarkPlus className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" strokeWidth={1.5} />
            <span>Add to word list</span>
          </button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <>
        <div className="relative flex flex-1 min-h-[56px]">
          <div className="flex w-full items-stretch">
            <button
              type="button"
              onClick={handleLookup}
              className="flex flex-1 flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors active:scale-[0.98]"
              title="Look up word in Cambridge Learner's Dictionary"
            >
              <motion.span
                whileTap={{ scale: 0.92 }}
                className="flex items-center justify-center w-10 h-10 rounded-xl"
              >
                <BookOpen className="w-5 h-5" strokeWidth={1.5} />
              </motion.span>
              <span className="text-[10px] font-medium mt-0.5 truncate max-w-[56px]">Word</span>
            </button>
            <button
              type="button"
              onClick={handleAddToWordList}
              className="flex flex-1 flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors active:scale-[0.98]"
              title="Add selected word to word list"
            >
              <motion.span
                whileTap={{ scale: 0.92 }}
                className="flex items-center justify-center w-10 h-10 rounded-xl"
              >
                <BookmarkPlus className="w-5 h-5" strokeWidth={1.5} />
              </motion.span>
              <span className="text-[10px] font-medium mt-0.5 truncate max-w-[56px]">Save</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileSheet === 'wordlist' && (
            <MobileLookupSheet title="Add to word list" onClose={closeMobileSheet}>
              <form onSubmit={handleWordListSubmit} className="space-y-2.5">
                <input
                  ref={wordListInputRef}
                  type="text"
                  value={wordListDraft}
                  onChange={(e) => setWordListDraft(e.target.value)}
                  placeholder="Type a word…"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-500 active:scale-[0.98]"
                >
                  Save word
                </button>
              </form>
            </MobileLookupSheet>
          )}
          {mobileSheet === 'lookup' && (
            <MobileLookupSheet title="Look up word" onClose={closeMobileSheet}>
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="Word or phrase…"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-indigo-500 active:scale-[0.98]"
                >
                  Open Cambridge
                </button>
              </form>
            </MobileLookupSheet>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleLookup}
        className={sidebarBtnClass}
        title="Look up selected text or type a word — Cambridge Learner's Dictionary"
      >
        <BookOpen
          className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
          strokeWidth={1.5}
        />
        <span className="hidden sm:inline">Look up word</span>
      </button>
      <button
        type="button"
        onClick={handleAddToWordList}
        className={sidebarBtnClass}
        title="Save selected word to your word list"
      >
        <BookmarkPlus
          className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
          strokeWidth={1.5}
        />
        <span className="hidden sm:inline">Add to word list</span>
      </button>
      <AnimatePresence>
        {showWordListInput && (
          <motion.form
            key="word-list-input"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleWordListSubmit}
            className="overflow-hidden px-1"
          >
            <div className="flex gap-1.5">
              <input
                ref={wordListInputRef}
                type="text"
                value={wordListDraft}
                onChange={(e) => setWordListDraft(e.target.value)}
                placeholder="Word to save…"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-emerald-500"
              >
                Save
              </button>
            </div>
          </motion.form>
        )}
        {showInput && (
          <motion.form
            key="lookup-input"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="overflow-hidden px-1"
          >
            <div className="flex gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Word or phrase…"
                className="min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-indigo-500"
              >
                Go
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
