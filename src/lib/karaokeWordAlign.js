/** Normalize token for matching display text ↔ Whisper output. */
export function normalizeWordToken(w) {
  return String(w || '')
    .replace(/^[.,!?;:'"()[\]]+|[.,!?;:'"()[\]]+$/g, '')
    .toLowerCase();
}

export function tokenizePlainText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

/**
 * Greedy sequential align: each display word → next matching Whisper token.
 * Uses real start/end from Whisper (actual voicing), interpolates only unmatched gaps.
 */
export function alignTextTokensToWhisper(inputTokens, whisperWords) {
  const n = inputTokens.length;
  const m = whisperWords.length;
  if (n === 0 || m === 0) return [];

  const whisperIdxForToken = new Array(n).fill(null);
  let wi = 0;
  const SEARCH_WINDOW = 10;

  for (let ti = 0; ti < n; ti++) {
    const target = normalizeWordToken(inputTokens[ti]);
    if (!target) continue;

    let found = -1;
    for (let w = wi; w < Math.min(wi + SEARCH_WINDOW, m); w++) {
      if (normalizeWordToken(whisperWords[w]?.word) === target) {
        found = w;
        break;
      }
    }
    if (found >= 0) {
      whisperIdxForToken[ti] = found;
      wi = found + 1;
    }
  }

  const matchedCount = whisperIdxForToken.filter((x) => x !== null).length;
  if (matchedCount < Math.max(3, Math.floor(n * 0.25))) {
    return mapProportionalTimings(inputTokens, whisperWords);
  }

  const aligned = new Array(n).fill(null);
  for (let ti = 0; ti < n; ti++) {
    const wj = whisperIdxForToken[ti];
    if (wj === null) continue;
    const start = Number(whisperWords[wj]?.start);
    const end = Number(whisperWords[wj]?.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    aligned[ti] = { word: inputTokens[ti], start, end };
  }

  const matchedIdx = [];
  for (let i = 0; i < n; i++) if (aligned[i]) matchedIdx.push(i);
  if (matchedIdx.length === 0) return mapProportionalTimings(inputTokens, whisperWords);

  for (let mi = 0; mi < matchedIdx.length - 1; mi++) {
    const a = matchedIdx[mi];
    const b = matchedIdx[mi + 1];
    const gap = b - a - 1;
    if (gap <= 0) continue;
    const left = aligned[a];
    const right = aligned[b];
    const t0 = left.end;
    const t1 = right.start;
    if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 <= t0) continue;
    const step = (t1 - t0) / (gap + 1);
    for (let k = 1; k <= gap; k++) {
      const idx = a + k;
      aligned[idx] = {
        word: inputTokens[idx],
        start: t0 + step * (k - 1),
        end: t0 + step * k,
      };
    }
  }

  const first = matchedIdx[0];
  if (first > 0) {
    const right = aligned[first];
    const span = Math.max(0.06, right.end - right.start || 0.15);
    const step = span / (first + 1);
    for (let i = first - 1; i >= 0; i--) {
      const e = right.start - step * (first - i);
      const s = e - step;
      aligned[i] = { word: inputTokens[i], start: Math.max(0, s), end: Math.max(0, e) };
    }
  }

  const last = matchedIdx[matchedIdx.length - 1];
  if (last < n - 1) {
    const left = aligned[last];
    const span = Math.max(0.06, left.end - left.start || 0.15);
    const step = span / (n - last);
    let cur = left.end;
    for (let i = last + 1; i < n; i++) {
      aligned[i] = { word: inputTokens[i], start: cur, end: cur + step };
      cur += step;
    }
  }

  if (aligned.some((x) => !x)) return mapProportionalTimings(inputTokens, whisperWords);
  return aligned;
}

/** Fallback: map each display word to a slice of Whisper timeline by index ratio. */
export function mapProportionalTimings(inputTokens, whisperWords) {
  const n = inputTokens.length;
  const m = whisperWords.length;
  if (n === 0 || m === 0) return [];
  if (Math.abs(n - m) / Math.max(n, m) > 0.25) return [];

  const result = [];
  for (let i = 0; i < n; i++) {
    const j0 = Math.floor((i * m) / n);
    const j1 = Math.min(m - 1, Math.max(j0, Math.floor(((i + 1) * m) / n) - 1));
    const start = Number(whisperWords[j0]?.start);
    const end = Number(whisperWords[j1]?.end ?? whisperWords[j0]?.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
    result.push({ word: inputTokens[i], start, end });
  }
  return result;
}

/** Active word = whose [start, end) contains audio currentTime (no manual offset). */
export function findActiveWordIndexFromTimings(timings, currentSec) {
  if (!timings?.length || !Number.isFinite(currentSec)) return -1;

  for (let i = 0; i < timings.length; i++) {
    const start = Number(timings[i].start);
    const end = Number(timings[i].end);
    if (currentSec >= start && currentSec < end) return i;
  }

  for (let i = timings.length - 1; i >= 0; i--) {
    if (currentSec >= Number(timings[i].start)) return i;
  }
  return -1;
}
