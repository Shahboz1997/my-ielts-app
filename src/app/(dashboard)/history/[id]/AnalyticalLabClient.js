'use client';

import { useState, useCallback } from 'react';
import AnalyticalLabLazy from '@/components/lazy/AnalyticalLabLazy';

/**
 * Client wrapper that owns editable content state and provides handleReplaceWord
 * so AnalyticalLab can apply corrections to the displayed text.
 */
export default function AnalyticalLabClient({ check }) {
  const [userText, setUserText] = useState(check?.content ?? '');

  const handleReplaceWord = useCallback((original, fixed, occurrenceIndex = 1, correctionIdx) => {
    setUserText((prevText) => {
      if (!prevText || original == null || original === '') return prevText;
      let count = 0;
      const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const regex = new RegExp(escaped, 'g');
      return prevText.replace(regex, (match) => {
        count++;
        return count === (occurrenceIndex || 1) ? fixed : match;
      });
    });
  }, []);

  return (
    <AnalyticalLabLazy
      check={check}
      userText={userText}
      setUserText={setUserText}
      handleReplaceWord={handleReplaceWord}
    />
  );
}
