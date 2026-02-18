import React, { createContext, useContext, useState } from 'react';

const BillingContext = createContext();

export const BillingProvider = ({ children }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const plans = [
    { id: 'trial_paid', name: 'Paid Trial', price: '3.99$', desc: 'Full access for 5 days' },
    { id: 'monthly', name: 'Monthly', price: '14.99$', desc: 'Best for students' },
    { id: 'yearly', name: 'Yearly', price: '39$', desc: 'Save 70% per year' },
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
