import { SUPPORT_MAILTO } from '@/lib/support';

/** Manual top-up packs (Visa transfer → claim paid → admin credits). */
export const CREDIT_PACKS = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    priceUsd: 9.99,
    blurb: 'Try a few full Task 1 & Task 2 checks',
    popular: false,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    credits: 20,
    priceUsd: 14.99,
    blurb: 'Exam-month plan — about one check every other day',
    popular: true,
  },
  {
    id: 'intensive',
    name: 'Intensive',
    credits: 40,
    priceUsd: 24.99,
    blurb: 'Best value for Task 1 + Task 2 drills',
    popular: false,
  },
];

/** Display-only regions for pack prices (settlement stays USD). */
export const DISPLAY_CURRENCIES = [
  { id: 'RUB', label: '₽ RU', symbol: '₽', rateFromUsd: 90 },
  { id: 'USD', label: '$ EN', symbol: '$', rateFromUsd: 1 },
  { id: 'UZS', label: "so'm UZ", symbol: "so'm", rateFromUsd: 12700 },
  { id: 'TJS', label: 'с. TG', symbol: 'с.', rateFromUsd: 10.8 },
];

export function getDisplayCurrency(id = 'USD') {
  return DISPLAY_CURRENCIES.find((c) => c.id === id) || DISPLAY_CURRENCIES[1];
}

export function formatPackPrice(priceUsd, currencyId = 'USD') {
  const currency = getDisplayCurrency(currencyId);
  const amount = Number(priceUsd) * currency.rateFromUsd;
  if (currency.id === 'USD') return `$${amount.toFixed(2)}`;
  if (currency.id === 'RUB') return `₽${Math.round(amount).toLocaleString('ru-RU')}`;
  if (currency.id === 'UZS') return `${Math.round(amount).toLocaleString('uz-UZ')} so'm`;
  if (currency.id === 'TJS') return `${amount.toFixed(2)} с.`;
  return `${currency.symbol}${amount.toFixed(2)}`;
}

export function formatPerCreditPrice(pack, currencyId = 'USD') {
  const credits = Math.max(1, Number(pack?.credits) || 1);
  const per = Number(pack?.priceUsd || 0) / credits;
  return `≈ ${formatPackPrice(per, currencyId)} / generation`;
}

export function getCreditPackById(packId) {
  if (typeof packId !== 'string' || !packId.trim()) return null;
  return CREDIT_PACKS.find((p) => p.id === packId.trim()) || null;
}

/** Prefill mail for support (fallback if claim flow unavailable). */
export function buildCreditPackMailto(pack, accountEmail = '') {
  const subject = `[STRATUM.ai] Credit pack: ${pack.name} (${pack.credits} credits)`;
  const body = [
    `Hi STRATUM support,`,
    ``,
    `I want to purchase the ${pack.name} pack.`,
    ``,
    `Package: ${pack.name}`,
    `Credits: ${pack.credits}`,
    `Price: ${formatPackPrice(pack.priceUsd)}`,
    `Account email: ${accountEmail || '(your login email)'}`,
    ``,
    `I will pay by Visa / card transfer, then use “I paid” in the app (or reply here).`,
    `Please top up my credits after you confirm the transfer.`,
    ``,
    `Thanks!`,
  ].join('\n');

  const params = new URLSearchParams();
  params.set('subject', subject);
  params.set('body', body.slice(0, 6000));
  return `${SUPPORT_MAILTO}?${params.toString()}`;
}

export const CREDITS_TOP_UP_NOTICE =
  'Choose a pack — invoice with Visa card details. Credits after payment check.';

export const CREDITS_TOP_UP_FOOTER =
  'Keep the receipt until credits appear in your account.';

export const CREDITS_INVOICE_HINT =
  'Transfer the exact amount using the details below. Include your STRATUM.ai email in the payment comment.';
