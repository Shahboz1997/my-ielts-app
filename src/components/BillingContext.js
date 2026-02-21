import React, { createContext, useContext, useState } from 'react';

const BillingContext = createContext();

export const BillingProvider = ({ children }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const plans = [
    { id: 'credits_small', name: '5 Reviews', price: '4$', desc: 'Perfect for a quick check' },
    { id: 'weekly', name: '7 Days Unlimited', price: '12$', desc: 'Best for last-minute prep', popular: true },
    { id: 'monthly', name: '30 Days Pro', price: '30$', desc: 'Master every criteria' },
  ];

  const openPricing = () => setIsPricingOpen(true);
  const closePricing = () => setIsPricingOpen(false);

  return (
    <BillingContext.Provider value={{ 
      selectedPlan, setSelectedPlan, 
      isPricingOpen, setIsPricingOpen, 
      plans, openPricing, closePricing 
    }}>
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => useContext(BillingContext);
