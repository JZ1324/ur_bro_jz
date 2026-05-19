import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { animate } from 'motion';
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

      // Measure full text width and also per-character cumulative widths
      const fullW = Math.ceil(context.measureText(fullText).width);
      setTextWidth(fullW);
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

  // Compute the total time at which the last character finishes animating so
  // we can use it as a reference for cursor timing.
  const totalTextRevealTime = useMemo(() => {
    const base = 0.14; // matches per-character base delay above
    const perWord = 0.24; // spacing added per word index
    const charDur = 0.44; // per-character animation duration

    let maxLastCharDelay = 0;
    for (let wi = 0; wi < words.length; wi += 1) {
      const chars = words[wi].text.length || 0;
      const lastCharDelay = base + wi * perWord + Math.max(0, chars - 1) * characterDelay;
      if (lastCharDelay > maxLastCharDelay) maxLastCharDelay = lastCharDelay;
    }

    return maxLastCharDelay + charDur;
  }, [words, characterDelay]);

  // Motion value that drives the container width (in px). The cursor will be
  // derived from this so it always follows the visible reveal progress.
  const widthMV = useMotionValue(0);
  const cursorLeftMV = useTransform(widthMV, (v) => v + 8);

  useLayoutEffect(() => {
    const duration = Math.max(totalTextRevealTime, revealDuration);
    const controls = animate(widthMV, measuredWidth, { duration, easing: [0.33, 1, 0.68, 1] });
    return () => controls.cancel();
  }, [measuredWidth, revealDuration, totalTextRevealTime, widthMV]);
  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn('relative my-0 inline-block h-[1.75em] whitespace-nowrap leading-[1.35] align-baseline', className)}
      style={{ width: `${measuredWidth}px` }}
    >
      <motion.div
        className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center gap-1 overflow-hidden whitespace-nowrap py-[0.34em] leading-[1.35]"
        style={{ width: widthMV, zIndex: 0 }}
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
                  delay: 0.14 + wordIndex * 0.24 + charIndex * characterDelay,
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
        style={{ left: cursorLeftMV, zIndex: 10, pointerEvents: 'none' as const }}
        initial={{ left: 0, opacity: 0 }}
        animate={{ opacity: [0.35, 1, 0.35] }}
        transition={{
          opacity: {
            delay: 0.2,
            duration: 1.6,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      />
    </div>
  );
}
