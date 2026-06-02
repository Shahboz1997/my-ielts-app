export function normalizeWordKey(word) {
  return String(word || '').trim().toLowerCase();
}

/** @param {Array<{ word: string, addedAt?: string }>} local */
/** @param {Array<{ word: string, addedAt?: string }>} server */
export function mergeWordLists(local, server) {
  const byKey = new Map();
  for (const item of [...(server || []), ...(local || [])]) {
    const word = String(item?.word || '').trim();
    if (!word) continue;
    const key = normalizeWordKey(word);
    const existing = byKey.get(key);
    const addedAt = item?.addedAt ? new Date(item.addedAt).getTime() : 0;
    const existingAt = existing?.addedAt ? new Date(existing.addedAt).getTime() : 0;
    if (!existing || addedAt >= existingAt) {
      byKey.set(key, { ...item, word });
    }
  }
  return [...byKey.values()]
    .sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0))
    .slice(0, 500);
}

export function mergeFavoriteTemplateIds(local, server) {
  const ids = new Set();
  for (const id of [...(server || []), ...(local || [])]) {
    const n = Number(id);
    if (Number.isFinite(n) && n > 0) ids.add(n);
  }
  return [...ids].sort((a, b) => a - b);
}
