/**
 * Generate Telegram posts via OpenAI using telegramPostPrompts templates.
 * Falls back to caller-provided static text when OpenAI is unavailable.
 */
import { createOpenAIClient, getTrimmedOpenAIKey, isPlaceholderOpenAiKey } from '@/lib/openaiServer';
import { buildTelegramPrompt } from '@/lib/telegramPostPrompts';

const MODEL = (process.env.TELEGRAM_OPENAI_MODEL || 'gpt-4o-mini').trim();

function aiEnabled() {
  if (process.env.TELEGRAM_USE_AI === '0') return false;
  const key = getTrimmedOpenAIKey();
  return Boolean(key) && !isPlaceholderOpenAiKey(key);
}

/**
 * @param {'morning'|'evening'} slot
 * @param {{ topic: string, siteLink: string }} ctx
 * @returns {Promise<{ text: string, source: 'ai'|'static', error?: string } | null>}
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
      max_tokens: 600,
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return { text: '', source: 'ai', error: 'empty response' };
    }

    return { text, source: 'ai' };
  } catch (err) {
    console.warn('[telegram/generate]', slot, err?.message || err);
    return { text: '', source: 'ai', error: String(err?.message || err) };
  }
}

export function isTelegramAiEnabled() {
  return aiEnabled();
}
