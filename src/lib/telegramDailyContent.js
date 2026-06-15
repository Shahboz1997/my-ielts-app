/**
 * Daily Telegram posts — morning tips & evening practice.
 * CTA: inline keyboard. Evening: native Telegram quiz poll.
 */
import topics from '../../data/topics.json';
import {
  buildCtaInlineKeyboard,
  buildPostInlineKeyboard,
  escapeHtml,
  getTelegramBotUsername,
  MORNING_QUIZ_DELAY_SEC,
  prepareTelegramHtml,
} from '@/lib/telegram';
import { generateMorningQuiz, generateTelegramPost } from '@/lib/telegramGeneratePost';
import { pickEveningQuiz } from '@/lib/telegramQuiz';
import { daySlotIndex, pickByIndex } from '@/lib/telegramSchedule';

/** Fixed public site — always used in group posts. */
export const STRATUM_SITE = 'https://stratumielts.com/';

export { daySlotIndex };

const SITE_LINK_HTML = '<a href="https://stratumielts.com/">stratumielts.com</a>';

function appendSiteLinkHtml(text) {
  const t = String(text ?? '').trim();
  if (t.includes('stratumielts.com')) return t;
  return `${t}\n\n—\n✍️ Practice with AI feedback: ${SITE_LINK_HTML}`;
}

const CTA_LABEL = '👉 stratumielts.com — Check your writing';
const CTA_EVENING_LABEL = '👉 stratumielts.com — Quiz breakdown';

const MORNING_TOPICS = [
  'Task 1: overview without numbers — common mistake and fix',
  'Task 1: comparing data — higher than, whereas, compared to',
  'Task 1 (process): passive voice — is collected, is filtered',
  'Task 1 (letter): register and bullet points — formal tone',
  'Task 2: thesis at the end of the introduction — clear position',
  'Task 2: one main idea per paragraph — do not mix arguments',
  'Task 2 (discussion): On the one hand / On the other hand',
  'Task 2 (opinion): This essay strongly agrees/disagrees that…',
  'Coherence (CC): linking words between paragraphs',
  'Lexical Resource (LR): avoid repetition — use synonyms',
  'Grammar (GRA): mix simple and complex sentences',
  'Task Achievement (TA): every paragraph must address the prompt',
];

const EVENING_TRAPS = [
  'Examiners expect the overview right after the intro — do not save it for the end.',
  'In an opinion essay, state your position in the intro, not only in the body.',
  'In discussion essays, cover both sides + your view — otherwise incomplete TR.',
  'In process diagrams, describe "how", not "why".',
  'In letters, each bullet from the prompt = its own paragraph.',
  'Do not copy the prompt wording verbatim in the intro — paraphrase.',
  'Compare data groups; do not list every figure in a row.',
  'In problem-solution essays, solutions must be specific, not abstract.',
];

function siteLink(campaign, extra = {}) {
  const base = STRATUM_SITE.replace(/\/$/, '');
  const q = new URLSearchParams({
    utm_source: 'telegram',
    utm_medium: 'group',
    utm_campaign: campaign,
    ...extra,
  });
  return `${base}/?${q}`;
}

function quizBreakdownLink(campaign) {
  const base = STRATUM_SITE.replace(/\/$/, '');
  const q = new URLSearchParams({
    id: campaign,
    utm_source: 'telegram',
    utm_medium: 'group',
    utm_campaign: campaign,
  });
  return `${base}/telegram-quiz?${q}`;
}

function subtypeLabel(subtype) {
  const map = {
    graph: 'Graph',
    table: 'Table',
    process: 'Process',
    letter: 'Letter',
    opinion: 'Opinion',
    discussion: 'Discussion',
    'problem-solution': 'Problem-Solution',
  };
  return map[subtype] || subtype || '';
}

/** @param {Date} date @param {'morning'|'evening'} slot */
export function pickTopicForSlot(date, slot) {
  const idx = daySlotIndex(date, slot);
  if (slot === 'evening') {
    const topic = pickByIndex(topics, idx);
    if (!topic) return 'IELTS Writing — Task 1 or Task 2 practice';
    const task = topic.type === 'task1' ? 'Task 1' : 'Task 2';
    const sub = topic.subtype ? ` (${subtypeLabel(topic.subtype)})` : '';
    return `${task}${sub}: ${topic.title}`;
  }
  return pickByIndex(MORNING_TOPICS, idx) || 'IELTS Writing — tip of the day';
}

function buildMorningPostStatic(date, campaign, ctaUrl) {
  const idx = daySlotIndex(date, 'morning');
  const topicLabel = pickByIndex(MORNING_TOPICS, idx);

  const lines = [
    `📊 <b>${escapeHtml(topicLabel)}</b>`,
    '',
    '✅ <b>Collocations of the day:</b>',
    '• <code>of paramount importance</code> — of the greatest importance [Band 7.5+ Vocabulary]',
    '  Synonym: <code>of vital significance</code>',
    '• <code>stem from</code> — to originate from [Band 7+ LR]',
    '  Synonym: <code>arise from</code>',
    '',
    '🔧 <b>Grammar Tip</b>',
    '❌ <i>Education is important. Technology is also important.</i>',
    '✅ <i>Education remains paramount, whereas technology serves mainly as a tool.</i>',
    `<tg-spoiler>Образование остаётся первостепенным, тогда как технологии служат в основном инструментом.</tg-spoiler>`,
    '',
    '✍️ <b>Task of the Day:</b> Write one sentence using <code>of paramount importance</code> in the comments.',
    '',
    `🔗 Full cheat sheets and our <b>AI writing checker</b> — ${SITE_LINK_HTML}`,
  ];

  return {
    text: lines.join('\n'),
    parseMode: 'HTML',
    replyMarkup: buildCtaInlineKeyboard(ctaUrl, CTA_LABEL),
    campaign,
    source: 'static',
  };
}

function buildEveningPostStatic(date, campaign, ctaUrl) {
  const idx = daySlotIndex(date, 'evening');
  const topic = pickByIndex(topics, idx);
  const trap = pickByIndex(EVENING_TRAPS, idx);
  const quiz = pickEveningQuiz(date);
  const taskLabel = topic?.type === 'task1' ? 'Task 1' : 'Task 2';
  const words = topic?.type === 'task1' ? '150+ words, 20 min' : '250+ words, 40 min';

  const lines = [
    '🌙 <b>Evening warm-up</b>',
    '',
    `✍️ <b>${escapeHtml(taskLabel)}</b>${topic?.subtype ? ` · ${escapeHtml(subtypeLabel(topic.subtype))}` : ''}`,
    '',
    `<i>${escapeHtml(topic?.title || 'Pick a practice topic and write an essay today.')}</i>`,
    '',
    `⏱ ${words}`,
    '',
    `⚠️ <b>Trap:</b> ${escapeHtml(trap)}`,
    '',
    '📊 <b>Vote in the poll below</b> — then open the breakdown on our site.',
    '',
    `🔗 ${SITE_LINK_HTML}`,
  ];

  return {
    text: lines.join('\n'),
    parseMode: 'HTML',
    replyMarkup: buildCtaInlineKeyboard(ctaUrl, CTA_EVENING_LABEL),
    poll: quiz
      ? {
          question: quiz.question,
          options: quiz.options,
          correctOptionId: quiz.correctOptionId,
          explanation: quiz.explanation,
        }
      : undefined,
    campaign,
    source: 'static',
  };
}

function buildStaticPost(slot, date) {
  const campaign = `${slot}_${date.toISOString().slice(0, 10)}`;
  const ctaUrl =
    slot === 'evening' ? quizBreakdownLink(campaign) : siteLink(campaign);
  return slot === 'evening'
    ? buildEveningPostStatic(date, campaign, ctaUrl)
    : buildMorningPostStatic(date, campaign, ctaUrl);
}

/**
 * @param {'morning'|'evening'} slot
 * @param {Date} [date]
 */
export function buildDailyPost(slot, date = new Date()) {
  return buildStaticPost(slot, date).text;
}

/**
 * @param {'morning'|'evening'} slot
 * @param {Date} [date]
 */
export async function buildDailyPostAsync(slot, date = new Date()) {
  const campaign = `${slot}_${date.toISOString().slice(0, 10)}`;
  const ctaUrl =
    slot === 'evening' ? quizBreakdownLink(campaign) : siteLink(campaign);
  const topic = pickTopicForSlot(date, slot);
  const ctaLabel = slot === 'evening' ? CTA_EVENING_LABEL : CTA_LABEL;

  const botUsername = getTelegramBotUsername();

  const generated = await generateTelegramPost(slot, { topic, siteLink: ctaUrl });
  if (generated?.text) {
    const post = {
      text: appendSiteLinkHtml(prepareTelegramHtml(generated.text)),
      parseMode: 'HTML',
      replyMarkup: buildPostInlineKeyboard({
        ctaUrl,
        ctaLabel,
        botUsername,
        includeCheckButton: slot === 'evening',
      }),
      campaign,
      source: 'ai',
    };
    if (slot === 'evening') {
      const quiz = pickEveningQuiz(date);
      if (quiz) {
        post.poll = {
          question: quiz.question,
          options: quiz.options,
          correctOptionId: quiz.correctOptionId,
          explanation: quiz.explanation,
        };
      }
    }
    if (slot === 'morning') {
      const morningQuiz = await generateMorningQuiz(generated.text);
      if (morningQuiz) {
        post.poll = morningQuiz;
        post.pollScheduleDate = new Date(Date.now() + MORNING_QUIZ_DELAY_SEC * 1000);
      }
    }
    return post;
  }

  const staticPost = buildStaticPost(slot, date);
  if (slot === 'evening') {
    staticPost.replyMarkup = buildPostInlineKeyboard({
      ctaUrl,
      ctaLabel: CTA_EVENING_LABEL,
      botUsername,
      includeCheckButton: true,
    });
  }
  return staticPost;
}
