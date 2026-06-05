import studyResources from '../../data/studyResources.json';
import templates from '../../data/templates.json';
import topics from '../../data/topics.json';
import { escapeHtml } from '@/lib/telegram';
import { STRATUM_SITE, buildDailyPost } from '@/lib/telegramDailyContent';

function appUrl(utmCampaign) {
  const base = STRATUM_SITE.replace(/\/$/, '');
  const params = new URLSearchParams({
    utm_source: 'telegram',
    utm_medium: 'bot',
    utm_campaign: utmCampaign,
  });
  return `${base}/?${params}`;
}

function randomItem(list) {
  if (!Array.isArray(list) || !list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function allResourcesFlat() {
  const out = [];
  for (const list of Object.values(studyResources.criteria || {})) {
    if (Array.isArray(list)) out.push(...list);
  }
  for (const list of Object.values(studyResources.subtopics || {})) {
    if (Array.isArray(list)) out.push(...list);
  }
  if (Array.isArray(studyResources.gtLetter)) out.push(...studyResources.gtLetter);
  return out;
}

/** @deprecated Use buildDailyPost('morning' | 'evening') */
export function buildMonthlyPost(date = new Date()) {
  return buildDailyPost('morning', date);
}

export function buildStartMessage() {
  const link = appUrl('start');
  return [
    '👋 <b>Добро пожаловать в STRATUM IELTS Writing!</b>',
    '',
    'В группе — 2 поста в день:',
    '☀️ утром — tip по Writing',
    '🌙 вечером — тема для практики',
    '',
    '<b>Команды:</b>',
    '/tip — совет по шаблону',
    '/topic — случайная тема для эссе',
    '/resource — полезная ссылка',
    '',
    `✍️ <a href="${escapeHtml(link)}">startum-writing-ai.vercel.app</a>`,
  ].join('\n');
}

export function buildTipMessage() {
  const t = randomItem(templates);
  if (!t) return 'Пока нет шаблонов в базе.';
  const lines = [
    `💡 <b>${escapeHtml(t.title)}</b>`,
    '',
    ...((t.structure || []).slice(0, 4).map((s) => `• ${escapeHtml(s)}`)),
  ];
  if (t.phrases?.introduction) {
    lines.push('', `<i>Intro:</i> ${escapeHtml(t.phrases.introduction)}`);
  }
  lines.push('', `→ <a href="${escapeHtml(appUrl('tip'))}">startum-writing-ai.vercel.app</a>`);
  return lines.join('\n');
}

export function buildTopicMessage() {
  const t = randomItem(topics);
  if (!t) return 'Пока нет тем в базе.';
  return [
    `✍️ <b>Тема для практики</b> (${escapeHtml(t.type)} · ${escapeHtml(t.subtype || '')})`,
    '',
    escapeHtml(t.title),
    '',
    `→ <a href="${escapeHtml(appUrl('topic'))}">startum-writing-ai.vercel.app</a>`,
  ].join('\n');
}

export function buildResourceMessage() {
  const pool = allResourcesFlat();
  const r = randomItem(pool);
  if (!r) return 'Пока нет ресурсов в базе.';
  return [
    `📖 <b>${escapeHtml(r.titleRu || r.title)}</b>`,
    r.durationMin ? `⏱ ~${r.durationMin} мин` : '',
    r.source ? `📌 ${escapeHtml(r.source)}` : '',
    '',
    `→ <a href="${escapeHtml(r.url)}">Открыть</a>`,
    '',
    `✍️ <a href="${escapeHtml(appUrl('resource'))}">startum-writing-ai.vercel.app</a>`,
  ]
    .filter(Boolean)
    .join('\n');
}
