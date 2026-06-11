/**
 * Telegram essay checking — deep analysis via runFullIeltsCheck (same pipeline as the web app).
 */
import { getOpenAIClient } from '@/lib/ielts/checkOpenai.js';
import { runFullIeltsCheck } from '@/lib/ielts/runFullIeltsCheck.js';
import { formatIeltsForTelegram } from '@/lib/ielts/formatForTelegram.js';
import { checkEssayViaAi, isTelegramAiEnabled } from '@/lib/telegramGeneratePost.js';

const NO_PROMPT_NOTE =
  'Not provided by the student. Infer the likely IELTS task/question from the essay and score Task Achievement/Response against that inference.';

function wordCount(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** @returns {{ isT1: boolean, isGtLetter: boolean, task1Kind: string, taskCriteriaName: string }} */
export function inferTelegramTaskContext(essayText) {
  const trimmed = String(essayText || '').trim();
  const wc = wordCount(trimmed);

  if (/^(dear\s|to whom it may concern)/i.test(trimmed)) {
    return {
      isT1: true,
      isGtLetter: true,
      task1Kind: 'gt_letter',
      taskCriteriaName: 'Task_Achievement',
    };
  }

  const t1Signals =
    /\b(\d+%|\d{4}|percent|percentage|figure|chart|graph|table|diagram|increased?|decreased?|rose|fell|peaked|compared to|whereas|respectively|the number of)\b/i;
  if (wc >= 100 && wc <= 240 && t1Signals.test(trimmed)) {
    return {
      isT1: true,
      isGtLetter: false,
      task1Kind: 'academic',
      taskCriteriaName: 'Task_Achievement',
    };
  }

  return {
    isT1: false,
    isGtLetter: false,
    task1Kind: 'academic',
    taskCriteriaName: 'Task_Response',
  };
}

function buildTelegramUserTextBlock({ essayText, isT1, isGtLetter }) {
  if (isGtLetter) {
    return `TASK: GT_LETTER\nPROMPT: ${NO_PROMPT_NOTE}\nSTUDENT LETTER:\n${essayText}`;
  }
  const mode = isT1 ? 'TASK1' : 'TASK2';
  return `TASK: ${mode}\nPROMPT: ${NO_PROMPT_NOTE}\nSTUDENT ESSAY:\n${essayText}`;
}

export function isDeepTelegramCheckEnabled() {
  return process.env.TELEGRAM_DEEP_CHECK !== '0';
}

/**
 * Deep essay check for Telegram DMs.
 * @param {string} essayText
 * @returns {Promise<{ messages: string[] } | { text: string } | null>}
 */
export async function checkEssayForTelegram(essayText) {
  if (!isTelegramAiEnabled()) return null;

  const userText = String(essayText || '').trim().slice(0, 4000);
  if (!userText) return null;

  if (!isDeepTelegramCheckEnabled()) {
    const shallow = await checkEssayViaAi(userText);
    return shallow?.text ? { text: shallow.text } : null;
  }

  const clientResult = getOpenAIClient();
  if ('error' in clientResult) {
    const shallow = await checkEssayViaAi(userText);
    return shallow?.text ? { text: shallow.text } : null;
  }

  const ctx = inferTelegramTaskContext(userText);
  const userTextBlock = buildTelegramUserTextBlock({ essayText: userText, ...ctx });

  try {
    const fullCheck = await runFullIeltsCheck({
      openai: clientResult.openai,
      userTextBlock,
      taskCriteriaName: ctx.taskCriteriaName,
      userText,
      isT1: ctx.isT1,
      isGtLetter: ctx.isGtLetter,
      task1Kind: ctx.task1Kind,
      image: null,
    });

    if (!fullCheck.ok) {
      console.warn('[telegram/essay-check] deep check failed:', fullCheck.message);
      const shallow = await checkEssayViaAi(userText);
      return shallow?.text ? { text: shallow.text } : null;
    }

    const messages = formatIeltsForTelegram(fullCheck.result, {
      isT1: ctx.isT1,
      isGtLetter: ctx.isGtLetter,
    });

    if (!messages.length) {
      const shallow = await checkEssayViaAi(userText);
      return shallow?.text ? { text: shallow.text } : null;
    }

    return { messages, taskContext: ctx };
  } catch (err) {
    console.warn('[telegram/essay-check]', err?.message || err);
    const shallow = await checkEssayViaAi(userText);
    return shallow?.text ? { text: shallow.text } : null;
  }
}
