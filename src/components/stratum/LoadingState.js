'use client';

import React from 'react';

const STEPS = [
  'Reading your essay',
  'Scoring against IELTS criteria',
  'Preparing feedback',
];

export default function LoadingState({ className = '' }) {
  const [stepIdx, setStepIdx] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setStepIdx((i) => (i + 1) % STEPS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`relative overflow-hidden px-6 py-9 sm:py-10 text-center ${className}`}>
      <div className="absolute inset-x-0 top-0 h-px overflow-hidden bg-slate-200/70 dark:bg-slate-800/80">
        <div
          className="h-full w-2/5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-stratum-loading-bar motion-reduce:animate-none"
          aria-hidden
        />
      </div>

      <div className="mx-auto max-w-[220px] space-y-2">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.32em] text-indigo-600/75 dark:text-indigo-400/85">
          Stratum Examiner
        </p>
        <p
          key={stepIdx}
          className="animate-stratum-step-fade text-sm font-medium text-slate-600 dark:text-slate-300 motion-reduce:animate-none"
          aria-live="polite"
        >
          {STEPS[stepIdx]}…
        </p>
      </div>

      <p className="mt-7 text-[11px] text-slate-400 dark:text-slate-500">
        Usually 20–40 seconds
      </p>
    </div>
  );
}
