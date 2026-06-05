#!/usr/bin/env node
/**
 * Preview morning/evening group posts in the terminal.
 *   node scripts/telegram-preview-post.js
 */

import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Load compiled path via dynamic import won't work with @ alias — duplicate minimal preview
const templates = require('../data/templates.json');
const topics = require('../data/topics.json');

const STRATUM = 'https://startum-writing-ai.vercel.app/';

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
console.log(`Tip index: ${mIdx}`);
console.log(`Template: ${pick(templates, mIdx)?.title}`);
console.log(`Link: ${STRATUM}?utm_source=telegram&utm_medium=group&utm_campaign=morning\n`);

console.log('=== EVENING ===\n');
console.log(`Topic: ${pick(topics, eIdx)?.title}`);
console.log(`Link: ${STRATUM}?utm_source=telegram&utm_medium=group&utm_campaign=evening\n`);

console.log('Deploy then test send:');
console.log(
  'curl -H "Authorization: Bearer $CRON_SECRET" "https://startum-writing-ai.vercel.app/api/cron/telegram-daily?slot=morning"'
);
