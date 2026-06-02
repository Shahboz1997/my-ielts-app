'use client';

import dynamic from 'next/dynamic';
import PageLoadingBlock from '@/components/lazy/PageLoadingBlock';

const LandingPage = dynamic(() => import('@/components/LandingPage'), {
  loading: () => <PageLoadingBlock className="min-h-[70vh]" />,
  ssr: false,
});

export default function LandingPageLazy(props) {
  return <LandingPage {...props} />;
}
