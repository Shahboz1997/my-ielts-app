'use client';

import { useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  CREDIT_PACKS,
  CREDITS_TOP_UP_FOOTER,
  CREDITS_TOP_UP_NOTICE,
  buildCreditPackMailto,
  formatPackPrice,
} from '@/lib/creditPacks';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/support';

/**
 * Manual credit-pack picker (mailto). Shown when the user runs out of analysis credits.
 */
export default function CreditsTopUpModal({
  isOpen,
  onClose,
  accountEmail = '',
  title = 'Welcome!',
  subtitle = 'Your free checks are used up. Top up to keep analyzing essays. Need more? Pick a pack below.',
}) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (ev) => {
      if (ev.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[210] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
            aria-label="Close credit packages"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="relative z-10 w-full max-w-md max-h-[min(92dvh,720px)] overflow-y-auto rounded-3xl border border-slate-200/90 bg-white shadow-[0_28px_80px_-24px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-950 dark:shadow-[0_28px_80px_-24px_rgba(0,0,0,0.65)]"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>

            <div className="px-6 pb-6 pt-8 sm:px-8 sm:pb-8 sm:pt-9">
              <h2
                id={titleId}
                className="pr-10 text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {subtitle}
              </p>

              <div
                className="mt-5 rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
                role="note"
              >
                <p>
                  {CREDITS_TOP_UP_NOTICE.split(SUPPORT_EMAIL).map((part, i, arr) =>
                    i < arr.length - 1 ? (
                      <span key={i}>
                        {part}
                        <a
                          href={SUPPORT_MAILTO}
                          className="font-semibold underline decoration-amber-700/40 underline-offset-2 hover:decoration-amber-800 dark:decoration-amber-300/50"
                        >
                          {SUPPORT_EMAIL}
                        </a>
                      </span>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </p>
              </div>

              <ul className="mt-5 space-y-3">
                {CREDIT_PACKS.map((pack) => {
                  const href = buildCreditPackMailto(pack, accountEmail);
                  const isPopular = Boolean(pack.popular);

                  return (
                    <li key={pack.id} className="relative">
                      {isPopular ? (
                        <span className="absolute -top-2.5 left-4 z-10 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                          Popular
                        </span>
                      ) : null}
                      <div
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-colors ${
                          isPopular
                            ? 'border-amber-400 bg-amber-50/40 shadow-sm dark:border-amber-500/50 dark:bg-amber-950/25'
                            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/60'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
                            {pack.credits} credits
                          </p>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {pack.name} · {pack.blurb}
                          </p>
                          <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                            {formatPackPrice(pack.priceUsd)}
                          </p>
                        </div>
                        <a
                          href={href}
                          className={`inline-flex shrink-0 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            isPopular
                              ? 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:focus-visible:ring-white'
                              : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          Contact
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-5 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {CREDITS_TOP_UP_FOOTER}
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
