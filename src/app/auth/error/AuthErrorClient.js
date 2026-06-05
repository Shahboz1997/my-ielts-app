"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PRODUCTION_SITE_ORIGIN } from "@/lib/publicSiteUrl";

const GOOGLE_CALLBACK_URI = `${PRODUCTION_SITE_ORIGIN}/api/auth/callback/google`;

function humanizeAuthError(code) {
  const c = String(code || "").trim();
  if (!c) return "Unknown auth error";
  if (c === "Configuration") {
    return "Auth configuration error. Check AUTH_URL/NEXTAUTH_URL, Google OAuth credentials, and that the redirect URI below is registered in Google Cloud Console.";
  }
  if (c === "OAuthSignin" || c === "OAuthCallback") {
    return "Google sign-in failed. Try again in a moment. If it keeps failing, check your connection and VPN/firewall.";
  }
  if (c === "OAuthAccountNotLinked") {
    return "This email is already registered with a different sign-in method. Use the same method you used originally.";
  }
  if (c === "AccessDenied") {
    return "Access denied by the provider or your app.";
  }
  if (c === "Verification") {
    return "Verification failed or expired.";
  }
  return `Auth error: ${c}`;
}

export default function AuthErrorClient() {
  const sp = useSearchParams();
  const error = sp?.get("error") || "";
  const reason = sp?.get("reason") || "";
  const callbackUrl = sp?.get("callbackUrl") || "";

  const message = useMemo(() => {
    if (error === "OAuthCallback" && reason === "google_timeout") {
      return "Google sign-in timed out while contacting Google servers. Wait a few seconds and try again, or sign in with email and password.";
    }
    if (error === "OAuthCallback" && reason === "db_timeout") {
      return "Google sign-in timed out while saving your account to the database. Wait a few seconds and try again — the server may have been waking up.";
    }
    if (error === "OAuthCallback" && reason === "oauth_config") {
      return `Google OAuth is misconfigured for this domain. In Vercel set NEXTAUTH_URL and NEXT_PUBLIC_APP_URL to ${PRODUCTION_SITE_ORIGIN}, then add this redirect URI in Google Cloud Console (Credentials → your OAuth client → Authorized redirect URIs).`;
    }
    return humanizeAuthError(error);
  }, [error, reason]);

  return (
    <div className="min-h-[70dvh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-sm">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
          STRATUM · Authentication
        </div>
        <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Sign-in failed
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>

        {callbackUrl ? (
          <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              callbackUrl
            </div>
            <div className="mt-1 break-all text-xs text-slate-700 dark:text-slate-200">{callbackUrl}</div>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Google redirect URI (required)
          </div>
          <div className="mt-1 break-all text-xs font-mono text-slate-800 dark:text-slate-100">
            {GOOGLE_CALLBACK_URI}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            Back to home
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-extrabold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
          >
            Try again
          </Link>
        </div>

        <div className="mt-6 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Production env on Vercel:{" "}
          <span className="font-semibold">NEXTAUTH_URL={PRODUCTION_SITE_ORIGIN}</span>,{" "}
          <span className="font-semibold">NEXT_PUBLIC_APP_URL={PRODUCTION_SITE_ORIGIN}</span>, plus{" "}
          <span className="font-semibold">AUTH_SECRET</span> and Google OAuth keys.
        </div>
      </div>
    </div>
  );
}
