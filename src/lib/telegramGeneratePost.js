/**
 * Generate Telegram posts via OpenAI using telegramPostPrompts templates.
 * Falls back to caller-provided static text when OpenAI is unavailable.
 */
import { createOpenAIClient, getTrimmedOpenAIKey, isPlaceholderOpenAiKey } from '@/lib/openaiServer';
import {
  buildMorningQuizPrompt,
  buildTelegramPrompt,
  ESSAY_CHECK_PROMPT,
  normalizeMorningQuiz,
  parseMorningPostJson,
} from '@/lib/telegramPostPrompts';

const MODEL = (process.env.TELEGRAM_OPENAI_MODEL || 'gpt-4o-mini').trim();

function aiEnabled() {
  if (process.env.TELEGRAM_USE_AI === '0') return false;
  const key = getTrimmedOpenAIKey();
  return Boolean(key) && !isPlaceholderOpenAiKey(key);
}

/**
 * @param {'morning'|'evening'} slot
 * @param {{ topic: string, siteLink: string }} ctx
 * @returns {Promise<{ text: string, source: 'ai'|'static', quiz?: object, error?: string } | null>}
 */
export async function generateTelegramPost(slot, { topic, siteLink }) {
  if (!aiEnabled()) return null;

  const clientResult = createOpenAIClient();
  if ('error' in clientResult) return null;

  const prompt = buildTelegramPrompt(slot, { topic, siteLink });

  try {
    const completion = await clientResult.openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75,
      max_tokens: slot === 'morning' ? 1500 : 800,
      ...(slot === 'morning' ? { response_format: { type: 'json_object' } } : {}),
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return { text: '', source: 'ai', error: 'empty response' };
    }

    if (slot === 'morning') {
      const parsed = parseMorningPostJson(raw);
      if (parsed?.postText) {
        return { text: parsed.postText, quiz: parsed.quiz ?? undefined, source: 'ai' };
      }
      return { text: '', source: 'ai', error: 'invalid morning JSON' };
    }

    return { text: raw, source: 'ai' };
  } catch (err) {
    console.warn('[telegram/generate]', slot, err?.message || err);
    return { text: '', source: 'ai', error: String(err?.message || err) };
  }
}

/**
 * Generate a fill-in-the-blank quiz from a morning post.
 * @param {string} postText
 * @returns {Promise<{ question: string, options: string[], correctOptionId: number, explanation?: string } | null>}
 */
export async function generateMorningQuiz(postText) {
  if (!aiEnabled() || !postText?.trim()) return null;

  const clientResult = createOpenAIClient();
  if ('error' in clientResult) return null;

  try {
    const completion = await clientResult.openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: buildMorningQuizPrompt(postText) }],
      temperature: 0.4,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return normalizeMorningQuiz(parsed);
  } catch (err) {
    console.warn('[telegram/morning-quiz]', err?.message || err);
    return null;
  }
}

/**
 * @param {string} essayText
 * @returns {Promise<{ text: string } | null>}
 */
export async function checkEssayViaAi(essayText) {
  if (!aiEnabled()) return null;

  const clientResult = createOpenAIClient();
  if ('error' in clientResult) return null;

  try {
    const completion = await clientResult.openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: ESSAY_CHECK_PROMPT },
        { role: 'user', content: essayText.slice(0, 4000) },
      ],
      temperature: 0.35,
      max_tokens: 1200,
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    return text ? { text } : null;
  } catch (err) {
    console.warn('[telegram/essay-check]', err?.message || err);
    return null;
  }
}

export function isTelegramAiEnabled() {
  return aiEnabled();
}
