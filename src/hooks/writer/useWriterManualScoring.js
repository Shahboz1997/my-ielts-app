'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  applyManualCriterionScore,
  isManualScoringActive,
  needsScoringSync,
  resetManualScoring,
} from '@/lib/writer/manualScoring';
import { syncResultScoresToServer } from '@/lib/writer/syncManualScores';

export { syncResultScoresToServer };

export function useWriterManualScoring({
  activeTab,
  essayT1,
  essayT2,
  activeResultT1,
  activeResultT2,
  setResultT1,
  setResultT2,
}) {
  const setActiveResult = useCallback(
    (updater) => {
      if (activeTab === 'Task 1') {
        setResultT1((prev) => (typeof updater === 'function' ? updater(prev) : updater));
      } else if (activeTab === 'Task 2') {
        setResultT2((prev) => (typeof updater === 'function' ? updater(prev) : updater));
      }
    },
    [activeTab, setResultT1, setResultT2]
  );

  const getEssayForTab = useCallback(
    (tab) => (tab === 'Task 1' ? essayT1 : essayT2),
    [essayT1, essayT2]
  );

  const handleCriteriaScoreChange = useCallback(
    (criterionKey, newScore) => {
      setActiveResult((prev) => applyManualCriterionScore(prev, criterionKey, newScore));
    },
    [setActiveResult]
  );

  const handleResetToAiScores = useCallback(() => {
    setActiveResult((prev) => {
      if (!prev?.scoring?.ai) return prev;
      const next = resetManualScoring(prev);
      const essay = getEssayForTab(activeTab);
      if (next?.savedId) {
        void syncResultScoresToServer(next, essay);
      }
      return next;
    });
    toast.success('Restored AI scores');
  }, [setActiveResult, activeTab, getEssayForTab]);

  const syncActiveTabToServer = useCallback(async () => {
    const result = activeTab === 'Task 1' ? activeResultT1 : activeResultT2;
    if (!needsScoringSync(result)) return { ok: true, skipped: true };
    const essay = getEssayForTab(activeTab);
    const res = await syncResultScoresToServer(result, essay);
    if (!res.ok) {
      toast.error(res.error || 'Could not save adjusted scores');
    }
    return res;
  }, [activeTab, activeResultT1, activeResultT2, getEssayForTab]);

  const syncResultIfNeeded = useCallback(
    async (result, essayText) => {
      if (!needsScoringSync(result)) return { ok: true, skipped: true };
      return syncResultScoresToServer(result, essayText);
    },
    []
  );

  const syncBothTasksIfNeeded = useCallback(async () => {
    const tasks = [
      { result: activeResultT1, essay: essayT1 },
      { result: activeResultT2, essay: essayT2 },
    ];
    for (const { result, essay } of tasks) {
      if (!needsScoringSync(result)) continue;
      const res = await syncResultScoresToServer(result, essay);
      if (!res.ok) return res;
    }
    return { ok: true };
  }, [activeResultT1, activeResultT2, essayT1, essayT2]);

  return {
    handleCriteriaScoreChange,
    handleResetToAiScores,
    syncActiveTabToServer,
    syncResultIfNeeded,
    syncBothTasksIfNeeded,
    isManualScoringActive,
    needsScoringSync,
  };
}
