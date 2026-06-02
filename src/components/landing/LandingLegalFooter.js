'use client';

import Link from 'next/link';
import {
  BUSINESS_ADDRESS,
  CONTACT_SUPPORT_LABEL,
  COPYRIGHT_SHORT,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_TEL,
} from '@/lib/support';

/** Static landing footer (Server Component — no client JS). */
export default function LandingLegalFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#F9FAFB] dark:bg-[#050505]">
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12">
        <div className="text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-medium tracking-wide text-slate-500 dark:text-slate-400">
            <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/refund" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Refund Policy
            </Link>
          </div>
          <p className="text-sm font-medium tracking-wide text-slate-900 dark:text-white">{COPYRIGHT_SHORT}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {BUSINESS_ADDRESS} ·{' '}
            <a href={SUPPORT_PHONE_TEL} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {CONTACT_SUPPORT_LABEL}
            </a>
            {' · '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
            Don&apos;t just practice. Evolve. Start your Stratum journey today.
          </p>
        </div>
      </div>
    </footer>
  );
}
