import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

type SecretPuzzleOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SecretPuzzleOverlay({ isOpen, onClose }: SecretPuzzleOverlayProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    // prevent layout shift by compensating for scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isOpen]);
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] flex items-center justify-center overflow-y-auto bg-bg/90 p-4 backdrop-blur-2xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border/55 bg-surface shadow-2xl shadow-black/30"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full bg-accent-soft p-3 text-accent transition-colors hover:bg-accent/15 sm:right-6 sm:top-6"
              aria-label="Close puzzle"
            >
              <X size={22} />
            </button>

            <div className="flex min-h-[28rem] items-center justify-center p-6 sm:p-8">
              <div className="max-w-xl text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-warm-accent">
                  To the one I have a crush on:
                </p>
                <p className="mt-5 text-balance text-2xl font-semibold leading-relaxed text-text sm:text-[2rem] sm:leading-[1.35]">
                  You make quiet moments feel alive,
                  <br />
                  like <SunlightSparkles /> finding a window at the right time.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// SunlightSparkles: renders the word "sunlight" with animated PNG images
function SunlightSparkles({
  imageUrls = ['/sunshine.png'],
  count = 8,
}: {
  imageUrls?: string[];
  count?: number;
}) {
  type Particle = {
    id: string;
    x: string;
    y: string;
    delay: number;
    scale: number;
    rotate: number;
    duration: number;
    repeatDelay: number;
    src: string;
  };

  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
      const gen = (): Particle => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const x = `${10 + Math.random() * 80}%`;
      const y = `${5 + Math.random() * 70}%`;
      const delay = Math.random() * 3.5;
      const scale = 0.6 + Math.random() * 0.9;
      const rotate = -15 + Math.random() * 30;
      const duration = 1.0 + Math.random() * 0.8; // shorter visible time
      const repeatDelay = 6 + Math.random() * 6; // less frequent
      const src = imageUrls[Math.floor(Math.random() * imageUrls.length)];
      return { id, x, y, delay, scale, rotate, duration, repeatDelay, src };
    };

    const initial = Array.from({ length: count }).map(() => gen());
    setParticles(initial);

    const interval = setInterval(() => {
      setParticles((curr) => curr.map((p) => ({ ...p, delay: Math.random() * 3.5 })));
    }, 8000);

    return () => clearInterval(interval);
    // Intentionally only depend on `count` so callers can pass `imageUrls` inline
    // without causing the effect to re-run on every render.
  }, [count]);

  return (
    <span className="relative inline-block align-baseline overflow-visible" style={{ fontSize: 'inherit', lineHeight: 'inherit' }}>
      <span className="relative z-10 select-text font-semibold" style={{ fontSize: 'inherit', lineHeight: 'inherit' }}>sunlight</span>
      {particles.map((p) => (
        <motion.img
          key={p.id}
          src={p.src.startsWith('/') ? p.src : `/${p.src}`}
          alt="spark"
          className="pointer-events-none absolute z-[30]"
          style={{ left: p.x, top: p.y, width: '1.3em', height: '1.3em', transform: 'translate(-50%, -50%)' }}
          initial={{ opacity: 0, scale: 0.45, rotate: p.rotate }}
          animate={{ opacity: [0, 0.9, 0], scale: [0.45, p.scale, 0.45], y: [0, -8, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, repeat: Infinity, repeatDelay: p.repeatDelay ?? 6, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}
