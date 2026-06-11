import { motion } from 'motion/react';
import type { NowItem } from '../data/site';
import { FlipWords } from './ui/flip-words';
import { SquigglyText } from './ui/squiggly-text';

type NowSectionProps = {
  items: NowItem[];
  onSecretClick?: () => void;
};

export function NowSection({ items, onSecretClick }: NowSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.25 }}
      className="grid gap-3 sm:grid-cols-3"
      aria-label="Current archive updates"
    >
      {items.map((item, index) => (
        <article
          key={item.label}
          className="archive-note-card group relative overflow-hidden rounded-2xl border border-border/50 bg-surface/80 p-4 pt-5 shadow-lg shadow-black/10 transition-[transform,border-color,background-color] duration-180 ease-out hover:-translate-y-0.5 hover:border-accent/30 hover:bg-surface active:scale-[0.99] sm:p-4 sm:pt-5"
        >
          <span className="archive-note-tab" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-warm-accent">{item.label}</p>
            <span className="h-px flex-1 bg-linear-to-r from-warm-accent/30 to-transparent" />
          </div>
          <h2 className="mt-2 text-[15px] font-bold leading-tight text-text">{item.title}</h2>
          {item.label === 'Music' ? (
            <p className="mt-2 text-[13px] leading-6 text-muted">
              This song is staying here for a reason. Maybe it is about{' '}
              <button
                type="button"
                onClick={onSecretClick}
                className="inline rounded-sm text-left font-semibold text-warm-accent outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-warm-accent/50"
                aria-label="Open classified name puzzle"
              >
                <SquigglyText stepDuration={320} scale={[2, 4]} className="font-semibold text-warm-accent">
                  <FlipWords words={['someone?', 'a crush?', 'her?']} duration={6200} transitionDuration={0.95} />
                </SquigglyText>
              </button>
            </p>
          ) : (
            <p className="mt-2 text-[13px] leading-6 text-muted">{item.body}</p>
          )}
        </article>
      ))}
    </motion.section>
  );
}
