import { useEffect, useState } from 'react';

export function useWriterScrollUi() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleScrollToTop = () => {
    const audio = new Audio('https://assets.mixkit.co');
    audio.volume = 0.15;
    audio.play().catch(() => {});

    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(15);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { showScrollTop, scrollProgress, handleScrollToTop };
}
