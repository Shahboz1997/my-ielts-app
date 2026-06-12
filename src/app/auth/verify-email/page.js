import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export const metadata = {
  title: 'Email verification — stratum',
};

function VerifyEmailFallback() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
        <p className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailClient />
    </Suspense>
  );
}
