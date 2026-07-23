import { Resend } from 'resend';
import { EMAIL_LEGAL_FOOTER, SUPPORT_EMAIL } from '@/lib/support';
import { parseAdminEmails } from '@/lib/admin';

function getResendClient() {
  const key = (process.env.RESEND_API_KEY || '').trim();
  if (!key) return null;
  return new Resend(key);
}

function getFromAddress() {
  const from = (process.env.RESEND_FROM || '').trim();
  if (from) return from;
  // Resend onboarding sender works for tests; production should set RESEND_FROM.
  return 'STRATUM.ai <onboarding@resend.dev>';
}

function footerHtml() {
  return `<p style="margin:16px 0 0;color:#6b7280;font-size:12px">${EMAIL_LEGAL_FOOTER}</p>`;
}

/**
 * Low-level Resend send. Returns { ok, reason?, id? }.
 */
export async function sendResendEmail({ to, subject, html, replyTo }) {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[resendMail] RESEND_API_KEY missing; skip send');
    return { ok: false, reason: 'no_resend' };
  }

  const recipients = Array.isArray(to)
    ? to.filter((e) => typeof e === 'string' && e.includes('@'))
    : typeof to === 'string' && to.includes('@')
      ? [to]
      : [];

  if (recipients.length === 0) {
    return { ok: false, reason: 'bad_to' };
  }
  if (!subject || !html) {
    return { ok: false, reason: 'bad_input' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: recipients,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    if (error) {
      console.error('[resendMail]', error);
      return { ok: false, reason: error.message || 'send_failed' };
    }
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error('[resendMail]', err?.message || err);
    return { ok: false, reason: err?.message || 'send_failed' };
  }
}

export function isResendConfigured() {
  return Boolean((process.env.RESEND_API_KEY || '').trim());
}

/**
 * Notify admins that a user claimed they paid for a credit pack.
 */
export async function sendDepositPaidAdminEmail(deposit) {
  const admins = parseAdminEmails();
  const to = admins.length > 0 ? admins : [SUPPORT_EMAIL];

  const subject = `[STRATUM] Deposit claimed — ${deposit.packName} (${deposit.credits} credits) · ${deposit.userEmail}`;
  const noteBlock = deposit.note
    ? `<p><strong>User note:</strong> ${escapeHtml(deposit.note)}</p>`
    : '';

  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;line-height:1.5">
    <p>A user marked a credit pack as paid. Verify the Visa / bank transfer, then credit their account.</p>
    <ul>
      <li><strong>Deposit ID:</strong> ${escapeHtml(deposit.id)}</li>
      <li><strong>User:</strong> ${escapeHtml(deposit.userEmail)} (id: ${escapeHtml(deposit.userId)})</li>
      <li><strong>Pack:</strong> ${escapeHtml(deposit.packName)} (${deposit.credits} credits)</li>
      <li><strong>Amount:</strong> $${Number(deposit.amountUsd).toFixed(2)} ${escapeHtml(deposit.currency || 'USD')}</li>
      <li><strong>Status:</strong> ${escapeHtml(deposit.status)}</li>
    </ul>
    ${noteBlock}
    <p style="color:#6b7280;font-size:13px">
      Credit via <code>POST /api/admin/credits</code> with
      <code>{"email":"${escapeHtml(deposit.userEmail)}","increment":${deposit.credits},"depositId":"${escapeHtml(deposit.id)}"}</code>
      (admin session required).
    </p>
    ${footerHtml()}
  </div>`;

  return sendResendEmail({
    to,
    subject,
    html,
    replyTo: deposit.userEmail,
  });
}

/**
 * Tell the user their credits were added after manual verification.
 */
export async function sendDepositCreditedUserEmail({ to, name, packName, credits, newBalance }) {
  const greeting = name ? `${escapeHtml(name)}, ` : '';
  const subject = `STRATUM.ai — ${credits} credits added (${packName})`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.5">
    <p>${greeting}your payment was verified. We added <strong>${credits}</strong> credits (${escapeHtml(packName)}).</p>
    <p>Your balance is now <strong>${newBalance}</strong> credits. Open the Writer to continue analyzing essays.</p>
    <p style="color:#6b7280;font-size:13px">Questions? Reply to this email or write ${SUPPORT_EMAIL}.</p>
    ${footerHtml()}
  </div>`;

  return sendResendEmail({ to, subject, html, replyTo: SUPPORT_EMAIL });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
