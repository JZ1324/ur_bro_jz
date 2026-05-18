import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

type FlipWordsProps = {
  words: string[];
  duration?: number;
  transitionDuration?: number;
  className?: string;
};

export function FlipWords({ words, duration = 1800, transitionDuration = 0.35, className }: FlipWordsProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % words.length);
    }, duration);

    return () => window.clearInterval(timer);
  }, [duration, words.length]);

  if (words.length === 0) return null;

  return (
    <span className={cn('relative inline-flex min-w-[4.8rem] align-baseline', className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -6, filter: 'blur(4px)' }}
          transition={{ duration: transitionDuration, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block whitespace-nowrap"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
