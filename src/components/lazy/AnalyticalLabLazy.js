'use client';

import dynamic from 'next/dynamic';
import PageLoadingBlock from '@/components/lazy/PageLoadingBlock';

const AnalyticalLab = dynamic(() => import('@/components/dashboard/AnalyticalLab'), {
  loading: () => <PageLoadingBlock className="min-h-[50vh]" />,
  ssr: false,
});

export default function AnalyticalLabLazy(props) {
  return <AnalyticalLab {...props} />;
}
