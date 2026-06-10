import { useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

function readAppQueryFlags() {
  if (typeof window === 'undefined') return { forceLanding: false, skipAppLanding: false };
  try {
    const sp = new URLSearchParams(window.location.search);
    return {
      forceLanding: sp.get('landing') === '1',
      skipAppLanding: sp.get('app') === '1',
    };
  } catch {
    return { forceLanding: false, skipAppLanding: false };
  }
}

export function useWriterNavRestore({
  setActiveTab,
  setTask1Kind,
  setPromptT1Letter,
  setPromptT1Academic,
  setLetterMeta,
  setImage,
}) {
  const pathname = usePathname();
  const [forceLanding, setForceLanding] = useState(() => readAppQueryFlags().forceLanding);
  const skipAppLanding = useSyncExternalStore(
    () => () => {},
    () => readAppQueryFlags().skipAppLanding,
    () => false,
  );

  useEffect(() => {
    if (pathname !== '/') return;
    setForceLanding(readAppQueryFlags().forceLanding);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/') return;
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const fromQuery = sp.get('tab');
      const fromStore = sessionStorage.getItem('stratum_nav_tab');
      const t = fromQuery || fromStore;
      const tab = t === 'Topics' || t === 'Bank' ? 'Home' : t;
      if (tab === 'Home' || tab === 'Task 1' || tab === 'Task 2') {
        setActiveTab(tab);
      }
      if (fromQuery) {
        sp.delete('tab');
        const next = sp.toString();
        window.history.replaceState({}, '', next ? `/?${next}` : '/');
      }
      if (fromStore) sessionStorage.removeItem('stratum_nav_tab');

      const studyNavRaw = sessionStorage.getItem('stratum_study_plan_nav');
      if (studyNavRaw) {
        sessionStorage.removeItem('stratum_study_plan_nav');
        const nav = JSON.parse(studyNavRaw);
        const navTab = nav.tab === 'Topics' || nav.tab === 'Bank' ? 'Home' : nav.tab;
        if (navTab === 'Home' || navTab === 'Task 1' || navTab === 'Task 2') {
          setActiveTab(navTab);
        }
        if (nav.task1Kind === 'gt_letter' || nav.task1Kind === 'academic') {
          setTask1Kind(nav.task1Kind);
        }
      }

      const prefillRaw = sessionStorage.getItem('stratum_workspace_prefill');
      if (prefillRaw) {
        sessionStorage.removeItem('stratum_workspace_prefill');
        const p = JSON.parse(prefillRaw);
        if (p.task1Kind === 'gt_letter' || p.task1Kind === 'academic') setTask1Kind(p.task1Kind);
        if (typeof p.promptT1Letter === 'string') setPromptT1Letter(p.promptT1Letter);
        if (typeof p.promptT1Academic === 'string') setPromptT1Academic(p.promptT1Academic);
        else if (typeof p.promptT1 === 'string') {
          if (p.task1Kind === 'gt_letter') setPromptT1Letter(p.promptT1);
          else setPromptT1Academic(p.promptT1);
        }
        if (p.letterMeta && typeof p.letterMeta === 'object') {
          setLetterMeta((prev) => ({ ...prev, ...p.letterMeta }));
        }
        if (!fromQuery && !fromStore && p.activeTab) {
          const prefillTab = p.activeTab === 'Topics' || p.activeTab === 'Bank' ? 'Home' : p.activeTab;
          setActiveTab(prefillTab);
        }
        setImage(null);
      }
    } catch {
      /* ignore */
    }
  }, [
    pathname,
    setActiveTab,
    setTask1Kind,
    setPromptT1Letter,
    setPromptT1Academic,
    setLetterMeta,
    setImage,
  ]);

  return { forceLanding, skipAppLanding };
}
