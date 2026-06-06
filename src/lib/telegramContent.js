import studyResources from '../../data/studyResources.json';
import templates from '../../data/templates.json';
import topics from '../../data/topics.json';
import { buildCtaInlineKeyboard, escapeHtml } from '@/lib/telegram';
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

function withCta(text, url, label = '👉 Check your writing on the site') {
  return { text, replyMarkup: buildCtaInlineKeyboard(url, label) };
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
  const text = [
    '👋 <b>Welcome to STRATUM IELTS Writing!</b>',
    '',
    'On our channel — <b>2 posts a day</b>:',
    '☀️ morning — Writing tip',
    '🌙 evening — practice topic + <b>quiz</b> + <b>Check my text</b>',
    '',
    '<b>Commands:</b>',
    '/check — send your essay for AI feedback (4 IELTS criteria)',
    '/tip — template advice',
    '/topic — random essay prompt',
    '/resource — useful link',
  ].join('\n');
  return withCta(text, link);
}

export function buildTipMessage() {
  const t = randomItem(templates);
  if (!t) return { text: 'No templates in the bank yet.' };
  const lines = [
    `💡 <b>${escapeHtml(t.title)}</b>`,
    '',
    ...((t.structure || []).slice(0, 4).map((s) => `• ${escapeHtml(s)}`)),
  ];
  if (t.phrases?.introduction) {
    lines.push('', `<i>Intro:</i> ${escapeHtml(t.phrases.introduction)}`);
  }
  return withCta(lines.join('\n'), appUrl('tip'));
}

export function buildTopicMessage() {
  const t = randomItem(topics);
  if (!t) return { text: 'No topics in the bank yet.' };
  const text = [
    `✍️ <b>Practice prompt</b> (${escapeHtml(t.type)} · ${escapeHtml(t.subtype || '')})`,
    '',
    `<i>${escapeHtml(t.title)}</i>`,
  ].join('\n');
  return withCta(text, appUrl('topic'));
}

export function buildResourceMessage() {
  const pool = allResourcesFlat();
  const r = randomItem(pool);
  if (!r) return { text: 'No resources in the bank yet.' };
  const text = [
    `📖 <b>${escapeHtml(r.titleRu || r.title)}</b>`,
    r.durationMin ? `⏱ ~${r.durationMin} min` : '',
    r.source ? `📌 ${escapeHtml(r.source)}` : '',
    '',
    `→ <a href="${escapeHtml(r.url)}">Open resource</a>`,
  ]
    .filter(Boolean)
    .join('\n');
  return withCta(text, appUrl('resource'));
}
