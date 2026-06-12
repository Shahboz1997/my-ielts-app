import { getMetadataBaseUrl } from '@/lib/publicSiteUrl';
import { LEGAL_COMPANY_NAME } from '@/lib/support';
import { LANDING_HERO } from '@/lib/landingSeoData';

const baseUrl = getMetadataBaseUrl();

export const landingPageMetadata = {
  title: 'stratum — IELTS Writing Task 1 & Task 2 AI Examiner',
  description: LANDING_HERO.description,
  keywords: [
    'IELTS writing checker',
    'IELTS Task 1',
    'IELTS Task 2',
    'AI IELTS examiner',
    'band score feedback',
    'GT letter IELTS',
    'academic writing IELTS',
    'stratum',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'stratum',
    title: 'stratum — IELTS Writing AI Examiner',
    description: LANDING_HERO.description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'stratum IELTS Writing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'stratum — IELTS Writing AI Examiner',
    description: LANDING_HERO.description,
    images: ['/og-image.png'],
  },
  authors: [{ name: LEGAL_COMPANY_NAME, url: baseUrl }],
  robots: { index: true, follow: true },
};
