import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { encode } from 'qss';
import React from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils';

type LinkPreviewProps = {
  children: React.ReactNode;
  url: string;
  className?: string;
  previewTitle?: string;
  previewDescription?: string;
  width?: number;
  height?: number;
  quality?: number;
} & (
  | { isStatic: true; imageSrc: string }
  | { isStatic?: false; imageSrc?: never }
);

export function LinkPreview({
  children,
  url,
  className,
  previewTitle,
  previewDescription,
  width = 240,
  height = 150,
  quality = 50,
  isStatic = false,
  imageSrc = '',
}: LinkPreviewProps) {
  const src = isStatic
    ? imageSrc
    : `https://api.microlink.io/?${encode({
        url,
        screenshot: true,
        meta: false,
        embed: 'screenshot.url',
        colorScheme: 'dark',
        'viewport.isMobile': false,
        'viewport.deviceScaleFactor': 1,
        'viewport.width': width * 3,
        'viewport.height': height * 3,
      })}`;

  const [isOpen, setOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const x = useMotionValue(0);
  const translateX = useSpring(x, { stiffness: 100, damping: 15 });

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMouseMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const targetRect = event.currentTarget.getBoundingClientRect();
    const eventOffsetX = event.clientX - targetRect.left;
    x.set((eventOffsetX - targetRect.width / 2) / 2);
  };

  return (
    <>
      {isMounted ? (
        <div className="hidden">
          <img src={src} width={width} height={height} alt="" aria-hidden="true" />
        </div>
      ) : null}

      <HoverCardPrimitive.Root openDelay={80} closeDelay={120} onOpenChange={setOpen}>
        <HoverCardPrimitive.Trigger asChild>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onMouseMove={handleMouseMove}
            className={cn('inline-flex', className)}
          >
            {children}
          </a>
        </HoverCardPrimitive.Trigger>

        <HoverCardPrimitive.Portal>
          <HoverCardPrimitive.Content
            className="z-[80] [transform-origin:var(--radix-hover-card-content-transform-origin)]"
            side="top"
            align="center"
            sideOffset={12}
          >
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.82 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: {
                      type: 'spring',
                      stiffness: 260,
                      damping: 20,
                    },
                  }}
                  exit={{ opacity: 0, y: 14, scale: 0.86 }}
                  className="w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-border/60 bg-surface p-1 shadow-2xl shadow-black/40"
                  style={{ x: translateX }}
                >
                  <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl bg-bg">
                    <img
                      src={src}
                      width={width}
                      height={height}
                      loading="eager"
                      decoding="async"
                      className="w-full rounded-t-xl object-cover"
                      style={{ height }}
                      alt={`Preview of ${url}`}
                    />
                    {(previewTitle || previewDescription) && (
                      <span className="flex flex-col gap-1 p-4 text-left">
                        {previewTitle && <span className="text-sm font-bold leading-tight text-text">{previewTitle}</span>}
                        {previewDescription && <span className="text-xs leading-relaxed text-muted">{previewDescription}</span>}
                      </span>
                    )}
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </HoverCardPrimitive.Content>
        </HoverCardPrimitive.Portal>
      </HoverCardPrimitive.Root>
    </>
  );
}
