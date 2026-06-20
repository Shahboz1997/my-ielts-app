/**
 * One-off test post: OpenAI (gpt-4o) + Telegram channel.
 * Usage: node send-once.mjs [morning|evening]
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID =
  process.env.TELEGRAM_CHAT_ID ||
  process.env.TELEGRAM_CHANNEL_ID ||
  process.env.TELEGRAM_GROUP_ID;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const SITE = 'https://stratumielts.com/';
const BOT_USERNAME = (process.env.TELEGRAM_BOT_USERNAME || 'Stratum_ielts_writing_bot').trim();
const args = process.argv.slice(2);
const STATIC = args.includes('--static');
const SLOT = args.includes('evening') ? 'evening' : 'morning';

const WEEKDAY = new Date().getDay();
const weekday = (WEEKDAY + 6) % 7;

const MORNING = [
  { rubric: '📚 Vocabulary (LR)', module: 'Academic Task 1', brief: 'Collocations for describing line graphs — trends and comparisons.' },
  { rubric: '🔧 Grammar Tip (GRA)', module: 'General Task 1', brief: 'Formal register and modal verbs in complaint letters.' },
  { rubric: '🏗️ Essay Structure (CC)', module: 'Task 2', brief: '4-paragraph skeleton for discussion essays + linking words.' },
  { rubric: '📋 Task 1 Templates (TA+CC)', module: 'Academic Task 1', brief: 'Overview and comparison phrases for bar charts.' },
  { rubric: '🧠 Tough Topic (TA+LR)', module: 'Task 2', brief: 'Climate change — arguments, collocations, staying on topic.' },
  { rubric: '📖 Topic Word Bank (LR)', module: 'Task 2', brief: 'Education theme — Band 7.5+ collocations with synonyms.' },
  { rubric: '⚡ Advanced Grammar (GRA)', module: 'Task 2', brief: 'Participle clauses for Band 7+.' },
];

const EVENING = [
  { rubric: '✍️ Practice: Academic Task 1', brief: 'Line graph prompt + plan + TA checklist (no full answer).' },
  { rubric: '✉️ Practice: General Task 1', brief: 'Complaint letter prompt + structure + phrases.' },
  { rubric: '🎯 Prompt Breakdown: Task 2 Academic', brief: 'Opinion essay — deconstruct prompt, thesis, outline.' },
  { rubric: '🎯 Prompt Breakdown: Task 2 General', brief: 'Two-part question about family/work — answer BOTH parts.' },
  { rubric: '❌ Error Analysis', brief: 'Band 5.5 fragment with 5 annotated mistakes.' },
  { rubric: '🏆 Band 8.5 Essay Breakdown', brief: 'Model essay with TA/CC/LR/GRA notes.' },
  { rubric: '🔄 Weekly Challenge', brief: 'Task 1 + Task 2 prompts + 16-point self-check.' },
];

const plan = (SLOT === 'morning' ? MORNING : EVENING)[weekday];
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SYSTEM_MORNING = `You are an expert IELTS Writing tutor for the STRATUM.ai Telegram channel.
Audience: non-native English speakers. Tone: professional, supportive, clear.
Language: **English only** — no Russian or any other language anywhere in the post.

Use Telegram HTML: <b>bold</b>, <i>italic</i>, <code>collocations</code>. No markdown, no URLs, no <tg-spoiler>.

REQUIRED sections:
<b>📚 Vocabulary</b> — 4–6 collocations with [Band 7.5+] tags, synonym, <i>example</i>
<b>🔧 Grammar Tip</b> — ❌ wrong + ✅ correct + one short English note on why ✅ works
<b>✍️ Task of the Day</b> — one sentence inviting a comment example

Length: 900–1400 characters. Output ONLY the post.`;

const SYSTEM_EVENING = `You are an expert IELTS Writing tutor for STRATUM.ai Telegram channel.
Use Telegram Markdown: **bold**, *italic*, bullet lists. English only. No URLs.

Include: evening task, trap, mention **Check my text** button for AI essay feedback.
Length: 800–1200 characters. Output ONLY the post.`;

const SYSTEM = SLOT === 'morning' ? SYSTEM_MORNING : SYSTEM_EVENING;

const USER = `Day: ${dayNames[weekday]} | Slot: ${SLOT === 'morning' ? 'Morning theory' : 'Evening practice'}
Rubric: ${plan.rubric}
${plan.module ? `Module: ${plan.module}` : ''}
Brief: ${plan.brief}

Generate today's post now.`;

async function generate() {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: USER },
      ],
      temperature: 0.75,
      max_tokens: 1500,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || JSON.stringify(data));
  return data.choices[0].message.content.trim();
}

async function sendTelegram(text, parseMode, campaign, botUsername) {
  const ctaUrl = `${SITE}?utm_source=telegram&utm_medium=channel&utm_campaign=${campaign}`;
  const rows = [[{ text: '👉 stratumielts.com — Check your writing', url: ctaUrl }]];
  if (SLOT === 'evening' && botUsername) {
    rows.push([{ text: '✅ Check my text', url: `https://t.me/${botUsername}?start=check` }]);
  }
  const body = {
    chat_id: CHAT_ID,
    text,
    disable_web_page_preview: false,
    reply_markup: { inline_keyboard: rows },
  };
  if (parseMode) body.parse_mode = parseMode;
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description);
  return data.result.message_id;
}

function siteFooter(body) {
  return `${body}\n\n—\n✍️ Practice with AI feedback:\n${SITE}`;
}

if (!TOKEN || !CHAT_ID || !OPENAI_KEY) {
  console.error('Missing TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, or OPENAI_API_KEY in .env.local');
  process.exit(1);
}

console.log(`${STATIC ? 'Static' : 'AI'} ${SLOT} post (${plan.rubric}) → chat ${CHAT_ID}…`);

let text;
if (STATIC) {
  text = [
    `<b>${plan.rubric}</b>`,
    `<i>${dayNames[weekday]} · Morning theory</i>`,
    '',
    '<b>📚 Vocabulary</b>',
    '• <code>of paramount importance</code> — of the greatest importance [Band 7.5+ Vocabulary]',
    '  Synonym: <code>of vital significance</code>',
    '  Example: <i>Education is of paramount importance for social mobility.</i>',
    '• <code>stem from</code> — to originate from [Band 7+ LR]',
    '  Synonym: <code>arise from</code>',
    '',
    '<b>🔧 Grammar Tip</b>',
    'Use <code>whereas</code> to contrast two ideas in one sentence.',
    '❌ <i>Education is important. Technology is also important.</i>',
    '✅ <i>Education remains paramount, whereas technology serves mainly as a tool.</i>',
    '<i>Why it works: <code>whereas</code> links two contrasting ideas in one formal sentence.</i>',
    '',
    '<b>✍️ Task of the Day:</b> Write one sentence using <code>of paramount importance</code> in the comments.',
    '',
    '💡 This is a <b>setup test</b> — if you see this, Telegram credentials work.',
  ].join('\n');
} else {
  text = await generate();
}
console.log('--- Preview ---\n', text.slice(0, 500), text.length > 500 ? '…' : '', '\n');

const campaign = `${SLOT}_${new Date().toISOString().slice(0, 10)}`;
const payload = siteFooter(text);
const parseMode = SLOT === 'morning' ? 'HTML' : 'Markdown';

const botUsername = BOT_USERNAME;

let messageId;
try {
  messageId = await sendTelegram(payload, parseMode, campaign, botUsername);
} catch (e) {
  console.warn('Parse mode failed, sending plain:', e.message);
  messageId = await sendTelegram(payload.replace(/<[^>]+>/g, ''), undefined, campaign, botUsername);
}

console.log(`✅ Posted message_id=${messageId} to channel ${CHAT_ID}`);
