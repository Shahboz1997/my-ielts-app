'use client';

import { motion } from 'framer-motion';

export default function TypingTitle({ text }) {
  if (!text) return null;

  const characters = text.split('');

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: 0.2 },
    },
  };

  const child = {
    visible: {
      opacity: 1,
      display: 'inline-block',
      transition: { duration: 0.01 },
    },
    hidden: {
      opacity: 0,
      display: 'inline-block',
    },
  };

  return (
    <motion.span variants={container} initial="hidden" animate="visible" className="inline-block">
      {characters.map((char, index) => (
        <motion.span key={`${char}-${index}`} variants={child}>
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
