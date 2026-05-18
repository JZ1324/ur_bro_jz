import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { FaithHover } from '../../data/site';
import { cn } from '../../lib/utils';

type FaithHoverCardProps = {
  children: React.ReactNode;
  faith: FaithHover;
  className?: string;
  onOpenPage?: () => void;
};

export function FaithHoverCard({ children, faith, className, onOpenPage }: FaithHoverCardProps) {
  const [isOpen, setOpen] = React.useState(false);

  const handleOpenPage = () => {
    setOpen(false);
    window.requestAnimationFrame(() => {
      onOpenPage?.();
    });
  };

  return (
    <HoverCardPrimitive.Root open={isOpen} openDelay={80} closeDelay={140} onOpenChange={setOpen}>
      <HoverCardPrimitive.Trigger asChild>
        <button type="button" onClick={handleOpenPage} className={cn('inline-flex cursor-pointer text-left', className)}>
          {children}
        </button>
      </HoverCardPrimitive.Trigger>

      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          side="top"
          align="center"
          sideOffset={8}
          className="z-[80] [transform-origin:var(--radix-hover-card-content-transform-origin)]"
        >
          <AnimatePresence>
            {isOpen && (
              <motion.button
                type="button"
                onClick={handleOpenPage}
                initial={{ opacity: 0, y: 16, scale: 0.88 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: 'spring',
                    stiffness: 260,
                    damping: 22,
                  },
                }}
                exit={{ opacity: 0, y: 12, scale: 0.9 }}
                className="group w-[min(15rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/60 bg-surface text-left shadow-2xl shadow-black/40 transition-colors hover:border-accent/45 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-bg">
                  <video
                    src={faith.previewVideoSrc}
                    className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.03]"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label={faith.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-warm-accent">Following</p>
                    <h3 className="mt-1 text-sm font-bold leading-tight text-text">{faith.title}</h3>
                    <span className="mt-1 inline-block text-[11px] font-bold text-accent">Read why</span>
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </HoverCardPrimitive.Content>
      </HoverCardPrimitive.Portal>
    </HoverCardPrimitive.Root>
  );
}
