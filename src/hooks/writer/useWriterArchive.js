import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DEFAULT_PROMPT_T1_ACADEMIC } from '@/lib/writer/constants';
import { isHistoryCheckId, resolveArchiveHistoryId } from '@/lib/writer/archiveHistory';
import { clearRemoteArchive, saveArchiveEntry } from '@/lib/writer/writerApi';
import { syncResultScoresToServer } from '@/lib/writer/syncManualScores';

export function useWriterArchive({
  archiveStorageKey,
  session,
  sessionStatus,
  activeTab,
  essayT1,
  essayT2,
  promptT1Active,
  promptT2,
  activeResultT1,
  activeResultT2,
  tutorCommentT1,
  tutorCommentT2,
  setTutorCommentT1,
  setTutorCommentT2,
  image,
  setEssayT1,
  setEssayT2,
  setResultT1,
  setResultT2,
  setPromptT1Academic,
  setPromptT1Letter,
  setPromptT2,
  setTask1Kind,
  setImage,
  setActiveTab,
}) {
  const router = useRouter();
  const [archive, setArchive] = useState([]);
  const [archiveSavedT1, setArchiveSavedT1] = useState(false);
  const [archiveSavedT2, setArchiveSavedT2] = useState(false);
  const [isSavingArchive, setIsSavingArchive] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(archiveStorageKey);
      if (saved) setArchive(JSON.parse(saved));
      else setArchive([]);
    } catch (e) {
      console.warn('Archive restore failed', e);
      setArchive([]);
    }
  }, [archiveStorageKey]);

  useEffect(() => {
    setArchiveSavedT1(false);
  }, [activeResultT1]);

  useEffect(() => {
    setArchiveSavedT2(false);
  }, [activeResultT2]);

  useEffect(() => {
    setArchiveSavedT1(false);
  }, [tutorCommentT1]);

  useEffect(() => {
    setArchiveSavedT2(false);
  }, [tutorCommentT2]);

  const clearArchive = async () => {
    if (!window.confirm('Are you sure you want to clear the entire archive?')) return;
    try {
      setArchive([]);
      await clearRemoteArchive();
      localStorage.removeItem(archiveStorageKey);
      localStorage.removeItem('ielts_archive');
      localStorage.removeItem('ielts_archive_v4');
      alert('Archive cleared successfully');
    } catch (e) {
      console.error('Delete error:', e);
      alert('Error clearing database. Please try again.');
    }
  };

  const handleDeleteArchiveEntry = (id) => {
    if (!window.confirm('Delete this archive entry?')) return;
    const updated = archive.filter((entry) => entry.id !== id);
    setArchive(updated);
    try {
      localStorage.setItem(archiveStorageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Archive persist failed', e);
    }
  };

  const handleReviewArchiveEntry = (entry) => {
    if (!entry) return;

    const historyId = resolveArchiveHistoryId(entry);
    if (historyId) {
      router.push(`/history/${historyId}`);
      return;
    }

    if (entry.taskType === 'Task 1') {
      setEssayT1(entry.essay || '');
      setResultT1(entry.fullData || null);
      setTutorCommentT1(
        typeof entry.fullData?.tutor_comment === 'string' ? entry.fullData.tutor_comment : ''
      );
      if (entry.image) setImage(entry.image);
      const prompt = entry.question || entry.prompt || '';
      if (entry.fullData?.task1Kind === 'gt_letter' || (entry.taskType === 'Task 1' && entry.fullData?.letterMeta)) {
        setTask1Kind('gt_letter');
        setPromptT1Letter(prompt);
      } else {
        setTask1Kind('academic');
        setPromptT1Academic(prompt || DEFAULT_PROMPT_T1_ACADEMIC);
      }
      setActiveTab('Task 1');
    } else {
      setEssayT2(entry.essay || '');
      setResultT2(entry.fullData || null);
      setTutorCommentT2(
        typeof entry.fullData?.tutor_comment === 'string' ? entry.fullData.tutor_comment : ''
      );
      const prompt = entry.question || entry.prompt || '';
      if (prompt) setPromptT2(prompt);
      setActiveTab('Task 2');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveCurrentToArchive = async () => {
    if (activeTab !== 'Task 1' && activeTab !== 'Task 2') return;

    const currentEssay = activeTab === 'Task 1' ? essayT1 : essayT2;
    const currentPrompt = activeTab === 'Task 1' ? promptT1Active : promptT2;
    const currentResult = activeTab === 'Task 1' ? activeResultT1 : activeResultT2;
    const currentTutorComment = activeTab === 'Task 1' ? tutorCommentT1 : tutorCommentT2;

    if (!currentResult) {
      toast.error('Nothing to save. Run an analysis first.');
      return;
    }
    if (!currentEssay?.trim()) {
      toast.error('Essay is empty.');
      return;
    }
    if (sessionStatus !== 'authenticated' || !session?.user) {
      toast.error('Sign in to save checks to your archive.');
      return;
    }

    setIsSavingArchive(true);
    try {
      const existingCheckId =
        typeof currentResult.savedId === 'string' ? currentResult.savedId.trim() : '';

      let checkId = isHistoryCheckId(existingCheckId) ? existingCheckId : null;

      if (checkId) {
        const syncRes = await syncResultScoresToServer(currentResult, currentEssay, currentTutorComment);
        if (!syncRes.ok) {
          toast.error(syncRes.error || 'Could not update saved check.');
          return;
        }
      } else {
        const { ok, data } = await saveArchiveEntry({
          type: activeTab === 'Task 1' ? 'TASK_1' : 'TASK_2',
          content: currentEssay,
          score: currentResult.overall_band,
          promptText: currentPrompt || '',
          feedback: { ...currentResult, text: currentEssay, tutor_comment: currentTutorComment || '' },
        });

        if (!ok) {
          toast.error(typeof data.error === 'string' ? data.error : 'Could not save to archive.');
          return;
        }

        checkId = typeof data.id === 'string' ? data.id : null;
        if (checkId && activeTab === 'Task 1') {
          setResultT1((prev) => (prev ? { ...prev, savedId: checkId } : prev));
        } else if (checkId && activeTab === 'Task 2') {
          setResultT2((prev) => (prev ? { ...prev, savedId: checkId } : prev));
        }
      }

      if (activeTab === 'Task 1') setArchiveSavedT1(true);
      else setArchiveSavedT2(true);

      toast.success('Saved to archive');

      const newEntry = {
        id: checkId || Date.now(),
        checkId: checkId || null,
        date: new Date().toLocaleString(),
        taskType: activeTab,
        essay: currentEssay,
        question: currentPrompt || 'No prompt provided',
        image: activeTab === 'Task 1' ? image : null,
        fullData: {
          ...currentResult,
          savedId: checkId || currentResult.savedId || null,
          text: currentEssay,
          tutor_comment: currentTutorComment || '',
        },
      };
      const updated = [newEntry, ...archive];
      setArchive(updated);
      localStorage.setItem(archiveStorageKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Save error:', e);
      toast.error('Error saving to archive.');
    } finally {
      setIsSavingArchive(false);
    }
  };

  return {
    archive,
    archiveSavedT1,
    archiveSavedT2,
    isSavingArchive,
    clearArchive,
    handleDeleteArchiveEntry,
    handleReviewArchiveEntry,
    saveCurrentToArchive,
  };
}
