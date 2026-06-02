'use client';

import LandingPageLazy from '@/components/lazy/LandingPageLazy';
import LandingMarketingShell from '@/components/landing/LandingMarketingShell';

export default function LandingInteractivePage({ isAuthenticated }) {
  return (
    <LandingMarketingShell isAuthenticated={isAuthenticated}>
      {({ onLoginClick, onFullAnalysisClick }) => (
        <LandingPageLazy
          onLoginClick={onLoginClick}
          onFullAnalysisClick={onFullAnalysisClick}
          isLoggedIn={isAuthenticated}
        />
      )}
    </LandingMarketingShell>
  );
}
