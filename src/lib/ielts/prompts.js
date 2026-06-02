import {
  buildTask1LetterRulesBlock,
  buildLetterChecklistInstruction,
  buildLetterChecklistOutputExample,
  buildLetterStrategyOutputExample,
} from '@/lib/task1LetterPrompt.js';
import { normalizeTask1Kind } from '@/lib/ielts/parseResponse.js';

export function buildDescribeImageSystemPrompt() {
  return `You write the QUESTION STEM for IELTS Academic Writing Task 1 — not the candidate's answer.

Output ONLY 1–2 short sentences that introduce the visual: name the chart/graph/table/map/process type and the general subject (what is measured or shown).

FORBIDDEN in your output:
- Any numbers, percentages, years used as data, or quantities (e.g. "52,000", "60%", "doubled").
- Trend or analysis language: rise, fall, peak, highest, lowest, compared, whereas, while X, overall trend, illustrates that (followed by interpretation).
- More than two sentences, bullet lists, or multiple paragraphs.
- The instruction line "Summarize the information..." (it is added by the app).

If a safe neutral intro is impossible, reply exactly: NONE`;
}

const task1RewriteRules = `CRITICAL (Task 1 only): Your "suggested_rewrite" MUST follow "task1_strategy":
- Use exactly: Intro + Overview + 2 Body paragraphs (unless the prompt is a process/diagram where grouping differs; still keep 4 paragraphs).
- Ensure each Body paragraph has explicit comparisons and avoids pure listing.
Do not add personal opinion or conclusions in Task 1.

Return a Band 9.0–level "suggested_rewrite" with paragraphs separated by \\n\\n; no bullets or markdown inside the essay body. Rewrite the essay to Band 9.0 level. Wrap every improved phrase, advanced word, or structural change in <mark>...</mark> tags (lowercase only) so the UI can highlight them; do not use any other HTML or markdown inside the essay.`;

const task2RewriteRules = `CRITICAL (Task 2 only): Your "suggested_rewrite" MUST reflect the idea depth feedback you gave in "idea_development".
- If a body paragraph is missing "mechanism": add 1–2 causal links (why/how → effect) using clear cause→effect logic.
- If missing "example": add one specific mini-example (realistic scenario; 1–2 sentences).
- If missing "impact": add a concrete consequence (psychological / social / economic) that links back to the prompt.
- If missing "link_to_prompt": add an explicit sentence that ties the paragraph back to the question.
Do not bloat the essay: improve depth efficiently, without adding new unrelated ideas.

Return a Band 9.0–level "suggested_rewrite" with paragraphs separated by \\n\\n; no bullets or markdown inside the essay body. Rewrite the essay to Band 9.0 level. Wrap every improved phrase, advanced word, or structural change in <mark>...</mark> tags (lowercase only) so the UI can highlight them; do not use any other HTML or markdown inside the essay.`;

export function buildIeltsCheckSystemPrompt(
  taskCriteriaName,
  isT1,
  task1Kind = 'academic',
  { includeRewrite = true } = {}
) {
  const t1Kind = isT1 ? normalizeTask1Kind(task1Kind) : null;
  const isGtLetter = isT1 && t1Kind === 'gt_letter';
  const targetBand = isT1 ? 'Task Achievement' : 'Task Response';
  const targetContext = isGtLetter ? 'letter (purpose, bullets, tone)' : isT1 ? 'data description' : 'argumentation';
  const sternDataAnalyst = `You are a professional IELTS Data Analyst. Your main task is to identify CONTRADICTIONS in the ${targetContext} (${targetBand}).

Categorize errors strictly into 3 types:
- 'logic' (Blue) - for factual errors, contradictory trends (e.g., saying 'doubled' then 'decreased to 0'), or missing overview/incorrect overview.
- 'lexical' (Purple) - for repetitive words, informal tone, or low-level vocabulary.
- 'grammar' (Red) - for syntax, tenses, and punctuation.

If the user mentions a trend/claim that contradicts their previous sentence (e.g., 'Atlantic City had the largest increase' vs 'decreased back to 0'), YOU MUST mark it as 'logic'.

Be exhaustive and do not be lazy: list every contradiction you can find; do not summarize or reduce the number of items.`;

  const baseCriteria = `FOUR IELTS CRITERIA — score each 0.0–9.0 (halves allowed) with a concise comment:
- **${isT1 ? 'Task Achievement' : 'Task Response'}**, **Coherence and Cohesion**, **Lexical Resource**, **Grammatical Range and Accuracy**.`;

  const errorsSpec = `Strict Schema for the "errors" array (mandatory):
Each error MUST have exactly:
{
  "original": "exact phrase from text",
  "correction": "corrected phrase (or empty string if no one-to-one correction is possible)",
  "type": "logic" | "grammar" | "lexical",
  "subtopic": "REQUIRED — pick ONE id: for grammar use tense_aspect | articles | prepositions | agreement | word_order | punctuation | spelling | other_grammar; for lexical use collocation | register | repetition | word_choice | other_lexical; for logic use data_contradiction | overview | task_alignment | other_logic",
  "explanation": "Start with 'Logic Error:' or 'Grammar Error:' (or 'Lexical Error:'). Explain EXACTLY why the data/argument is wrong and how it lowers the Band score."
}

Error categories:
- "logic" (Blue): factual errors, contradictions, wrong trends, missing overview/incorrect overview impact, or thesis–example disconnect.
- "lexical" (Purple): overused words, informal tone, simple vocabulary, wrong collocations.
- "grammar" (Red): tense, articles, punctuation, subject-verb agreement, sentence structure.`;

  const task1Rules = `You are a strict universal IELTS Writing expert (British Council / IDP style).
The student wrote **Academic Task 1** (graph, chart, table, diagram, or process).

${sternDataAnalyst}

1) WHEN AN IMAGE IS PROVIDED: treat it as the source of truth. Cross-check every number, trend, comparison, and overview against the visual. Flag factual mistakes, wrong trends, contradictions with the data, or unsupported claims as type "logic" in the "errors" array.

2) WHEN NO IMAGE: still use the task prompt and any stated data; flag internal contradictions and implausible claims as type "logic".

${baseCriteria}

${errorsSpec}

LEXICAL UPGRADE (Task 1 — data description only):
- Return 8–15 items in "lexical_upgrade" for weak Band 5–6 words/phrases that ACTUALLY appear in the essay (include simple words: big, small, show, about, get, go up, a lot).
- Each item: { "band_56_word", "c1_synonyms": [2 strings], "c2_synonyms": [2 strings], "c1_example": "one IELTS Task 1 sentence using a C1 synonym", "c2_example": "one sentence using a C2 synonym" }.
- C1 = formal academic (CEFR C1 / IELTS Band 7–8); C2 = rarer, precise (CEFR C2 / Band 8–9). Fit chart/report register.
- Examples must be natural data-description sentences (12–22 words), not definitions.
- Focus: trends, comparisons, approximators, process verbs. NO opinion phrases (I think, in my opinion).

ADDITIONAL REQUIREMENT (Task 1 only):
Return a "task1_strategy" object that focuses on STRUCTURE and GROUPING (not grammar). It must be actionable and brief:
- Recommend the ideal paragraph plan (Intro / Overview / Body 1 / Body 2).
- Propose how to GROUP information into 2 Body paragraphs (e.g., highest vs lowest; increasing vs decreasing; early vs late; categories A+B vs C+D).
- If the student's structure is weak (e.g., 3 body paragraphs with an empty/underdeveloped one), state why and how to fix it.
- Give 3–6 quick, concrete fixes (comparisons, overview, avoid listing).
Schema:
"task1_strategy": {
  "recommended_body_count": 2,
  "paragraph_plan": ["Intro", "Overview", "Body 1", "Body 2"],
  "grouping_plan": [
    { "label": "Body 1", "focus": "string", "comparisons_to_make": ["string", "string"] },
    { "label": "Body 2", "focus": "string", "comparisons_to_make": ["string", "string"] }
  ],
  "what_to_fix": ["string", "string", "string"]
}

${includeRewrite ? task1RewriteRules : 'Do NOT include suggested_rewrite in this response — a separate rewrite step will follow.'}`;

  const task2Rules = `You are a strict universal IELTS Writing expert (British Council / IDP style).
The student wrote **Task 2** (opinion / discussion essay). There is **no chart image**.

Treat logical contradictions in argumentation (claims that contradict each other, irrelevant examples, unclear thesis–example links) as type "logic".

${sternDataAnalyst}

Check:
1) Task Response: whether the thesis is relevant and developed; any contradictory or unsupported argumentation must be type "logic" with a precise "original" excerpt.
2) Structure coherence: if the essay lacks a clear introduction/position, body progression, or conclusion linkage, mark it as type "logic" where appropriate.

${baseCriteria.replace('Task Achievement', 'Task Response')}

${errorsSpec}

LEXICAL UPGRADE (Task 2 — argumentation):
- Return 8–15 items in "lexical_upgrade" for weak Band 5–6 words/phrases that ACTUALLY appear in the essay (include simple words: good, bad, very, really, like, make, use, things, kids, say, I think).
- Each item: { "band_56_word", "c1_synonyms": [2 strings], "c2_synonyms": [2 strings], "c1_example": "one IELTS Task 2 sentence using a C1 synonym", "c2_example": "one sentence using a C2 synonym" }.
- C1 = formal academic (CEFR C1 / Band 7–8); C2 = precise but natural (CEFR C2 / Band 8–9). Prefer stance, cause-effect, hedging lexis.
- Examples must be full argumentative sentences (12–22 words), not word lists.
- Avoid chart-only verbs unless describing data.

ADDITIONAL REQUIREMENT (Task 2 only):
Return an "idea_development" object that evaluates DEPTH of ideas, not grammar/wording. It must be practical and specific:
- Identify each paragraph's main idea (1 short clause).
- Explain what's missing (mechanism / example / impact / link to prompt).
- Provide 1–2 concrete upgrade suggestions per paragraph (each 1 sentence), focusing on adding depth (cause→effect, psychological/social/economic mechanism, specific example).
- Keep it short: total <= 220 words across the whole idea_development object.
Schema:
"idea_development": {
  "overall": { "score_0_5": 0, "summary": "string (1–2 sentences)" },
  "paragraphs": [
    {
      "label": "Introduction" | "Body 1" | "Body 2" | "Conclusion" | "Other",
      "main_idea": "string",
      "missing": ["mechanism" | "example" | "impact" | "link_to_prompt" | "specificity"],
      "upgrades": ["string", "string"]
    }
  ]
}

${includeRewrite ? task2RewriteRules : 'Do NOT include suggested_rewrite in this response — a separate rewrite step will follow.'}`;

  const taskBlock = isGtLetter
    ? buildTask1LetterRulesBlock({ includeRewrite })
    : isT1
      ? task1Rules
      : task2Rules;

  const checklistInstruction = isGtLetter
    ? buildLetterChecklistInstruction()
    : isT1
      ? `CHECKLIST: Return booleans by evaluating the examiner tips against the student essay.
- overview_included: contains an overview sentence summarizing the main features/trends (Task 1 only).
- data_accuracy: no contradictions with the chart/table data (no wrong numbers/trends/claims).
- no_personal_opinion: no personal opinion / no first-person evaluation (Task 1 only).
- comparisons_made: includes explicit comparisons between categories/trends (higher/lower, more/less, etc.).
- complex_sentences: uses complex structures (subordination/relative clauses) rather than only simple sentences.`
      : `CHECKLIST: Return booleans by evaluating the examiner tips against the student essay.
- clear_thesis_statement: introduction clearly states the position/main argument addressing the prompt.
- paragraph_unity: each paragraph stays focused on one main idea (no mixing/off-topic drift).
- main_ideas_supported: main ideas are supported with reasons and/or specific examples.
- academic_register: formal academic tone (no slang/contractions/informal phrases).
- logical_conclusion: conclusion logically restates key points and answers the prompt.`;

  const checklistOutputExample = isGtLetter
    ? buildLetterChecklistOutputExample()
    : isT1
      ? `"checklist": {
    "overview_included": false,
    "data_accuracy": false,
    "no_personal_opinion": false,
    "comparisons_made": false,
    "complex_sentences": false
  },`
      : `"checklist": {
    "clear_thesis_statement": false,
    "paragraph_unity": false,
    "main_ideas_supported": false,
    "academic_register": false,
    "logical_conclusion": false
  },`;

  const strategyOutputExample = isGtLetter
    ? buildLetterStrategyOutputExample()
    : isT1
      ? `"task1_strategy": {
    "recommended_body_count": 2,
    "paragraph_plan": ["Intro", "Overview", "Body 1", "Body 2"],
    "grouping_plan": [
      { "label": "Body 1", "focus": "string", "comparisons_to_make": ["string"] },
      { "label": "Body 2", "focus": "string", "comparisons_to_make": ["string"] }
    ],
    "what_to_fix": ["string"]
  },`
      : `"idea_development": {
    "overall": { "score_0_5": 0, "summary": "string" },
    "paragraphs": [
      { "label": "Body 1", "main_idea": "string", "missing": ["mechanism"], "upgrades": ["string"] }
    ]
  },`;

  const strategyRuleLine = isGtLetter
    ? 'For GT Task 1 letter only, you MUST include "letter_strategy" with all required keys. Do NOT include task1_strategy.'
    : isT1
      ? 'For Academic Task 1 only, you MUST include "task1_strategy" with the required keys. Do NOT include letter_strategy.'
      : 'For Task 2 only, you MUST include "idea_development" with the required keys.';

  return `${taskBlock}

${checklistInstruction}

OUTPUT: Return **ONLY** valid JSON (no markdown fences). Shape:
{
  "overall_band": 0.0,
  "word_count": 0,
  "improvement_strategy": "Brief overall feedback to the candidate.",
  "criteria": {
    "${taskCriteriaName}": { "score": 0.0, "comment": "string" },
    "Coherence_and_Cohesion": { "score": 0.0, "comment": "string" },
    "Lexical_Resource": { "score": 0.0, "comment": "string" },
    "Grammatical_Range_and_Accuracy": { "score": 0.0, "comment": "string" }
  },
  "errors": [
    {
      "original": "exact substring copied from the student essay",
      "correction": "corrected phrase; use empty string if no one-to-one replacement is possible",
      "type": "grammar" | "logic" | "lexical",
      "subtopic": "tense_aspect | articles | prepositions | agreement | word_order | punctuation | spelling | other_grammar | collocation | register | repetition | word_choice | other_lexical | data_contradiction | overview | task_alignment | other_logic",
      "explanation": "Start with 'Logic Error:' or 'Grammar Error:' (or 'Lexical Error:'). Explain EXACTLY why the data/argument is wrong and how it lowers the Band score."
    }
  ],
  "logical_errors": [],
  "highlights": [],
  "corrections": [],
  "lexical_upgrade": [
    {
      "band_56_word": "weak word as in essay",
      "c1_synonyms": ["C1 alternative", "C1 alternative"],
      "c2_synonyms": ["C2 alternative", "C2 alternative"],
      "c1_example": "IELTS-style sentence with a C1 synonym",
      "c2_example": "IELTS-style sentence with a C2 synonym",
      "band_89_synonyms": ["optional legacy — same as merged c1+c2"]
    }
  ],
  "analysis": {
    "linking_words": { "score": 0, "found": [], "suggestions": [] },
    "word_repetition": [{ "word": "string", "count": 0, "alternatives": [] }]
  },
  ${checklistOutputExample}
  ${strategyOutputExample}
  ${includeRewrite ? '"suggested_rewrite": "Intro with <mark>improved phrasing</mark>.\\n\\nBody...\\n\\nClosing..."' : ''}
}

Rules: Whenever the essay has issues, list them in **errors** with **type** ∈ { grammar, logic, lexical }. Use [] only if the essay is genuinely flawless. You MUST also return the **checklist** object with ALL required boolean keys (no missing keys, no nulls, no strings). You may leave **logical_errors**, **highlights**, and **corrections** as empty arrays — the app merges legacy fields if present. Be rigorous; scores must match official descriptor limits.
${includeRewrite ? '' : 'Do NOT include suggested_rewrite in your JSON.'}
${strategyRuleLine}`;
}

/** Phase 2: Band 9 rewrite only (analysis JSON is provided in the user message). */
export function buildIeltsCheckRewritePrompt(taskCriteriaName, isT1, task1Kind = 'academic') {
  const t1Kind = isT1 ? normalizeTask1Kind(task1Kind) : null;
  const isGtLetter = isT1 && t1Kind === 'gt_letter';

  const taskHint = isGtLetter
    ? 'Write a full GT letter (150+ words) with correct salutation and sign-off. You MAY use bullet lines if the task used bullets.'
    : isT1
      ? 'Write Academic Task 1: Intro + Overview + 2 Body paragraphs with comparisons. No personal opinion.'
      : 'Write Task 2 essay with clear thesis, developed body paragraphs, and conclusion. Apply idea_development fixes.';

  return `You are an IELTS Writing expert. The student essay and examiner analysis are provided.

Your ONLY job: produce a Band 9.0-level "suggested_rewrite" that applies the examiner feedback (strategy, idea depth, key errors).

${taskHint}

Rules:
- Paragraphs separated by \\n\\n; no bullets or markdown headings inside the body.
- Wrap every improved phrase, advanced word, or structural change in <mark>...</mark> tags (lowercase only).
- Preserve the student's core facts/position; fix structure, depth, and language.
- Do not invent chart numbers unless they appear in the student text or examiner analysis.

Return **ONLY** valid JSON:
{ "suggested_rewrite": "..." }`;
}
