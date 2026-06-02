'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  BUSINESS_ADDRESS,
  CONTACT_SUPPORT_LABEL,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
  SUPPORT_PHONE_TEL,
} from '@/lib/support';
import WriterFeedbackForm from '@/components/writer/footer/WriterFeedbackForm';

export default function WriterSupportModal({
  darkMode,
  showSupportModal,
  setShowSupportModal,
  feedbackBanner,
  onSubmitFeedback,
  supportFirstFieldRef,
}) {
  if (!showSupportModal) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Contact support"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close support form"
        onClick={() => setShowSupportModal(false)}
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
        <div className={`px-6 sm:px-8 pt-7 pb-5 ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Contact support
              </h3>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Fill in the form and click Email — your mail app opens with a draft. Or write directly to{' '}
                <a
                  href={SUPPORT_MAILTO}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
                ,{' '}
                <a
                  href={SUPPORT_PHONE_TEL}
                  className="font-semibold text-slate-900 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {CONTACT_SUPPORT_LABEL}
                </a>
                , or write to{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-200">{BUSINESS_ADDRESS}</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
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

          {feedbackBanner && (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                feedbackBanner.kind === 'success'
                  ? darkMode
                    ? 'bg-emerald-950/40 border-emerald-900 text-emerald-200'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : darkMode
                    ? 'bg-rose-950/40 border-rose-900 text-rose-200'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
              role="status"
            >
              {feedbackBanner.message}
            </div>
          )}
        </div>

        <div className={`px-6 sm:px-8 pb-8 ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
          <WriterFeedbackForm
            darkMode={darkMode}
            onSubmit={onSubmitFeedback}
            firstFieldRef={supportFirstFieldRef}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
