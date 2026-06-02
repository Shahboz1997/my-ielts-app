'use client';

import dynamic from 'next/dynamic';

const WriterDetailedAnalysis = dynamic(
  () => import('@/components/writer/WriterDetailedAnalysis'),
  {
    loading: () => (
      <div className="order-3 min-h-[12rem] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60 xl:col-span-2" />
    ),
    ssr: false,
  }
);

export default function WriterDetailedAnalysisLazy(props) {
  return <WriterDetailedAnalysis {...props} />;
}
