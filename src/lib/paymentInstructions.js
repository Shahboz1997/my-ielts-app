/**
 * Manual Visa / bank-transfer payment details for credit top-ups.
 *
 * NEXT_PUBLIC_* must be read as static `process.env.NEXT_PUBLIC_…` identifiers
 * so Next.js can inline them into the client bundle.
 * Server-only PAYMENT_* work on API routes / emails.
 */

function trim(value) {
  return String(value || '').trim();
}

function readCardNumber() {
  return (
    trim(process.env.NEXT_PUBLIC_PAYMENT_CARD_NUMBER) ||
    trim(process.env.PAYMENT_CARD_NUMBER)
  );
}

function readCardHolder() {
  return (
    trim(process.env.NEXT_PUBLIC_PAYMENT_CARD_HOLDER) ||
    trim(process.env.PAYMENT_CARD_HOLDER)
  );
}

function readCardLabel() {
  return (
    trim(process.env.NEXT_PUBLIC_PAYMENT_CARD_LABEL) ||
    trim(process.env.PAYMENT_CARD_LABEL) ||
    'Visa'
  );
}

function readTransferNote() {
  return (
    trim(process.env.NEXT_PUBLIC_PAYMENT_TRANSFER_NOTE) ||
    trim(process.env.PAYMENT_TRANSFER_NOTE) ||
    'STRATUM + your login email'
  );
}

function readExtra() {
  return (
    trim(process.env.NEXT_PUBLIC_PAYMENT_EXTRA_INSTRUCTIONS) ||
    trim(process.env.PAYMENT_EXTRA_INSTRUCTIONS)
  );
}

function buildPaymentInfo(cardNumber) {
  const configured = Boolean(cardNumber);
  return {
    configured,
    cardLabel: readCardLabel(),
    cardNumber: configured ? cardNumber : '',
    cardHolder: readCardHolder(),
    transferNote: readTransferNote(),
    extra: readExtra() || '',
    supportFallback: !configured,
  };
}

/** Safe to call from client components (static NEXT_PUBLIC_* reads). */
export function getPublicPaymentInstructions() {
  return buildPaymentInfo(readCardNumber());
}

/** Server-side (API / emails) — also reads non-public PAYMENT_*. */
export function getPaymentInstructions() {
  return buildPaymentInfo(readCardNumber());
}

/** Human-readable block for emails / UI. */
export function formatPaymentInstructionsText(info = getPaymentInstructions()) {
  if (!info.configured) {
    return 'Card details are not published yet — email support after choosing a pack.';
  }
  const lines = [
    `Pay by card transfer (${info.cardLabel}):`,
    info.cardNumber,
  ];
  if (info.cardHolder) lines.push(`Cardholder: ${info.cardHolder}`);
  lines.push(`Payment comment: ${info.transferNote}`);
  if (info.extra) lines.push(info.extra);
  return lines.join('\n');
}
