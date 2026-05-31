/** Resolve `<html class="dark">` on the server from theme cookie (+ system preference hint). */
export async function getServerHtmlThemeClass() {
  try {
    const { getTheme } = await import('@wrksz/themes/next');
    const { headers } = await import('next/headers');
    const theme = await getTheme({ defaultTheme: 'system', themes: ['light', 'dark', 'system'] });
    if (theme === 'dark') return 'dark';
    if (theme === 'light') return '';
    const pref = (await headers()).get('sec-ch-prefers-color-scheme');
    if (pref === 'dark') return 'dark';
  } catch {
    // Client provider applies theme after hydration when cookie is missing.
  }
  return '';
}

export async function getServerInitialTheme() {
  try {
    const { getTheme } = await import('@wrksz/themes/next');
    return await getTheme({ defaultTheme: 'system', themes: ['light', 'dark', 'system'] });
  } catch {
    return 'system';
  }
}
