/**
 * Full STRATUM Writing analysis PDF (home page Task 1/2): mirrors on-screen analysis
 * (criteria, linguistic insights, lexical upgrade C1/C2, corrections, model response).
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDF_BRAND_TAGLINE, PDF_CONTACT_LINE, PDF_LEGAL_LINE } from '@/lib/support';
import { mergeLexicalUpgrades } from '@/lib/lexicalUpgrade';

function getLinkingWords(result) {
  return result?.analysis?.linking_words ?? result?.linking_words ?? null;
}

function getWordRepetition(result) {
  const raw = result?.analysis?.word_repetition ?? result?.word_repetition ?? [];
  return Array.isArray(raw) ? raw : [];
}

function normalizeCefrStats(cefrStats) {
  if (!cefrStats || typeof cefrStats !== 'object') return null;
  const out = {};
  if (Array.isArray(cefrStats)) {
    cefrStats.forEach((x) => {
      const id = (x?.level ?? x?.id ?? '').toString().toUpperCase();
      if (id) out[id] = Math.min(100, Math.max(0, Number(x?.percent ?? x?.value ?? 0)));
    });
  } else {
    Object.entries(cefrStats).forEach(([k, v]) => {
      const id = String(k).toUpperCase();
      out[id] = Math.min(100, Math.max(0, Number(v)));
    });
  }
  return Object.keys(out).length ? out : null;
}

/** Decode common HTML entities (SSR-safe, no DOM). */
function decodeHtmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/**
 * Some API payloads glitch with & between single letters (e.g. &i&n&f…).
 * Only run when there are several & — avoids breaking normal "R&D" or "A & B".
 */
function fixInterleavedAmpersands(str) {
  let s = String(str);
  const amp = (s.match(/&/g) || []).length;
  if (amp < 4) return s;
  let prev;
  do {
    prev = s;
    s = s.replace(/([a-zA-Z0-9])&([a-zA-Z0-9])/g, '$1$2');
  } while (s !== prev);
  return s;
}

/** Remove HTML; keep inner text of <mark>…</mark>. */
function stripHtmlToPlain(str) {
  let s = String(str || '');
  s = s.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '$1');
  s = s.replace(/<[^>]+>/g, '');
  return s;
}

/**
 * Clean strings for jsPDF default fonts (Helvetica): entities, glitches, extra spaces.
 */
function sanitizePdfText(str) {
  let s = stripHtmlToPlain(str);
  s = decodeHtmlEntities(s);
  s = fixInterleavedAmpersands(s);
  s = s.replace(/\u00a0/g, ' ').replace(/[\u200b-\u200d\ufeff]/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

/** Preserve line/paragraph breaks for essay body (matches site whitespace-pre-wrap). */
function prepareEssayForPdf(str) {
  let s = stripHtmlToPlain(String(str || ''));
  s = decodeHtmlEntities(s);
  s = fixInterleavedAmpersands(s);
  s = s.replace(/\u00a0/g, ' ').replace(/[\u200b-\u200d\ufeff]/g, '');
  return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

/** Split essay into paragraphs (blank line or single Enter in the editor). */
function splitEssayParagraphs(essayText) {
  const prepared = prepareEssayForPdf(essayText);
  if (!prepared) return [];
  const byBlankLine = prepared
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\n+/g, ' ').replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
  if (byBlankLine.length > 1) return byBlankLine;
  return prepared
    .split(/\n+/)
    .map((p) => p.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
}

/**
 * Paragraphs for model response: respect newlines; split long single blocks by sentence groups.
 */
function splitModelResponseParagraphs(text) {
  const paras = splitEssayParagraphs(text);
  if (paras.length > 1) return paras;
  const block = (paras[0] || sanitizePdfText(String(text)) || '').trim();
  if (!block) return ['—'];
  if (block.length < 220) return [block];
  const sentences = block
    .match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)
    ?.map((s) => s.trim())
    .filter(Boolean);
  if (!sentences || sentences.length <= 2) return [block];
  const targetParas = Math.min(5, Math.max(2, Math.ceil(sentences.length / 2)));
  const chunkSize = Math.ceil(sentences.length / targetParas);
  const out = [];
  for (let i = 0; i < sentences.length; i += chunkSize) {
    out.push(sentences.slice(i, i + chunkSize).join(' '));
  }
  return out.length ? out : [block];
}

function modelParagraphLabel(paraIdx, total, isGtLetter) {
  if (total <= 1) return null;
  if (isGtLetter) {
    if (paraIdx === 0) return 'OPENING';
    if (paraIdx === total - 1) return 'CLOSING';
    return `PARAGRAPH ${paraIdx + 1}`;
  }
  if (total === 2) return paraIdx === 0 ? 'INTRODUCTION' : 'CONCLUSION';
  if (paraIdx === 0) return 'INTRODUCTION';
  if (paraIdx === total - 1) return 'CONCLUSION';
  return `BODY ${paraIdx}`;
}

const CHART_IMAGE_MAX_HEIGHT = 95;
const ESSAY_PARAGRAPH_GAP = 9;

/** Collect unique error phrases from corrections / errors (whole phrases, not tokenized). */
function collectErrorPhrases(result) {
  const seen = new Set();
  const phrases = [];
  const add = (raw) => {
    const phrase = sanitizePdfText(raw || '').trim();
    if (phrase.length < 2) return;
    const key = phrase.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    phrases.push(phrase);
  };
  (Array.isArray(result?.corrections) ? result.corrections : []).forEach((c) => add(c.original));
  (Array.isArray(result?.errors) ? result.errors : []).forEach((e) => {
    if (typeof e === 'string') add(e);
    else add(e?.original ?? e?.word ?? e?.text);
  });
  return phrases.sort((a, b) => b.length - a.length);
}

/** Character ranges in `text` where an error phrase appears (case-insensitive). */
function buildErrorRangesInText(text, phrases) {
  if (!text || !phrases.length) return [];
  const lower = text.toLowerCase();
  const ranges = [];
  for (const phrase of phrases) {
    const needle = phrase.toLowerCase();
    if (!needle) continue;
    let from = 0;
    while (from <= lower.length - needle.length) {
      const idx = lower.indexOf(needle, from);
      if (idx === -1) break;
      ranges.push({ start: idx, end: idx + phrase.length });
      from = idx + 1;
    }
  }
  if (!ranges.length) return [];
  ranges.sort((a, b) => a.start - b.start);
  const merged = [{ ...ranges[0] }];
  for (let i = 1; i < ranges.length; i++) {
    const r = ranges[i];
    const last = merged[merged.length - 1];
    if (r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }
  return merged;
}

function partOverlapsErrorRanges(partStart, partEnd, ranges) {
  if (!ranges.length || partEnd <= partStart) return false;
  return ranges.some((r) => partStart < r.end && partEnd > r.start);
}

function formatSynonymsField(syn) {
  if (syn == null) return '—';
  if (Array.isArray(syn)) {
    return syn.map((x) => sanitizePdfText(String(x))).filter(Boolean).join(', ') || '—';
  }
  return sanitizePdfText(String(syn)) || '—';
}

function formatSynonymList(synonyms) {
  if (!Array.isArray(synonyms) || synonyms.length === 0) return '—';
  return (
    synonyms
      .map((x) => sanitizePdfText(String(x)))
      .filter(Boolean)
      .slice(0, 8)
      .join(', ') || '—'
  );
}

/**
 * @param {Object} opts
 * @param {boolean} opts.isT1
 * @param {Object} opts.result - API analysis object
 * @param {string} opts.essay
 * @param {string|null} [opts.chartImage] - data URL for Task 1 chart
 * @param {string} [opts.promptText]
 * @param {'academic'|'gt_letter'} [opts.task1Kind]
 */
export function generateStratumWritingPdf({
  isT1,
  result,
  essay,
  chartImage = null,
  promptText = '',
  task1Kind = 'academic',
}) {
  const isGtLetter =
    isT1 && (task1Kind === 'gt_letter' || result?.task1Kind === 'gt_letter');
  if (!result) return;

  const doc = new jsPDF();
  const MARGIN = 20;
  const PAGE_WIDTH = 210;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  const FOOTER_Y = 287;
  const BODY_BOTTOM = FOOTER_Y - 18;
  const SECTION_GAP = 10;

  const indigo = [79, 70, 229];
  const indigoLight = [238, 242, 255];
  const themeRed = [220, 38, 38];
  const greyBorder = [226, 232, 240];
  const greyText = [71, 85, 105];
  const amberText = [146, 64, 14];
  const essayParagraphs = splitEssayParagraphs(essay);
  const safePrompt = sanitizePdfText(String(promptText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n'));

  const addFooter = (pdf, pageIndex, totalPages) => {
    pdf.setFontSize(7);
    pdf.setTextColor(...greyText);
    pdf.text(`Page ${pageIndex} / ${totalPages}`, PAGE_WIDTH / 2, FOOTER_Y - 10, { align: 'center' });
    pdf.setFontSize(8);
    pdf.text(PDF_BRAND_TAGLINE, PAGE_WIDTH / 2, FOOTER_Y - 3, { align: 'center' });
    pdf.setFontSize(6);
    pdf.text(PDF_LEGAL_LINE, PAGE_WIDTH / 2, FOOTER_Y + 3, { align: 'center' });
    pdf.text(PDF_CONTACT_LINE, PAGE_WIDTH / 2, FOOTER_Y + 8, { align: 'center' });
  };

  const ensureSpace = (currentY, needed) => {
    if (currentY + needed > BODY_BOTTOM) {
      doc.addPage();
      return MARGIN + 12;
    }
    return currentY;
  };

  let y = MARGIN;

  doc.setTextColor(...indigo);
  doc.setFontSize(18);
  const logoText = 'S T R A T U M';
  const letterSpacing = 3;
  let logoX = MARGIN;
  for (let i = 0; i < logoText.length; i++) {
    doc.text(logoText[i], logoX, y + 8);
    logoX += doc.getTextWidth(logoText[i]) + (logoText[i] === ' ' ? 2 : letterSpacing);
  }
  doc.setFontSize(8);
  doc.setTextColor(...greyText);
  doc.text('.ai', logoX, y + 8);
  y += 22;

  doc.setFillColor(...indigo);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 28, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(
    `Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    MARGIN + 8,
    y + 10
  );
  doc.text(
    `Task Type: ${
      isGtLetter ? 'Task 1 (GT Letter)' : isT1 ? 'Task 1 (Academic)' : 'Task 2 (Essay)'
    }`,
    MARGIN + 8,
    y + 18
  );
  doc.setFontSize(22);
  doc.text(`Overall Band: ${result.overall_band != null ? result.overall_band : '—'}`, MARGIN + 8, y + 26);
  y += 34 + SECTION_GAP;

  if (safePrompt.trim()) {
    y = ensureSpace(y, 28);
    doc.setTextColor(...indigo);
    doc.setFontSize(12);
    doc.text('Task topic', MARGIN, y);
    y += 7;
    doc.setFontSize(9);
    doc.setTextColor(...greyText);
    const promptLines = doc.splitTextToSize(safePrompt, CONTENT_WIDTH);
    promptLines.forEach((line) => {
      y = ensureSpace(y, 5);
      doc.text(line, MARGIN, y);
      y += 4.5;
    });
    y += SECTION_GAP;
  }

  y = ensureSpace(y, 22);
  doc.setTextColor(...indigo);
  doc.setFontSize(12);
  doc.text('1. The Draft', MARGIN, y);
  y += 7;

  const errorPhrases = collectErrorPhrases(result);
  const linkingMap = {};
  const lwForMap = getLinkingWords(result);
  if (lwForMap?.found) {
    lwForMap.found.forEach((word) => {
      const clean = sanitizePdfText(String(word || ''))
        .toLowerCase()
        .replace(/[.,!?;:()]/g, '');
      if (clean) linkingMap[clean] = true;
    });
  }

  if (
    isT1 &&
    !isGtLetter &&
    chartImage &&
    typeof chartImage === 'string' &&
    chartImage.startsWith('data:image')
  ) {
    try {
      const format = chartImage.includes('png') ? 'PNG' : 'JPEG';
      y = ensureSpace(y, CHART_IMAGE_MAX_HEIGHT + 12);
      doc.setDrawColor(...greyBorder);
      doc.setLineWidth(0.4);
      doc.roundedRect(MARGIN - 1, y - 2, CONTENT_WIDTH + 2, CHART_IMAGE_MAX_HEIGHT + 4, 2, 2, 'S');
      doc.addImage(chartImage, format, MARGIN, y, CONTENT_WIDTH, CHART_IMAGE_MAX_HEIGHT, undefined, 'FAST');
      y += CHART_IMAGE_MAX_HEIGHT + 10;
    } catch {
      y += 4;
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let currentX = MARGIN;
  const lineHeight = 6;

  const renderEssayWords = (paragraphText) => {
    const errorRanges = buildErrorRangesInText(paragraphText, errorPhrases);
    let charIndex = 0;
    const wordsInParagraph = paragraphText.split(/(\s+)/);
    wordsInParagraph.forEach((part) => {
      if (!part) return;
      const partStart = charIndex;
      const partEnd = charIndex + part.length;
      charIndex = partEnd;
      const isError = partOverlapsErrorRanges(partStart, partEnd, errorRanges);
      const clean = part.toLowerCase().trim().replace(/[.,!?;:()]/g, '');
      const isLink = !isError && linkingMap[clean];
      const wordWidth = doc.getTextWidth(part);

      if (currentX + wordWidth > PAGE_WIDTH - MARGIN) {
        currentX = MARGIN;
        y += lineHeight;
      }
      const pagesBefore = doc.getNumberOfPages();
      y = ensureSpace(y, 8);
      if (doc.getNumberOfPages() > pagesBefore) currentX = MARGIN;
      if (y < MARGIN + 8) y = MARGIN + 8;

      if (isError) {
        doc.setFillColor(254, 226, 226);
        doc.rect(currentX, y - 3.5, wordWidth, 5, 'F');
        doc.setDrawColor(...themeRed);
        doc.line(currentX, y - 1, currentX + wordWidth, y - 1);
        doc.setTextColor(0, 0, 0);
      } else if (isLink) {
        doc.setFillColor(219, 234, 254);
        doc.rect(currentX, y - 3.5, wordWidth, 5, 'F');
        doc.setTextColor(30, 58, 138);
      } else {
        doc.setTextColor(40, 40, 40);
      }

      doc.text(part, currentX, y);
      currentX += wordWidth;
    });
  };

  essayParagraphs.forEach((paragraph, idx) => {
    if (idx > 0) {
      currentX = MARGIN;
      y += ESSAY_PARAGRAPH_GAP;
    }
    renderEssayWords(paragraph);
  });
  y += 12;

  // Keep all four criteria on a readable page: break before section 2 if little room left
  if (y > BODY_BOTTOM - 95) {
    doc.addPage();
    y = MARGIN + 12;
  }

  y += 4;
  doc.setTextColor(...indigo);
  doc.setFontSize(12);
  doc.text('2. Criteria breakdown', MARGIN, y);
  y += 10;

  const taskKey = isT1 ? 'Task_Achievement' : 'Task_Response';
  const cards = [
    { title: isT1 ? 'TASK ACHIEVEMENT' : 'TASK RESPONSE', critKey: taskKey },
    { title: 'COHERENCE & COHESION', critKey: 'Coherence_and_Cohesion' },
    { title: 'LEXICAL RESOURCE', critKey: 'Lexical_Resource' },
    { title: 'GRAMMATICAL RANGE & ACCURACY', critKey: 'Grammatical_Range_and_Accuracy' },
  ];

  cards.forEach((card) => {
    const crit = result.criteria?.[card.critKey];
    const score = crit?.score != null ? crit.score : '—';
    const comment = typeof crit?.comment === 'string' ? sanitizePdfText(crit.comment) : '';
    const bullets = comment
      .split(/\n+|\.\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
    const estH = 22 + bullets.reduce((acc, b) => acc + doc.splitTextToSize('• ' + b, CONTENT_WIDTH - 6).length * 4.2, 0);
    y = ensureSpace(y, Math.min(estH + 8, 85));

    doc.setDrawColor(...greyBorder);
    doc.setLineWidth(0.35);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    y += 5;
    doc.setTextColor(...indigo);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(card.title, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Score: ${score}`, PAGE_WIDTH - MARGIN, y, { align: 'right' });
    y += 6;
    doc.setTextColor(...greyText);
    doc.setFontSize(8.5);
    bullets.forEach((b) => {
      const lines = doc.splitTextToSize('• ' + b, CONTENT_WIDTH - 6);
      lines.forEach((line) => {
        y = ensureSpace(y, 5);
        doc.text(line, MARGIN + 4, y);
        y += 4.2;
      });
    });
    if (bullets.length === 0) {
      doc.text('No specific feedback for this criterion.', MARGIN + 4, y);
      y += 5;
    }
    y += 6;
  });
  y += SECTION_GAP;

  if (result.improvement_strategy && String(result.improvement_strategy).trim()) {
    y = ensureSpace(y, 24);
    doc.setTextColor(...indigo);
    doc.setFontSize(12);
    doc.text('3. Improvement strategy', MARGIN, y);
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(...greyText);
    const stratLines = doc.splitTextToSize(sanitizePdfText(String(result.improvement_strategy)), CONTENT_WIDTH);
    stratLines.forEach((line) => {
      y = ensureSpace(y, 5);
      doc.text(line, MARGIN, y);
      y += 4.8;
    });
    y += SECTION_GAP;
  }

  const letterStrat = isGtLetter ? result?.letter_strategy : null;
  if (letterStrat && typeof letterStrat === 'object') {
    y = ensureSpace(y, 36);
    doc.setTextColor(...indigo);
    doc.setFontSize(12);
    doc.text('3b. Letter structure', MARGIN, y);
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(...greyText);
    const toneLine = `Tone: ${letterStrat.tone_match || 'formal'}`;
    doc.text(toneLine, MARGIN, y);
    y += 6;
    const bullets = Array.isArray(letterStrat.bullets_coverage) ? letterStrat.bullets_coverage : [];
    bullets.slice(0, 6).forEach((b) => {
      const line = `${b.covered ? '[OK]' : '[MISS]'} ${b.bullet || 'Bullet'}${b.comment ? ` — ${b.comment}` : ''}`;
      const lines = doc.splitTextToSize(sanitizePdfText(line), CONTENT_WIDTH);
      lines.forEach((ln) => {
        y = ensureSpace(y, 5);
        doc.text(ln, MARGIN, y);
        y += 4.5;
      });
    });
    y += SECTION_GAP;
  }

  const lw = getLinkingWords(result);
  const repetitions = getWordRepetition(result);
  const hasInsights =
    lw ||
    repetitions.length > 0 ||
    (result.plagiarism && (result.plagiarism.score != null || result.plagiarism.status));

  if (hasInsights) {
    y = ensureSpace(y, 26);
    doc.setTextColor(...indigo);
    doc.setFontSize(12);
    doc.text('4. Linguistic insights', MARGIN, y);
    y += 9;

    if (lw) {
      doc.setFontSize(9);
      doc.setTextColor(...amberText);
      const scoreStr = lw.score != null ? `Linking words (score): ${lw.score} / 9.0` : 'Linking words';
      doc.text(scoreStr, MARGIN, y);
      y += 6;
      doc.setTextColor(...greyText);
      const found = Array.isArray(lw.found) ? lw.found.map((w) => sanitizePdfText(String(w))) : [];
      const foundText = found.length ? found.join(', ') : '—';
      const foundLines = doc.splitTextToSize(`Found: ${foundText}`, CONTENT_WIDTH);
      foundLines.forEach((line) => {
        y = ensureSpace(y, 5);
        doc.text(line, MARGIN, y);
        y += 4.8;
      });
      const sugg = Array.isArray(lw.suggestions) ? lw.suggestions.map((s) => sanitizePdfText(String(s))) : [];
      const suggText = sugg.length ? sugg.join(', ') : '—';
      const suggLines = doc.splitTextToSize(`Suggested additions: ${suggText}`, CONTENT_WIDTH);
      suggLines.forEach((line) => {
        y = ensureSpace(y, 5);
        doc.text(line, MARGIN, y);
        y += 4.8;
      });
      y += 6;
    }

    if (repetitions.length > 0) {
      y = ensureSpace(y, 20);
      doc.setFontSize(9);
      doc.setTextColor(...indigo);
      doc.text('Frequency alert (repetition)', MARGIN, y);
      y += 5;
      autoTable(doc, {
        startY: y,
        head: [['Word / phrase', 'Count', 'Band 8+ replacements']],
        body: repetitions.slice(0, 30).map((item) => {
          const wordText = typeof item === 'object' ? (item.word ?? '') : String(item ?? '');
          const count = typeof item === 'object' ? Number(item.count ?? 0) : 0;
          const alts = typeof item === 'object' && Array.isArray(item.alternatives) ? item.alternatives : [];
          return [
            sanitizePdfText(String(wordText)).slice(0, 80),
            count > 0 ? String(count) : '—',
            alts.length ? alts.map((a) => sanitizePdfText(String(a))).slice(0, 14).join(', ') : '—',
          ];
        }),
        theme: 'striped',
        headStyles: { fillColor: indigo, fontSize: 9, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: { top: 3, right: 3, bottom: 3, left: 3 }, valign: 'top' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: MARGIN, right: MARGIN },
      });
      y = (doc.lastAutoTable?.finalY ?? y) + SECTION_GAP;
    }

    if (result.plagiarism && (result.plagiarism.score != null || result.plagiarism.status)) {
      y = ensureSpace(y, 22);
      doc.setFontSize(9);
      doc.setTextColor(...greyText);
      const pScore = result.plagiarism.score != null ? `${result.plagiarism.score}%` : '—';
      doc.text(`Plagiarism check: ${pScore}`, MARGIN, y);
      y += 5;
      if (result.plagiarism.status) {
        const stLines = doc.splitTextToSize(sanitizePdfText(String(result.plagiarism.status)), CONTENT_WIDTH);
        stLines.forEach((line) => {
          y = ensureSpace(y, 5);
          doc.text(line, MARGIN, y);
          y += 4.8;
        });
      }
      y += SECTION_GAP;
    }
  }

  const cefrNorm = normalizeCefrStats(result.cefr_stats);
  if (cefrNorm) {
    y = ensureSpace(y, 18);
    doc.setTextColor(...indigo);
    doc.setFontSize(10);
    doc.text('CEFR distribution (%)', MARGIN, y);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(...greyText);
    const parts = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => `${lvl}: ${cefrNorm[lvl] ?? 0}%`);
    const line = parts.join('   ');
    const wrap = doc.splitTextToSize(line, CONTENT_WIDTH);
    wrap.forEach((wline) => {
      y = ensureSpace(y, 5);
      doc.text(wline, MARGIN, y);
      y += 4.8;
    });
    y += SECTION_GAP;
  }

  y = ensureSpace(y, 28);
  doc.setTextColor(...indigo);
  doc.setFontSize(12);
  doc.text('5. Lexical upgrade', MARGIN, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(...greyText);
  doc.text('Swap weak words for sharper choices (C1 / C2)', MARGIN, y);
  y += 8;

  const lexicalRows = mergeLexicalUpgrades({
    apiRows: Array.isArray(result.lexical_upgrade) ? result.lexical_upgrade : [],
    essayText: essay || '',
    isT1: isT1 && !isGtLetter,
  });

  if (lexicalRows.length > 0) {
    const tableBody = lexicalRows.map((row) => [
      sanitizePdfText(row.band_56_word) || '—',
      formatSynonymList(row.c1_synonyms),
      formatSynonymList(row.c2_synonyms),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Band 5–6 (weak)', 'C1 — sharper choice', 'C2 — sharper choice']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: indigo, fontSize: 8.5, textColor: 255, fontStyle: 'bold' },
      styles: {
        fontSize: 8,
        cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
        overflow: 'linebreak',
        valign: 'top',
      },
      columnStyles: {
        0: { cellWidth: CONTENT_WIDTH * 0.26, fontStyle: 'italic' },
        1: { cellWidth: CONTENT_WIDTH * 0.37 },
        2: { cellWidth: CONTENT_WIDTH * 0.37 - 0.5 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: MARGIN, right: MARGIN },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + SECTION_GAP;
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...greyText);
    doc.text('No lexical upgrades for this submission.', MARGIN, y);
    y += 8;
  }

  const corrections = Array.isArray(result.corrections) ? result.corrections : [];
  if (corrections.length > 0) {
    doc.addPage();
    y = MARGIN + 10;
    doc.setTextColor(...indigo);
    doc.setFontSize(12);
    doc.text('6. Detailed corrections', MARGIN, y);
    y += 6;
    autoTable(doc, {
      startY: y + 2,
      head: [['#', 'Type', 'Original', 'Correction', 'Explanation']],
      body: corrections.map((c, i) => [
        String(i + 1),
        sanitizePdfText(String(c.category || c.rule || '—')).slice(0, 36),
        sanitizePdfText(String(c.original || '—')),
        sanitizePdfText(String(c.fixed || c.suggestion || '—')),
        sanitizePdfText(String(c.explanation || '—')),
      ]),
      theme: 'grid',
      headStyles: { fillColor: indigo, fontSize: 9, textColor: 255, fontStyle: 'bold' },
      styles: {
        fontSize: 8,
        cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
        overflow: 'linebreak',
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 11 },
        1: { cellWidth: 26 },
        2: { cellWidth: 38 },
        3: { cellWidth: 38 },
        4: { cellWidth: CONTENT_WIDTH - 11 - 26 - 38 - 38 - 0.5 },
      },
      margin: { left: MARGIN, right: MARGIN },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.15,
    });
    y = (doc.lastAutoTable?.finalY ?? y) + SECTION_GAP;
  }

  const rawModel = result.suggested_rewrite || 'Not available.';
  const modelParagraphs = splitModelResponseParagraphs(String(rawModel));
  const MODEL_INSET = 9;
  const MODEL_LINE_H = 5.35;
  const MODEL_PARA_GAP = 7;
  const MODEL_TEXT_W = CONTENT_WIDTH - MODEL_INSET * 2;
  const modelSlate = [30, 41, 59];

  y = ensureSpace(y, 26);
  doc.setTextColor(...indigo);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('7. The model response', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...greyText);
  doc.text('Band 9 target · examiner-style rewrite', MARGIN, y + 5);
  y += 15;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);

  modelParagraphs.forEach((para, paraIdx) => {
    const safePara = sanitizePdfText(para) || '—';
    const lines = doc.splitTextToSize(safePara, MODEL_TEXT_W);
    const label = modelParagraphLabel(paraIdx, modelParagraphs.length, isGtLetter);
    const labelOffset = label ? 5.5 : 0;
    const boxH = lines.length * MODEL_LINE_H + MODEL_INSET * 2 + labelOffset;

    y = ensureSpace(y, boxH + MODEL_PARA_GAP);

    doc.setFillColor(...indigoLight);
    doc.setDrawColor(...greyBorder);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, boxH, 2.5, 2.5, 'FD');

    if (label) {
      doc.setFontSize(7);
      doc.setTextColor(...indigo);
      doc.setFont('helvetica', 'bold');
      doc.text(label, MARGIN + MODEL_INSET, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
    }

    let textY = y + MODEL_INSET + 3.5 + labelOffset;
    doc.setTextColor(...modelSlate);
    lines.forEach((line) => {
      doc.text(line, MARGIN + MODEL_INSET, textY);
      textY += MODEL_LINE_H;
    });

    y += boxH + MODEL_PARA_GAP;
  });

  y += SECTION_GAP - MODEL_PARA_GAP;

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addFooter(doc, p, totalPages);
  }
  doc.save(`STRATUM_Report_${isGtLetter ? 'GT_Letter' : isT1 ? 'T1' : 'T2'}_${Date.now()}.pdf`);
}

/** Payload shape used by archive export helper. */
export function generateStratumWritingPdfFromArchivePayload({ isT1, result, essay, prompt, question, image }) {
  generateStratumWritingPdf({
    isT1,
    result,
    essay,
    chartImage: image || null,
    promptText: prompt || question || '',
    task1Kind: result?.task1Kind || 'academic',
  });
}

/**
 * DB / dashboard archive row (Prisma Check): same full PDF as the home page.
 * @param {Object} check - { type, content, promptText?, feedback }
 */
export function generateStratumWritingPdfFromCheck(check) {
  if (!check) return;
  let result = {};
  try {
    result = typeof check.feedback === 'string' ? JSON.parse(check.feedback) : check.feedback || {};
  } catch (_) {
    result = {};
  }
  if (!result || typeof result !== 'object') result = {};
  const isT1 = (check.type || 'TASK_2') === 'TASK_1';
  generateStratumWritingPdf({
    isT1,
    result,
    essay: check.content || '',
    chartImage: null,
    promptText: check.promptText || '',
  });
}
