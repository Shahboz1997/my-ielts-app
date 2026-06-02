'use client';

import { motion } from 'framer-motion';
import { Check, Share2, X } from 'lucide-react';

export default function WriterShareModal({ darkMode, shareModal, setShareModal, copyShareLink, nativeShareLink }) {
  if (!shareModal) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Share analysis"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close share dialog"
        onClick={() => setShareModal(null)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className={`relative w-full max-w-lg rounded-[2rem] border shadow-2xl overflow-hidden ${
          darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className={`px-6 sm:px-8 pt-7 pb-6 ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Share report
              </h3>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {shareModal.band
                  ? `Anyone with this link can view your Band ${shareModal.band} analysis for 30 days.`
                  : 'Anyone with this link can view your analysis for 30 days.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShareModal(null)}
              className={`shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-2xl border transition-colors ${
                darkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium break-all ${
              darkMode
                ? 'bg-slate-900/80 border-slate-800 text-indigo-300'
                : 'bg-slate-50 border-slate-200 text-indigo-700'
            }`}
          >
            {shareModal.url}
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={copyShareLink}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-colors"
            >
              <Check className="w-4 h-4" />
              Copy link
            </button>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={nativeShareLink}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-colors ${
                  darkMode
                    ? 'border-slate-700 text-slate-200 hover:bg-slate-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Share2 className="w-4 h-4" />
                Share…
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
