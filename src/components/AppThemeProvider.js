'use client';

import { useEffect } from 'react';
import { ClientThemeProvider } from '@wrksz/themes/client';

const STORAGE_KEY = 'theme';

function syncLocalStorageThemeToCookie() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const re = new RegExp(`(?:^|;\\s*)${STORAGE_KEY}=`);
    if (re.test(document.cookie)) return;
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(stored)}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // ignore
  }
}

export default function AppThemeProvider({ children, initialTheme }) {
  useEffect(() => {
    syncLocalStorageThemeToCookie();
  }, []);

  return (
    <ClientThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storage="hybrid"
      enableColorScheme={false}
      disableTransitionOnChange
      initialTheme={initialTheme}
    >
      {children}
    </ClientThemeProvider>
  );
}
