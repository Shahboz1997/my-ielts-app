'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const MESSAGES = {
  missing: 'The verification link is incomplete. Open the full link from your email.',
  invalid: 'This verification link is invalid or has already been used.',
  expired: 'This verification link has expired. Sign in and request a new one.',
};

export default function VerifyEmailClient() {
  const params = useSearchParams();
  const error = params.get('error') || 'invalid';
  const message = MESSAGES[error] || MESSAGES.invalid;

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
          Email verification
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
