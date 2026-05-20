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
  revealDuration = 4.8,
}: TypewriterEffectSmoothProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('my-0 inline-flex h-[1.75em] items-center whitespace-nowrap leading-[1.35] align-baseline', className)}
    >
      <motion.div
        className="overflow-hidden whitespace-nowrap py-[0.34em] leading-[1.35]"
        initial={{ width: 0 }}
        animate={{ width: 'fit-content' }}
        transition={{
          duration: revealDuration,
          ease: 'linear',
        }}
      >
        <div className="flex items-center gap-1 whitespace-nowrap leading-[1.35]">
          {words.map((word, wordIndex) => (
            <span
              key={`${word.text}-${wordIndex}`}
              className={cn('inline-block whitespace-nowrap text-text leading-[1.35]', word.className)}
            >
              {word.text}
            </span>
          ))}
        </div>
      </motion.div>
      <motion.span
        className={cn('ml-2 h-8 w-[3px] shrink-0 rounded-full bg-accent md:h-10', cursorClassName)}
        initial={{ opacity: 0 }}
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
