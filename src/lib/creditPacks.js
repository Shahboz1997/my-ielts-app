import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/support';

/** Manual top-up packs (Stripe / YooKassa not live yet). */
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

export function formatPackPrice(priceUsd) {
  return `$${Number(priceUsd).toFixed(2)}`;
}

/** Prefill mail for support after choosing a pack. */
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
    `I will pay manually (YooKassa / Stripe checkout not connected yet).`,
    `Please reply with payment instructions, then top up my credits.`,
    ``,
    `Thanks!`,
  ].join('\n');

  const params = new URLSearchParams();
  params.set('subject', subject);
  params.set('body', body.slice(0, 6000));
  return `${SUPPORT_MAILTO}?${params.toString()}`;
}

export const CREDITS_TOP_UP_NOTICE =
  `Automated payments via YooKassa and Stripe are not connected yet. After you pay, email ${SUPPORT_EMAIL} with your account email and the package name — we credit you manually.`;

export const CREDITS_TOP_UP_FOOTER =
  'After payment, credits are usually added within a few hours (often sooner).';
