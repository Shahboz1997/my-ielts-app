'use client';

import React, { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { Download, ArrowLeft } from 'lucide-react';
import { downloadCheckReport } from '@/lib/downloadReportPdf';

const FEED_LABEL = { grammar: 'Grammar', lexical: 'Vocabulary', cohesion: 'Cohesion' };

function underlineClass(type) {
  if (type === 'grammar') return 'underline-grammar';
  if (type === 'lexical') return 'underline-vocab';
  return 'underline-cohesion';
}

function buildSegments(content, highlights, corrections) {
  const items = [];
  (highlights || []).forEach((h, i) => {
    items.push({ text: h.text, type: h.type || 'grammar', suggestion: h.suggestion, id: `h-${i}`, kind: 'highlight' });
  });
  (corrections || []).forEach((c, i) => {
    const type = (c.category || '').toLowerCase().includes('lexical') || (c.category || '').toLowerCase().includes('vocab') ? 'lexical' : 'grammar';
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

export default function AnalyticalLab({ check }) {
  const feedback = useMemo(() => {
    try {
      return typeof check.feedback === 'string' ? JSON.parse(check.feedback) : (check.feedback || {});
    } catch {
      return {};
    }
  }, [check.feedback]);

  const [focusedId, setFocusedId] = useState(null);
  const criteria = feedback.criteria || {};
  const taskKey = check.type === 'TASK_1' ? 'Task_Achievement' : 'Task_Response';
  const ta = criteria[taskKey]?.score ?? 0;
  const cc = criteria.Coherence_and_Cohesion?.score ?? 0;
  const lr = criteria.Lexical_Resource?.score ?? 0;
  const gra = criteria.Grammatical_Range_and_Accuracy?.score ?? 0;
  const band = feedback.overall_band != null ? Number(feedback.overall_band) : null;

  const highlights = Array.isArray(feedback.highlights) ? feedback.highlights : [];
  const corrections = Array.isArray(feedback.corrections) ? feedback.corrections : [];
  const lexicalUpgrade = Array.isArray(feedback.lexical_upgrade) ? feedback.lexical_upgrade : [];
  const suggestedRewrite = feedback.suggested_rewrite || '';
  const segments = useMemo(
    () => buildSegments(check.content || '', highlights, corrections),
    [check.content, highlights, corrections]
  );

  const feedItems = useMemo(() => {
    const list = [];
    highlights.forEach((h, i) => list.push({ id: `h-${i}`, type: h.type || 'grammar', label: FEED_LABEL[h.type] || h.type, text: h.text, suggestion: h.suggestion, kind: 'highlight' }));
    corrections.forEach((c, i) => {
      const type = (c.category || '').toLowerCase().includes('lexical') || (c.category || '').toLowerCase().includes('vocab') ? 'lexical' : 'grammar';
      list.push({
        id: `c-${i}`,
        type,
        label: c.category || type,
        text: c.original,
        suggestion: c.explanation,
        fixed: c.fixed,
        impact: c.impact,
        kind: 'correction',
      });
    });
    return list;
  }, [highlights, corrections]);

  const cardRefs = React.useRef({});
  const scrollToCard = useCallback((id) => {
    setFocusedId(id);
    const el = cardRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Top bar: back + download */}
        <div className="flex flex-wrap items-center justify-between gap-4 lg:col-span-full">
          <Link
            href="/history"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium text-sm tracking-tight transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            My Archive
          </Link>
          <button
            type="button"
            onClick={() => downloadCheckReport(check)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-700 hover:border-indigo-200 hover:text-indigo-600 font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF Report
          </button>
        </div>

        {/* Left ~60%: Document + underlines */}
        <div className="flex-1 min-w-0 lg:min-w-[60%]">
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-8">
            <div className="mb-6 flex items-center justify-between">
              <span className={`inline-block px-3 py-1 rounded-xl text-xs font-medium ${check.type === 'TASK_1' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                {check.type === 'TASK_1' ? 'Task 1' : 'Task 2'}
              </span>
              <p className="text-xs text-slate-500">
                Red wavy = Grammar · Blue wavy = Vocabulary — Click to focus
              </p>
            </div>
            <div className="text-slate-800 leading-relaxed whitespace-pre-wrap break-words font-[var(--font-geist-sans)] text-[15px]">
              {segments.map((seg, i) =>
                seg.type ? (
                  <span
                    key={`${seg.id}-${i}`}
                    className={`cursor-pointer rounded px-0.5 ${underlineClass(seg.type)} hover:opacity-90`}
                    onClick={() => scrollToCard(seg.id)}
                    title={seg.suggestion}
                  >
                    {seg.text}
                  </span>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )}
            </div>
          </div>

          {lexicalUpgrade.length > 0 && (
            <section className="mt-6 rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-800 tracking-tight mb-4">Lexical upgrade — Band 5–6 → 8–9</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-500">
                      <th className="pb-2 pr-4">Current (B5–6)</th>
                      <th className="pb-2">Academic alternatives (B8–9)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lexicalUpgrade.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-2 pr-4 text-slate-600 italic">{row.band_56_word}</td>
                        <td className="py-2 text-slate-800">{Array.isArray(row.band_89_synonyms) ? row.band_89_synonyms.join(', ') : row.band_89_synonyms}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {suggestedRewrite && (
            <section className="mt-6 rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-slate-800 tracking-tight mb-3">Suggested rewrite</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap border-l-2 border-indigo-200 pl-4">{suggestedRewrite}</div>
            </section>
          )}
        </div>

        {/* Right ~40%: Score + criteria + feed */}
        <div className="lg:w-[40%] lg:max-w-md space-y-6">
          {/* Band score circle + 4-grid */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-sm font-semibold text-slate-800 tracking-tight">Band score</h2>
              <div className="relative h-16 w-16 shrink-0">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeDasharray={band != null ? `${(band / 9) * 100}, 100` : '0, 100'}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-slate-800">
                  {band != null ? band.toFixed(1) : '—'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { key: 'TA', value: ta, label: taskKey === 'Task_Achievement' ? 'TA' : 'TR' },
                { key: 'CC', value: cc, label: 'CC' },
                { key: 'LR', value: lr, label: 'LR' },
                { key: 'GRA', value: gra, label: 'GRA' },
              ].map(({ key, value, label }) => (
                <div key={key} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-tight">{label}</div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${((value ?? 0) / 9) * 100}%` }} />
                  </div>
                  <div className="text-sm font-semibold text-slate-800 mt-1">{value != null ? value.toFixed(1) : '—'}</div>
                </div>
              ))}
            </div>
            {feedback.improvement_strategy && (
              <p className="mt-4 text-slate-600 text-sm leading-relaxed">{feedback.improvement_strategy}</p>
            )}
          </div>

          {/* Feed of slim cards */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-800 tracking-tight mb-4">Feedback</h2>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {feedItems.length === 0 ? (
                <p className="text-slate-500 text-sm">No corrections or highlights for this essay.</p>
              ) : (
                feedItems.map((item) => {
                  const isFocused = focusedId === item.id;
                  return (
                    <div
                      key={item.id}
                      ref={(el) => { cardRefs.current[item.id] = el; }}
                      className={`p-3 rounded-xl border transition-all duration-200 ${isFocused ? 'border-indigo-300 bg-indigo-50/80 shadow-md ring-1 ring-indigo-100' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}
                    >
                      <span className={`text-[10px] font-medium uppercase tracking-tight ${item.type === 'grammar' ? 'text-red-600' : item.type === 'lexical' ? 'text-blue-600' : 'text-violet-600'}`}>
                        {item.label}
                      </span>
                      <p className="mt-1 text-slate-700 text-sm italic">&quot;{item.text}&quot;</p>
                      {item.fixed && <p className="text-xs text-slate-500 mt-0.5">→ &quot;{item.fixed}&quot;</p>}
                      {item.impact && <p className="text-[10px] text-slate-500 mt-0.5">Impact: {item.impact}</p>}
                      <p className="mt-1 text-slate-800 text-sm">{item.suggestion}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
