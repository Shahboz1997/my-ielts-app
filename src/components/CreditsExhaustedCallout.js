'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { CREDIT_PACKS, formatPackPrice } from '@/lib/creditPacks';

export default function CreditsExhaustedCallout({
  className = '',
  onOpenPackages,
  onContactSupport,
}) {
  const popular = CREDIT_PACKS.find((p) => p.popular) || CREDIT_PACKS[1];

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-amber-200/90 dark:border-amber-500/35 bg-gradient-to-br from-amber-50/95 via-white to-slate-50 dark:from-amber-950/40 dark:via-slate-900/80 dark:to-slate-950 px-5 py-6 sm:px-8 sm:py-8 shadow-[0_20px_50px_-20px_rgba(245,158,11,0.35)] dark:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)] ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/25 blur-3xl dark:bg-amber-500/15"
        aria-hidden
      />
      <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/25 dark:bg-amber-500 dark:shadow-amber-500/25">
          <Sparkles className="h-6 w-6" strokeWidth={1.5} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            No credits left
          </h3>
          <p className="text-sm sm:text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            You’ve used your included Task&nbsp;1 and Task&nbsp;2 checks. Top up with a credit pack —
            pay by Visa transfer, then tap “I paid” in the packages dialog.
            {popular ? (
              <>
                {' '}
                Popular: <span className="font-bold text-slate-900 dark:text-white">{popular.credits} credits</span> for{' '}
                <span className="font-bold text-slate-900 dark:text-white">{formatPackPrice(popular.priceUsd)}</span>.
              </>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2">
            {typeof onOpenPackages === 'function' && (
              <button
                type="button"
                onClick={onOpenPackages}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold tracking-tight text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                View credit packages
              </button>
            )}
            {typeof onContactSupport === 'function' && (
              <button
                type="button"
                onClick={onContactSupport}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 px-4 py-3 text-sm font-bold tracking-tight text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
              >
                Contact support
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
