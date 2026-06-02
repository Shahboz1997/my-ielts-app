/** A/B copy for guest landing CTAs (signup funnel). */

export const LANDING_AB_STORAGE_KEY = 'stratum_landing_ab_v1';

export const LANDING_AB_VARIANTS = {
  a: {
    id: 'a',
    label: 'Sign-up-first',
    heroPrimaryCta: 'Start free account',
    heroSecondaryCta: 'See how it works',
    bottomCta: 'CREATE FREE ACCOUNT',
    stickyCta: 'Sign up free',
    offerLine:
      'Create a free account for full GPT-4o analysis, saved history, and writing credits.',
  },
  b: {
    id: 'b',
    label: 'Band-first',
    heroPrimaryCta: 'See my band score',
    heroSecondaryCta: 'Unlock full GPT-4o',
    bottomCta: 'GET BAND SCORE · FREE',
    stickyCta: 'Sign up free',
    offerLine:
      'Sign up to run IELTS checks with corrections, rewrites, and account credits.',
  },
};

export const LANDING_AB_DEFAULT = 'a';

export function pickLandingAbVariant() {
  return Math.random() < 0.5 ? 'a' : 'b';
}

export function getLandingAbCopy(variantId) {
  return LANDING_AB_VARIANTS[variantId] ?? LANDING_AB_VARIANTS[LANDING_AB_DEFAULT];
}
