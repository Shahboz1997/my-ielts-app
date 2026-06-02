import { normalizeSubtopic } from '@/lib/errorSubtopics.js';

const ERROR_TYPES_ALLOWED = new Set(['grammar', 'logic', 'lexical']);

/** Model sometimes wraps JSON in ```json ... ``` despite instructions. */
export function stripMarkdownJsonFence(text) {
  if (typeof text !== 'string') return '';
  let s = text.trim();
  const m = /^```(?:json)?\s*([\s\S]*?)```\s*$/im.exec(s);
  if (m) return m[1].trim();
  return s;
}

/**
 * Parse examiner JSON; avoids throwing into outer handler (SyntaxError → opaque 500 / empty axios data).
 * Truncation at max_tokens often yields "Unterminated string in JSON".
 */
export function parseExaminerJson(content) {
  const raw = stripMarkdownJsonFence(typeof content === 'string' ? content : '');
  if (!raw) {
    return { ok: false, error: 'Empty model response' };
  }
  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch (e) {
    const msg = e?.message || 'Invalid JSON';
    console.error('[/api/check] Examiner JSON parse error:', msg, {
      length: raw.length,
      head: raw.slice(0, 160),
      tail: raw.slice(-160),
    });
    return { ok: false, error: msg };
  }
}

export function normalizeExaminerErrorType(t) {
  const s = String(t || '')
    .toLowerCase()
    .trim();
  if (s === 'vocabulary' || s === 'lexical') return 'lexical';
  if (s === 'logical' || s === 'task' || s === 'cohesion' || s === 'coherence') return 'logic';
  if (ERROR_TYPES_ALLOWED.has(s)) return s;
  return 'grammar';
}

/**
 * Single canonical list for the app. Order: model `errors` first, then logical_errors, corrections, highlights (skip duplicates by original text).
 */
export function mergeUnifiedErrors(result) {
  const byKey = new Map();

  const push = (row) => {
    const original = String(row?.original ?? row?.phrase ?? row?.text ?? '')
      .trim();
    if (!original) return;
    const key = original.toLowerCase();
    if (byKey.has(key)) return;
    const type = normalizeExaminerErrorType(row.type ?? row.category);
    // App expects `fixed`/`suggestion`, but the examiner may return `correction` instead.
    const fixed =
      typeof row.fixed === 'string'
        ? row.fixed.trim()
        : typeof row.correction === 'string'
          ? row.correction.trim()
          : '';
    const suggestion = typeof row.suggestion === 'string' ? row.suggestion.trim() : '';
    const explanation =
      typeof row.explanation === 'string'
        ? row.explanation.trim()
        : typeof row.reason === 'string'
          ? row.reason.trim()
          : '';
    const expl =
      explanation ||
      (type === 'logic'
        ? 'This issue affects Task Achievement or Task Response and may lower your band.'
        : 'See criterion feedback for impact on your band score.');
    byKey.set(key, {
      original,
      type,
      subtopic: normalizeSubtopic(row.subtopic, type, expl),
      fixed: fixed || suggestion,
      suggestion: suggestion || fixed,
      explanation: expl,
    });
  };

  (Array.isArray(result.errors) ? result.errors : []).forEach(push);
  (Array.isArray(result.logical_errors) ? result.logical_errors : []).forEach((e) =>
    push({
      phrase: e?.phrase,
      text: e?.text,
      type: 'logic',
      explanation: e?.explanation ?? e?.reason,
      fixed: typeof e?.fixed === 'string' ? e.fixed : '',
    })
  );
  (Array.isArray(result.corrections) ? result.corrections : []).forEach((c) => push(c));
  (Array.isArray(result.highlights) ? result.highlights : []).forEach((h) =>
    push({
      text: h?.text,
      type: h?.type,
      suggestion: h?.suggestion,
      fixed: '',
      explanation: typeof h?.suggestion === 'string' ? h.suggestion : '',
    })
  );

  return Array.from(byKey.values()).map((e, i) => ({
    ...e,
    id: `err-${i}`,
  }));
}

export function correctionsFromErrors(errorsArr) {
  return (errorsArr || []).map((e) => ({
    original: e.original,
    fixed: e.fixed || '',
    category: e.type === 'lexical' ? 'Vocabulary' : e.type === 'logic' ? 'Logic' : 'Grammar',
    impact: 'medium',
    band_descriptor: '',
    explanation: e.explanation || '',
    rule: e.type === 'lexical' ? 'Vocabulary' : e.type === 'logic' ? 'Logic' : 'Grammar',
  }));
}

export function normalizeTask1Kind(raw) {
  return raw === 'gt_letter' ? 'gt_letter' : 'academic';
}

export function normalizeLetterStrategy(result) {
  const strat = result?.letter_strategy;
  const cleanList = (arr, max) =>
    (arr || [])
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter(Boolean)
      .slice(0, max);

  const bulletsRaw = Array.isArray(strat?.bullets_coverage) ? strat.bullets_coverage : [];
  const planRaw = Array.isArray(strat?.paragraph_plan) ? strat.paragraph_plan : [];
  const fixRaw = Array.isArray(strat?.what_to_fix) ? strat.what_to_fix : [];
  const sal = strat?.salutation_closing && typeof strat.salutation_closing === 'object' ? strat.salutation_closing : {};

  const defaultBullets = [
    { bullet: 'Bullet 1', covered: false, comment: 'Check the prompt and ensure this point is answered.' },
    { bullet: 'Bullet 2', covered: false, comment: 'Add a clear sentence addressing this requirement.' },
    { bullet: 'Bullet 3', covered: false, comment: 'Include a specific detail or request for this bullet.' },
  ];

  result.letter_strategy = {
    opening_ok: strat?.opening_ok === true,
    tone_match: typeof strat?.tone_match === 'string' ? strat.tone_match.trim() : 'formal',
    bullets_coverage:
      bulletsRaw.length > 0
        ? bulletsRaw.slice(0, 6).map((b) => ({
            bullet: typeof b?.bullet === 'string' ? b.bullet.trim() : 'Requirement',
            covered: b?.covered === true,
            comment: typeof b?.comment === 'string' ? b.comment.trim() : '',
          }))
        : defaultBullets,
    closing_ok: strat?.closing_ok === true,
    salutation_closing: {
      opening: typeof sal.opening === 'string' ? sal.opening.trim() : '',
      closing: typeof sal.closing === 'string' ? sal.closing.trim() : '',
      appropriate: sal.appropriate === true,
    },
    paragraph_plan:
      cleanList(planRaw, 6).length > 0
        ? cleanList(planRaw, 6)
        : ['Opening', 'Details', 'Request / information', 'Closing'],
    what_to_fix:
      cleanList(fixRaw, 8).length > 0
        ? cleanList(fixRaw, 8)
        : [
            'State your purpose clearly in the opening sentence.',
            'Address every bullet point from the task with specific detail.',
            'Use an appropriate formal closing (Yours faithfully / Yours sincerely).',
          ],
  };
  delete result.task1_strategy;
}

/** Legacy compact API shape → full app shape */
export function isSimplifiedCheckResult(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (obj.overall_band != null && typeof obj.overall_band === 'number') return false;
  if (Array.isArray(obj.logical_errors)) return false;
  return 'bandScore' in obj || 'suggestedRewrite' in obj;
}

export function normalizeSimplifiedCheckResult(raw, taskCriteriaName, userText) {
  const feedback = typeof raw.feedback === 'string' ? raw.feedback : '';
  const suggested =
    typeof raw.suggestedRewrite === 'string'
      ? raw.suggestedRewrite
      : typeof raw.suggested_rewrite === 'string'
        ? raw.suggested_rewrite
        : '';
  const bandStr = raw.bandScore != null ? String(raw.bandScore) : raw.overall_band != null ? String(raw.overall_band) : '';
  const bandNum = parseFloat(bandStr.replace(/[^\d.]/g, ''));
  const overall_band = Number.isFinite(bandNum) ? bandNum : null;
  const scoreForCriteria = overall_band ?? 0;
  const wc = userText.trim().split(/\s+/).filter(Boolean).length;
  const subComment = 'See overall feedback.';
  return {
    overall_band,
    word_count: wc,
    improvement_strategy: feedback,
    criteria: {
      [taskCriteriaName]: { score: scoreForCriteria, comment: feedback || subComment },
      Coherence_and_Cohesion: { score: scoreForCriteria, comment: subComment },
      Lexical_Resource: { score: scoreForCriteria, comment: subComment },
      Grammatical_Range_and_Accuracy: { score: scoreForCriteria, comment: subComment },
    },
    errors: [],
    logical_errors: [],
    highlights: [],
    corrections: [],
    lexical_upgrade: [],
    analysis: {
      linking_words: { score: 0, found: [], suggestions: [] },
      word_repetition: [],
    },
    suggested_rewrite: suggested,
  };
}
