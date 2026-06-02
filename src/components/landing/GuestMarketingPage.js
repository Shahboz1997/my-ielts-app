import LandingLegalFooter from '@/components/landing/LandingLegalFooter';
import LandingMarketingClient from '@/components/landing/LandingMarketingClient';
import LandingSeoMainContent from '@/components/landing/LandingSeoMainContent';

/** Server composition: indexable landing at `/` for guests. */
export default function GuestMarketingPage() {
  return (
    <div className="relative min-h-[100dvh] font-sans antialiased">
      <LandingSeoMainContent />
      <LandingMarketingClient />
      <LandingLegalFooter />
    </div>
  );
}
