import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';

type DecodedTextProps = {
  text: string;
  className?: string;
  intervalMs?: number;
};

const SYMBOLS = ['#', '/', '0', '1', '?', '*', '+', '~'];

function makeSymbolFrame(length: number, offset: number) {
  return Array.from({ length }, (_, index) => SYMBOLS[(index + offset) % SYMBOLS.length]);
}

export function DecodedText({ text, className, intervalMs = 70 }: DecodedTextProps) {
  const reduceMotion = useReducedMotion();
  const characters = useMemo(() => Array.from(text), [text]);
  const [resolvedCount, setResolvedCount] = useState(reduceMotion ? characters.length : 0);
  const [symbolOffset, setSymbolOffset] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setResolvedCount(characters.length);
      return;
    }

    setResolvedCount(0);
    setSymbolOffset(0);

    const interval = window.setInterval(() => {
      setSymbolOffset((currentOffset) => currentOffset + 1);
      setResolvedCount((currentCount) => {
        if (currentCount >= characters.length) {
          window.clearInterval(interval);
          return currentCount;
        }

        return currentCount + 1;
      });
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [characters.length, intervalMs, reduceMotion, text]);

  if (reduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const fallbackSymbols = makeSymbolFrame(characters.length, symbolOffset);

  return (
    <span className={cn('inline-flex flex-wrap gap-[0.01em]', className)} aria-label={text}>
      {characters.map((character, index) => {
        const isResolved = index < resolvedCount;
        const displayCharacter = isResolved ? character : fallbackSymbols[index];

        return (
          <motion.span
            aria-hidden="true"
            key={`${text}-${index}`}
            initial={{ opacity: 0.45, y: 2 }}
            animate={{
              opacity: isResolved ? 1 : 0.45,
              y: isResolved ? 0 : 2,
              color: isResolved ? '#E49A78' : '#8E927F',
            }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(character === ' ' && 'w-[0.35em]')}
          >
            {character === ' ' ? '\u00a0' : displayCharacter}
          </motion.span>
        );
      })}
    </span>
  );
}
