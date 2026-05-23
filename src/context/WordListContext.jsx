'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  WORD_LIST_STORAGE_KEY,
  WORD_LIST_UPDATED_EVENT,
  addWordToList,
  loadWordListRaw,
  removeWordFromList,
  isWordInList as checkWordInList,
} from '@/lib/wordList';

const WordListContext = createContext(null);

export function WordListProvider({ children }) {
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

  const addWord = useCallback((entry) => {
    const result = addWordToList(entry);
    if (result.ok) refresh();
    return result;
  }, [refresh]);

  const removeWord = useCallback((id) => {
    removeWordFromList(id);
    refresh();
  }, [refresh]);

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
