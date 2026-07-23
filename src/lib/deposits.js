import { formatPackPrice, getCreditPackById } from '@/lib/creditPacks';

export { getCreditPackById };

export const DEPOSIT_STATUSES = {
  PENDING: 'pending',
  PAID_CLAIMED: 'paid_claimed',
  CREDITED: 'credited',
  REJECTED: 'rejected',
};

/** Min gap between “I paid” claims per user (anti-spam). */
export const DEPOSIT_CLAIM_COOLDOWN_MS = 10 * 60 * 1000;

export function depositSummaryLine(deposit) {
  return `${deposit.packName} · ${deposit.credits} credits · ${formatPackPrice(deposit.amountUsd)}`;
}

export function sanitizeDepositNote(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().slice(0, 500);
  return trimmed || null;
}

/** UI label + tone for deposit status (settings history). */
export function getDepositStatusMeta(status, isRu = false) {
  const s = String(status || '').toLowerCase();
  if (s === DEPOSIT_STATUSES.CREDITED) {
    return {
      label: isRu ? 'Зачислено' : 'Credited',
      tone: 'success',
    };
  }
  if (s === DEPOSIT_STATUSES.REJECTED) {
    return {
      label: isRu ? 'Отклонено' : 'Rejected',
      tone: 'danger',
    };
  }
  // pending + paid_claimed
  return {
    label: isRu ? 'На проверке' : 'Pending review',
    tone: 'pending',
  };
}

export function formatDepositDate(isoOrDate, locale = 'en') {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
