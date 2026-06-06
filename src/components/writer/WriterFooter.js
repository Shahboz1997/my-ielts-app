'use client';

import { AnimatePresence } from 'framer-motion';
import { COPYRIGHT_LINE, TELEGRAM_CHANNEL_LABEL, TELEGRAM_CHANNEL_URL } from '@/lib/support';
import TelegramIcon from '@/components/icons/TelegramIcon';
import WriterFeedbackForm from '@/components/writer/footer/WriterFeedbackForm';
import { WriterFooterBrand, WriterFooterLegal, WriterFooterResources } from '@/components/writer/footer/WriterFooterNav';
import WriterShareModal from '@/components/writer/footer/WriterShareModal';
import WriterSupportModal from '@/components/writer/footer/WriterSupportModal';
import WriterScrollTopButton from '@/components/writer/footer/WriterScrollTopButton';

export default function WriterFooter({
  minimal = false,
  darkMode,
  activeTab,
  setActiveTab,
  onLoginClick,
  onSubmitFeedback,
  feedbackBanner,
  shareModal,
  setShareModal,
  copyShareLink,
  nativeShareLink,
  showSupportModal,
  setShowSupportModal,
  supportFirstFieldRef,
  showScrollTop,
  scrollProgress,
  onScrollToTop,
}) {
  return (
    <footer className="border-t border-white/5 bg-[#F9FAFB] dark:bg-[#050505] transition-colors">
      <div
        className={
          minimal
            ? 'mx-auto max-w-5xl px-4 py-8 sm:py-10 text-center'
            : 'mx-auto w-full max-w-7xl xl:max-w-screen-2xl px-3 sm:px-6 lg:px-8 xl:px-10 py-12 lg:py-16'
        }
      >
        {!minimal && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <WriterFooterBrand />
            <WriterFooterResources activeTab={activeTab} setActiveTab={setActiveTab} onLoginClick={onLoginClick} />

            <div id="stratum-feedback-section" className="relative scroll-mt-24 space-y-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight mb-4">Feedback</h4>
              <WriterFeedbackForm darkMode={darkMode} onSubmit={onSubmitFeedback} />
            </div>

            <WriterFooterLegal />
          </div>
        )}

        <div className={minimal ? 'space-y-2' : 'mt-12 pt-8 border-t border-white/5 text-center space-y-2'}>
          <p
            className={
              minimal
                ? 'text-xs sm:text-sm font-medium tracking-tight text-slate-600 dark:text-slate-400'
                : 'text-sm font-semibold tracking-tight text-slate-900 dark:text-white'
            }
          >
            {COPYRIGHT_LINE}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 text-xs text-slate-500 dark:text-slate-400">
            {!minimal && (
              <>
                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="inline-flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Contact support
                </button>
                <span className="text-slate-400/70 select-none" aria-hidden="true">
                  ·
                </span>
              </>
            )}
            <a
              href={TELEGRAM_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[#229ED9] dark:hover:text-[#229ED9] transition-colors"
            >
              <TelegramIcon className="h-4 w-4 shrink-0 text-[#229ED9]" />
              {TELEGRAM_CHANNEL_LABEL}
            </a>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {shareModal && (
          <WriterShareModal
            darkMode={darkMode}
            shareModal={shareModal}
            setShareModal={setShareModal}
            copyShareLink={copyShareLink}
            nativeShareLink={nativeShareLink}
          />
        )}
        {showSupportModal && (
          <WriterSupportModal
            darkMode={darkMode}
            showSupportModal={showSupportModal}
            setShowSupportModal={setShowSupportModal}
            feedbackBanner={feedbackBanner}
            onSubmitFeedback={onSubmitFeedback}
            supportFirstFieldRef={supportFirstFieldRef}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScrollTop && (
          <WriterScrollTopButton
            darkMode={darkMode}
            showScrollTop={showScrollTop}
            scrollProgress={scrollProgress}
            onScrollToTop={onScrollToTop}
          />
        )}
      </AnimatePresence>
    </footer>
  );
}
