'use client';

import { motion, AnimatePresence } from 'framer-motion';

export default function WriterFeedbackBanner({ feedbackBanner, onDismiss, onGoToForm }) {
  return (
    <AnimatePresence>
      {feedbackBanner && (
        <motion.div
          key={`${feedbackBanner.kind}-${feedbackBanner.message}`}
          role="status"
          initial={{ opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -28 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          className={`fixed left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[240] w-[min(92vw,26rem)] -translate-x-1/2 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-md ${
            feedbackBanner.kind === 'success'
              ? 'border-emerald-200/90 bg-emerald-50/95 text-emerald-950 dark:border-emerald-800/70 dark:bg-emerald-950/90 dark:text-emerald-50'
              : 'border-rose-200/90 bg-rose-50/95 text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/90 dark:text-rose-50'
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/[0.07]" aria-hidden />
          <div className="relative px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold leading-snug tracking-tight pr-2">{feedbackBanner.message}</p>
              <button
                type="button"
                className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:bg-black/[0.06] dark:text-slate-300 dark:hover:bg-white/10"
                onClick={onDismiss}
              >
                Dismiss
              </button>
            </div>
            <button
              type="button"
              className="mt-3 text-left text-sm font-bold text-indigo-600 underline decoration-2 underline-offset-2 hover:text-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
              onClick={onGoToForm}
            >
              Go to feedback form
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
