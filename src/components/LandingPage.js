'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  CursorArrowRaysIcon,
  BookOpenIcon,
  ArchiveBoxIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-48px' },
  transition: { duration: 0.4 },
};

export default function LandingPage({ onLoginClick, onFullAnalysisClick }) {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Hero */}
      <section className="relative bg-[#f8fafc] dark:bg-slate-950 px-4 py-20 sm:py-28 lg:py-32">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6"
          >
            Master IELTS Writing with AI Precision
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10"
          >
            Get instant, examiner-grade feedback based on the official 2024 IELTS Band Descriptors. Stop guessing your score—start improving it.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <button
              onClick={onFullAnalysisClick}
              className="px-8 py-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
            >
              Start Free Analysis
            </button>
            <button
              onClick={onLoginClick}
              className="px-8 py-4 rounded-xl font-semibold text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              Get Your Free Credits Now
            </button>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm text-slate-500 dark:text-slate-400"
          >
            Trusted by 10,000+ students worldwide.
          </motion.p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            {...fadeInUp}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white text-center mb-12"
          >
            How It Works
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                icon: DocumentTextIcon,
                title: 'Choose Your Task',
                desc: 'Generate a fresh IELTS prompt or paste your existing essay draft. We support both Academic and General modules.',
              },
              {
                step: 2,
                icon: MagnifyingGlassIcon,
                title: 'AI-Powered Scan',
                desc: 'Our elite AI Examiner analyzes 50+ linguistic parameters, identifying every grammatical nuance and lexical gap.',
              },
              {
                step: 3,
                icon: ChartBarIcon,
                title: 'Deep Dive Results',
                desc: 'Access interactive color-coded highlights, C1/C2 vocabulary upgrades, and download your formal PDF report.',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  {...fadeInUp}
                  className="p-6 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">Step {item.step}: {item.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison: Generic AI vs BandBooster */}
      <section className="py-16 sm:py-24 bg-[#f8fafc] dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4">
          <motion.h2
            {...fadeInUp}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white text-center mb-12"
          >
            Why Generic AI Isn&apos;t Enough for IELTS
          </motion.h2>
          <motion.div
            {...fadeInUp}
            className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
          >
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left p-4 font-extrabold text-slate-900 dark:text-white"></th>
                  <th className="text-left p-4 font-extrabold text-slate-500 dark:text-slate-400">Generic AI (e.g. ChatGPT)</th>
                  <th className="text-left p-4 font-extrabold text-indigo-600 dark:text-indigo-400">BandBooster</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { feature: 'Feedback quality', generic: 'Vague feedback', booster: 'IDP/BC Certified Logic' },
                  { feature: 'Scoring', generic: 'Inconsistent scoring', booster: 'Real-time Band Descriptors' },
                  { feature: 'Criteria', generic: 'Lacks official criteria', booster: 'Deep Error Mapping' },
                  { feature: 'Tone', generic: 'Informal tone suggestions', booster: 'Academic Register Engine' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">{row.feature}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <XCircleIcon className="w-4 h-4 text-red-500 shrink-0" />
                        {row.generic}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircleIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        {row.booster}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <motion.h2
            {...fadeInUp}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white text-center mb-12"
          >
            Key Features
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: CursorArrowRaysIcon, title: 'Interactive Analysis', desc: 'Click any underlined error to see a detailed explanation and a suggested professional correction.' },
              { icon: BookOpenIcon, title: 'Vocabulary Lab', desc: 'Replace repetitive "Band 5" words with sophisticated "Band 8-9" academic synonyms.' },
              { icon: ArchiveBoxIcon, title: 'Progress Archive', desc: 'Every essay is saved in your personal archive. Track your journey from Band 5.5 to 7.5+.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  {...fadeInUp}
                  className="p-6 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 sm:py-24 bg-[#f8fafc] dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4">
          <motion.h2
            {...fadeInUp}
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white text-center mb-12"
          >
            Success Stories
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { quote: "BandBooster's feedback is scarily accurate. It caught errors my tutor missed. Went from 6.0 to 7.5 in 3 weeks!", author: 'Ahmed', location: 'Saudi Arabia', band: '6.0 → 7.5' },
              { quote: "The vocabulary upgrades are a game-changer. It taught me how to sound like a native academic writer.", author: 'Lin', location: 'China', band: '6.5 → 8.0' },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <StarIcon key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 ml-1">{item.band}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">&ldquo;{item.quote}&rdquo;</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.author}, {item.location}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 bg-slate-900 dark:bg-slate-950 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.h2
            {...fadeInUp}
            className="text-3xl sm:text-4xl font-extrabold text-white dark:text-slate-100 mb-4"
          >
            Ready to Reach Band 7.5+?
          </motion.h2>
          <motion.p
            {...fadeInUp}
            className="text-lg text-slate-400 dark:text-slate-400 mb-8"
          >
            Stop wasting time on ineffective practice. Get the precision you need to succeed. First 5 checks are on us.
          </motion.p>
          <motion.div {...fadeInUp}>
            <button
              type="button"
              onClick={onFullAnalysisClick}
              className="px-8 py-4 rounded-xl font-semibold text-slate-900 dark:text-slate-900 bg-white dark:bg-slate-100 hover:bg-slate-100 dark:hover:bg-slate-200 transition-colors shadow-sm"
            >
              Get Your Free Credits Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer — legal links, company info, payment methods */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center space-y-6"
          >
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold tracking-tight">
              <Link href="/privacy" className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/refund" className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                Refund Policy
              </Link>
            </div>
            <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              © 2026 BANDBOOSTER LLC. Registered in Delaware, USA.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <a href="mailto:support@bandbooster.com" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                support@bandbooster.com
              </a>
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 pt-2 text-xs font-medium tracking-tight text-slate-400 dark:text-slate-500">
              <span>We accept</span>
              <span className="inline-flex items-center gap-3">
                <span>Visa</span>
                <span>Mastercard</span>
                <span>Apple Pay</span>
              </span>
            </div>
          </motion.div>
        </div>
      </footer>
    </main>
  );
}
