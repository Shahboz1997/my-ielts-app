import { isHistoryCheckId } from '@/lib/writer/archiveHistory';
import { patchHistoryCheck } from '@/lib/writer/writerApi';
import { needsScoringSync } from '@/lib/writer/manualScoring';

export { needsScoringSync };

/**
 * Push manual (or latest) scores to the saved Check row.
 * @param {object} result
 * @param {string} [essayText]
 */
export async function syncResultScoresToServer(result, essayText = '') {
  const id = typeof result?.savedId === 'string' ? result.savedId.trim() : '';
  if (!isHistoryCheckId(id)) {
    return { ok: false, error: 'No saved check id' };
  }

  const score = Number(result.overall_band);
  const feedback = {
    ...result,
    text: essayText || result.text || '',
  };

  const { ok, data } = await patchHistoryCheck(id, {
    score: Number.isFinite(score) ? score : 0,
    feedback,
  });

  if (!ok) {
    return {
      ok: false,
      error: typeof data?.error === 'string' ? data.error : 'Could not save scores',
    };
  }
  return { ok: true, id };
}
