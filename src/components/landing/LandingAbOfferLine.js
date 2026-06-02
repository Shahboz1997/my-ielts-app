'use client';

import { useLandingAbVariant } from '@/hooks/useLandingAbVariant';
import { LANDING_GUEST_OFFER } from '@/lib/landingSeoData';

/** Client A/B line under hero on SEO landing (default copy until hydration). */
export default function LandingAbOfferLine({ className = '' }) {
  const { copy } = useLandingAbVariant();

  return (
    <p
      className={className}
      data-ab-variant={copy.id}
      suppressHydrationWarning
    >
      {copy.offerLine || LANDING_GUEST_OFFER}
    </p>
  );
}
