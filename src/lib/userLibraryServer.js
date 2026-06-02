import { normalizeWordKey } from '@/lib/userLibraryMerge.js';

const MAX_WORDS = 500;

function toClientWord(row) {
  const synonyms = Array.isArray(row.synonyms) ? row.synonyms : [];
  return {
    id: row.id,
    word: row.word,
    taskType: row.taskType ?? null,
    source: row.source ?? null,
    note: row.note ?? null,
    synonyms: synonyms.filter(Boolean).slice(0, 8),
    addedAt: row.addedAt instanceof Date ? row.addedAt.toISOString() : String(row.addedAt),
  };
}

export async function getWordListForUser(prisma, userId) {
  const rows = await prisma.wordListItem.findMany({
    where: { userId },
    orderBy: { addedAt: 'desc' },
    take: MAX_WORDS,
  });
  return rows.map(toClientWord);
}

export async function replaceWordListForUser(prisma, userId, items) {
  const list = Array.isArray(items) ? items.slice(0, MAX_WORDS) : [];
  const data = [];
  const seen = new Set();

  for (const raw of list) {
    const word = String(raw?.word || '').trim();
    if (!word || !/[a-zA-Z]/.test(word)) continue;
    const wordKey = normalizeWordKey(word);
    if (seen.has(wordKey)) continue;
    seen.add(wordKey);
    const synonyms = Array.isArray(raw.synonyms) ? raw.synonyms.filter(Boolean).slice(0, 8) : [];
    const addedAt = raw.addedAt ? new Date(raw.addedAt) : new Date();
    data.push({
      userId,
      wordKey,
      word,
      taskType: raw.taskType ? String(raw.taskType) : null,
      source: raw.source ? String(raw.source) : null,
      note: raw.note ? String(raw.note) : null,
      synonyms,
      addedAt: Number.isNaN(addedAt.getTime()) ? new Date() : addedAt,
    });
  }

  await prisma.$transaction([
    prisma.wordListItem.deleteMany({ where: { userId } }),
    ...(data.length ? [prisma.wordListItem.createMany({ data })] : []),
  ]);

  return getWordListForUser(prisma, userId);
}

export async function getFavoriteTemplateIdsForUser(prisma, userId) {
  const rows = await prisma.favoriteTemplate.findMany({
    where: { userId },
    orderBy: { templateId: 'asc' },
    select: { templateId: true },
  });
  return rows.map((r) => r.templateId);
}

export async function replaceFavoriteTemplateIdsForUser(prisma, userId, templateIds) {
  const ids = [...new Set((Array.isArray(templateIds) ? templateIds : []).map(Number).filter((n) => Number.isFinite(n) && n > 0))];

  await prisma.$transaction([
    prisma.favoriteTemplate.deleteMany({ where: { userId } }),
    ...(ids.length
      ? [
          prisma.favoriteTemplate.createMany({
            data: ids.map((templateId) => ({ userId, templateId })),
          }),
        ]
      : []),
  ]);

  return ids;
}
