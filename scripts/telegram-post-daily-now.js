import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHANNEL_ID;
const templates = JSON.parse(readFileSync(join(root, 'data/templates.json'), 'utf8'));
const topics = JSON.parse(readFileSync(join(root, 'data/topics.json'), 'utf8'));
const SITE = 'https://startum-writing-ai.vercel.app/';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function pick(list, i) {
  return list[((i % list.length) + list.length) % list.length];
}

function dayIdx(date, slot) {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date - start) / 86400000);
  return day * 2 + (slot === 'evening' ? 1 : 0);
}

function link(campaign) {
  return `${SITE}?utm_source=telegram&utm_medium=channel&utm_campaign=${campaign}`;
}

function buildMorning(date) {
  const idx = dayIdx(date, 'morning');
  const t = pick(templates, idx);
  const label = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  return [
    '☀️ <b>STRATUM.ai — утренний tip</b>',
    `<i>${esc(label)}</i>`,
    '',
    '💡 CC: используйте linking words — However, Furthermore, In contrast.',
    '',
    `📝 <b>Структура:</b> ${esc(t.title)}`,
    ...(t.structure || []).slice(0, 3).map((s) => `• ${esc(s)}`),
    '',
    '✍️ Проверьте эссе с AI:',
    `<a href="${link('morning')}">startum-writing-ai.vercel.app</a>`,
    '',
    '#IELTS #Writing',
  ].join('\n');
}

function buildEvening(date) {
  const idx = dayIdx(date, 'evening');
  const topic = pick(topics, idx);
  const t = pick(templates.filter((x) => x.type === topic.type), idx) || pick(templates, idx);
  const label = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  return [
    '🌙 <b>STRATUM.ai — вечерняя практика</b>',
    `<i>${esc(label)}</i>`,
    '',
    `✍️ <b>${esc(topic.type === 'task1' ? 'Task 1' : 'Task 2')}</b>`,
    '',
    esc(topic.title),
    '',
    `⏱ ${topic.type === 'task1' ? '150+ слов, 20 мин' : '250+ слов, 40 мин'}`,
    t?.phrases?.introduction ? `\n<code>${esc(t.phrases.introduction)}</code>` : '',
    '',
    '🤖 Проверка по TA, CC, LR, GRA:',
    `<a href="${link('evening')}">startum-writing-ai.vercel.app</a>`,
    '',
    '#IELTS #Practice',
  ].join('\n');
}

async function send(text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description);
  return data.result.message_id;
}

const date = new Date();
const welcome = [
  '✅ <b>Канал Startum подключён!</b>',
  '',
  'Каждый день бот будет публиковать:',
  '☀️ ~08:00 — tip по IELTS Writing',
  '🌙 ~19:00 — тема для практики',
  '',
  `<a href="${link('welcome')}">startum-writing-ai.vercel.app</a>`,
].join('\n');

const ids = [];
ids.push(await send(welcome));
ids.push(await send(buildMorning(date)));
ids.push(await send(buildEvening(date)));
console.log('Posted message ids:', ids.join(', '));
