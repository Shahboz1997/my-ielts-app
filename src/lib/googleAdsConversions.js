/** Google Ads conversion: Registration (AW-18107551498). */
export const GOOGLE_ADS_REGISTRATION_SEND_TO =
  'AW-18107551498/JjM1CJ3TjtEcEIqerbpD';

export function trackGoogleAdsRegistrationConversion() {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'conversion', {
    send_to: GOOGLE_ADS_REGISTRATION_SEND_TO,
    value: 1.0,
    currency: 'USD',
  });
}
