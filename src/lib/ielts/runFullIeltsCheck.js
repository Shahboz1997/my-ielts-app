import {
  buildIeltsCheckRewritePrompt,
  buildIeltsCheckSystemPrompt,
} from '@/lib/ielts/prompts.js';
import { parseExaminerJson } from '@/lib/ielts/parseResponse.js';
import { normalizeCheckResult } from '@/lib/ielts/normalizeCheckResult.js';

const FULL_MODEL = 'gpt-4o';
const ANALYSIS_MAX_TOKENS = 6144;
const REWRITE_MAX_TOKENS = 3500;

function buildRewriteContext(analysis, { isT1, isGtLetter }) {
  const ctx = {
    overall_band: analysis.overall_band,
    improvement_strategy: analysis.improvement_strategy,
    criteria: analysis.criteria,
  };
  if (isGtLetter) {
    ctx.letter_strategy = analysis.letter_strategy;
  } else if (isT1) {
    ctx.task1_strategy = analysis.task1_strategy;
  } else {
    ctx.idea_development = analysis.idea_development;
  }
  const errors = Array.isArray(analysis.errors) ? analysis.errors : [];
  ctx.priority_errors = errors.slice(0, 10).map((e) => ({
    original: e.original,
    type: e.type,
    subtopic: e.subtopic,
    explanation: e.explanation,
  }));
  return JSON.stringify(ctx);
}

async function callExaminerJson(openai, { system, userContent, maxTokens, label }) {
  const response = await openai.chat.completions.create({
    model: FULL_MODEL,
    temperature: 0.2,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
  });

  const choice0 = response?.choices?.[0];
  const finishReason = choice0?.finish_reason;
  const rawContent = choice0?.message?.content;

  console.log(`[/api/check] ${label} meta`, {
    finishReason,
    contentChars: typeof rawContent === 'string' ? rawContent.length : null,
  });

  if (finishReason === 'length') {
    return { ok: false, error: 'length' };
  }

  const parsed = parseExaminerJson(rawContent);
  if (!parsed.ok) {
    return { ok: false, error: 'invalid_json' };
  }

  return { ok: true, data: parsed.data };
}

/**
 * Two-phase full analysis: (1) scores/errors/strategy, (2) Band 9 rewrite.
 * Reduces truncation vs one huge JSON response.
 */
export async function runFullIeltsCheck({
  openai,
  userTextBlock,
  taskCriteriaName,
  userText,
  isT1,
  isGtLetter,
  task1Kind,
  image,
}) {
  const analysisPrompt = buildIeltsCheckSystemPrompt(taskCriteriaName, isT1, task1Kind, {
    includeRewrite: false,
  });

  const userContent = [
    { type: 'text', text: userTextBlock },
    ...(isT1 && !isGtLetter && image
      ? [{ type: 'image_url', image_url: { url: image } }]
      : []),
  ];

  console.log('[/api/check] mode=full phase=analysis', {
    model: FULL_MODEL,
    task1Kind,
    isT1,
    isGtLetter,
    hasImage: Boolean(isT1 && !isGtLetter && image),
  });

  const phase1 = await callExaminerJson(openai, {
    system: analysisPrompt,
    userContent,
    maxTokens: ANALYSIS_MAX_TOKENS,
    label: 'full phase=analysis',
  });

  if (!phase1.ok) {
    const message =
      phase1.error === 'length'
        ? 'The analysis hit the output limit and was cut off. Please click Analyze again, or shorten a very long essay.'
        : 'The examiner returned incomplete or invalid data (often after a truncated response). Please run Analyze again, or try a slightly shorter essay.';
    return { ok: false, status: 502, message };
  }

  const analysisData = phase1.data;
  const rewriteContext = buildRewriteContext(analysisData, { isT1, isGtLetter });
  const rewritePrompt = buildIeltsCheckRewritePrompt(taskCriteriaName, isT1, task1Kind);
  const rewriteUserText = `${userTextBlock}\n\n--- EXAMINER ANALYSIS (apply in rewrite) ---\n${rewriteContext}`;

  console.log('[/api/check] mode=full phase=rewrite', { model: FULL_MODEL });

  const phase2 = await callExaminerJson(openai, {
    system: rewritePrompt,
    userContent: [{ type: 'text', text: rewriteUserText }],
    maxTokens: REWRITE_MAX_TOKENS,
    label: 'full phase=rewrite',
  });

  if (phase2.ok && typeof phase2.data?.suggested_rewrite === 'string') {
    analysisData.suggested_rewrite = phase2.data.suggested_rewrite;
  } else {
    console.warn('[/api/check] rewrite phase failed; returning analysis without suggested_rewrite', {
      reason: phase2.error,
    });
    analysisData.suggested_rewrite =
      typeof analysisData.suggested_rewrite === 'string' ? analysisData.suggested_rewrite : '';
  }

  const result = normalizeCheckResult(analysisData, {
    taskCriteriaName,
    userText,
    isT1,
    isGtLetter,
    task1Kind,
  });

  return { ok: true, result };
}
