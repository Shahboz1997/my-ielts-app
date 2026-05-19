"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { BillingProvider } from "@/components/BillingContext";
import { BankTopicsNavProvider } from "@/context/BankTopicsNavContext";

const isDev = process.env.NODE_ENV === "development";

function AuthDbWarm() {
  useEffect(() => {
    void fetch("/api/auth/warm-db", { cache: "no-store" }).catch(() => {});
  }, []);
  return null;
}

/**
 * Session from the server layout avoids an immediate client fetch to /api/auth/session
 * while Turbopack is still compiling the auth route (common cause of ClientFetchError).
 */
export function Providers({ children, session }) {
  return (
    <SessionProvider
      session={session ?? null}
      basePath="/api/auth"
      refetchInterval={isDev ? 0 : 5 * 60}
      refetchOnWindowFocus={!isDev}
    >
      <AuthDbWarm />
      <Toaster position="top-center" />
      <BillingProvider>
        <BankTopicsNavProvider>
          {children}
        </BankTopicsNavProvider>
      </BillingProvider>
    </SessionProvider>
  );
}
