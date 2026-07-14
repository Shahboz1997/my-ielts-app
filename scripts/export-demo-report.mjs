/**
 * Export Check row(s) into a durable demo snapshot (no 30-day share expiry).
 *
 * Usage:
 *   node scripts/export-demo-report.mjs --slug task2-band-75 --t2 <checkId>
 *   node scripts/export-demo-report.mjs --slug writing-pair --t1 <id> --t2 <id>
 *   node scripts/export-demo-report.mjs --slug from-share --token <shareToken>
 *
 * Reads DATABASE_URL / AUTH_SECRET from .env.local (dotenv).
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { verifyShareToken } from '../src/lib/shareToken.js';
import { getPrisma, withPrismaRetry } from '../src/lib/prisma.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return null;
  return process.argv[i + 1] || null;
}

function safeJsonParse(str) {
  try {
    return typeof str === 'string' ? JSON.parse(str) : str || {};
  } catch {
    return {};
  }
}

/** Lightweight row normalizer (avoids Next/TS path alias issues in plain Node). */
function normalizeLexicalRow(row) {
  const parseSyn = (val) => {
    if (val == null) return [];
    if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
    return String(val)
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  };
  const band_56_word = String(row.band_56_word || row.word || '').trim();
  const c1 = parseSyn(row.c1_synonyms);
  const c2 = parseSyn(row.c2_synonyms);
  const legacy = parseSyn(row.band_89_synonyms ?? row.synonyms);
  const c1_synonyms = c1.length > 0 ? c1 : legacy.slice(0, 2);
  const c2_synonyms = c2.length > 0 ? c2 : legacy.length > 2 ? legacy.slice(2) : legacy.slice(0, 2);
  return {
    band_56_word,
    c1_synonyms,
    c2_synonyms,
    band_89_synonyms: [...new Set([...c1_synonyms, ...c2_synonyms, ...legacy])],
    source: row.source || 'api',
  };
}

async function buildReport(t1Id, t2Id, ref) {
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
    ref: ref || 'stratum-demo',
    source: {
      exportedAt: new Date().toISOString(),
      t1Id: t1Id || null,
      t2Id: t2Id || null,
    },
    tasks: ordered.map((c) => {
      const fb = safeJsonParse(c.feedback);
      const criteria = fb.criteria || {};
      const isTask1 = (c.type || 'TASK_2') === 'TASK_1';
      const taskKey = isTask1 ? 'Task_Achievement' : 'Task_Response';
      const band =
        (fb.overall_band != null && Number.isFinite(Number(fb.overall_band))
          ? Number(fb.overall_band)
          : null) ??
        (c.score != null && Number.isFinite(Number(c.score)) ? Number(c.score) : null);

      const lw = fb.analysis?.linking_words ?? fb.linking_words ?? null;
      const repetitions = Array.isArray(fb.analysis?.word_repetition)
        ? fb.analysis.word_repetition
        : Array.isArray(fb.word_repetition)
          ? fb.word_repetition
          : [];

      const lexicalRows = (Array.isArray(fb.lexical_upgrade) ? fb.lexical_upgrade : [])
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
        id: `demo-${isTask1 ? 't1' : 't2'}-${String(c.id).slice(-8)}`,
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
        tutorComment: '',
        suggestedRewrite: typeof fb.suggested_rewrite === 'string' ? fb.suggested_rewrite : '',
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

const slug = arg('slug');
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error(
    'Usage: node scripts/export-demo-report.mjs --slug <kebab-slug> (--t1 <id> | --t2 <id> | --token <shareToken>)'
  );
  process.exit(1);
}

let t1Id = arg('t1');
let t2Id = arg('t2');
const token = arg('token');

if (token) {
  const verified = verifyShareToken(token);
  if (!verified.ok) {
    console.error('Invalid or expired share token:', verified.error || 'unknown');
    process.exit(1);
  }
  t1Id = verified.data.t1Id;
  t2Id = verified.data.t2Id;
}

if (!t1Id && !t2Id) {
  console.error('Provide --t1 and/or --t2 check ids, or --token');
  process.exit(1);
}

const report = await buildReport(t1Id, t2Id, 'stratum-demo');
if (!report) {
  console.error('No checks found for the given ids');
  process.exit(1);
}

const outDir = join(root, 'content', 'demo');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${slug}.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

const catalogPath = join(outDir, 'catalog.json');
let catalog = { demos: [] };
if (existsSync(catalogPath)) {
  try {
    catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  } catch {
    catalog = { demos: [] };
  }
}
if (!Array.isArray(catalog.demos)) catalog.demos = [];

const bands = report.tasks.map((t) => t.band).filter((b) => b != null);
const types = report.tasks.map((t) => t.type);
const prev = catalog.demos.find((d) => d.slug === slug);
const entry = {
  slug,
  title: prev?.title || null,
  blurb: prev?.blurb || null,
  types,
  bands,
  flagship: Boolean(prev?.flagship),
  href: `/demo/${slug}`,
};

catalog.demos = catalog.demos.filter((d) => d.slug !== slug);
catalog.demos.push(entry);
catalog.updatedAt = new Date().toISOString();
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');

console.log(`Wrote ${outPath}`);
console.log(
  `Tasks: ${report.tasks.map((t) => `${t.type} band ${t.band}`).join(', ')}`
);

try {
  await getPrisma().$disconnect();
} catch {
  /* ignore */
}
process.exit(0);
