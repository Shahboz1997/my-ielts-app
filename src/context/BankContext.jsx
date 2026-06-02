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
  FAVORITE_TEMPLATES_STORAGE_KEY,
  FAVORITE_TEMPLATES_UPDATED_EVENT,
  loadFavoriteTemplateIds,
  persistFavoriteTemplateIds,
} from '@/lib/bankFavorites.js';
import { pushFavoriteTemplateIdsIfAuthed } from '@/lib/userLibraryClient.js';

const BankContext = createContext(null);

/** Favourite template IDs — localStorage + DB sync when logged in. */
export function BankProvider({ children }) {
  const { status } = useSession();
  const isAuthed = status === 'authenticated';
  const [favoriteIds, setFavoriteIds] = useState([]);

  const refresh = useCallback(() => {
    setFavoriteIds(loadFavoriteTemplateIds());
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    const onStorage = (e) => {
      if (e.key === FAVORITE_TEMPLATES_STORAGE_KEY) refresh();
    };
    window.addEventListener(FAVORITE_TEMPLATES_UPDATED_EVENT, onUpdate);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(FAVORITE_TEMPLATES_UPDATED_EVENT, onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const toggleFavorite = useCallback(
    (id) => {
      const n = Number(id);
      if (!Number.isFinite(n)) return;
      setFavoriteIds((prev) => {
        const next = prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n];
        persistFavoriteTemplateIds(next);
        if (isAuthed) {
          void pushFavoriteTemplateIdsIfAuthed(next);
        }
        return next;
      });
    },
    [isAuthed]
  );

  const isFavorite = useCallback(
    (id) => favoriteIds.includes(Number(id)),
    [favoriteIds]
  );

  const value = useMemo(
    () => ({ favoriteIds, toggleFavorite, isFavorite }),
    [favoriteIds, toggleFavorite, isFavorite]
  );

  return <BankContext.Provider value={value}>{children}</BankContext.Provider>;
}

export function useBank() {
  const ctx = useContext(BankContext);
  if (!ctx) {
    throw new Error('useBank must be used within BankProvider');
  }
  return ctx;
}
