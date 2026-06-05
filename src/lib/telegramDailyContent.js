/**
 * Daily Telegram posts — morning tips & evening practice.
 * CTA: inline keyboard. Evening: native Telegram quiz poll.
 */
import templates from '../../data/templates.json';
import topics from '../../data/topics.json';
import {
  buildCtaInlineKeyboard,
  escapeHtml,
  prepareTelegramHtml,
} from '@/lib/telegram';
import { generateTelegramPost } from '@/lib/telegramGeneratePost';
import { pickEveningQuiz } from '@/lib/telegramQuiz';
import { daySlotIndex, pickByIndex } from '@/lib/telegramSchedule';

/** Fixed public site — always used in group posts. */
export const STRATUM_SITE = 'https://startum-writing-ai.vercel.app/';

export { daySlotIndex };

const CTA_LABEL = '👉 Check your writing on the site';
const CTA_EVENING_LABEL = '👉 See quiz breakdown on site';

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

const MORNING_TRAPS = [
  'Putting specific figures in the overview → TA penalty.',
  'Starting body paragraphs without an overview → examiner notices immediately.',
  'Giving personal opinion in Task 1 → it is data description only.',
  'Thesis hidden in the body, not the intro → weak Task Response.',
  'New ideas in the conclusion → typical −0.5 band.',
  'Repeating the same word 5+ times → weak LR.',
  'Only short sentences → GRA rarely above 6.',
  'Linking words in every sentence → sounds unnatural.',
  'Skipping the second part of a discussion prompt → incomplete TR.',
  'Writing under 250 words in Task 2 → TA penalty.',
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
  const trap = pickByIndex(MORNING_TRAPS, idx);
  const template = pickByIndex(templates, idx);

  const lines = [
    `📊 <b>${escapeHtml(topicLabel)}</b>`,
    '',
    `❌ <b>Mistake:</b> ${escapeHtml(trap)}`,
    '',
    '✅ <b>Rule of the day:</b>',
  ];

  if (template?.structure?.length) {
    for (const step of template.structure.slice(0, 3)) {
      lines.push(`• ${escapeHtml(step)}`);
    }
  } else {
    lines.push(
      '• Overview/thesis in the intro — no extra detail',
      '• One main idea per paragraph',
      '• Check TA, CC, LR, GRA before submitting'
    );
  }

  lines.push(
    '',
    '🔗 Full cheat sheets and our <b>AI writing checker</b> — on the site (button below).'
  );

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
    `<i>${escapeHtml(topic?.title || 'Pick a topic in the Bank and write an essay today.')}</i>`,
    '',
    `⏱ ${words}`,
    '',
    `⚠️ <b>Trap:</b> ${escapeHtml(trap)}`,
    '',
    '📊 <b>Vote in the poll below</b> — then open the breakdown on our site.',
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

  const generated = await generateTelegramPost(slot, { topic, siteLink: ctaUrl });
  if (generated?.text) {
    const post = {
      text: prepareTelegramHtml(generated.text),
      parseMode: 'HTML',
      replyMarkup: buildCtaInlineKeyboard(ctaUrl, ctaLabel),
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
    return post;
  }

  return buildStaticPost(slot, date);
}
