import { useMemo } from 'react';
import { STRATUM_WORKSPACE_STORAGE_KEY } from '@/lib/writer/constants';

export function useWriterStorageKeys(session) {
  const userStorageId = useMemo(() => {
    const id = session?.user?.id || session?.user?.email;
    return typeof id === 'string' && id.trim().length > 0 ? id.trim() : 'anon';
  }, [session?.user?.id, session?.user?.email]);

  const workspaceStorageKey = useMemo(
    () => `${STRATUM_WORKSPACE_STORAGE_KEY}:${userStorageId}`,
    [userStorageId]
  );
  const draftStorageKey = useMemo(() => `ielts_draft:${userStorageId}`, [userStorageId]);
  const archiveStorageKey = useMemo(() => `ielts_archive_v5:${userStorageId}`, [userStorageId]);

  return { userStorageId, workspaceStorageKey, draftStorageKey, archiveStorageKey };
}
