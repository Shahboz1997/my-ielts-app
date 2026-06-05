/**
 * Daily Telegram group posts — morning & evening IELTS Writing tips.
 * All CTA links point to STRATUM.ai only (no third-party URLs in group posts).
 */
import templates from '../../data/templates.json';
import topics from '../../data/topics.json';
import { escapeHtml } from '@/lib/telegram';

/** Fixed public site — always used in group posts. */
export const STRATUM_SITE = 'https://startum-writing-ai.vercel.app/';

const CRITERION_TIPS = [
  {
    ru: 'TA / TR: каждый абзац должен отвечать на вопрос задания. Не уходите от темы.',
    en: 'TA: every paragraph must address the task prompt.',
  },
  {
    ru: 'CC: используйте linking words между абзацами — However, Furthermore, In contrast.',
    en: 'CC: use clear linking words between paragraphs.',
  },
  {
    ru: 'LR: избегайте повторов — заменяйте important → significant → crucial.',
    en: 'LR: avoid word repetition; use synonyms.',
  },
  {
    ru: 'GRA: чередуйте простые и сложные предложения — не только short sentences.',
    en: 'GRA: mix simple and complex sentence structures.',
  },
];

const TASK1_CHECKS = [
  'Task 1: overview обязателен — 1–2 предложения о главном тренде без цифр.',
  'Task 1: не пишите своё мнение — только описание данных.',
  'Task 1: сравнивайте группы — higher than, compared to, whereas.',
  'Task 1 (graph): начните с The line graph illustrates…',
  'Task 1 (table): выделите самую большую разницу в overview.',
  'Task 1 (process): используйте passive voice — is collected, is filtered.',
];

const TASK2_CHECKS = [
  'Task 2: thesis в конце introduction — чёткая позиция.',
  'Task 2: один main idea на абзац — не смешивайте аргументы.',
  'Task 2 (opinion): This essay strongly agrees/disagrees that…',
  'Task 2 (discussion): On the one hand… / On the other hand…',
  'Task 2: conclusion только перефразирует, без новых идей.',
  'Task 2: минимум 250 слов — следите за объёмом.',
];

function siteLink(campaign) {
  const base = STRATUM_SITE.replace(/\/$/, '');
  const q = new URLSearchParams({
    utm_source: 'telegram',
    utm_medium: 'group',
    utm_campaign: campaign,
  });
  return `${base}/?${q}`;
}

/** Deterministic index — same slot/day always picks same item until next day. */
function daySlotIndex(date, slot) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  const slotBit = slot === 'evening' ? 1 : 0;
  return dayOfYear * 2 + slotBit;
}

function pickByIndex(list, index) {
  if (!Array.isArray(list) || !list.length) return null;
  return list[((index % list.length) + list.length) % list.length];
}

function templatePhrasesFlat() {
  const out = [];
  for (const t of templates) {
    const phrases = t.phrases || {};
    for (const [key, text] of Object.entries(phrases)) {
      if (text && String(text).trim()) {
        out.push({
          templateTitle: t.title,
          type: t.type,
          key,
          text: String(text).trim(),
        });
      }
    }
  }
  return out;
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

/**
 * @param {'morning'|'evening'} slot
 * @param {Date} [date]
 */
export function buildDailyPost(slot, date = new Date()) {
  return slot === 'evening' ? buildEveningPost(date) : buildMorningPost(date);
}

function buildMorningPost(date) {
  const idx = daySlotIndex(date, 'morning');
  const dateLabel = date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const pools = [
    ...CRITERION_TIPS.map((t) => ({ kind: 'criterion', text: t.ru })),
    ...TASK1_CHECKS.map((text) => ({ kind: 'task1', text })),
    ...TASK2_CHECKS.map((text) => ({ kind: 'task2', text })),
    ...templatePhrasesFlat().map((p) => ({
      kind: 'phrase',
      text: `${p.templateTitle}: «${p.text}»`,
    })),
  ];

  const tip = pickByIndex(pools, idx);
  const template = pickByIndex(templates, idx);
  const link = siteLink(`morning_${date.toISOString().slice(0, 10)}`);

  const lines = [
    `☀️ <b>STRATUM.ai — утренний tip</b>`,
    `<i>${escapeHtml(dateLabel)}</i>`,
    '',
    `💡 ${escapeHtml(tip?.text || 'Начните день с 15 минут письма — это лучше, чем час без практики.')}`,
  ];

  if (template?.structure?.length) {
    lines.push('', `📝 <b>Структура дня:</b> ${escapeHtml(template.title)}`);
    for (const step of template.structure.slice(0, 3)) {
      lines.push(`• ${escapeHtml(step)}`);
    }
  }

  lines.push(
    '',
    '✍️ Проверьте своё эссе с AI-экзаменатором:',
    `<a href="${escapeHtml(link)}">startum-writing-ai.vercel.app</a>`,
    '',
    '#IELTS #Writing #Task1 #Task2'
  );

  return lines.join('\n');
}

function buildEveningPost(date) {
  const idx = daySlotIndex(date, 'evening');
  const dateLabel = date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const topic = pickByIndex(topics, idx);
  const template = pickByIndex(
    templates.filter((t) => !topic || t.type === topic.type),
    idx
  ) || pickByIndex(templates, idx);

  const link = siteLink(`evening_${date.toISOString().slice(0, 10)}`);
  const taskLabel = topic?.type === 'task1' ? 'Task 1' : 'Task 2';
  const words = topic?.type === 'task1' ? '150+ слов' : '250+ слов';

  const lines = [
    `🌙 <b>STRATUM.ai — вечерняя практика</b>`,
    `<i>${escapeHtml(dateLabel)}</i>`,
    '',
    `✍️ <b>${escapeHtml(taskLabel)}</b>${topic?.subtype ? ` · ${escapeHtml(subtypeLabel(topic.subtype))}` : ''}`,
    '',
    escapeHtml(topic?.title || 'Выберите тему в Bank и напишите эссе сегодня.'),
    '',
    `⏱ Задание: ${words}, ${topic?.type === 'task1' ? '20' : '40'} минут`,
  ];

  if (template) {
    lines.push('', `📋 <b>Шаблон:</b> ${escapeHtml(template.title)}`);
    if (template.phrases?.introduction) {
      lines.push(`<code>${escapeHtml(template.phrases.introduction)}</code>`);
    }
    if (template.example) {
      lines.push('', `<i>Пример:</i> ${escapeHtml(template.example.slice(0, 200))}…`);
    }
  }

  lines.push(
    '',
    '🤖 Отправьте текст на проверку — band-оценка по TA, CC, LR, GRA:',
    `<a href="${escapeHtml(link)}">startum-writing-ai.vercel.app</a>`,
    '',
    '#IELTS #Writing #Practice'
  );

  return lines.join('\n');
}
