#!/usr/bin/env node
/**
 * Preview morning/evening group posts (static fallback format).
 *   node scripts/telegram-preview-post.js
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const templates = JSON.parse(readFileSync(join(root, 'data/templates.json'), 'utf8'));
const topics = JSON.parse(readFileSync(join(root, 'data/topics.json'), 'utf8'));
const STRATUM = 'https://stratumielts.com/';

const MORNING_TOPICS = [
  'Task 1: overview without numbers',
  'Task 2: thesis in introduction',
  'Coherence: linking words',
];

function pick(list, i) {
  return list[((i % list.length) + list.length) % list.length];
}

function dayIdx(date, slot) {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date - start) / 86400000);
  return day * 2 + (slot === 'evening' ? 1 : 0);
}

const date = new Date();
const mIdx = dayIdx(date, 'morning');
const eIdx = dayIdx(date, 'evening');

console.log('=== MORNING ===\n');
console.log(`AI topic: ${pick(MORNING_TOPICS, mIdx)}`);
console.log(`Template: ${pick(templates, mIdx)?.title}`);
console.log(`Link: ${STRATUM}?utm_source=telegram&utm_medium=group&utm_campaign=morning`);
console.log('Prompt: src/lib/telegramPostPrompts.js → MORNING_MASTER_PROMPT\n');

console.log('=== EVENING ===\n');
console.log(`AI topic: ${pick(topics, eIdx)?.title}`);
console.log(`Link: ${STRATUM}?utm_source=telegram&utm_medium=group&utm_campaign=evening`);
console.log('Prompt: src/lib/telegramPostPrompts.js → EVENING_POST_PROMPT\n');

console.log('With OPENAI_API_KEY, cron generates posts via src/lib/telegramGeneratePost.js');
console.log('');
console.log('Test cron (Windows-friendly):');
console.log('  node --env-file=.env.local scripts/telegram-trigger-cron.js morning');
console.log('  .\\scripts\\telegram-test-cron.ps1 morning');
console.log('');
console.log('Bash only: curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/telegram-daily?slot=morning"');
