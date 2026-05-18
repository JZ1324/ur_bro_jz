import { motion } from 'motion/react';
import type { NowItem } from '../data/site';
import { FlipWords } from './ui/flip-words';
import { SquigglyText } from './ui/squiggly-text';

type NowSectionProps = {
  items: NowItem[];
};

export function NowSection({ items }: NowSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.25 }}
      className="grid gap-3 sm:grid-cols-3"
      aria-label="Current archive updates"
    >
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-border/50 bg-surface/80 p-4 shadow-lg shadow-black/10 sm:p-4"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-warm-accent">{item.label}</p>
          <h2 className="mt-2 text-[15px] font-bold leading-tight text-text">{item.title}</h2>
          {item.label === 'Music' ? (
            <p className="mt-2 text-[13px] leading-6 text-muted">
              This song is staying here for a reason. Maybe it is about{' '}
              <SquigglyText stepDuration={180} scale={[3, 5]} className="font-semibold text-warm-accent">
                <FlipWords words={['someone?', 'a crush?', 'her?']} duration={3400} />
              </SquigglyText>
            </p>
          ) : (
            <p className="mt-2 text-[13px] leading-6 text-muted">{item.body}</p>
          )}
        </article>
      ))}
    </motion.section>
  );
}
