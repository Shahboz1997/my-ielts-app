import 'server-only';
import { Prisma } from '@prisma/client';
import { getPrisma, withPrismaRetry } from '@/lib/prisma';
import { HISTORY_PAGE_SIZE } from '@/lib/historyConstants';

export { HISTORY_PAGE_SIZE } from '@/lib/historyConstants';

function serializeHistoryCheck(row) {
  return {
    id: row.id,
    type: row.type,
    score: row.score != null ? Number(row.score) : null,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    promptText: row.promptText ?? '',
    content: row.content ?? '',
    feedback: row.feedback ?? null,
  };
}

function buildHistoryFilters(userId, { q = '', minScore = 0 } = {}) {
  const search = String(q || '').trim();
  const min = Math.max(0, Number(minScore) || 0);
  const searchPattern = search ? `%${search.replace(/[%_\\]/g, '\\$&')}%` : null;
  const searchCondition = search
    ? Prisma.sql`(content ILIKE ${searchPattern} OR COALESCE("promptText", '') ILIKE ${searchPattern})`
    : Prisma.sql`TRUE`;

  return {
    where: Prisma.sql`
      "userId" = ${userId}
      AND (${min} = 0 OR COALESCE(score, 0) >= ${min})
      AND ${searchCondition}
    `,
  };
}

/**
 * Lightweight history list: indexed lookup, trimmed text fields, criteria-only feedback slice.
 */
export async function getHistoryChecksForUser(userId, opts = {}) {
  const page = Math.max(1, Number(opts.page) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, Number(opts.pageSize) || HISTORY_PAGE_SIZE)
  );
  const skip = (page - 1) * pageSize;
  const sortOrder = opts.sort === 'asc' ? 'asc' : 'desc';
  const orderFragment = sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  const { where } = buildHistoryFilters(userId, opts);

  return withPrismaRetry(async () => {
    const prisma = getPrisma();

    const [rows, countRows] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          id,
          type,
          score,
          "createdAt",
          LEFT(COALESCE("promptText", ''), 200) AS "promptText",
          LEFT(content, 400) AS content,
          CASE
            WHEN feedback IS NULL THEN NULL
            ELSE jsonb_build_object('criteria', feedback->'criteria')
          END AS feedback
        FROM "Check"
        WHERE ${where}
        ORDER BY "createdAt" ${orderFragment}
        LIMIT ${pageSize} OFFSET ${skip}
      `,
      prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM "Check"
        WHERE ${where}
      `,
    ]);

    const total = Number(countRows?.[0]?.count ?? 0);
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;

    return {
      checks: rows.map(serializeHistoryCheck),
      meta: {
        total,
        page,
        pageSize,
        totalPages,
        sort: sortOrder,
        q: String(opts.q || '').trim(),
        minScore: Math.max(0, Number(opts.minScore) || 0),
      },
    };
  });
}

export async function getHistoryCheckForUser(userId, id) {
  return withPrismaRetry(async () => {
    const prisma = getPrisma();
    return prisma.check.findFirst({
      where: { id, userId },
    });
  });
}

export async function patchHistoryCheckForUser(
  userId,
  id,
  { score = null, feedback, feedbackPatch, tutorComment, essayText } = {}
) {
  let patch = feedbackPatch;
  if (!patch && (typeof tutorComment === 'string' || typeof essayText === 'string')) {
    patch = {};
    if (typeof tutorComment === 'string') patch.tutor_comment = tutorComment;
    if (typeof essayText === 'string') patch.text = essayText;
  }

  return withPrismaRetry(
    async () => {
      const prisma = getPrisma();

      if (patch && typeof patch === 'object' && !Array.isArray(patch)) {
        const patchJson = JSON.stringify(patch);
        const rows =
          score !== null
            ? await prisma.$queryRaw`
                UPDATE "Check"
                SET
                  score = ${score},
                  feedback = COALESCE(feedback, '{}'::jsonb) || ${patchJson}::jsonb
                WHERE id = ${id} AND "userId" = ${userId}
                RETURNING id, score
              `
            : await prisma.$queryRaw`
                UPDATE "Check"
                SET feedback = COALESCE(feedback, '{}'::jsonb) || ${patchJson}::jsonb
                WHERE id = ${id} AND "userId" = ${userId}
                RETURNING id, score
              `;

        const row = rows?.[0];
        if (!row) return null;
        return { id: row.id, score: row.score };
      }

      if (feedback === undefined) return null;

      const existing = await prisma.check.findFirst({
        where: { id, userId },
        select: { id: true },
      });
      if (!existing) return null;

      return prisma.check.update({
        where: { id },
        data: {
          ...(score !== null ? { score } : {}),
          feedback,
        },
        select: { id: true, score: true },
      });
    },
    { attempts: 5 }
  );
}

export function formatHistoryDbError(err) {
  const code = err?.code || err?.cause?.code;
  const msg = String(err?.message || '');

  if (code === 'EAI_AGAIN' || /getaddrinfo EAI_AGAIN/i.test(msg)) {
    return 'Database DNS lookup failed. Check DATABASE_URL in .env.local and copy fresh pooler URIs from Supabase Dashboard → Connect.';
  }
  if (/Tenant or user not found/i.test(msg)) {
    return 'Supabase rejected the database credentials. Reset the database password in Supabase Dashboard → Database and update DATABASE_URL.';
  }
  if (/Connection terminated unexpectedly|Server has closed the connection/i.test(msg)) {
    return 'Database connection was closed. Use Transaction pooler (port 6543) for DATABASE_URL and retry.';
  }
  return msg || 'Database unavailable';
}
