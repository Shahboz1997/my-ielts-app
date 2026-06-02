import {
  clampCriterionScore,
  computeOverallBandFromCriteria,
  IELTS_BAND_STEPS,
} from '@/lib/ielts/computeOverallBand';

export { IELTS_BAND_STEPS };

function cloneCriteria(criteria) {
  if (!criteria || typeof criteria !== 'object') return {};
  const out = {};
  for (const [key, entry] of Object.entries(criteria)) {
    out[key] =
      entry && typeof entry === 'object'
        ? { ...entry, score: clampCriterionScore(entry.score) }
        : { score: clampCriterionScore(entry), comment: '' };
  }
  return out;
}

function snapshotFromResult(result) {
  const criteria = cloneCriteria(result?.criteria);
  const overall =
    computeOverallBandFromCriteria(criteria) ??
    (Number.isFinite(Number(result?.overall_band)) ? clampCriterionScore(result.overall_band) : null);
  return { criteria, overall_band: overall };
}

/** Whether the teacher has overridden AI scores. */
export function isManualScoringActive(result) {
  return result?.scoring?.source === 'manual';
}

/** True when manual scores should be pushed to the server before share. */
export function needsScoringSync(result) {
  return Boolean(result?.savedId && isManualScoringActive(result));
}

/**
 * Apply a criterion score change; returns a new result object (immutable update).
 * @param {object|null} result
 * @param {string} criterionKey
 * @param {number} newScore
 * @returns {object|null}
 */
export function applyManualCriterionScore(result, criterionKey, newScore) {
  if (!result || !criterionKey) return result;

  const score = clampCriterionScore(newScore);
  const prev = result;
  const aiSnapshot =
    prev.scoring?.ai ?? snapshotFromResult(prev);

  const criteria = { ...(prev.criteria || {}) };
  const existing = criteria[criterionKey];
  criteria[criterionKey] =
    existing && typeof existing === 'object'
      ? { ...existing, score }
      : { score, comment: typeof existing === 'string' ? existing : '' };

  const overall_band = computeOverallBandFromCriteria(criteria);

  return {
    ...prev,
    criteria,
    overall_band,
    scoring: {
      source: 'manual',
      ai: aiSnapshot,
      manual: {
        criteria: cloneCriteria(criteria),
        overall_band,
        adjustedAt: new Date().toISOString(),
      },
    },
  };
}

/** Restore AI-original criterion scores and overall band. */
export function resetManualScoring(result) {
  if (!result?.scoring?.ai) return result;

  const { criteria, overall_band } = result.scoring.ai;
  return {
    ...result,
    criteria: cloneCriteria(criteria),
    overall_band,
    scoring: {
      ...result.scoring,
      source: 'ai',
      manual: null,
    },
  };
}

/** Ensure scoring.ai exists after a fresh analyze (optional normalize). */
export function attachAiScoringSnapshot(result) {
  if (!result) return result;
  if (result.scoring?.ai) return result;
  const ai = snapshotFromResult(result);
  return {
    ...result,
    scoring: {
      source: 'ai',
      ai,
      manual: null,
    },
  };
}
