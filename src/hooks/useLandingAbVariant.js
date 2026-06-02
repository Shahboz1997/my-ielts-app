'use client';

import { useEffect, useState } from 'react';
import {
  LANDING_AB_DEFAULT,
  LANDING_AB_STORAGE_KEY,
  getLandingAbCopy,
  pickLandingAbVariant,
} from '@/lib/landingAbVariants';

/**
 * Stable A/B assignment for landing CTAs (localStorage, client-only).
 * SEO HTML keeps the default variant; interactive pages use this hook.
 */
export function useLandingAbVariant() {
  const [variantId, setVariantId] = useState(LANDING_AB_DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANDING_AB_STORAGE_KEY);
      if (stored === 'a' || stored === 'b') {
        setVariantId(stored);
      } else {
        const next = pickLandingAbVariant();
        window.localStorage.setItem(LANDING_AB_STORAGE_KEY, next);
        setVariantId(next);
      }
    } catch {
      setVariantId(LANDING_AB_DEFAULT);
    } finally {
      setReady(true);
    }
  }, []);

  return {
    ready,
    variantId,
    copy: getLandingAbCopy(variantId),
  };
}
