import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { NowItem } from '../data/site';
import { FlipWords } from './ui/flip-words';
import { SquigglyText } from './ui/squiggly-text';

const lastUpdateIso = typeof __LAST_UPDATE_ISO__ === 'string' ? __LAST_UPDATE_ISO__ : '';

const relativeUnits = [
  { maxSeconds: 60, seconds: 1, singular: 'sec', plural: 'sec', article: 'a' },
  { maxSeconds: 60 * 60, seconds: 60, singular: 'min', plural: 'min', article: 'a' },
  { maxSeconds: 60 * 60 * 24, seconds: 60 * 60, singular: 'hr', plural: 'hr', article: 'an' },
  { maxSeconds: 60 * 60 * 24 * 7, seconds: 60 * 60 * 24, singular: 'day', plural: 'days', article: 'a' },
  { maxSeconds: 60 * 60 * 24 * 30, seconds: 60 * 60 * 24 * 7, singular: 'week', plural: 'weeks', article: 'a' },
  { maxSeconds: 60 * 60 * 24 * 365, seconds: 60 * 60 * 24 * 30, singular: 'month', plural: 'months', article: 'a' },
  { maxSeconds: Number.POSITIVE_INFINITY, seconds: 60 * 60 * 24 * 365, singular: 'year', plural: 'years', article: 'a' },
] as const;

function formatRelativeLastUpdate(iso: string, now = Date.now()) {
  const updatedAt = Date.parse(iso);

  if (!Number.isFinite(updatedAt)) {
    return 'just now';
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - updatedAt) / 1000));

  if (elapsedSeconds < 1) {
    return 'just now';
  }

  const unit = relativeUnits.find((candidate) => elapsedSeconds < candidate.maxSeconds) ?? relativeUnits[relativeUnits.length - 1];
  const value = Math.max(1, Math.floor(elapsedSeconds / unit.seconds));

  if (value === 1) {
    return `${unit.article} ${unit.singular} ago`;
  }

  return `${value} ${unit.plural} ago`;
}

type NowSectionProps = {
  items: NowItem[];
  onSecretClick?: () => void;
};

export function NowSection({ items, onSecretClick }: NowSectionProps) {
  const [lastUpdateLabel, setLastUpdateLabel] = useState(() => formatRelativeLastUpdate(lastUpdateIso));

  useEffect(() => {
    const updateLabel = () => setLastUpdateLabel(formatRelativeLastUpdate(lastUpdateIso));
    updateLabel();

    const intervalId = window.setInterval(updateLabel, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.25 }}
      className="grid gap-3 sm:grid-cols-3"
      aria-label="Current archive updates"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-surface px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-sm sm:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-text">When was the last update?</h2>
          </div>
          <span className="rounded-full border border-border/45 bg-bg/45 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
            {lastUpdateLabel}
          </span>
        </div>
      </div>
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
