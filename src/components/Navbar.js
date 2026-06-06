import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from "next-auth/react";
import { useTheme } from '@wrksz/themes/client';
import { 
  Zap, Sun, Moon, Menu, X, 
  ChevronDown, LogOut,
} from 'lucide-react';
const Navbar = ({ 
  activeTab, setActiveTab, darkMode: darkModeProp, setDarkMode: setDarkModeProp, 
  isMenuOpen, setIsMenuOpen, onLoginClick,
  credits: creditsProp,
  guestQuotaRemaining = null,
}) => {
  const { data: session, status } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  useEffect(() => { setThemeMounted(true); }, []);
  const darkMode = darkModeProp !== undefined ? darkModeProp : (themeMounted && resolvedTheme === 'dark');

  const isLoggedIn = status === "authenticated";
  const credits =
    typeof creditsProp === 'number'
      ? creditsProp
      : (session?.user?.credits ?? 0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [confirmLogoutMobile, setConfirmLogoutMobile] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) setConfirmLogoutMobile(false);
  }, [isMenuOpen]);

  const primaryItems = ['Task 1', 'Task 2'];
  const secondaryItems = ['Home', 'Bank', 'Archive'];
  const menuItems = ['Home', 'Bank', ...primaryItems, 'Archive'];
  const handleThemeToggle = () => {
    if (!themeMounted) return;
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <>
      <nav className={`sticky top-0 z-50 p-4 border-b border-white/5 backdrop-blur-md transition-colors duration-300 ${
        darkMode ? 'bg-[#050505]/90' : 'bg-[#F9FAFB]/90'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          
          {/* Logo: STRATUM.ai — bold, wide-tracked, accent on dot */}
          <button
            type="button"
            onClick={() => setActiveTab('Home')}
            className="group flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl md:text-2xl font-black tracking-[0.12em] sm:tracking-[0.15em] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded uppercase shrink-0"
            aria-label="Go to Home"
          >
            <Zap className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-indigo-500 dark:text-indigo-400 shrink-0 transition-transform duration-200 group-hover:scale-110 [filter:drop-shadow(0_0_5px_rgba(79,70,229,0.5))]" strokeWidth={1.5} />
            <span className={`hidden min-[400px]:inline ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              STRATUM<span className="text-indigo-500 dark:text-indigo-400">.</span>ai
            </span>
          </button>

          {/* Task 1 / Task 2 — always visible on mobile */}
          <div
            className={`md:hidden flex flex-1 min-w-0 items-stretch gap-1 p-1 rounded-xl border ${
              darkMode
                ? 'bg-slate-800/90 border-slate-600'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            {primaryItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveTab(item)}
                aria-current={activeTab === item ? 'page' : undefined}
                className={`flex-1 min-h-[44px] min-w-0 px-1 py-1.5 rounded-lg font-extrabold transition-all ${
                  activeTab === item
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/35 ring-1 ring-indigo-500/50'
                    : darkMode
                      ? 'text-slate-100 hover:bg-slate-700'
                      : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="flex flex-col items-center justify-center leading-none gap-0.5 min-[400px]:hidden">
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-90">Task</span>
                  <span className="text-base font-black">{item === 'Task 1' ? '1' : '2'}</span>
                </span>
                <span className="hidden min-[400px]:block text-xs sm:text-sm uppercase tracking-tight truncate">
                  {item}
                </span>
              </button>
            ))}
          </div>

          {/* ДЕСКТОПНОЕ МЕНЮ (Скрыто на мобилках) */}
          <div className="hidden md:flex items-center gap-6 ml-auto">
            <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {menuItems.map((item) =>
                item === 'Archive' ? (
                  isLoggedIn ? (
                    <Link key={item} href="/history" className={`px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-tighter transition-all block ${activeTab === item ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'}`}>{item}</Link>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onLoginClick?.('Sign in to view your archive.')}
                      className={`px-4 py-2 rounded-full font-black text-[11px] uppercase tracking-tighter transition-all ${activeTab === item ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'}`}
                    >
                      {item}
                    </button>
                  )
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setActiveTab(item)}
                    aria-current={activeTab === item ? 'page' : undefined}
                    className={`px-4 py-2 rounded-full font-extrabold text-xs uppercase tracking-tight transition-all ${
                      activeTab === item
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                        : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-4 border-l pl-6 border-slate-700/30">
              {/* <div className="relative">
                <button type="button" onClick={() => setIsPricingOpen(!isPricingOpen)} className="flex items-center gap-2 min-h-[44px] px-3 py-2 font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-xl transition-all">
                  <CreditCard className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} /> Pricing
                </button>
                <AnimatePresence>
                  {isPricingOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute right-0 mt-3 w-64 p-4 rounded-3xl shadow-2xl shadow-black/10 border border-white/5 backdrop-blur-md ${darkMode ? 'bg-slate-900/90' : 'bg-white/95'}`}>
                       {plans.map(p => (
                          <div key={p.name} onClick={() => { setSelectedPlan(p); setIsPricingOpen(false); }} className="p-3 mb-1 rounded-xl cursor-pointer font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-all">
                             <div className="flex justify-between"><span>{p.name}</span><span className="text-indigo-600">{p.price}</span></div>
                             <div className="text-[8px] opacity-60 tracking-tighter">{p.desc}</div>
                          </div>
                       ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div> */}
            {isLoggedIn ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-semibold text-xs text-indigo-600 bg-indigo-600/10 px-2 py-1 rounded-lg tracking-tight" title="Account credits">
            {credits} <Zap className="w-3 h-3 inline-block" strokeWidth={1.5} />
          </div>
          
          {/* User dropdown: Profile, Billing, Logout */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 rounded-xl transition-all"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-semibold">
                {session.user.name?.charAt(0) || 'U'}
              </div>
              <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <AnimatePresence>
              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setIsUserMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 mt-2 w-48 py-1 rounded-3xl shadow-2xl shadow-black/10 border border-white/5 backdrop-blur-md z-50 bg-white/95 dark:bg-slate-900/95"
                  >
                    <Link
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center min-h-[44px] px-4 py-2 text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600"
                    >
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => { signOut({ callbackUrl: '/' }); setIsUserMenuOpen(false); }}
                      className="w-full text-left flex items-center min-h-[44px] px-4 py-2 text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 border-t border-slate-100 dark:border-slate-800"
                    >
                      <LogOut className="w-4 h-4 mr-2 shrink-0" strokeWidth={1.5} />
                      Logout
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
              ) : (
                <>
                  {typeof guestQuotaRemaining === 'number' && guestQuotaRemaining > 0 && (
                    <button
                      type="button"
                      onClick={() => onLoginClick?.()}
                      className="hidden sm:flex items-center gap-1 font-semibold text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg tracking-tight hover:bg-amber-500/20 transition-colors"
                      title="One free demo check on this network — sign in for archive and credits"
                    >
                      Demo
                    </button>
                  )}
                  <button type="button" onClick={() => onLoginClick()} className="btn-stratum min-h-[44px] px-4 py-2 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]">
                    <div className="shimmer-layer animate-shimmer" aria-hidden />
                    <span className="btn-stratum-text">STRATUM LOGIN</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleThemeToggle}
                disabled={!themeMounted}
                className="group flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                aria-label={themeMounted && resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {themeMounted && resolvedTheme === 'dark' ? <Sun className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} /> : <Moon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {/* КНОПКА БУРГЕРА (Только мобильные, <768px) */}
          <div className="md:hidden flex items-center gap-2 shrink-0 ml-auto">
            {/* Кредиты (mobile) */}
            {isLoggedIn ? (
              <div className="flex items-center gap-1 font-semibold text-[11px] text-indigo-600 bg-indigo-600/10 px-2 py-1 rounded-lg tracking-tight whitespace-nowrap">
                {credits} <Zap className="w-3 h-3 inline-block" strokeWidth={1.5} />
              </div>
            ) : (
              typeof guestQuotaRemaining === 'number' && guestQuotaRemaining > 0 && (
                <button
                  type="button"
                  onClick={() => onLoginClick?.()}
                  className="flex items-center gap-1 font-semibold text-[11px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg tracking-tight whitespace-nowrap hover:bg-amber-500/20 transition-colors"
                  title="Sign in for archive and full analysis"
                >
                  Demo
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] text-slate-600 dark:text-slate-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} /> : <Menu className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* МОБИЛЬНОЕ ВЫПАДАЮЩЕЕ МЕНЮ (Pricing + Theme + Nav) */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden overflow-hidden bg-inherit">
              <div className="flex flex-col p-4 space-y-4 border-t dark:border-slate-800 mt-4">
                
                {/* 1. Навигация */}
                <div className="grid grid-cols-2 gap-2">
                  {secondaryItems.map((item) =>
                    item === 'Archive' ? (
                      isLoggedIn ? (
                        <Link key={item} href="/history" onClick={() => setIsMenuOpen(false)} className={`flex items-center justify-center min-h-[44px] p-4 rounded-xl font-semibold tracking-tight text-center block text-slate-600 dark:text-slate-400 hover:bg-white/5 hover:text-indigo-600 ${activeTab === item ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20' : 'bg-white/5 dark:bg-white/5 border border-white/5'}`}>{item}</Link>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onLoginClick?.('Sign in to view your archive.');
                          }}
                          className={`flex items-center justify-center min-h-[44px] p-4 rounded-xl font-semibold tracking-tight text-center text-slate-600 dark:text-slate-400 hover:bg-white/5 hover:text-indigo-600 ${activeTab === item ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20' : 'bg-white/5 dark:bg-white/5 border border-white/5'}`}
                        >
                          {item}
                        </button>
                      )
                    ) : (
                      <button key={item} type="button" onClick={() => { setActiveTab(item); setIsMenuOpen(false); }} className={`flex items-center justify-center min-h-[44px] p-4 rounded-xl font-semibold tracking-tight text-center text-slate-600 dark:text-slate-400 hover:bg-white/5 hover:text-indigo-600 ${activeTab === item ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/20' : 'bg-white/5 dark:bg-white/5 border border-white/5'}`}>{item}</button>
                    )
                  )}
                </div>

                {/* 2. Блок Pricing внутри бургера
                <div className={`p-4 rounded-3xl border border-white/5 backdrop-blur-md ${darkMode ? 'bg-white/5' : 'bg-white/80'}`}>
                  <h4 className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" strokeWidth={1.5} /> Subscription Plans</h4>
                  <div className="space-y-2">
                    {plans.map(p => (
                      <button key={p.name} type="button" onClick={() => { setSelectedPlan(p); setIsMenuOpen(false); }} className="w-full flex justify-between items-center min-h-[44px] p-4 rounded-xl bg-white dark:bg-slate-900 border dark:border-slate-700 shadow-sm active:scale-[0.98] transition-transform">
                        <div className="text-left leading-tight">
                          <div className="text-[10px] font-black uppercase dark:text-white">{p.name}</div>
                          <div className="text-[8px] text-slate-500 font-bold uppercase">{p.desc}</div>
                        </div>
                        <div className="text-indigo-600 font-semibold text-xs">{p.price}</div>
                      </button>
                    ))}
                  </div>
                </div> */}

                {/* 3. Утилиты: Theme, Login (or Logout when logged in) */}
                <div className="flex gap-2">
                   <button
                     type="button"
                     onClick={handleThemeToggle}
                     disabled={!themeMounted}
                     className="flex-1 min-h-[44px] p-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center gap-3 font-semibold tracking-tight text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
                   >
                     {themeMounted && resolvedTheme === 'dark' ? <><Sun className="w-5 h-5" strokeWidth={1.5} /> Day</> : <><Moon className="w-5 h-5" strokeWidth={1.5} /> Night</>}
                   </button>
                   {!isLoggedIn ? (
                     <button type="button" onClick={() => onLoginClick()} className="btn-stratum flex-1 min-h-[44px] p-4 rounded-xl hover:shadow-[0_0_25px_rgba(79,70,229,0.3)]">
                       <div className="shimmer-layer animate-shimmer" aria-hidden />
                       <span className="btn-stratum-text">STRATUM LOGIN</span>
                     </button>
                   ) : null}
                </div>

                {/* 4. Logout row (mobile) — prominent, fat-finger friendly, optional confirm */}
                {isLoggedIn && (
                  <div className="pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirmLogoutMobile) {
                          signOut({ callbackUrl: '/' });
                          setIsMenuOpen(false);
                        } else {
                          setConfirmLogoutMobile(true);
                        }
                      }}
                      className="
                        w-full flex items-center justify-center gap-2 min-h-[48px] rounded-xl
                        font-black uppercase tracking-[0.2em] text-[10px]
                        text-slate-500 dark:text-slate-400
                        hover:text-red-500 hover:bg-red-500/10 active:text-red-500 active:bg-red-500/10
                        transition-colors
                      "
                    >
                      <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                      <span>{confirmLogoutMobile ? 'Tap again to sign out' : 'Sign Out'}</span>
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

    </>
  );
};

export default Navbar;
