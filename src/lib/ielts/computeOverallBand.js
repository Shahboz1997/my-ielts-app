/** IELTS half-band steps from 0 through 9. */
export const IELTS_BAND_STEPS = Object.freeze(
  Array.from({ length: 19 }, (_, i) => i * 0.5)
);

/**
 * Round a raw average to the nearest IELTS half band (0, 0.5, …, 9).
 * @param {number} average
 * @returns {number|null}
 */
export function roundToIeltsHalfBand(average) {
  if (!Number.isFinite(average)) return null;
  const clamped = Math.max(0, Math.min(9, average));
  return Math.round(clamped * 2) / 2;
}

/**
 * Extract numeric criterion scores from a check result `criteria` object.
 * @param {Record<string, { score?: number }>|null|undefined} criteria
 * @returns {number[]}
 */
export function criteriaScoresArray(criteria) {
  if (!criteria || typeof criteria !== 'object') return [];
  return Object.values(criteria)
    .map((entry) => {
      const raw = entry?.score ?? entry;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    })
    .filter((n) => n != null);
}

/**
 * Compute overall band from four (or fewer) criterion scores.
 * @param {Record<string, { score?: number }>|null|undefined} criteria
 * @returns {number|null}
 */
export function computeOverallBandFromCriteria(criteria) {
  const scores = criteriaScoresArray(criteria);
  if (scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return roundToIeltsHalfBand(sum / scores.length);
}

/**
 * Clamp and snap a single criterion score to a valid IELTS half band.
 * @param {number} value
 * @returns {number}
 */
export function clampCriterionScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return roundToIeltsHalfBand(Math.max(0, Math.min(9, n))) ?? 0;
}
