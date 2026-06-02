import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { getPrisma } from "@/lib/prisma";
import { ensureAuthPublicUrl } from "@/lib/ensureAuthPublicUrl";
import { EMAIL_LEGAL_FOOTER } from "@/lib/support";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function getSiteOrigin() {
  ensureAuthPublicUrl();
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

export async function createEmailVerificationToken(email) {
  const normalized = String(email ?? "").trim().toLowerCase();
  if (!normalized) return null;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const token = hashToken(rawToken);
  const expires = new Date(Date.now() + TOKEN_TTL_MS);
  const prisma = getPrisma();

  await prisma.verificationToken.deleteMany({
    where: { identifier: normalized },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: normalized,
      token,
      expires,
    },
  });

  return rawToken;
}

export async function sendVerificationEmail({ to, name, token }) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    console.warn("[emailVerification] EMAIL_USER or EMAIL_PASS missing; skip send");
    return { ok: false, reason: "no_smtp" };
  }
  if (!to || !String(to).includes("@") || !token) {
    return { ok: false, reason: "bad_input" };
  }

  const verifyUrl = `${getSiteOrigin()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  const greeting = name ? `${name}, ` : "";
  const footer = `<p style="margin:16px 0 0;color:#6b7280;font-size:12px">${EMAIL_LEGAL_FOOTER}</p>`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;line-height:1.5">
    <p>${greeting}confirm your email to activate your STRATUM.ai account.</p>
    <p><a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Confirm email</a></p>
    <p style="color:#6b7280;font-size:13px">Or copy this link:<br><a href="${verifyUrl}" style="color:#4f46e5;word-break:break-all">${verifyUrl}</a></p>
    <p style="color:#6b7280;font-size:13px">This link expires in 24 hours.</p>
    ${footer}
  </div>`;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: user,
      to,
      subject: "STRATUM.ai — confirm your email",
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[emailVerification]", err?.message || err);
    return { ok: false, reason: err?.message || "send_failed" };
  }
}

export async function verifyEmailToken(rawToken) {
  const token = hashToken(rawToken);
  const prisma = getPrisma();

  const row = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!row) {
    return { ok: false, error: "invalid" };
  }

  if (row.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return { ok: false, error: "expired" };
  }

  const email = row.identifier;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return { ok: false, error: "invalid" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return { ok: true, email };
}

export async function issueVerificationEmailForUser(user) {
  if (!user?.email || user.emailVerified) {
    return { ok: false, reason: "not_needed" };
  }

  const rawToken = await createEmailVerificationToken(user.email);
  if (!rawToken) return { ok: false, reason: "token_failed" };

  return sendVerificationEmail({
    to: user.email,
    name: user.name,
    token: rawToken,
  });
}
