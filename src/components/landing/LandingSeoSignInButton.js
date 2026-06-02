'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import AuthModal from '@/components/AuthModal';

export default function LandingSeoSignInButton({ className = '' }) {
  const router = useRouter();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsAuthOpen(true)} className={className}>
        Sign in
      </button>
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
            onLoginSuccess={() => {
              setIsAuthOpen(false);
              router.replace('/?app=1');
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
