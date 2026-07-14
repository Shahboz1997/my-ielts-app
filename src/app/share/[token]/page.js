export const revalidate = 3600;
export const runtime = 'nodejs';

import { notFound } from 'next/navigation';
import { loadShareReport } from '@/lib/loadShareReport';
import { verifyShareToken } from '@/lib/shareToken';
import { resolvePublicSiteOrigin } from '@/lib/publicSiteUrl';
import SharedReportDocument from '@/components/share/SharedReportDocument';

/** Metadata without DB — page load uses cached `loadShareReport` once. */
export async function generateMetadata({ params }) {
  const p = await params;
  const token = String(p?.token || '');
  const verified = verifyShareToken(token);
  if (!verified.ok) {
    return { title: 'Shared report — STRATUM', robots: { index: false, follow: false } };
  }

  const ref = verified.data.ref;
  const title = ref ? `Shared IELTS report — @${ref}` : 'Shared IELTS report — STRATUM';
  const description =
    'IELTS Writing analysis: criteria, lexical upgrade, corrections, and side-by-side draft vs academic rewrite.';

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, images: ['/og-image.png'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
  };
}

export default async function SharePage({ params }) {
  const p = await params;
  const token = String(p?.token || '');
  const share = await loadShareReport(token);
  if (!share) notFound();
  const { tasks, ref } = share;

  const publicBase = resolvePublicSiteOrigin();
  const qs = new URLSearchParams();
  if (ref) qs.set('ref', ref);
  qs.set('landing', '1');
  const landingHref = publicBase ? `${publicBase}/?${qs.toString()}` : `/?${qs.toString()}`;

  return (
    <SharedReportDocument
      tasks={tasks}
      refLabel={ref}
      landingHref={landingHref}
    />
  );
}
