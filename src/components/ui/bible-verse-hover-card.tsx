import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { BibleVersePreview } from '../../data/site';
import { cn } from '../../lib/utils';

type BibleVerseHoverCardProps = {
  children: React.ReactNode;
  verse: BibleVersePreview;
  className?: string;
};

type BibleVersePreviewPanelProps = {
  verse: BibleVersePreview;
};

export function BibleVersePreviewPanel({ verse }: BibleVersePreviewPanelProps) {
  return (
    <div
      data-verse-preview-panel="true"
      className="w-[min(14.75rem,calc(100vw-1rem))] max-h-[var(--radix-hover-card-content-available-height)] overflow-y-auto overscroll-contain rounded-[0.72rem] border border-border/45 bg-surface/96 px-[0.65rem] py-[0.58rem] text-left shadow-lg shadow-black/25 backdrop-blur-md"
    >
      <p data-verse-preview-text="true" className="break-words text-[8.65px] leading-[1.34] text-text/95">
        {verse.verses.map((item) => (
          <React.Fragment key={item.verse}>
            <sup data-verse-preview-verse="true" className="ml-1 mr-0.5 align-super text-[0.68em] font-bold leading-none text-warm-accent first:ml-0">{item.verse}</sup>
            <span>{item.text}</span>
          </React.Fragment>
        ))}
      </p>
    </div>
  );
}

export function BibleVerseHoverCard({ children, verse, className }: BibleVerseHoverCardProps) {
  const [isOpen, setOpen] = React.useState(false);

  return (
    <HoverCardPrimitive.Root open={isOpen} openDelay={120} closeDelay={110} onOpenChange={setOpen}>
      <HoverCardPrimitive.Trigger asChild>
        <button
          type="button"
          data-verse-preview-trigger="true"
          aria-label={`Preview Bible verse ${verse.reference}`}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          onMouseEnter={() => setOpen(true)}
          onPointerEnter={() => setOpen(true)}
          className={cn('inline-flex cursor-help text-left', className)}
        >
          {children}
        </button>
      </HoverCardPrimitive.Trigger>

      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          side="top"
          align="center"
          sideOffset={8}
          collisionPadding={12}
          className="z-[60] [transform-origin:var(--radix-hover-card-content-transform-origin)]"
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.96 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    duration: 0.2,
                    ease: [0.23, 1, 0.32, 1],
                  },
                }}
                exit={{ opacity: 0, y: 2, scale: 0.98, transition: { duration: 0.06 } }}
              >
                <BibleVersePreviewPanel verse={verse} />
              </motion.div>
            )}
          </AnimatePresence>
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  );
}
