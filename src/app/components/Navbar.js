import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FireIcon, 
  SunIcon, 
  MoonIcon, 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  BoltIcon 
} from '@heroicons/react/24/outline';
const Navbar = ({ 
  activeTab, 
  setActiveTab, 
  darkMode, 
  setDarkMode, 
  isMenuOpen, 
  setIsMenuOpen,
  onLoginClick,       // <-- 1. ДОБАВЛЕНО СЮДА
  isLoggedIn = false, 
  credits = 0         
}) => {

  const menuItems = ['Topics', 'Task 1', 'Task 2', 'Archive'];

  return (
    <nav className={`sticky top-0 z-50 p-4 border-b backdrop-blur-md transition-colors duration-300 ${
      darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* 1. ЛОГОТИП */}
        <div 
          className="flex items-center gap-2 text-2xl font-black italic cursor-pointer group" 
          onClick={() => setActiveTab('Topics')}
        >
          <FireIcon className="w-8 h-8 text-red-600 shrink-0 group-hover:scale-110 transition-transform" /> 
          <span className={`${darkMode ? 'text-white' : 'text-slate-900'} hidden min-[340px]:inline tracking-tighter uppercase`}>
            BAND<span className="text-red-600">BOOSTER</span>
          </span>
        </div>

        {/* 2. ДЕСКТОПНОЕ МЕНЮ */}
        <div className="hidden md:flex items-center gap-6">
          <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {menuItems.map(t => (
              <button 
                key={t} 
                onClick={() => setActiveTab(t)} 
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                  activeTab === t ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-red-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 border-l pl-6 border-slate-700/30">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end leading-none">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Credits</span>
                  <span className="text-xs font-black text-red-600 flex items-center gap-0.5">
                    {credits} <BoltIcon className="w-3 h-3" />
                  </span>
                </div>
                <button className="flex items-center gap-2 p-1 pr-3 bg-red-600/10 hover:bg-red-600/20 text-red-600 rounded-full transition-all border border-red-600/20">
                  <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-xs">U</div>
                  <span className="text-[10px] font-black uppercase">Cabinet</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={onLoginClick} // <-- 2. ДОБАВЛЕНО СЮДА
                className="text-[10px] font-black uppercase px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
              >
                Login
              </button>
            )}

            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-red-600'}`}
            >
              {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 3. МОБИЛЬНЫЙ БЛОК */}
        <div className="md:hidden flex items-center gap-3">
          {isLoggedIn && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-600/10 rounded-lg">
              <span className="text-xs font-black text-red-600">{credits}</span>
              <BoltIcon className="w-3 h-3 text-red-600" />
            </div>
          )}
          <button onClick={() => setDarkMode(!darkMode)} className={darkMode ? 'text-amber-400' : 'text-red-600'}>
            {darkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          </button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-red-600">
            {isMenuOpen ? <XMarkIcon className="w-8 h-8" /> : <Bars3Icon className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* 4. МОБИЛЬНОЕ МЕНЮ */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white dark:bg-slate-900"
          >
            <div className="flex flex-col p-4 space-y-3 pt-6">
              {menuItems.map(t => (
                <button 
                  key={t} 
                  onClick={() => { setActiveTab(t); setIsMenuOpen(false); }} 
                  className={`w-full text-left p-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                    activeTab === t ? 'bg-red-600 text-white shadow-xl' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {t}
                </button>
              ))}
              
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => { onLoginClick(); setIsMenuOpen(false); }} // <-- 3. И СЮДА ДЛЯ МОБИЛОК
                  className="w-full p-4 rounded-xl font-black uppercase text-[10px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center gap-2"
                >
                  <UserCircleIcon className="w-5 h-5" />
                  {isLoggedIn ? 'Account Settings' : 'Sign In / Register'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
