"use client";

import { SessionProvider } from "next-auth/react";
import { BillingProvider } from "@/components/BillingContext";

export function Providers({ children }) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={5 * 60}
      refetchOnWindowFocus={false}
    >
      <BillingProvider>
        {children}
      </BillingProvider>
    </SessionProvider>
  );
}
