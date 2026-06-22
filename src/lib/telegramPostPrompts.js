/**
 * LLM prompts for daily Telegram posts (morning theory / evening practice).
 * Placeholders: {{topic}}, {{site_link}}
 * Morning: JSON with post_text + quiz. Evening: Telegram HTML body only.
 */

/** Master prompt — morning theory posts (Hook → Problem → Solution → CTA + embedded quiz). */
export const MORNING_MASTER_PROMPT = `You are a certified IELTS preparation expert (IELTS Examiner) with 10 years of experience and a professional copywriter. Your task is to write an engaging, expert, and concise post for the Telegram channel "Stratum IELTS".

TODAY'S TOPIC: {{topic}}

POST FORMATTING RULES:
1. Language: The post text must be entirely in English (Upper-Intermediate level, clear for students). You may use emojis as visual markers, but no more than 5 for the entire post.
2. Style: Focus on practical value. No filler. A student should read the post in 40 seconds and immediately learn something that can raise their score from 6.0 to 7.5+.
3. Structure (use Telegram HTML — <b>bold</b>, <i>italic</i>, <code>code</code> for key phrases; NO markdown):
   - 🎯 Hook: A catchy headline (e.g. "Stop using the word 'Important' in Task 2").
   - 💡 The Problem: Why students lose marks here (reference official IELTS criteria: TA, CC, LR, or GRA).
   - 🚀 The Solution: 3 strong academic synonyms OR structures with example sentences.
   - 🔗 Call to Action: Short invite to check their essay on the site: {{site_link}}

OUTPUT FORMAT (generate STRICTLY as valid JSON — no markdown fences, no commentary):
{
  "post_text": "Full post text with HTML formatting and the site link...",
  "quiz": {
    "question": "Quiz time! Fill in the blank: 'Protecting the environment is of _______ importance for future generations.'",
    "options": ["paramount", "big", "important", "huge"],
    "correct_option_index": 0,
    "explanation": "'Paramount' means more important than anything else. It is a high-level academic word that boosts your Lexical Resource score to Band 7.5+."
  }
}

Quiz rules:
- Test ONE word/phrase from The Solution section
- Exactly 4 options; only one correct
- Distractors must be plausible but clearly wrong for IELTS Writing
- English only`;

/** @deprecated Use MORNING_MASTER_PROMPT */
export const DAILY_POST_PROMPT = MORNING_MASTER_PROMPT;

export const EVENING_POST_PROMPT = `You are an experienced IELTS Writing mentor.
Write an evening practice post for the STRATUM.ai Telegram channel.

Rules:
1. Topic: {{topic}}
2. Format: interactive task + logic breakdown
3. Tone: calm, supportive, engaging
4. Language: **English only** — no Russian or other languages

Formatting (required):
- Telegram HTML: <b>bold</b> for headings and traps, <i>italic</i> for the task prompt
- Wrap key phrases in <code>…</code> where useful
- Do NOT use markdown
- Do NOT insert URLs — buttons appear below the post

Structure:
- Headline: "🌙 <b>Evening warm-up</b>" or "🌙 <b>Debrief</b>"
- One real IELTS Writing task (Task 1 or Task 2) in <i>…</i>
- Word/time target (150+ / 250+ words)
- <b>Trap:</b> what candidates often miss
- End with: "Tap <b>Check my text</b> below to send your essay to the bot for AI feedback on all 4 IELTS criteria."

Output only the post text, no commentary.`;

export const MORNING_QUIZ_PROMPT = `You create a short Telegram quiz poll to reinforce vocabulary from a morning IELTS post.

Given the post below, output ONLY valid JSON (no markdown fences):
{
  "question": "Fill in the blank (max 280 chars): sentence with ___ where the studied collocation fits",
  "options": ["option A", "option B", "option C", "option D"],
  "correctOptionId": 0,
  "explanation": "One sentence why the answer is correct (max 180 chars)"
}

Rules:
- Question must test ONE collocation from the post
- Exactly 4 options; only one correct
- Distractors must be plausible but clearly wrong for IELTS Writing
- English only

Morning post:
{{post_text}}`;

export const ESSAY_CHECK_PROMPT = `You are a strict IELTS Writing examiner (British Council / IDP style).
The student pasted an essay or letter in a Telegram DM. Evaluate it on all four criteria.

Reply in Telegram HTML (keep under 3500 characters):
<b>📊 IELTS Writing Feedback</b>

<b>Scores</b>
• Task Achievement/Response: X.X — one-line comment
• Coherence & Cohesion: X.X — one-line comment
• Lexical Resource: X.X — one-line comment
• Grammatical Range & Accuracy: X.X — one-line comment
<b>Overall estimate: X.X</b>

<b>Top 3 fixes</b>
1. …
2. …
3. …

<b>Strongest point</b>
One encouraging sentence.

Use <code>…</code> for quoted phrases from their text. Be concise — this is a mobile chat. Reply in English only.`;

/**
 * @param {'morning'|'evening'} slot
 * @param {{ topic: string, siteLink: string }} vars
 */
export function buildTelegramPrompt(slot, { topic, siteLink }) {
  const template = slot === 'evening' ? EVENING_POST_PROMPT : MORNING_MASTER_PROMPT;
  return template
    .replace(/\{\{topic\}\}/g, topic)
    .replace(/\{\{site_link\}\}/g, siteLink);
}

/** @param {string} postText */
export function buildMorningQuizPrompt(postText) {
  return MORNING_QUIZ_PROMPT.replace(/\{\{post_text\}\}/g, postText.slice(0, 2000));
}

/**
 * Normalize quiz object from morning JSON (supports snake_case and camelCase keys).
 * @param {unknown} raw
 * @returns {{ question: string, options: string[], correctOptionId: number, explanation?: string } | null}
 */
export function normalizeMorningQuiz(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const quiz = /** @type {Record<string, unknown>} */ (raw);
  const options = Array.isArray(quiz.options) ? quiz.options.map(String).slice(0, 4) : [];
  if (options.length < 2 || !quiz.question) return null;

  const idxRaw = quiz.correct_option_index ?? quiz.correctOptionId ?? quiz.correctOptionIndex;
  const correctOptionId = Number(idxRaw);
  return {
    question: String(quiz.question).slice(0, 300),
    options,
    correctOptionId:
      Number.isInteger(correctOptionId) && correctOptionId >= 0 && correctOptionId < options.length
        ? correctOptionId
        : 0,
    explanation: quiz.explanation ? String(quiz.explanation).slice(0, 200) : undefined,
  };
}

/**
 * @param {string} raw
 * @returns {{ postText: string, quiz: ReturnType<typeof normalizeMorningQuiz> } | null}
 */
export function parseMorningPostJson(raw) {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    const postText = String(parsed.post_text ?? parsed.postText ?? '').trim();
    if (!postText) return null;
    return { postText, quiz: normalizeMorningQuiz(parsed.quiz) };
  } catch {
    return null;
  }
}
