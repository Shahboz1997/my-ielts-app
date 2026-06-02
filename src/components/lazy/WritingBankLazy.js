'use client';

import dynamic from 'next/dynamic';
import PageLoadingBlock from '@/components/lazy/PageLoadingBlock';

const WritingBankShell = dynamic(() => import('@/components/bank/WritingBankShell'), {
  loading: () => <PageLoadingBlock className="min-h-[50vh]" />,
  ssr: false,
});

export default function WritingBankLazy(props) {
  return <WritingBankShell {...props} />;
}
