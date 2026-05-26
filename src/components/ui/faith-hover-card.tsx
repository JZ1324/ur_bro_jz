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
  const [isNavigating, setIsNavigating] = React.useState(false);
  const suppressHoverUntilRef = React.useRef(0);

  React.useEffect(() => {
    const closeHover = () => setOpen(false);
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') closeHover();
    };

    window.addEventListener('blur', closeHover);
    window.addEventListener('pagehide', closeHover);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', closeHover);
      window.removeEventListener('pagehide', closeHover);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen && (isNavigating || Date.now() < suppressHoverUntilRef.current)) {
      return;
    }

    setOpen(nextOpen);
  };

  const handleOpenPage = () => {
    suppressHoverUntilRef.current = Date.now() + 700;
    setIsNavigating(true);
    setOpen(false);
    window.requestAnimationFrame(() => {
      onOpenPage?.();
      window.setTimeout(() => setIsNavigating(false), 250);
    });
  };

  return (
    <HoverCardPrimitive.Root open={isOpen} openDelay={140} closeDelay={90} onOpenChange={handleOpenChange}>
      <HoverCardPrimitive.Trigger asChild>
        <button
          type="button"
          onPointerDown={() => {
            suppressHoverUntilRef.current = Date.now() + 700;
          }}
          onClick={handleOpenPage}
          className={cn('inline-flex cursor-pointer text-left', className)}
        >
          {children}
        </button>
      </HoverCardPrimitive.Trigger>

      <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          side="top"
          align="center"
          sideOffset={8}
          className="z-[60] [transform-origin:var(--radix-hover-card-content-transform-origin)]"
        >
          <AnimatePresence>
            {isOpen && !isNavigating && (
              <motion.button
                type="button"
                onClick={handleOpenPage}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    duration: 0.2,
                    ease: [0.23, 1, 0.32, 1],
                  },
                }}
                exit={{ opacity: 0, y: 4, scale: 0.98, transition: { duration: 0.06 } }}
                className="group w-[min(15rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/60 bg-surface text-left shadow-2xl shadow-black/40 transition-[background-color,border-color,transform] duration-180 ease-out hover:border-accent/45 hover:bg-accent-soft active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-bg">
                  <video
                    src={faith.previewVideoSrc}
                    className="h-full w-full object-cover opacity-90 transition-transform duration-300 ease-out group-hover:scale-[1.015]"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-label={faith.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-warm-accent">Relationship</p>
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
