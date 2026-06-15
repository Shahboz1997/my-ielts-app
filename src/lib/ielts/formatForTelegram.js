/**
 * Format a normalized IELTS check result into Telegram HTML message parts (≤3900 chars each).
 */
import { escapeHtml } from '@/lib/telegram';

const TG_CHUNK = 3900;

function esc(text) {
  return escapeHtml(String(text ?? '').trim());
}

function scoreLine(label, entry) {
  if (!entry) return '';
  const score =
    typeof entry.score === 'number' && Number.isFinite(entry.score)
      ? entry.score.toFixed(1)
      : String(entry.score ?? '—');
  const comment = esc(entry.comment || '');
  return `• <b>${esc(label)}</b>: ${score}${comment ? ` — ${comment}` : ''}`;
}

function chunkText(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return [];
  if (trimmed.length <= TG_CHUNK) return [trimmed];

  const chunks = [];
  let rest = trimmed;
  while (rest.length > TG_CHUNK) {
    let cut = rest.lastIndexOf('\n\n', TG_CHUNK);
    if (cut < TG_CHUNK * 0.5) cut = rest.lastIndexOf('\n', TG_CHUNK);
    if (cut < TG_CHUNK * 0.5) cut = TG_CHUNK;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function pushParts(parts, text) {
  for (const chunk of chunkText(text)) {
    if (chunk) parts.push(chunk);
  }
}

/**
 * @param {object} result — normalized output from normalizeCheckResult
 * @param {{ isT1?: boolean, isGtLetter?: boolean }} meta
 * @returns {string[]}
 */
export function formatIeltsForTelegram(result, { isT1 = false, isGtLetter = false } = {}) {
  if (!result || typeof result !== 'object') return [];

  const parts = [];
  const criteria = result.criteria || {};
  const taskKey = isT1 ? 'Task_Achievement' : 'Task_Response';
  const taskLabel = isGtLetter ? 'Task Achievement (letter)' : isT1 ? 'Task Achievement' : 'Task Response';

  let scores = '<b>📊 IELTS Writing — Deep Feedback</b>\n\n<b>Scores</b>\n';
  scores += `${scoreLine(taskLabel, criteria[taskKey])}\n`;
  scores += `${scoreLine('Coherence & Cohesion', criteria.Coherence_and_Cohesion)}\n`;
  scores += `${scoreLine('Lexical Resource', criteria.Lexical_Resource)}\n`;
  scores += `${scoreLine('Grammar (GRA)', criteria.Grammatical_Range_and_Accuracy)}\n`;

  const overall =
    typeof result.overall_band === 'number' && Number.isFinite(result.overall_band)
      ? result.overall_band.toFixed(1)
      : String(result.overall_band ?? '—');
  scores += `\n<b>Overall estimate: ${overall}</b>`;

  if (typeof result.word_count === 'number') {
    scores += `\n<i>Word count: ${result.word_count}</i>`;
  }

  const checklist = result.checklist;
  if (checklist && typeof checklist === 'object') {
    const flags = Object.entries(checklist)
      .filter(([, v]) => v === true || v === false)
      .slice(0, 6)
      .map(([k, v]) => `${v ? '✅' : '❌'} ${esc(k.replace(/_/g, ' '))}`);
    if (flags.length) {
      scores += `\n\n<b>Checklist</b>\n${flags.join('\n')}`;
    }
  }

  pushParts(parts, scores);

  const errors = Array.isArray(result.errors) ? result.errors.slice(0, 10) : [];
  if (errors.length) {
    let block = '<b>🔍 Key errors</b> <i>(grammar · logic · vocabulary)</i>\n';
    errors.forEach((e, i) => {
      const orig = esc(e.original || e.phrase || '');
      const fix = esc(e.correction || e.suggestion || e.rewrite || '');
      const type = esc(e.type || 'grammar');
      const sub = e.subtopic ? ` · ${esc(e.subtopic)}` : '';
      block += `\n${i + 1}. <code>${orig}</code>`;
      if (fix) block += `\n   → ${fix}`;
      block += `\n   <i>${type}${sub}</i>`;
    });
    pushParts(parts, block);
  }

  const logical = Array.isArray(result.logical_errors) ? result.logical_errors.slice(0, 4) : [];
  if (logical.length) {
    let block = '<b>⚠️ Logic / Task issues</b>\n';
    logical.forEach((e, i) => {
      block += `\n${i + 1}. <code>${esc(e.phrase)}</code>\n   ${esc(e.explanation)}\n`;
    });
    pushParts(parts, block);
  }

  const lex = Array.isArray(result.lexical_upgrade) ? result.lexical_upgrade.slice(0, 8) : [];
  if (lex.length) {
    let block = '<b>📚 Lexical upgrades</b> <i>(B2 → C1/C2)</i>\n';
    lex.forEach((item) => {
      const weak = esc(item.band_56_word || item.word || item.weak);
      const upgrade =
        item.c2_synonyms?.[0] ||
        item.c1_synonyms?.[0] ||
        item.band_89_synonyms?.[0] ||
        item.strong;
      const strong = esc(upgrade);
      const example = item.c2_example || item.c1_example;
      block += `\n• <code>${weak}</code> → <code>${strong}</code>`;
      if (example) block += `\n   <i>${esc(example)}</i>`;
      block += '\n';
    });
    pushParts(parts, block);
  }

  if (isGtLetter && result.letter_strategy) {
    const ls = result.letter_strategy;
    let block = '<b>✉️ Letter strategy</b>\n';
    if (ls.tone_register) block += `Tone: ${esc(ls.tone_register)}\n`;
    const fixes = Array.isArray(ls.what_to_fix) ? ls.what_to_fix.slice(0, 4) : [];
    fixes.forEach((f, i) => {
      block += `${i + 1}. ${esc(f)}\n`;
    });
    pushParts(parts, block);
  } else if (isT1 && result.task1_strategy) {
    const ts = result.task1_strategy;
    let block = '<b>📈 Task 1 strategy</b>\n';
    const fixes = Array.isArray(ts.what_to_fix) ? ts.what_to_fix.slice(0, 4) : [];
    fixes.forEach((f, i) => {
      block += `${i + 1}. ${esc(f)}\n`;
    });
    pushParts(parts, block);
  } else if (!isT1 && result.idea_development?.overall) {
    const idea = result.idea_development;
    let block = '<b>💡 Idea development</b>\n';
    if (idea.overall.summary) block += `${esc(idea.overall.summary)}\n`;
    const paras = Array.isArray(idea.paragraphs) ? idea.paragraphs.slice(0, 3) : [];
    paras.forEach((p) => {
      if (p.main_idea) block += `\n<b>${esc(p.label)}</b>: ${esc(p.main_idea)}`;
      if (Array.isArray(p.missing) && p.missing.length) {
        block += `\n   Missing: ${p.missing.map((m) => esc(m)).join(', ')}`;
      }
    });
    pushParts(parts, block);
  }

  if (result.improvement_strategy) {
    pushParts(parts, `<b>🎯 Priority fix</b>\n${esc(result.improvement_strategy)}`);
  }

  const rewrite = typeof result.suggested_rewrite === 'string' ? result.suggested_rewrite : '';
  if (rewrite) {
    const plain = rewrite.replace(/<mark[^>]*>/gi, '').replace(/<\/mark>/gi, '').trim();
    const excerpt = plain.length > 900 ? `${plain.slice(0, 900)}…` : plain;
    pushParts(
      parts,
      `<b>✨ Band 9 rewrite</b> <i>(excerpt)</i>\n\n${esc(excerpt)}\n\n<i>Full highlighted rewrite on stratum</i>`
    );
  }

  return parts;
}
