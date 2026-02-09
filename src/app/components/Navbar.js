import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  FireIcon, SunIcon, MoonIcon, Bars3Icon, XMarkIcon, 
  BoltIcon, CreditCardIcon, ShieldCheckIcon 
} from '@heroicons/react/24/outline';

const stripePromise = loadStripe('pk_test_your_public_key_here');

// --- ФОРМА ОПЛАТЫ STRIPE ---
const CheckoutForm = ({ plan, darkMode, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card', card: cardElement,
    });

    if (error) {
      setError(error.message);
      setProcessing(false);
    } else {
      alert(`Success! ${plan.name} activated.`);
      setProcessing(false);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <CardElement options={{
          style: {
            base: { fontSize: '16px', color: darkMode ? '#fff' : '#000', '::placeholder': { color: '#64748b' } },
          },
        }} />
      </div>
      {error && <div className="text-red-500 text-[10px] font-black uppercase text-center">{error}</div>}
      <button disabled={processing} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95">
        {processing ? 'Processing...' : plan.price === '3.99$' ? 'Start 3-Day Free Trial' : `Pay ${plan?.price} Now`}
      </button>
    </form>
  );
};

// --- ОСНОВНОЙ NAVBAR ---
const Navbar = ({ 
  activeTab, setActiveTab, darkMode, setDarkMode, 
  isMenuOpen, setIsMenuOpen, onLoginClick, 
  isLoggedIn = false, credits = 0         
}) => {
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const menuItems = ['Topics', 'Task 1', 'Task 2', 'Archive'];
  
  // ОБЪЕДИНЕННЫЕ УСЛОВИЯ: 3 дня бесплатно -> 3.99$ за 5 дней
  const plans = [
    { name: 'Trial', price: '3.99$', desc: '3 Days FREE, then 3.99$ per 5 days' },
    { name: 'Monthly', price: '14.99$', desc: 'Full access for 30 days' },
    { name: 'Yearly', price: '39.99$', desc: 'Best value - Save 70% yearly' },
  ];

  return (
    <>
      <nav className={`sticky top-0 z-50 p-4 border-b backdrop-blur-md transition-colors duration-300 ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* ЛОГОТИП (Всегда виден) */}
          <div className="flex items-center gap-2 text-2xl font-black italic cursor-pointer" onClick={() => setActiveTab('Topics')}>
            <FireIcon className="w-8 h-8 text-red-600 shrink-0" /> 
            <span className={`${darkMode ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>
              BAND<span className="text-red-600">BOOSTER</span>
            </span>
          </div>

          {/* ДЕСКТОПНОЕ МЕНЮ (Скрыто на мобилках) */}
          <div className="hidden md:flex items-center gap-6">
            <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              {menuItems.map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-red-500'}`}>{t}</button>
              ))}
            </div>

            <div className="flex items-center gap-4 border-l pl-6 border-slate-700/30">
              <div className="relative">
                <button onClick={() => setIsPricingOpen(!isPricingOpen)} className="flex items-center gap-2 px-3 py-2 text-amber-500 text-[10px] font-black uppercase hover:bg-amber-500/10 rounded-xl transition-all">
                  <CreditCardIcon className="w-4 h-4" /> Pricing
                </button>
                <AnimatePresence>
                  {isPricingOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute right-0 mt-3 w-64 p-4 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                       {plans.map(p => (
                          <div key={p.name} onClick={() => { setSelectedPlan(p); setIsPricingOpen(false); }} className="p-3 mb-1 rounded-xl cursor-pointer hover:bg-red-600 hover:text-white group transition-all">
                             <div className="flex justify-between font-black text-[10px] uppercase"><span>{p.name}</span><span className="text-red-600 group-hover:text-white">{p.price}</span></div>
                             <div className="text-[8px] opacity-60 group-hover:opacity-100 tracking-tighter">{p.desc}</div>
                          </div>
                       ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {isLoggedIn ? (
                <div className="flex items-center gap-1 font-black text-xs text-red-600">
                  {credits} <BoltIcon className="w-3 h-3" />
                </div>
              ) : (
                <button onClick={onLoginClick} className="text-[10px] font-black uppercase px-4 py-2 bg-red-600 text-white rounded-xl">Login</button>
              )}

              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                {darkMode ? <SunIcon className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5 text-red-600" />}
              </button>
            </div>
          </div>

          {/* КНОПКА БУРГЕРА (Только мобильные) */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-red-600 p-2 transition-transform active:scale-90">
              {isMenuOpen ? <XMarkIcon className="w-8 h-8" /> : <Bars3Icon className="w-8 h-8" />}
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
                  {menuItems.map(t => (
                    <button key={t} onClick={() => { setActiveTab(t); setIsMenuOpen(false); }} className={`p-4 rounded-xl font-black uppercase text-[10px] text-center ${activeTab === t ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{t}</button>
                  ))}
                </div>

                {/* 2. Блок Pricing внутри бургера */}
                <div className={`p-4 rounded-2xl border ${darkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}>
                  <h4 className="text-[10px] font-black uppercase text-amber-500 mb-3 flex items-center gap-2 tracking-widest"><CreditCardIcon className="w-4 h-4" /> Subscription Plans</h4>
                  <div className="space-y-2">
                    {plans.map(p => (
                      <button key={p.name} onClick={() => { setSelectedPlan(p); setIsMenuOpen(false); }} className="w-full flex justify-between items-center p-4 rounded-xl bg-white dark:bg-slate-900 border dark:border-slate-700 shadow-sm active:scale-[0.98] transition-transform">
                        <div className="text-left leading-tight">
                          <div className="text-[10px] font-black uppercase dark:text-white">{p.name}</div>
                          <div className="text-[8px] text-slate-500 font-bold uppercase">{p.desc}</div>
                        </div>
                        <div className="text-red-600 font-black text-xs">{p.price}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Утилиты (Тема и Логин) */}
                <div className="flex gap-2">
                   <button onClick={() => setDarkMode(!darkMode)} className="flex-1 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center gap-3 font-black uppercase text-[10px] dark:text-white transition-colors">
                      {darkMode ? <><SunIcon className="w-5 h-5 text-amber-400" /> Day</> : <><MoonIcon className="w-5 h-5 text-red-600" /> Night</>}
                   </button>
                   {!isLoggedIn && (
                     <button onClick={onLoginClick} className="flex-1 p-4 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg shadow-red-600/20">Login</button>
                   )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* STRIPE PAYMENT MODAL */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPlan(null)} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className={`relative w-full max-w-md p-8 rounded-[32px] shadow-2xl ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-900'}`}>
              <div className="flex justify-between items-center mb-8">
                <div className="italic font-black uppercase text-2xl tracking-tighter">
                  <h3>{selectedPlan.price === '0$' ? 'Start Trial' : 'Checkout'}</h3>
                </div>
                <button onClick={() => setSelectedPlan(null)} className="p-2 hover:bg-red-500/10 rounded-full transition-colors"><XMarkIcon className="w-6 h-6" /></button>
              </div>

              <div className={`mb-8 p-5 rounded-2xl border-2 border-dashed ${darkMode ? 'border-slate-700 bg-slate-800/40' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-black text-xs uppercase text-slate-500">{selectedPlan.name} Plan</span>
                  <span className="text-2xl font-black text-red-600">{selectedPlan.price}</span>
                </div>
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-tight">{selectedPlan.desc}</p>
              </div>

              <Elements stripe={stripePromise}>
                <CheckoutForm plan={selectedPlan} darkMode={darkMode} onClose={() => setSelectedPlan(null)} />
              </Elements>

              <div className="mt-8 flex justify-center items-center gap-2 text-[9px] font-black uppercase text-slate-500 opacity-50 italic">
                <ShieldCheckIcon className="w-4 h-4" /> 256-bit Encrypted Secure Payment
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
