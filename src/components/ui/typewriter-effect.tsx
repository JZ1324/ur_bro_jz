import { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

type TypewriterWord = {
  text: string;
  className?: string;
};

type TypewriterEffectSmoothProps = {
  words: TypewriterWord[];
  className?: string;
  cursorClassName?: string;
  characterDelay?: number;
  revealDuration?: number;
};

export function TypewriterEffectSmooth({
  words,
  className,
  cursorClassName,
  characterDelay = 0.11,
  revealDuration = 2.4,
}: TypewriterEffectSmoothProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [textWidth, setTextWidth] = useState<number | null>(null);
  const fullText = words.map((word) => word.text).join(' ');

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let isMounted = true;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const measure = () => {
      if (!context || !isMounted) return;

      const style = window.getComputedStyle(element);
      context.font = [
        style.fontStyle,
        style.fontVariant,
        style.fontWeight,
        style.fontSize,
        style.fontFamily,
      ].join(' ');

      setTextWidth(Math.ceil(context.measureText(fullText).width));
    };

    measure();
    void document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', measure);
    };
  }, [fullText]);

  const measuredWidth = textWidth ?? Math.max(fullText.length, 1) * 18;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn('relative my-0 inline-block h-[1.75em] whitespace-nowrap leading-[1.35] align-baseline', className)}
      style={{ width: `${measuredWidth}px` }}
    >
      <motion.div
        className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center gap-1 overflow-hidden whitespace-nowrap py-[0.34em] leading-[1.35]"
        initial={{ width: 0 }}
        animate={{ width: measuredWidth }}
        transition={{ duration: revealDuration, ease: [0.33, 1, 0.68, 1] }}
      >
        {words.map((word, wordIndex) => (
          <span key={`${word.text}-${wordIndex}`} className="inline-flex whitespace-nowrap leading-[1.35]">
            {word.text.split('').map((char, charIndex) => (
              <motion.span
                key={`${word.text}-${char}-${charIndex}`}
                className={cn('text-text leading-[1.35]', word.className)}
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  delay: 0.08 + wordIndex * 0.2 + charIndex * characterDelay,
                  duration: 0.44,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {char}
              </motion.span>
            ))}
          </span>
        ))}
      </motion.div>
      <motion.span
        className={cn('absolute top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full bg-accent md:h-10', cursorClassName)}
        initial={{ left: 0, opacity: 0 }}
        animate={{ left: measuredWidth + 6, opacity: [0.35, 1, 0.35] }}
        transition={{
          left: { duration: revealDuration, ease: [0.33, 1, 0.68, 1] },
          opacity: {
            delay: 0.2,
            duration: 0.9,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      />
    </div>
  );
}
