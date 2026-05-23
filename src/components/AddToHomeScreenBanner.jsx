'use client';

import { useEffect, useState } from 'react';
import { Share, Smartphone, X } from 'lucide-react';

const DISMISS_KEY = 'stratum-a2hs-dismissed';
const DISMISS_DAYS = 14;

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

function isIosSafari() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOS && isSafari;
}

function wasRecentlyDismissed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function AddToHomeScreenBanner() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState('ios');
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    if (isStandaloneMode() || !isMobileDevice() || wasRecentlyDismissed()) return;

    if (isIosSafari()) {
      setMode('ios');
      setVisible(true);
      return;
    }

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setMode('android');
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    dismiss();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[90] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden"
      role="region"
      aria-label="Add STRATUM to your home screen"
    >
      <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-indigo-200/80 bg-white/95 shadow-[0_20px_50px_-20px_rgba(79,70,229,0.35)] backdrop-blur dark:border-indigo-500/35 dark:bg-slate-900/95 dark:shadow-[0_24px_60px_-24px_rgba(99,102,241,0.25)]">
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 dark:bg-indigo-500">
            {mode === 'ios' ? (
              <Share className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            ) : (
              <Smartphone className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
              Add STRATUM to your home screen
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {mode === 'ios' ? (
                <>
                  Tap <span className="font-semibold text-slate-800 dark:text-slate-100">Share</span>, then{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Add to Home Screen</span>.
                </>
              ) : (
                'Install the app for quick access with your STRATUM icon.'
              )}
            </p>
            {mode === 'android' && (
              <button
                type="button"
                onClick={handleInstall}
                className="mt-3 inline-flex items-center rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Install app
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
