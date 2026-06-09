'use client';

import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export default function WriterScrollTopButton({ darkMode, showScrollTop, scrollProgress, onScrollToTop }) {
  if (!showScrollTop) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: 20 }}
      className="fixed z-[100] flex items-center justify-center group"
      style={{
        right: 'calc(1rem + env(safe-area-inset-right) + 4.25rem - 40px)',
        bottom: 'calc(1rem + env(safe-area-inset-bottom))',
      }}
    >
      <span className="absolute right-full mr-4 px-3 py-1 bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
        Back to top
      </span>
      <button
        type="button"
        onClick={onScrollToTop}
        className={`relative w-14 h-14 rounded-3xl flex items-center justify-center transition-all active:scale-90 shadow-lg ${
          darkMode
            ? 'bg-slate-800 text-white border border-slate-700'
            : 'bg-white text-indigo-600 border border-slate-200 shadow-sm'
        }`}
      >
        <svg className="absolute inset-0 w-full h-full -rotate-90 p-0.5" aria-hidden>
          <circle
            cx="50%"
            cy="50%"
            r="46%"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="2"
            className={darkMode ? 'text-slate-700' : 'text-slate-100'}
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="46%"
            fill="transparent"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ pathLength: scrollProgress / 100 }}
            transition={{ type: 'spring', stiffness: 60, damping: 15 }}
          />
        </svg>
        <ChevronUp className="w-6 h-6 relative z-10 group-hover:-translate-y-1 transition-transform" />
      </button>
    </motion.div>
  );
}
