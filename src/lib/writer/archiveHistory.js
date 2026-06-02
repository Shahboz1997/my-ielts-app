/** Prisma cuid stored on Check rows (archive / history detail). */
export function isHistoryCheckId(id) {
  return typeof id === 'string' && /^c[a-z0-9]{20,}$/i.test(id.trim());
}

/** Prefer server check id so Review opens /history/[id] (AnalyticalLab). */
export function resolveArchiveHistoryId(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const candidates = [entry.checkId, entry.fullData?.savedId, entry.id];
  for (const raw of candidates) {
    const id = typeof raw === 'string' ? raw.trim() : '';
    if (isHistoryCheckId(id)) return id;
  }
  return null;
}
