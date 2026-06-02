import { normalizeLexicalUpgradeFromApi } from '@/lib/lexicalUpgrade';
import {
  correctionsFromErrors,
  isSimplifiedCheckResult,
  mergeUnifiedErrors,
  normalizeLetterStrategy,
  normalizeSimplifiedCheckResult,
} from '@/lib/ielts/parseResponse.js';

export function normalizeCheckResult(result, { taskCriteriaName, userText, isT1, isGtLetter, task1Kind }) {
  if (isSimplifiedCheckResult(result)) {
    result = normalizeSimplifiedCheckResult(result, taskCriteriaName, userText);
  }
  result.word_count = result.word_count ?? userText.trim().split(/\s+/).filter(Boolean).length;
  if (!Array.isArray(result.highlights)) result.highlights = [];
  result.highlights = result.highlights.map(h => ({
    ...h,
    type: ['grammar', 'lexical', 'cohesion', 'logic'].includes(h.type) ? h.type : (h.type === 'error' ? 'grammar' : 'lexical')
  }));
  if (!Array.isArray(result.corrections)) result.corrections = [];
  result.corrections = result.corrections.map(c => ({
    ...c,
    category: c.category || c.rule || 'General',
    impact: c.impact || 'medium',
    band_descriptor: c.band_descriptor || ''
  }));
  if (!Array.isArray(result.lexical_upgrade)) result.lexical_upgrade = [];
  result.lexical_upgrade = normalizeLexicalUpgradeFromApi(result.lexical_upgrade);
  if (!Array.isArray(result.logical_errors)) result.logical_errors = [];
  result.logical_errors = result.logical_errors.map((e) => ({
    phrase: typeof e?.phrase === 'string' ? e.phrase : typeof e?.text === 'string' ? e.text : '',
    explanation: typeof e?.explanation === 'string' ? e.explanation : typeof e?.reason === 'string' ? e.reason : '',
    criterion:
      typeof e?.criterion === 'string'
        ? e.criterion
        : isT1
          ? 'Task Achievement'
          : 'Task Response',
  }));
  if (!Array.isArray(result.errors)) result.errors = [];

  result.task1Kind = task1Kind;

  // GT Task 1 letter: normalize letter_strategy
  if (isGtLetter) {
    normalizeLetterStrategy(result);
  }

  // Academic Task 1: normalize strategy block (backward-compatible).
  if (isT1 && !isGtLetter) {
    const strat = result?.task1_strategy;
    const groupingRaw = Array.isArray(strat?.grouping_plan) ? strat.grouping_plan : [];
    const planRaw = Array.isArray(strat?.paragraph_plan) ? strat.paragraph_plan : [];
    const fixRaw = Array.isArray(strat?.what_to_fix) ? strat.what_to_fix : [];
    const recBody = Number(strat?.recommended_body_count);
    const safeRecBody = Number.isFinite(recBody) ? Math.max(1, Math.min(3, Math.round(recBody))) : 2;

    const cleanList = (arr, max) =>
      (arr || [])
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter(Boolean)
        .slice(0, max);

    const normalizeLabel = (x, fallback) => {
      const s = String(x || '').trim();
      if (!s) return fallback;
      const lower = s.toLowerCase();
      if (lower.includes('body 1') || lower.includes('body1')) return 'Body 1';
      if (lower.includes('body 2') || lower.includes('body2')) return 'Body 2';
      return fallback;
    };

    const defaultPlan = ['Intro', 'Overview', 'Body 1', 'Body 2'];

    result.task1_strategy = {
      recommended_body_count: safeRecBody,
      paragraph_plan: cleanList(planRaw, 6).length > 0 ? cleanList(planRaw, 6) : defaultPlan,
      grouping_plan: (groupingRaw.length > 0 ? groupingRaw : [{ label: 'Body 1' }, { label: 'Body 2' }])
        .slice(0, 2)
        .map((g, idx) => {
          const fallback = idx === 0 ? 'Body 1' : 'Body 2';
          return {
            label: normalizeLabel(g?.label, fallback),
            focus: typeof g?.focus === 'string' ? g.focus.trim() : '',
            comparisons_to_make: cleanList(g?.comparisons_to_make, 4),
          };
        }),
      what_to_fix:
        cleanList(fixRaw, 8).length > 0
          ? cleanList(fixRaw, 8)
          : [
              'Write a clear overview (main trends / highest vs lowest) without listing all numbers.',
              'Use 2 body paragraphs with grouping; avoid a third weak body paragraph.',
              'Prioritise comparisons (higher/lower, larger/smaller, overtook, widened/narrowed gap) over pure listing.',
            ],
    };
    delete result.letter_strategy;
  }

  // Task 2: normalize idea development block (optional for older model outputs / backward compatibility).
  if (!isT1) {
    const idea = result?.idea_development;
    const score = Number(idea?.overall?.score_0_5);
    const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(5, Math.round(score))) : 0;
    const summary = typeof idea?.overall?.summary === 'string' ? idea.overall.summary.trim() : '';
    const parasRaw = Array.isArray(idea?.paragraphs) ? idea.paragraphs : [];
    const allowedMissing = new Set(['mechanism', 'example', 'impact', 'link_to_prompt', 'specificity']);
    const normalizeLabel = (x) => {
      const s = String(x || '').trim();
      if (!s) return 'Other';
      const lower = s.toLowerCase();
      if (lower.startsWith('intro')) return 'Introduction';
      if (lower.includes('body 1') || lower.includes('body1')) return 'Body 1';
      if (lower.includes('body 2') || lower.includes('body2')) return 'Body 2';
      if (lower.startsWith('concl')) return 'Conclusion';
      return ['Introduction', 'Body 1', 'Body 2', 'Conclusion', 'Other'].includes(s) ? s : 'Other';
    };
    result.idea_development = {
      overall: {
        score_0_5: safeScore,
        summary: summary || (safeScore >= 4 ? 'Ideas are generally well-developed; add one more concrete example for maximum impact.' : 'Some ideas need deeper development (mechanism, example, and impact) to strengthen Task Response.'),
      },
      paragraphs: parasRaw
        .map((p) => {
          const main_idea = typeof p?.main_idea === 'string' ? p.main_idea.trim() : '';
          const missingArr = Array.isArray(p?.missing) ? p.missing : [];
          const missing = missingArr
            .map((m) => String(m || '').trim())
            .filter((m) => allowedMissing.has(m))
            .slice(0, 5);
          const upgradesArr = Array.isArray(p?.upgrades) ? p.upgrades : [];
          const upgrades = upgradesArr
            .map((u) => (typeof u === 'string' ? u.trim() : ''))
            .filter(Boolean)
            .slice(0, 2);
          return {
            label: normalizeLabel(p?.label),
            main_idea: main_idea || '',
            missing,
            upgrades,
          };
        })
        .filter((p) => p.main_idea || p.upgrades.length > 0 || (p.missing && p.missing.length > 0))
        .slice(0, 6),
    };
  }

  const mergedErrors = mergeUnifiedErrors(result);
  result.errors = mergedErrors;
  result.corrections = correctionsFromErrors(mergedErrors);
  result.highlights = [];

  return result;
}
