'use client';

import { motion } from 'framer-motion';
import { BarChart3, Loader2, Mail, Sparkles } from 'lucide-react';
import TypingTitle from '@/components/writer/TypingTitle';

export default function WriterHomeLabs({
  darkMode,
  onScrollToEditor,
  isGenLoadingT1,
  onGenerateTask1Chart,
  isGenLoadingLetter,
  onGenerateLetterTask,
  customKeyword,
  onCustomKeywordChange,
  genTopicError,
  genLoading,
  onGenerateTask2,
}) {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Focus on <span className="text-indigo-600 dark:text-indigo-400">Excellence</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm font-medium tracking-tight">
            Challenge your limits with AI-powered task generation
          </p>
          <div className="pt-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-4 w-full max-w-md px-6">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
              <span className="text-xs font-semibold tracking-tight text-slate-600 dark:text-slate-400">OR</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
            </div>
            <p className="text-sm md:text-base font-medium text-slate-600 dark:text-slate-400 px-4">
              Already have a draft?{" "}
              <button onClick={onScrollToEditor} className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors cursor-pointer underline underline-offset-4 decoration-indigo-600/30 hover:decoration-indigo-600">
                Proceed directly to Evaluation
              </button>
              {" "}or start writing below.
            </p>
          </div>
        </header>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 items-stretch">
      {/* --- 2. ACADEMIC TASK 1 LAB --- */}
      <motion.section
  initial={{ opacity: 0, x: -0 }}
  whileInView={{ opacity: 1, x: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
  className="flex flex-col space-y-4 md:space-y-6"
>
  <h2 className="mt-[10px] text-xl md:text-2xl font-extrabold flex items-center justify-center md:justify-start gap-2 tracking-tight text-slate-900 dark:text-white">
    <div className="w-1.5 h-6 md:w-2 md:h-8 bg-indigo-600 dark:bg-indigo-500 rounded-full" />
    Task 1 · Chart
  </h2>

  <div
    className={`p-6 md:p-8 flex-1 min-h-[280px] md:min-h-[320px] rounded-3xl border border-dashed transition-all flex flex-col items-center justify-center gap-4 md:gap-6 ${
      darkMode ? "bg-slate-900 border-slate-700" : "bg-indigo-50/40 border-indigo-100"
    }`}
  >
    <div className="relative flex flex-col items-center mt-1">
      <motion.span
        aria-hidden
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 text-[9px] font-extrabold uppercase tracking-wider text-white px-1.5 py-0.5 rounded-md whitespace-nowrap bg-gradient-to-r from-red-500 via-rose-500 to-red-600 shadow-[0_0_14px_rgba(239,68,68,0.45)] ring-1 ring-white/25"
      >
        HOT
      </motion.span>
      <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm transition-transform">
        {isGenLoadingT1 ? (
          <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-indigo-600" />
        ) : (
          <BarChart3 className="w-10 h-10 md:w-12 md:h-12 text-indigo-600" />
        )}
      </div>
    </div>
    <div className="text-center">
      <h3 className="font-extrabold text-lg md:text-xl tracking-tight min-h-[1.5em] text-slate-900 dark:text-slate-100">
        <TypingTitle text="Generate Data Task" />
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium tracking-tight mt-1 md:mt-2">
        Charts, Graphs & Diagrams
      </p>
    </div>
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onGenerateTask1Chart(); }}
      disabled={isGenLoadingT1}
      className="btn-stratum px-6 py-2.5 rounded-full hover:shadow-[0_0_25px_rgba(79,70,229,0.3)] disabled:opacity-60"
    >
      <div className="shimmer-layer animate-shimmer" aria-hidden />
      <span className="btn-stratum-text">{isGenLoadingT1 ? "GENERATING..." : "GENERATE · CHART"}</span>
    </button>
  </div>
</motion.section>

      {/* --- 2b. GT LETTER LAB --- */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-col space-y-4 md:space-y-6"
      >
        <h2 className="mt-[10px] text-xl md:text-2xl font-extrabold flex items-center justify-center md:justify-start gap-2 tracking-tight text-slate-900 dark:text-white">
          <div className="w-1.5 h-6 md:w-2 md:h-8 bg-teal-600 dark:bg-teal-500 rounded-full" />
          Task 1 · Letter
        </h2>
        <div
          className={`p-6 md:p-8 flex-1 min-h-[280px] md:min-h-[320px] rounded-3xl border border-dashed transition-all flex flex-col items-center justify-center gap-4 md:gap-6 ${
            darkMode ? 'bg-slate-900 border-slate-700' : 'bg-teal-50/40 border-teal-100'
          }`}
        >
          <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm">
            {isGenLoadingLetter ? (
              <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-teal-600" />
            ) : (
              <Mail className="w-10 h-10 md:w-12 md:h-12 text-teal-600" />
            )}
          </div>
          <div className="text-center">
            <h3 className="font-extrabold text-lg md:text-xl tracking-tight text-slate-900 dark:text-slate-100">
              Generate Letter Task
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium tracking-tight mt-1 md:mt-2">
              GT · Formal tone · Bullet points
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onGenerateLetterTask(); }}
            disabled={isGenLoadingLetter}
            className="btn-stratum px-6 py-2.5 rounded-full disabled:opacity-60"
          >
            <span className="btn-stratum-text">{isGenLoadingLetter ? 'GENERATING...' : 'GENERATE · LETTER'}</span>
          </button>
        </div>
      </motion.section>

      {/* --- 3. ESSAY TASK 2 LAB --- */}
      <motion.section
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col space-y-4 md:space-y-6"
      >
        {/* Исправил mt-[30px] на mt-[10px], чтобы убрать перекос */}
        <h2 className="mt-[10px] text-xl md:text-2xl font-extrabold flex items-center justify-center md:justify-start gap-2 tracking-tight text-slate-900 dark:text-white">
          <div className="w-1.5 h-6 md:w-2 md:h-8 bg-indigo-600 dark:bg-indigo-500 rounded-full" />
          Task 2 Lab
        </h2>

        <div
          className={`p-6 md:p-8 flex-1 min-h-[280px] md:min-h-[320px] rounded-3xl border border-dashed transition-all flex flex-col items-center justify-center gap-4 md:gap-6 ${
            darkMode ? "bg-slate-900 border-slate-700" : "bg-indigo-50/40 border-indigo-100"
          }`}
        >
          <div className="relative flex flex-col items-center mt-1">
            <motion.span
              aria-hidden
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
              className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 text-[9px] font-extrabold uppercase tracking-wider text-white px-1.5 py-0.5 rounded-md whitespace-nowrap bg-gradient-to-r from-teal-400 to-cyan-500 shadow-[0_0_12px_rgba(20,184,166,0.4)] ring-1 ring-white/20"
            >
              NEW
            </motion.span>
            <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm">
              {genLoading ? (
                <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-indigo-600" />
              ) : (
                <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-indigo-600" />
              )}
            </div>
          </div>
          <div className="text-center space-y-4 w-full">
            <div>
              <h3 className="font-extrabold text-lg md:text-xl tracking-tight min-h-[1.5em] text-slate-900 dark:text-slate-100">
                <TypingTitle text="Generate Essay Task" />
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium tracking-tight mt-1">Custom Topics & Prompts</p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-[240px] md:max-w-xs mx-auto">
              <input
                value={customKeyword}
                onChange={(e) => { onCustomKeywordChange(e.target.value); }}
                placeholder="Enter Keyword..."
                className={`px-4 py-2.5 md:py-3 rounded-xl border outline-none text-center text-sm font-medium transition-all ${
                  darkMode ? "bg-slate-950 border-slate-700 focus:border-indigo-500 text-white" : "bg-white border-slate-200 focus:border-indigo-500 shadow-sm"
                }`}
              />
              {genTopicError && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                  {genTopicError}
                </p>
              )}
              <button
                type="button"
                onClick={onGenerateTask2}
                disabled={genLoading}
                className="btn-stratum w-full py-2.5 md:py-3 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]"
              >
                <div className="shimmer-layer animate-shimmer" aria-hidden />
                <span className="btn-stratum-text">{genLoading ? "INITIALIZING..." : "GENERATE · STRATUM"}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.section>
    </div>

                </div>
  );
}
