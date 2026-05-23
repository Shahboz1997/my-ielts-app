'use client';

import React from 'react';
import { CheckCircle, XCircle, Mail } from 'lucide-react';

/**
 * GT Task 1 letter feedback — structure, bullets, tone, salutation.
 */
export default function LetterStrategyPanel({ strategy }) {
  if (!strategy || typeof strategy !== 'object') return null;

  const bullets = Array.isArray(strategy.bullets_coverage) ? strategy.bullets_coverage : [];
  const plan = Array.isArray(strategy.paragraph_plan) ? strategy.paragraph_plan : [];
  const fixes = Array.isArray(strategy.what_to_fix) ? strategy.what_to_fix : [];
  const sal = strategy.salutation_closing || {};

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-extrabold tracking-tight text-slate-800 dark:text-slate-100 ml-2 flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />
          Letter Strategy
        </h3>
        <div className="shrink-0 rounded-2xl border border-indigo-200/70 dark:border-indigo-500/30 bg-white/80 dark:bg-slate-900/50 px-4 py-2 shadow-sm">
          <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Tone</div>
          <div className="text-sm font-black tracking-tight text-indigo-600 dark:text-indigo-300 capitalize">
            {strategy.tone_match || 'formal'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { ok: strategy.opening_ok, label: 'Opening' },
          { ok: strategy.closing_ok, label: 'Closing' },
          { ok: sal.appropriate, label: 'Sign-off' },
        ].map(({ ok, label }) => (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold ${
              ok
                ? 'border-emerald-200/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200'
                : 'border-rose-200/80 bg-rose-50/60 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-200'
            }`}
          >
            {ok ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
            {label}
          </div>
        ))}
      </div>

      {(sal.opening || sal.closing) && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-white">Salutation: </span>
          {sal.opening || '—'}
          <span className="mx-2 text-slate-300">→</span>
          <span className="font-semibold text-slate-900 dark:text-white">Close: </span>
          {sal.closing || '—'}
        </div>
      )}

      {bullets.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Bullet coverage
          </div>
          <ul className="space-y-2">
            {bullets.map((b, i) => (
              <li
                key={`${b.bullet}-${i}`}
                className={`flex gap-2 text-sm leading-relaxed ${
                  b.covered ? 'text-slate-700 dark:text-slate-300' : 'text-rose-700 dark:text-rose-300'
                }`}
              >
                {b.covered ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                )}
                <span>
                  <span className="font-semibold">{b.bullet}</span>
                  {b.comment ? ` — ${b.comment}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">
            Paragraph plan
          </div>
          <div className="flex flex-wrap gap-2">
            {plan.map((p, i) => (
              <span
                key={`${p}-${i}`}
                className="inline-flex rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {fixes.length > 0 && (
        <div className="p-6 rounded-3xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800/80 dark:text-amber-200/80 mb-2">
            What to fix
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-amber-900 dark:text-amber-100">
            {fixes.slice(0, 8).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
