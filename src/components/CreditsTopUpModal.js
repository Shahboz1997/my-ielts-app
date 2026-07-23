'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, Loader2, X } from 'lucide-react';
import {
  CREDIT_PACKS,
  CREDITS_INVOICE_HINT,
  CREDITS_TOP_UP_FOOTER,
  CREDITS_TOP_UP_NOTICE,
  formatPackPrice,
  formatPerCreditPrice,
} from '@/lib/creditPacks';
import { getPublicPaymentInstructions } from '@/lib/paymentInstructions';

/**
 * Two-step credit top-up: pack list → payment invoice + “I paid” claim.
 */
export default function CreditsTopUpModal({
  isOpen,
  onClose,
  title = 'Get more credits',
  subtitle = "You've used your free checks. Choose a credit pack to keep analyzing essays.",
}) {
  const titleId = useId();
  const [paymentInfo, setPaymentInfo] = useState(() => getPublicPaymentInstructions());
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [step, setStep] = useState('plans'); // 'plans' | 'invoice'
  const [selectedPackId, setSelectedPackId] = useState(
    () => CREDIT_PACKS.find((p) => p.popular)?.id || CREDIT_PACKS[0]?.id || ''
  );
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState(null);
  const [copied, setCopied] = useState(false);

  const selectedPack = CREDIT_PACKS.find((p) => p.id === selectedPackId) || CREDIT_PACKS[0];

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (ev) => {
      if (ev.key === 'Escape') {
        if (step === 'invoice' && !claimSuccess) {
          setStep('plans');
          return;
        }
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose, step, claimSuccess]);

  useEffect(() => {
    if (!isOpen) {
      setStep('plans');
      setClaimError('');
      setClaimSuccess(null);
      setClaiming(false);
      setCopied(false);
      return;
    }

    let cancelled = false;
    setPaymentLoading(true);
    fetch('/api/deposits/payment-info')
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data?.cardNumber) return;
        setPaymentInfo({
          configured: true,
          cardLabel: data.cardLabel || 'Visa',
          cardNumber: data.cardNumber,
          cardHolder: data.cardHolder || '',
          transferNote: data.transferNote || '',
          extra: data.extra || '',
          supportFallback: false,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPaymentLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const copyCard = useCallback(async () => {
    const num = paymentInfo?.cardNumber;
    if (!num) return;
    try {
      await navigator.clipboard.writeText(String(num).replace(/\s+/g, ''));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [paymentInfo?.cardNumber]);

  const openInvoice = (packId) => {
    setSelectedPackId(packId);
    setClaimError('');
    setClaimSuccess(null);
    setStep('invoice');
  };

  const backToPlans = () => {
    setStep('plans');
    setClaimError('');
  };

  const handleClaimPaid = async () => {
    if (!selectedPack || claiming || claimSuccess) return;
    setClaiming(true);
    setClaimError('');
    try {
      const res = await fetch('/api/deposits/claim-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: selectedPack.id,
          currency: 'USD',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.code === 'DEPOSIT_COOLDOWN' && data?.retryAfterSec) {
          const mins = Math.ceil(Number(data.retryAfterSec) / 60);
          throw new Error(
            `Please wait about ${mins} min before another claim (anti-spam).`
          );
        }
        throw new Error(data?.error || 'Could not submit payment claim');
      }
      setClaimSuccess({
        ...data.deposit,
        notifyOk: data?.notify?.ok !== false,
      });
      if (data?.notify && data.notify.ok === false) {
        // Claim is stored; warn so the user knows admin may need a manual ping.
        setClaimError(
          'Claim saved, but the admin email may not have been delivered. Contact support if credits are not added soon.'
        );
      }
    } catch (err) {
      setClaimError(err?.message || 'Something went wrong');
    } finally {
      setClaiming(false);
    }
  };

  const creditLabel = (n) => (Number(n) === 1 ? '1 credit' : `${n} credits`);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[210] flex items-end justify-center p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
            aria-label="Close credit packages"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-slate-200/90 bg-white shadow-[0_28px_80px_-24px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-950 dark:shadow-[0_28px_80px_-24px_rgba(0,0,0,0.65)] sm:max-h-[min(92dvh,720px)] sm:rounded-3xl max-h-[min(92dvh,100%)] pb-[env(safe-area-inset-bottom)]"
          >
            <div
              className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden"
              aria-hidden
            />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 pt-5 sm:px-8 sm:pb-8 sm:pt-9">
              {step === 'plans' ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 pr-1">
                      <h2
                        id={titleId}
                        className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl"
                      >
                        {title}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {subtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>

                  <div
                    className="mt-4 rounded-2xl bg-slate-100 px-3.5 py-3 text-sm leading-relaxed text-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:mt-5 sm:px-4"
                    role="note"
                  >
                    {CREDITS_TOP_UP_NOTICE}
                  </div>

                  <ul className="mt-4 space-y-3 sm:mt-5" aria-label="Credit packs">
                    {CREDIT_PACKS.map((pack) => {
                      const isPopular = Boolean(pack.popular);
                      return (
                        <li key={pack.id} className="relative pt-1">
                          {isPopular ? (
                            <span className="absolute left-3 top-0 z-10 -translate-y-1/2 bg-white px-1 text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:bg-slate-950 dark:text-white sm:left-4">
                              Popular
                            </span>
                          ) : null}
                          <div
                            className={`flex flex-col gap-3 rounded-2xl border bg-white p-3.5 dark:bg-slate-950 min-[380px]:flex-row min-[380px]:items-center sm:gap-3 sm:px-4 sm:py-3.5 ${
                              isPopular
                                ? 'border-2 border-slate-900 dark:border-white'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
                                {creditLabel(pack.credits)}
                              </p>
                              <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                                {formatPackPrice(pack.priceUsd)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {formatPerCreditPrice(pack)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => openInvoice(pack.id)}
                              className={`inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors min-[380px]:w-auto ${
                                isPopular
                                  ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                                  : 'border border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800'
                              }`}
                            >
                              Select
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={backToPlans}
                      className="min-h-10 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      ← Back to plans
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-orange-500 sm:mt-5">
                    {claimSuccess ? 'Claim submitted' : 'Awaiting payment'}
                  </p>
                  <h2
                    id={titleId}
                    className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl"
                  >
                    Payment invoice
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {CREDITS_INVOICE_HINT}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
                    <div className="min-w-0 rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-900 sm:px-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Pack
                      </p>
                      <p className="mt-1 truncate text-[15px] font-bold text-slate-900 dark:text-white">
                        {creditLabel(selectedPack?.credits)}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {selectedPack?.name}
                      </p>
                    </div>
                    <div className="min-w-0 rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-900 sm:px-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Amount
                      </p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white sm:text-xl">
                        {formatPackPrice(selectedPack?.priceUsd)}
                      </p>
                    </div>
                  </div>

                  {paymentInfo.configured ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-3.5 py-4 dark:border-slate-700 dark:bg-slate-950 sm:mt-5 sm:px-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Payment details
                        </p>
                        <button
                          type="button"
                          onClick={copyCard}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-900"
                          aria-label="Copy card number"
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                          ) : (
                            <Copy className="h-3.5 w-3.5" aria-hidden />
                          )}
                          {copied ? 'Copied' : 'Copy card number'}
                        </button>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-slate-800 dark:text-slate-100">
                        <p className="break-all font-semibold leading-snug">
                          {paymentInfo.cardLabel || 'Visa'} card:{' '}
                          <span className="font-mono tracking-wide">
                            {paymentInfo.cardNumber}
                          </span>
                        </p>
                        {paymentInfo.cardHolder ? (
                          <p className="text-slate-600 dark:text-slate-400">
                            Cardholder: {paymentInfo.cardHolder}
                          </p>
                        ) : null}
                        <p className="text-slate-600 dark:text-slate-400">
                          Transfer the exact USD amount. Include your STRATUM.ai
                          email in the payment note. Then tap &quot;I paid&quot;.
                        </p>
                        {paymentInfo.extra ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {paymentInfo.extra}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : paymentLoading ? (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:mt-5">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Loading payment details…
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100 sm:mt-5">
                      Card details are not published yet. Contact support after choosing a pack.
                    </div>
                  )}

                  {claimSuccess ? (
                    <div
                      className="mt-4 rounded-2xl border border-emerald-300/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-100"
                      role="status"
                    >
                      Claim submitted ({claimSuccess.packName}, {claimSuccess.credits} credits).
                      We will verify the transfer and add credits soon.
                    </div>
                  ) : null}

                  {claimError ? (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
                      {claimError}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleClaimPaid}
                    disabled={claiming || !selectedPack || Boolean(claimSuccess)}
                    className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    {claiming ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Submitting…
                      </>
                    ) : claimSuccess ? (
                      'Claim sent'
                    ) : (
                      'I paid — notify admin'
                    )}
                  </button>

                  <p className="mt-4 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {CREDITS_TOP_UP_FOOTER}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
