'use client';

import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';
import { DEMO_PATHS, DEMO_LANDING_SAMPLES } from '@/lib/demoReportPaths';
import {
  LandingSection,
  LandingSectionHeader,
  LandingCard,
  landingFadeInUp,
} from '@/components/landing/landingUi';
import { motion } from 'framer-motion';

/**
 * Evergreen sample reports (real GPT pipeline snapshots) — proves the product on an empty guest landing.
 */
export default function LandingSampleReports({ onTryDemoClick }) {
  return (
    <LandingSection id="sample-reports" ariaLabelledby="section-sample-reports">
      <LandingSectionHeader
        tagline="Live product"
        id="section-sample-reports"
        title="See a real examiner report"
        description="These are snapshots from the same Analyze → History → report pipeline — not mock UI. Open one, then try your own free demo check."
      />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {DEMO_LANDING_SAMPLES.map((item) => (
          <LandingCard key={item.href}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-100 dark:ring-indigo-500/20">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} aria-hidden />
              </div>
              <span className="rounded-lg bg-slate-100 dark:bg-white/10 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">
                Band {item.band}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{item.blurb}</p>
            <Link
              href={item.href}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              Open full report
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </LandingCard>
        ))}
      </div>
      <motion.div
        {...landingFadeInUp}
        className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
      >
        <Link
          href={DEMO_PATHS.flagship}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-500"
        >
          Flagship sample (Task 1 + Task 2)
        </Link>
        {typeof onTryDemoClick === 'function' ? (
          <button
            type="button"
            onClick={onTryDemoClick}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            Try free demo check
          </button>
        ) : (
          <Link
            href="/?app=1"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
          >
            Try free demo check
          </Link>
        )}
      </motion.div>
    </LandingSection>
  );
}
