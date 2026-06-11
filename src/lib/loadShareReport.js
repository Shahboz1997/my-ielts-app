import { unstable_cache } from 'next/cache';
import { getPrisma, withPrismaRetry } from '@/lib/prisma';
import { verifyShareToken } from '@/lib/shareToken';
import { mergeLexicalUpgrades, normalizeLexicalRow } from '@/lib/lexicalUpgrade';

function safeJsonParse(str) {
  try {
    return typeof str === 'string' ? JSON.parse(str) : str || {};
  } catch {
    return {};
  }
}

async function fetchShareChecksFromDb(t1Id, t2Id, ref) {
  const ids = [t1Id, t2Id].filter(Boolean);
  const checks = await withPrismaRetry(async () => {
    const prisma = getPrisma();
    return prisma.check.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        type: true,
        content: true,
        score: true,
        feedback: true,
        createdAt: true,
      },
    });
  });

  const byId = new Map(checks.map((c) => [c.id, c]));
  const ordered = [t1Id ? byId.get(t1Id) : null, t2Id ? byId.get(t2Id) : null].filter(Boolean);
  if (ordered.length === 0) return null;

  return {
    ref: ref || null,
    tasks: ordered.map((c) => {
      const fb = safeJsonParse(c.feedback);
      const criteria = fb.criteria || {};
      const isTask1 = (c.type || 'TASK_2') === 'TASK_1';
      const taskKey = isTask1 ? 'Task_Achievement' : 'Task_Response';
      const band =
        (fb.overall_band != null && Number.isFinite(Number(fb.overall_band)) ? Number(fb.overall_band) : null) ??
        (c.score != null && Number.isFinite(Number(c.score)) ? Number(c.score) : null);

      const lw = fb.analysis?.linking_words ?? fb.linking_words ?? null;
      const repetitions = Array.isArray(fb.analysis?.word_repetition)
        ? fb.analysis.word_repetition
        : Array.isArray(fb.word_repetition)
          ? fb.word_repetition
          : [];

      const lexicalRows = mergeLexicalUpgrades({
        apiRows: Array.isArray(fb.lexical_upgrade) ? fb.lexical_upgrade : [],
        essayText: c.content || '',
        isT1: isTask1,
      })
        .map((row) => normalizeLexicalRow(row))
        .filter((row) => row.band_56_word && (row.c1_synonyms.length > 0 || row.c2_synonyms.length > 0))
        .slice(0, 20);

      const ideaRaw = fb.idea_development;
      const ideaDevelopment =
        !isTask1 && ideaRaw && typeof ideaRaw === 'object'
          ? {
              overall: {
                score_0_5: Number(ideaRaw?.overall?.score_0_5),
                summary:
                  typeof ideaRaw?.overall?.summary === 'string' ? ideaRaw.overall.summary.trim() : '',
              },
              paragraphs: Array.isArray(ideaRaw?.paragraphs) ? ideaRaw.paragraphs : [],
            }
          : null;

      let cefr = null;
      const rawCefr = fb.cefr_stats;
      if (rawCefr && typeof rawCefr === 'object') {
        cefr = {};
        if (Array.isArray(rawCefr)) {
          rawCefr.forEach((x) => {
            const id = String(x?.level ?? x?.id ?? '').toUpperCase();
            if (id) cefr[id] = Math.min(100, Math.max(0, Number(x?.percent ?? x?.value ?? 0)));
          });
        } else {
          Object.entries(rawCefr).forEach(([k, v]) => {
            cefr[String(k).toUpperCase()] = Math.min(100, Math.max(0, Number(v)));
          });
        }
        if (!Object.keys(cefr).length) cefr = null;
      }

      const corrections = Array.isArray(fb.corrections)
        ? fb.corrections.map((err) => ({
            original: err.original ?? '',
            fixed: err.fixed ?? err.suggestion ?? '',
            suggestion: err.suggestion ?? '',
            category: err.category ?? err.rule ?? '',
            rule: err.rule ?? '',
            explanation: err.explanation ?? '',
          }))
        : [];

      return {
        id: c.id,
        type: isTask1 ? 'TASK_1' : 'TASK_2',
        createdAt: c.createdAt,
        band,
        ideaDevelopment,
        criteria: {
          task: criteria[taskKey]?.score ?? null,
          cc: criteria.Coherence_and_Cohesion?.score ?? null,
          lr: criteria.Lexical_Resource?.score ?? null,
          gra: criteria.Grammatical_Range_and_Accuracy?.score ?? null,
          taskComment: criteria[taskKey]?.comment ?? '',
          ccComment: criteria.Coherence_and_Cohesion?.comment ?? '',
          lrComment: criteria.Lexical_Resource?.comment ?? '',
          graComment: criteria.Grammatical_Range_and_Accuracy?.comment ?? '',
        },
        improvementStrategy:
          typeof fb.improvement_strategy === 'string' ? fb.improvement_strategy : '',
        task1Strategy: isTask1 && fb.task1_strategy ? fb.task1_strategy : null,
        letterStrategy: isTask1 && fb.letter_strategy ? fb.letter_strategy : null,
        task1Kind: fb.task1Kind === 'gt_letter' ? 'gt_letter' : 'academic',
        originalEssay: typeof c.content === 'string' ? c.content : '',
        tutorComment: typeof fb.tutor_comment === 'string' ? fb.tutor_comment.trim() : '',
        suggestedRewrite:
          typeof fb.suggested_rewrite === 'string' ? fb.suggested_rewrite : '',
        errors: Array.isArray(fb.errors) ? fb.errors : [],
        highlights: Array.isArray(fb.highlights) ? fb.highlights : [],
        corrections,
        insights: {
          linking: lw
            ? {
                score: lw.score ?? null,
                found: Array.isArray(lw.found) ? lw.found.map(String) : [],
                suggestions: Array.isArray(lw.suggestions) ? lw.suggestions.map(String) : [],
              }
            : null,
          repetitions,
          lexical: lexicalRows,
          plagiarism:
            fb.plagiarism && (fb.plagiarism.score != null || fb.plagiarism.status)
              ? { score: fb.plagiarism.score ?? null, status: fb.plagiarism.status ?? '' }
              : null,
          cefr,
        },
      };
    }),
  };
}

/**
 * Public share payload: cached 1h (token is an immutable snapshot of check ids).
 * In dev, Turbopack HMR may still re-request the page on file saves — that is expected.
 */
export async function loadShareReport(tokenRaw) {
  const token = String(tokenRaw || '');
  const verified = verifyShareToken(token);
  if (!verified.ok) return null;

  const { t1Id, t2Id, ref } = verified.data;
  if (!t1Id && !t2Id) return null;

  const cacheKey = `share-v1-${token.slice(0, 48)}`;
  return unstable_cache(
    () => fetchShareChecksFromDb(t1Id, t2Id, ref),
    [cacheKey],
    { revalidate: 3600, tags: [cacheKey] }
  )();
}
