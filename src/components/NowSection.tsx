import { motion } from 'motion/react';
import type { NowItem } from '../data/site';

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
          className="rounded-2xl border border-border/50 bg-surface/80 p-4 shadow-lg shadow-black/10"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-accent">{item.label}</p>
          <h2 className="mt-2 text-base font-bold leading-snug text-text">{item.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
        </article>
      ))}
    </motion.section>
  );
}
