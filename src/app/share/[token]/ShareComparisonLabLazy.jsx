'use client';

import dynamic from 'next/dynamic';

const ShareComparisonLab = dynamic(() => import('./ShareComparisonLab'), {
  ssr: false,
  loading: () => (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
      Loading comparison…
    </div>
  ),
});

export default function ShareComparisonLabLazy({ task }) {
  return <ShareComparisonLab task={task} />;
}
