import { safeAuth } from '@/lib/safeAuth';
import GuestMarketingPage from '@/components/landing/GuestMarketingPage';
import LandingInteractivePage from '@/components/landing/LandingInteractivePage';
import { landingPageMetadata } from '@/lib/landingMetadata';

export const metadata = {
  ...landingPageMetadata,
  alternates: { canonical: '/landing' },
  robots: { index: true, follow: true },
};

/**
 * /landing — full interactive tour (client, lazy-loaded).
 * /?seo=1 on this path serves the same server HTML as / (for previews).
 */
export default async function LandingRoutePage({ searchParams }) {
  const sp = await searchParams;
  if (sp?.seo === '1') {
    return <GuestMarketingPage />;
  }

  const session = await safeAuth();
  return <LandingInteractivePage isAuthenticated={Boolean(session?.user)} />;
}
