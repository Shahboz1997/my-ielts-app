'use client';

import React from 'react';
import {
  CEFR_COLORS,
  CEFR_LEVELS,
  CEFR_LEVEL_LABELS,
  CEFR_TEXT_CLASS,
  ERROR_TYPE_HIGHLIGHT_CLASS,
  PLACEHOLDER_CEFR,
} from './constants';

export function ErrorHighlightLegend({ className = '' }) {
  const items = [
    { dot: 'bg-rose-500', label: 'Grammar', title: 'Красный: Грамматика (Grammar)' },
    { dot: 'bg-sky-500', label: 'Logic & TA', title: 'Синий: Логика и данные (Logic & Task Achievement)' },
    { dot: 'bg-purple-500', label: 'Vocabulary', title: 'Фиолетовый: Словарный запас (Vocabulary)' },
  ];
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className}`}
      role="list"
      aria-label="Легенда цветов подсветки: грамматика, логика и данные, словарь"
    >
      {items.map((it) => (
        <div
          key={it.label}
          role="listitem"
          className="inline-flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400"
          title={it.title}
        >
          <span className={`h-2 w-2 rounded-full shrink-0 ${it.dot}`} aria-hidden />
          <span className="font-medium text-slate-700 dark:text-slate-300 tracking-tight">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

export function normalizeClientErrorType(t) {
  const s = String(t || '').toLowerCase().trim();
  if (s === 'vocabulary' || s === 'lexical') return 'lexical';
  if (s === 'logical' || s === 'task' || s === 'cohesion' || s === 'coherence') return 'logic';
  if (s === 'grammar' || s === 'logic' || s === 'lexical') return s;
  return 'grammar';
}

export function renderHighlighterSpans(segments, { handleAutoFix, setUserText, scrollToErrorCard }) {
  return segments.map((seg, i) => {
    if (seg.kind === 'highlight' || seg.kind === 'correction') {
      const errType = normalizeClientErrorType(seg.type ?? 'grammar');
      const cls = ERROR_TYPE_HIGHLIGHT_CLASS[errType] || ERROR_TYPE_HIGHLIGHT_CLASS.grammar;
      const tip = String(seg.suggestion ?? seg.impact ?? '').trim();
      return (
        <span key={`hc-${i}`} className={`${cls} rounded px-0.5`} title={tip || undefined}>
          {seg.text}
        </span>
      );
    }
    if (seg.kind !== 'error') {
      return <span key={`t-${i}`}>{seg.text}</span>;
    }
    const errType = normalizeClientErrorType(seg.errorType);
    const cls = ERROR_TYPE_HIGHLIGHT_CLASS[errType] || ERROR_TYPE_HIGHLIGHT_CLASS.grammar;
    const replacement = seg.fixed || seg.suggestion;
    const canReplace = Boolean(setUserText && replacement && String(replacement).trim() !== String(seg.text).trim());
    return (
      <span
        key={`${seg.id}-${i}`}
        className={`${cls} rounded px-0.5 transition-all duration-200 cursor-pointer hover:opacity-90`}
        role="button"
        tabIndex={0}
        onClick={() => {
          scrollToErrorCard(seg.id, seg.errorType);
          if (canReplace) handleAutoFix(seg.text, replacement);
        }}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            scrollToErrorCard(seg.id, seg.errorType);
            if (canReplace) handleAutoFix(seg.text, replacement);
          }
        }}
        title={seg.explanation || replacement || seg.suggestion || ''}
      >
        {seg.text}
      </span>
    );
  });
}

export function buildWordLevelsMap(wordLevels) {
  const map = new Map();
  if (!wordLevels) return map;
  if (Array.isArray(wordLevels)) {
    wordLevels.forEach((x) => {
      const word = (x?.word ?? x?.token ?? '').toString().toLowerCase().trim();
      const level = (x?.level ?? x?.cefr ?? '').toString().toUpperCase();
      if (word && level && CEFR_COLORS[level]) map.set(word, level);
    });
  } else if (typeof wordLevels === 'object') {
    Object.entries(wordLevels).forEach(([word, level]) => {
      const w = String(word).toLowerCase().trim();
      const l = String(level).toUpperCase();
      if (w && l && CEFR_COLORS[l]) map.set(w, l);
    });
  }
  return map;
}

export function buildErrorWordsSet(errorsArray, corrections) {
  const set = new Set();
  const add = (str) => {
    if (str) {
      String(str)
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .forEach((w) => {
          const c = w.replace(/\W/g, '');
          if (c) set.add(c);
        });
    }
  };
  (errorsArray || []).forEach((e) => add(typeof e === 'string' ? e : (e?.word ?? e?.original ?? e?.text ?? '')));
  (corrections || []).forEach((c) => add(c?.original));
  return set;
}

export function renderTextWithWordLevels(userText, wordLevelsMap, errorWordsSet, onErrorClick, weakWordsSet) {
  if (!userText || typeof userText !== 'string') return userText;
  const weakSet = weakWordsSet && weakWordsSet.size > 0 ? weakWordsSet : null;
  const tokens = userText.split(/(\b\w+\b)/);
  return tokens.map((token, i) => {
    if (!/^\w+$/.test(token)) return <span key={i}>{token}</span>;
    const key = `wl-${i}-${token}`;
    const normalized = token.toLowerCase();
    const level = wordLevelsMap.get(normalized);
    const isError = errorWordsSet.has(normalized);
    const isWeak = weakSet && weakSet.has(normalized);
    const title = level ? CEFR_LEVEL_LABELS[level] : undefined;
    const className = [
      'rounded px-0.5 cursor-pointer transition-colors',
      isError
        ? 'bg-yellow-100 border-b-2 border-orange-400 dark:bg-yellow-500/20 dark:border-orange-400'
        : isWeak
          ? 'bg-amber-100/80 dark:bg-amber-900/30 border-b-2 border-amber-400/70 dark:border-amber-500/50 text-amber-800/90 dark:text-amber-200/90'
          : level && CEFR_TEXT_CLASS[level]
            ? `${CEFR_TEXT_CLASS[level]} hover:opacity-90`
            : '',
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <span
        key={key}
        className={className || undefined}
        title={title}
        onClick={isError && onErrorClick ? () => onErrorClick() : undefined}
      >
        {token}
      </span>
    );
  });
}

export function buildSegments(content, highlights, corrections) {
  const items = [];
  (highlights || []).forEach((h, i) => {
    items.push({ text: h.text, type: h.type || 'grammar', suggestion: h.suggestion, id: `h-${i}`, kind: 'highlight' });
  });
  (corrections || []).forEach((c, i) => {
    const type =
      (c.category || '').toLowerCase().includes('lexical') || (c.category || '').toLowerCase().includes('vocab')
        ? 'lexical'
        : 'grammar';
    items.push({
      text: c.original,
      type,
      suggestion: c.explanation || c.impact,
      id: `c-${i}`,
      kind: 'correction',
      fixed: c.fixed,
      impact: c.impact,
    });
  });
  if (!items.length) return [{ text: content, type: null, id: null }];
  const sorted = [...items].sort((a, b) => {
    const posA = content.toLowerCase().indexOf(a.text.toLowerCase());
    const posB = content.toLowerCase().indexOf(b.text.toLowerCase());
    if (posA === -1 && posB === -1) return 0;
    if (posA === -1) return 1;
    if (posB === -1) return -1;
    return posA - posB;
  });
  const segments = [];
  let lastEnd = 0;
  for (const it of sorted) {
    const pos = content.toLowerCase().indexOf(it.text.toLowerCase(), lastEnd);
    if (pos === -1) continue;
    if (pos > lastEnd) segments.push({ text: content.slice(lastEnd, pos), type: null, id: null });
    segments.push({ ...it });
    lastEnd = pos + it.text.length;
  }
  if (lastEnd < content.length) segments.push({ text: content.slice(lastEnd), type: null, id: null });
  return segments;
}

export function buildSegmentsFromErrors(content, errors) {
  if (!content || !Array.isArray(errors) || errors.length === 0) {
    return [{ kind: 'text', text: content || '' }];
  }
  const items = errors
    .map((e, i) => ({
      id: e.id ?? `error-${i}`,
      original: (e.original ?? e.word ?? e.text ?? '').toString().trim(),
      errorType: normalizeClientErrorType(e.type ?? e.category),
      suggestion: e.suggestion || e.fixed || '',
      explanation: e.explanation || e.impact || '',
      fixed: e.fixed || e.suggestion || '',
    }))
    .filter((e) => e.original);
  if (!items.length) return [{ kind: 'text', text: content }];
  const sorted = [...items].sort((a, b) => {
    const posA = content.toLowerCase().indexOf(a.original.toLowerCase());
    const posB = content.toLowerCase().indexOf(b.original.toLowerCase());
    if (posA === -1 && posB === -1) return 0;
    if (posA === -1) return 1;
    if (posB === -1) return -1;
    return posA - posB;
  });
  const segments = [];
  let lastEnd = 0;
  for (const it of sorted) {
    const pos = content.toLowerCase().indexOf(it.original.toLowerCase(), lastEnd);
    if (pos === -1) continue;
    if (pos > lastEnd) segments.push({ kind: 'text', text: content.slice(lastEnd, pos) });
    segments.push({
      kind: 'error',
      id: it.id,
      errorType: it.errorType,
      text: it.original,
      suggestion: it.suggestion,
      explanation: it.explanation,
      fixed: it.fixed,
    });
    lastEnd = pos + it.original.length;
  }
  if (lastEnd < content.length) segments.push({ kind: 'text', text: content.slice(lastEnd) });
  return segments.length ? segments : [{ kind: 'text', text: content }];
}

export function normalizeCefrStats(cefrStats) {
  const out = { ...PLACEHOLDER_CEFR };
  if (cefrStats && typeof cefrStats === 'object') {
    if (Array.isArray(cefrStats)) {
      cefrStats.forEach((x) => {
        const id = (x?.level ?? x?.id ?? '').toString().toUpperCase();
        if (CEFR_LEVELS.some((l) => l.id === id)) out[id] = Math.min(100, Math.max(0, Number(x?.percent ?? x?.value ?? 0)));
      });
    } else {
      Object.entries(cefrStats).forEach(([k, v]) => {
        const id = String(k).toUpperCase();
        if (CEFR_LEVELS.some((l) => l.id === id)) out[id] = Math.min(100, Math.max(0, Number(v)));
      });
    }
  }
  CEFR_LEVELS.forEach((l) => {
    if (out[l.id] == null) out[l.id] = 0;
  });
  return out;
}
