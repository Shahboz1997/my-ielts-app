/**
 * IELTS General Training Writing Task 1 — letter prompts & API context.
 */

export const GT_LETTER_STANDARD_TAIL =
  'Write at least 150 words. You do not need to write any addresses. Begin your letter as follows:';

export const LETTER_TONES = ['formal', 'semi-formal', 'informal'];
export const LETTER_PURPOSES = [
  'complaint',
  'request',
  'apology',
  'information',
  'invitation',
  'application',
];

export const DEFAULT_LETTER_META = {
  tone: 'formal',
  purpose: 'request',
  recipient: '',
  bulletCount: 3,
};

/** Build user message prefix for GT letter checks. */
export function buildGtLetterUserContext({ promptText, letterMeta }) {
  const m = letterMeta && typeof letterMeta === 'object' ? letterMeta : {};
  return [
    'IELTS GENERAL TRAINING — WRITING TASK 1 (LETTER)',
    `TASK PROMPT:\n${String(promptText || '').trim()}`,
    m.tone ? `Expected tone/register: ${m.tone}` : '',
    m.purpose ? `Letter purpose: ${m.purpose}` : '',
    m.recipient ? `Recipient: ${m.recipient}` : '',
    Number.isFinite(Number(m.bulletCount)) ? `Bullet points in task: ${m.bulletCount}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/** System-prompt block for GT letter analysis (replaces Academic Task 1 rules). */
export function buildTask1LetterRulesBlock({ includeRewrite = true } = {}) {
  return `You are a strict universal IELTS Writing expert (British Council / IDP style).
The student wrote **IELTS General Training Task 1 — a LETTER** (not a chart report).

Evaluate Task Achievement by:
1) Covering EVERY bullet point in the task prompt (all requests/questions must be addressed).
2) Clear purpose stated early (why they are writing).
3) Appropriate tone and register (formal / semi-formal / informal) for the situation.
4) Suitable opening salutation and closing (e.g. Dear Sir or Madam + Yours faithfully; Dear Mr Smith + Yours sincerely).

Do NOT require an "overview", data comparisons, or chart language. Do NOT penalise for lacking statistics.

Categorize errors strictly into 3 types:
- 'logic' (Blue) — missing bullet, wrong tone/register, unclear purpose, inappropriate closing, not answering the prompt.
- 'lexical' (Purple) — informal words in formal letters, weak letter phrases, repetition.
- 'grammar' (Red) — tense, articles, punctuation, sentence structure.

For logic errors use subtopic "task_alignment" when a bullet or purpose is missing; "register" issues can be lexical with subtopic "register".

FOUR IELTS CRITERIA — score each 0.0–9.0 (halves allowed) with a concise comment:
- **Task Achievement**, **Coherence and Cohesion**, **Lexical Resource**, **Grammatical Range and Accuracy**.

Strict Schema for the "errors" array (mandatory):
Each error MUST have exactly:
{
  "original": "exact phrase from text",
  "correction": "corrected phrase (or empty string if no one-to-one correction is possible)",
  "type": "logic" | "grammar" | "lexical",
  "subtopic": "REQUIRED — grammar/lexical ids as for essays; for logic use task_alignment | register | other_logic",
  "explanation": "Start with 'Logic Error:' or 'Grammar Error:' (or 'Lexical Error:'). Explain why it lowers the band."
}

LEXICAL UPGRADE (GT letter only):
- Return 8–15 items in "lexical_upgrade" for weak Band 5–6 words/phrases that ACTUALLY appear in the letter.
- Each item: { "band_56_word", "c1_synonyms": [2], "c2_synonyms": [2], "c1_example", "c2_example" } — formal letter sentences (12–20 words).
- Prefer letter phrases: I am writing to..., I would be grateful if..., I look forward to hearing from you, I apologise for...
- C1/C2 = formal letter collocations (CEFR C1/C2); avoid chart verbs (illustrate trends, peaked at).

ADDITIONAL REQUIREMENT (GT letter only):
Return "letter_strategy" (NOT task1_strategy) — actionable structure feedback:
"letter_strategy": {
  "opening_ok": true,
  "tone_match": "formal",
  "bullets_coverage": [
    { "bullet": "short label from prompt", "covered": true, "comment": "brief note" }
  ],
  "closing_ok": true,
  "salutation_closing": {
    "opening": "Dear ...",
    "closing": "Yours faithfully",
    "appropriate": true
  },
  "paragraph_plan": ["Opening", "Details", "Request", "Closing"],
  "what_to_fix": ["string", "string"]
}

${
  includeRewrite
    ? `CRITICAL: Your "suggested_rewrite" MUST be a full GT letter (150+ words), paragraphs separated by \\n\\n.
Use appropriate salutation and sign-off. You MAY use bullet lines in the body if the task used bullet points.
Wrap improved phrases in <mark>...</mark> tags (lowercase only). Do not use markdown headings.

Return a Band 9.0–level "suggested_rewrite" as a letter, not a report.`
    : 'Do NOT include suggested_rewrite in this response — a separate rewrite step will follow.'
}`;
}

export function buildLetterChecklistInstruction() {
  return `CHECKLIST: Return booleans by evaluating the letter against GT Task 1 requirements.
- all_bullets_addressed: every bullet point in the prompt is clearly answered.
- appropriate_tone: register matches the situation (formal/semi-formal/informal).
- clear_purpose_opening: opening states why they are writing.
- correct_salutation_closing: salutation and sign-off match the relationship (known vs unknown recipient).
- paragraphing_clear: ideas grouped in clear paragraphs (not one block).`;
}

export function buildLetterChecklistOutputExample() {
  return `"checklist": {
    "all_bullets_addressed": false,
    "appropriate_tone": false,
    "clear_purpose_opening": false,
    "correct_salutation_closing": false,
    "paragraphing_clear": false
  },`;
}

export function buildLetterStrategyOutputExample() {
  return `"letter_strategy": {
    "opening_ok": false,
    "tone_match": "formal",
    "bullets_coverage": [
      { "bullet": "describe the problem", "covered": false, "comment": "string" }
    ],
    "closing_ok": false,
    "salutation_closing": { "opening": "Dear Sir or Madam", "closing": "Yours faithfully", "appropriate": true },
    "paragraph_plan": ["Opening", "Details", "Request", "Closing"],
    "what_to_fix": ["string", "string"]
  },`;
}
