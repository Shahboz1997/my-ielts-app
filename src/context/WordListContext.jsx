'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSession } from 'next-auth/react';
import {
  WORD_LIST_STORAGE_KEY,
  WORD_LIST_UPDATED_EVENT,
  addWordToList,
  loadWordListRaw,
  removeWordFromList,
  isWordInList as checkWordInList,
} from '@/lib/wordList';
import { pushWordListIfAuthed } from '@/lib/userLibraryClient.js';

const WordListContext = createContext(null);

export function WordListProvider({ children }) {
  const { status } = useSession();
  const isAuthed = status === 'authenticated';
  const [words, setWords] = useState([]);

  const refresh = useCallback(() => {
    setWords(loadWordListRaw());
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    const onStorage = (e) => {
      if (e.key === WORD_LIST_STORAGE_KEY) refresh();
    };
    window.addEventListener(WORD_LIST_UPDATED_EVENT, onUpdate);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(WORD_LIST_UPDATED_EVENT, onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const syncToServer = useCallback(
    (list) => {
      if (!isAuthed) return;
      void pushWordListIfAuthed(list);
    },
    [isAuthed]
  );

  const addWord = useCallback(
    (entry) => {
      const result = addWordToList(entry);
      if (result.ok) {
        const list = loadWordListRaw();
        refresh();
        syncToServer(list);
      }
      return result;
    },
    [refresh, syncToServer]
  );

  const removeWord = useCallback(
    (id) => {
      const list = removeWordFromList(id);
      refresh();
      syncToServer(list);
    },
    [refresh, syncToServer]
  );

  const isWordSaved = useCallback((word) => checkWordInList(word), [words]);

  const value = useMemo(
    () => ({ words, addWord, removeWord, isWordSaved, refresh }),
    [words, addWord, removeWord, isWordSaved, refresh]
  );

  return <WordListContext.Provider value={value}>{children}</WordListContext.Provider>;
}

export function useWordList() {
  const ctx = useContext(WordListContext);
  if (!ctx) {
    throw new Error('useWordList must be used within WordListProvider');
  }
  return ctx;
}
