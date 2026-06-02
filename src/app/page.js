import { Suspense } from 'react';
import WriterShell from '@/components/writer/WriterShell';
import { landingPageMetadata } from '@/lib/landingMetadata';

export const metadata = landingPageMetadata;

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <WriterShell />
    </Suspense>
  );
}
