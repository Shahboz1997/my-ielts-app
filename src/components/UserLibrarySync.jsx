'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { syncUserLibraryOnLogin } from '@/lib/userLibraryClient.js';

/** Merges word list from localStorage with DB after login. */
export default function UserLibrarySync() {
  const { data: session, status } = useSession();
  const syncedUserIdRef = useRef(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const userId = session?.user?.id;
    if (status !== 'authenticated' || !userId) {
      syncedUserIdRef.current = null;
      return;
    }
    if (syncedUserIdRef.current === userId || inFlightRef.current) return;

    inFlightRef.current = true;
    void syncUserLibraryOnLogin()
      .then(() => {
        syncedUserIdRef.current = userId;
      })
      .finally(() => {
        inFlightRef.current = false;
      });
  }, [status, session?.user?.id]);

  return null;
}
