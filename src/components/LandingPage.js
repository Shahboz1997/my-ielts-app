'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@wrksz/themes/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useLandingAbVariant } from '@/hooks/useLandingAbVariant';
import TransformationSlider from '@/components/TransformationSlider';
import Task2ComparisonLab from '@/components/Task2ComparisonLab';
import {
  FileText,
  Search,
  BarChart3,
  CheckCircle,
  Star,
  Sparkles,
  PenTool,
  Wrench,
  Plus,
  Minus,
  Eye,
  Crown,
  Filter,
  LayoutGrid,
  RefreshCw,
  Shield,
  Target,
  Zap,
  CalendarDays,
  BellRing,
  LineChart,
  BookOpen,
  Mail,
} from 'lucide-react';
import { TASK1_TIPS, TASK2_TIPS, LETTER_TIPS } from '@/lib/ieltsGuidelines';
import NeuralSyncShowcase from '@/components/NeuralSyncShowcase';

const appleEase = [0.16, 1, 0.3, 1];
const fadeInUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-48px' },
  transition: { ease: appleEase, duration: 0.8 },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
  viewport: { once: true, margin: '-32px' },
};
const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  transition: { ease: appleEase, duration: 0.7 },
};

const SUCCESS_PATH_STEPS = [
  { step: 1, title: 'Generate Topic', desc: 'Charts for Academic Task 1, formal letters for GT, or Task 2 essay prompts — from the lab or AI generator.', Icon: Sparkles },
  { step: 2, title: 'Write Essay', desc: 'Switch Academic chart mode or GT Letter mode. Timer and word count match the real exam.', Icon: PenTool },
  { step: 3, title: 'Get Instant Band Score', desc: 'AI Examiner grades all four criteria — including bullet coverage and tone for GT letters.', Icon: BarChart3 },
  { step: 4, title: 'Fix Mistakes', desc: 'Highlights, Letter Strategy (GT), vocabulary upgrades, and a Band 9-style suggested rewrite.', Icon: Wrench },
];

import { LANDING_FAQ_ITEMS as FAQ_ITEMS } from '@/lib/landingSeoData';

export default function LandingPage({ onLoginClick, onFullAnalysisClick }) {
  const router = useRouter();
  const { copy: abCopy } = useLandingAbVariant();
  const { resolvedTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState(null);
  useEffect(() => setThemeMounted(true), []);

  const darkMode = themeMounted && resolvedTheme === 'dark';

  return (
    <main className="min-h-screen bg-[#F9FAFB] dark:bg-[#050505] transition-colors duration-300 pt-0">
      {/* Hero — centered, spotlight gradient, noise overlay */}
      <section className="relative flex flex-col justify-center bg-[#F9FAFB] dark:bg-[#050505] px-4 pt-10 pb-16 border-b border-white/5 overflow-hidden hero-noise">
        {/* Subtle radial spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.08)_0%,transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.12)_0%,transparent_50%)] pointer-events-none" aria-hidden />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="tagline-pill mb-2 inline-block text-slate-500 dark:text-slate-400 font-medium tracking-wide"
          >
            AI-Powered Writing Assessment
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.7 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter uppercase mb-4"
          >
            <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white bg-clip-text text-transparent">
              Master IELTS with Stratum Intelligence
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium tracking-wide max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            Elevate your IELTS score with precision AI-driven evaluation for Writing Task 1 and Task 2. Get instant Band 9.0-style feedback and stratum-level analytics to master the exam.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-8"
          >
            <button
              type="button"
              onClick={onLoginClick}
              data-testid="open-auth-login"
              className="btn-stratum px-7 py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]"
            >
              <div className="shimmer-layer animate-shimmer" aria-hidden />
              <span className="btn-stratum-text">Sign in</span>
            </button>
          </motion.div>
          {/* Dashboard preview — bento widget */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mx-auto w-full max-w-2xl rounded-3xl bg-white/80 dark:bg-white/5 border border-white/5 backdrop-blur-md shadow-2xl shadow-black/5 dark:shadow-black/20 p-4 sm:p-5 mt-8"
          >
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-700/50">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Task 2 — Preview</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">CEFR</span>
                <span className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-xs font-semibold text-indigo-600 dark:text-indigo-400">B2–C1</span>
                <span className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-xs font-semibold text-red-500">Band 7.5</span>
              </div>
            </div>
            <div className="h-20 sm:h-24 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center px-3">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide text-center">Paste your essay or generate a prompt to see instant Band Score and AI-evaluation for your Writing Task.</p>
            </div>
            <div className="mt-3 flex gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-1.5 w-1/4 rounded-full bg-indigo-400/40" />
            </div>
          </motion.div>

        </div>
      </section>

      {/* Workflow — four steps (prompt → feedback loop) */}
      <section aria-labelledby="section-workflow" className="py-10 sm:py-14 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-8 sm:mb-10">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              Workflow
            </span>
            <h2 id="section-workflow" className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              From prompt to band breakthrough
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              A clear loop: generate, write, score, fix — then let your saved checks build a data-backed study plan.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {SUCCESS_PATH_STEPS.map(({ step, title, desc, Icon }) => (
              <motion.div
                key={step}
                {...fadeInUp}
                className="relative overflow-hidden rounded-[1.75rem] border border-white/10 dark:border-white/5 bg-white/80 dark:bg-white/5 backdrop-blur-md p-5 sm:p-6 shadow-xl shadow-black/5 dark:shadow-black/20"
              >
                <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/90 dark:text-indigo-400/90">
                  {String(step).padStart(2, '0')}
                </div>
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/35 flex items-center justify-center mb-4 border border-indigo-200/30 dark:border-indigo-700/25">
                  <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-300" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-white mb-2 pr-10">{title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 1: Precision AI Analysis — Features & Value */}
      <section id="how-it-works" aria-labelledby="section-precision-ai" className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-8">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">AI-Evaluation</span>
            <h2 id="section-precision-ai" className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              Precision AI Analysis for Writing Task 1 &amp; 2
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              STRATUM.ai delivers exam-grade AI-evaluation for Academic charts, General Training letters, and Task 2 essays — all scored against official band descriptors.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FileText, title: 'Grammar & Cohesion Audit', desc: 'Full grammar and cohesion audit with linking-word suggestions so your writing meets Band 7+ standards.' },
              { icon: Search, title: 'Lexical Resource Upgrade', desc: 'Band 9-level synonyms and collocations — chart language for Academic, letter phrases for GT.' },
              { icon: BarChart3, title: 'Real-Time Scoring', desc: 'Instant bands for Task Achievement, Coherence, Lexical Resource, and Grammar after every submission.' },
              {
                icon: Mail,
                title: 'GT Letter Mode',
                badge: 'New',
                desc: 'Dedicated GT Task 1 workflow: tone & purpose controls, bullet checklist, Letter Strategy feedback, and AI-generated formal letter prompts.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  {...fadeInUp}
                  className="group p-6 rounded-3xl border border-white/5 backdrop-blur-md bg-white/80 dark:bg-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 [&_svg]:transition-transform [&_svg]:duration-200 group-hover:[&_svg]:scale-110 ${
                    item.badge === 'New'
                      ? 'bg-teal-100 dark:bg-teal-900/30 [&_svg]:[filter:drop-shadow(0_0_5px_rgba(20,184,166,0.5))]'
                      : 'bg-indigo-100 dark:bg-indigo-900/30 [&_svg]:[filter:drop-shadow(0_0_5px_rgba(79,70,229,0.5))]'
                  }`}>
                    <Icon className={`w-5 h-5 ${item.badge === 'New' ? 'text-teal-600 dark:text-teal-400' : 'text-indigo-600 dark:text-indigo-400'}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold tracking-wide text-slate-900 dark:text-white">{item.title}</h3>
                    {item.badge && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-teal-500 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Neural Sync — audio shadowing demo */}
      <NeuralSyncShowcase onCtaClick={onFullAnalysisClick} />

      {/* Section 3: Stratum-Level Analytics for Your Progress */}
      <section aria-labelledby="section-stratum-analytics" className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <motion.div {...fadeInUp}>
          <div className="max-w-6xl mx-auto px-4">
            <TransformationSlider darkMode={darkMode} onCtaClick={onFullAnalysisClick} />
          </div>
        </motion.div>
        <div className="mt-8 max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeInUp} className="text-center">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">Progress</span>
            <h2 id="section-stratum-analytics" className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-3">
              Stratum-Level Analytics for Your Progress
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              Track criterion trends, flagged issues, and before-and-after rewrites so every check moves you closer to your target band.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Study plan, analytics & reminders — latest dashboard features */}
      <section
        id="study-plan"
        aria-labelledby="section-study-plan"
        className="relative overflow-hidden py-12 sm:py-16 bg-gradient-to-b from-[#EEF3FF] via-[#F9FAFB] to-[#F9FAFB] dark:from-indigo-950/25 dark:via-[#050505] dark:to-[#050505] border-b border-white/5"
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
        >
          <div className="absolute -top-28 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18)_0%,transparent_60%)] dark:bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.24)_0%,transparent_60%)] blur-2xl" />
          <div className="absolute -bottom-40 right-[-10rem] h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.14)_0%,transparent_65%)] dark:bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.16)_0%,transparent_65%)] blur-2xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-9 sm:mb-11 relative">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              Preparation
            </span>
            <h2
              id="section-study-plan"
              className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white"
            >
              Study plan, analytics &amp; reminders
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              STRATUM does not stop at one-off scores. Your dashboard aggregates every saved check into trends, focus areas, and habits — so preparation stays measurable between exam day and today.
            </p>
          </motion.div>

          <motion.div {...fadeInUp} className="flex flex-wrap justify-center gap-2.5 mb-6 max-w-2xl mx-auto">
            {[
              { label: 'Writing profile analytics', Icon: LineChart },
              { label: 'Study plan & focus', Icon: Target },
              { label: 'Email practice reminders', Icon: BellRing },
              { label: 'Weak-area resources', Icon: BookOpen },
            ].map(({ label, Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200 shadow-sm shadow-black/5 dark:shadow-black/30 backdrop-blur-md"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" strokeWidth={2} />
                {label}
              </span>
            ))}
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                Icon: LineChart,
                title: 'Writing profile & charts',
                blurb:
                  'Criterion averages, flagged issue types, and sub-topic patterns — built from your archive. See where you gain points and where errors repeat.',
                accent: 'from-indigo-500/16 to-transparent',
              },
              {
                Icon: BookOpen,
                title: 'Curated weak-area links',
                blurb:
                  'The Study plan suggests external materials matched to your profile — turn analytics into targeted practice instead of random essays.',
                accent: 'from-teal-500/14 to-transparent',
              },
              {
                Icon: CalendarDays,
                title: 'Timezone-aware email nudges',
                blurb:
                  'Enable practice reminders in Settings: pick weekdays, local send time, and your timezone. Gentle consistency beats cramming.',
                accent: 'from-violet-500/16 to-transparent',
              },
            ].map(({ Icon, title, blurb, accent }) => (
              <motion.div
                key={title}
                {...fadeInUp}
                className="group relative overflow-hidden rounded-[2rem] border border-slate-200/70 dark:border-white/10 bg-white/85 dark:bg-white/5 backdrop-blur-md p-6 sm:p-7 shadow-2xl shadow-black/5 dark:shadow-black/25 transition-all duration-300 hover:border-indigo-300/40 dark:hover:border-indigo-500/25 hover:shadow-black/10 dark:hover:shadow-black/40"
              >
                <div
                  className={`pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-br ${accent} blur-2xl opacity-90`}
                  aria-hidden
                />
                <div className="relative">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100/90 dark:bg-indigo-900/35 ring-1 ring-indigo-200/60 dark:ring-indigo-600/30 transition-transform duration-300 group-hover:scale-[1.05]">
                    <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-semibold tracking-wide text-slate-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{blurb}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            {...fadeInUp}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 rounded-[1.85rem] border border-dashed border-indigo-300/50 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/20 px-6 py-5 shadow-sm shadow-black/5 dark:shadow-black/25"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/85 dark:bg-white/10 shadow-sm ring-1 ring-indigo-200/70 dark:ring-white/10">
                <BellRing className="h-5 w-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                  After you sign in
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                  Open <span className="text-slate-900 dark:text-white">Study plan</span> for analytics and{' '}
                  <span className="text-slate-900 dark:text-white">Settings</span> for email reminders — same account, one preparation stack.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLoginClick}
              className="shrink-0 rounded-2xl border border-indigo-200/80 dark:border-indigo-500/30 bg-white/90 dark:bg-slate-900/80 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-200 shadow-sm transition hover:bg-indigo-50 dark:hover:bg-indigo-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9FAFB] dark:focus-visible:ring-offset-[#050505]"
            >
              Sign in to unlock
            </button>
          </motion.div>
        </div>
      </section>

      {/* Task 2 Comparison Lab — before/after rewrite demo */}
      <section className="py-8 sm:py-10 bg-white/50 dark:bg-white/5 border-b border-white/5">
        <Task2ComparisonLab darkMode={darkMode} />
      </section>

      {/* STRATUM METHODOLOGY — Expert IELTS Guidelines */}
      <section className="py-12 sm:py-16 bg-white dark:bg-[#050505] border-b border-slate-200/80 dark:border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-10">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">Expert Guidelines</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              STRATUM METHODOLOGY
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              The five principles we use to evaluate and improve your writing for Band 7+.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Task 1 Academic */}
            <motion.div
              {...fadeInUp}
              className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-md p-6 sm:p-8 shadow-2xl shadow-black/5 dark:shadow-black/25"
            >
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-indigo-600 dark:text-indigo-400 mb-6">
                Task 1 · Academic
              </h3>
              <ul className="space-y-4">
                {TASK1_TIPS.map((tip, i) => {
                  const Icon = { Eye, Target, Shield, Filter, Zap }[tip.icon];
                  return (
                    <motion.li
                      key={tip.id}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-24px' }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="flex items-center gap-3 text-slate-700 dark:text-slate-300"
                    >
                      {Icon && <Icon className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />}
                      <span className="text-sm font-medium">{tip.label}</span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
            {/* Task 1 GT Letter */}
            <motion.div
              {...fadeInUp}
              className="rounded-3xl border border-teal-200/80 dark:border-teal-500/20 bg-teal-50/80 dark:bg-teal-950/20 backdrop-blur-md p-6 sm:p-8 shadow-2xl shadow-black/5 dark:shadow-black/25"
            >
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-teal-600 dark:text-teal-400 mb-6">
                Task 1 · GT Letter
              </h3>
              <ul className="space-y-4">
                {LETTER_TIPS.map((tip, i) => {
                  const Icon = { CheckCircle, Shield, Target, FileText, LayoutGrid }[tip.icon];
                  return (
                    <motion.li
                      key={tip.id}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-24px' }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="flex items-center gap-3 text-slate-700 dark:text-slate-300"
                    >
                      {Icon && <Icon className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" strokeWidth={1.5} />}
                      <span className="text-sm font-medium">{tip.label}</span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
            {/* Task 2 */}
            <motion.div
              {...fadeInUp}
              className="rounded-3xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-md p-6 sm:p-8 shadow-2xl shadow-black/5 dark:shadow-black/25"
            >
              <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-indigo-600 dark:text-indigo-400 mb-6">
                Task 2 · Essay
              </h3>
              <ul className="space-y-4">
                {TASK2_TIPS.map((tip, i) => {
                  const Icon = { Target, LayoutGrid, Crown, Shield, RefreshCw }[tip.icon];
                  return (
                    <motion.li
                      key={tip.id}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-24px' }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="flex items-center gap-3 text-slate-700 dark:text-slate-300"
                    >
                      {Icon && <Icon className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />}
                      <span className="text-sm font-medium">{tip.label}</span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Success Stories — bento cards */}
      <section className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-6">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">Testimonials</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              Trusted by Students Worldwide
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              Students use STRATUM.ai for AI-evaluation and Band Score feedback on their Writing Task 1 and Task 2. Read how precision feedback and stratum-level analytics helped them reach their target band.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { quote: 'Stratum\'s feedback is remarkably accurate. It identified errors my tutor had missed. I went from 6.0 to 7.5 in three weeks.', author: 'Ahmed', location: 'Saudi Arabia', band: '6.0 → 7.5' },
              { quote: 'The vocabulary upgrades are a game-changer. It taught me how to achieve a native-level academic register.', author: 'Lin', location: 'China', band: '6.5 → 8.0' },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                className="p-6 rounded-3xl border border-white/5 backdrop-blur-md bg-white/80 dark:bg-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20"
              >
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" strokeWidth={1.5} />
                  ))}
                  <span className="text-xs font-semibold text-red-500 ml-1">{item.band}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{item.author}, {item.location}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — bento cards */}
      {/* <section id="pricing" className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-6">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">Plans</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-1">
              Plans &amp; Pricing
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
              Choose the plan that fits your IELTS preparation. Get access to AI-evaluation, Band Score feedback, and stratum-level analytics. Upgrade or change your plan at any time.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                {...fadeInUp}
                className={`relative p-6 rounded-3xl border border-white/5 backdrop-blur-md transition-all duration-300 shadow-2xl shadow-black/5 dark:shadow-black/20 ${
                  plan.popular
                    ? 'bg-indigo-50/80 dark:bg-indigo-900/20'
                    : 'bg-white/80 dark:bg-white/5 hover:shadow-2xl'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-lg text-[10px] font-semibold uppercase tracking-widest bg-indigo-600 text-white">
                    Most Popular
                  </span>
                )}
                <div className="text-center pt-2">
                  <h3 className="text-base font-semibold tracking-wide text-slate-900 dark:text-white mb-1">{plan.name}</h3>
                  <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400 mb-2">{plan.price}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium tracking-wide leading-relaxed">{plan.desc}</p>
                  <button
                    type="button"
                    onClick={() => { openPricing(); onFullAnalysisClick?.(); }}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      plan.popular
                        ? 'btn-stratum hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]'
                        : 'btn-squircle-secondary text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {plan.popular ? (
                      <>
                        <div className="shimmer-layer animate-shimmer" aria-hidden />
                        <span className="btn-stratum-text">GET STARTED · STRATUM</span>
                      </>
                    ) : (
                      'Get Started'
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Final CTA */}
      <section className="py-12 sm:py-16 bg-white/50 dark:bg-white/5 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div {...fadeInUp}>
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">Get started</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white mb-2">
              Ready to Reach Band 7.5+?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide mb-6 leading-relaxed max-w-xl mx-auto">
              {abCopy.offerLine}
            </p>
            <button
              type="button"
              onClick={() => router.push('/?app=1')}
              className="btn-stratum px-8 py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]"
              data-ab-variant={abCopy.id}
            >
              <div className="shimmer-layer animate-shimmer" aria-hidden />
              <span className="btn-stratum-text">{abCopy.bottomCta}</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* FAQ — Glassmorphism accordion */}
      <section id="faq" className="py-12 sm:py-16 bg-[#F9FAFB] dark:bg-[#050505] border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-10">
            <span className="tagline-pill mb-2 block w-fit mx-auto text-slate-500 dark:text-slate-400 font-medium tracking-wide">FAQ</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide max-w-xl mx-auto leading-relaxed">
              Everything you need to know about Stratum AI scoring, Academic and General Training support, and your data privacy.
            </p>
          </motion.div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = faqOpenIndex === index;
              return (
                <motion.div
                  key={index}
                  {...fadeInUp}
                  className="rounded-2xl border border-white/10 dark:border-white/5 bg-white/80 dark:bg-white/5 backdrop-blur-md overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5 dark:hover:bg-white/5"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                  >
                    <span className="font-bold uppercase tracking-widest text-xs text-slate-900 dark:text-white pr-4">
                      {item.q}
                    </span>
                    <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400 transition-transform duration-200">
                      <AnimatePresence mode="wait">
                        {isOpen ? (
                          <motion.span key="minus" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                            <Minus className="w-4 h-4" strokeWidth={2} />
                          </motion.span>
                        ) : (
                          <motion.span key="plus" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
                            <Plus className="w-4 h-4" strokeWidth={2} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${index}`}
                        role="region"
                        aria-labelledby={`faq-question-${index}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-4 text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide leading-relaxed">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

    </main>
  );
}
