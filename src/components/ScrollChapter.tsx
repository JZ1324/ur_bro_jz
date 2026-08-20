import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  type MotionValue,
} from 'motion/react';
import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { clampProgress, type ScrollChapterId } from './scrollJourney';

export type ScrollChapterState = {
  progress: MotionValue<number>;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  reducedMotion: boolean;
};

type ScrollChapterProps = {
  id: ScrollChapterId;
  desktopVh: number;
  mobileVh: number;
  children: (state: ScrollChapterState) => ReactNode;
  onActiveChange?: (id: ScrollChapterId, active: boolean) => void;
  className?: string;
  stickyClassName?: string;
  ariaLabel?: string;
  performanceReduced?: boolean;
  sharedPointerX?: MotionValue<number>;
  sharedPointerY?: MotionValue<number>;
};

export function ScrollChapter({
  id,
  desktopVh,
  mobileVh,
  children,
  onActiveChange,
  className = '',
  stickyClassName = '',
  ariaLabel,
  performanceReduced = false,
  sharedPointerX,
  sharedPointerY,
}: ScrollChapterProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothPointerX = useSpring(pointerX, { stiffness: 110, damping: 28, mass: 0.4 });
  const smoothPointerY = useSpring(pointerY, { stiffness: 110, damping: 28, mass: 0.4 });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 30,
    mass: 0.3,
    restDelta: 0.0001,
  });

  useEffect(() => {
    if (!performanceReduced) return;
    pointerX.set(0);
    pointerY.set(0);
    sharedPointerX?.set(0);
    sharedPointerY?.set(0);
  }, [performanceReduced, pointerX, pointerY, sharedPointerX, sharedPointerY]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !onActiveChange || reducedMotion) {
      onActiveChange?.(id, false);
      return;
    }

    let wasActive = false;
    const updateActiveState = () => {
      const bounds = section.getBoundingClientRect();
      const isActive = bounds.top <= 1 && bounds.bottom >= window.innerHeight - 1;
      if (isActive === wasActive) return;
      wasActive = isActive;
      onActiveChange(id, isActive);
    };

    updateActiveState();
    const unsubscribe = scrollYProgress.on('change', updateActiveState);
    window.addEventListener('resize', updateActiveState);
    return () => {
      unsubscribe();
      window.removeEventListener('resize', updateActiveState);
      onActiveChange(id, false);
    };
  }, [id, onActiveChange, reducedMotion, scrollYProgress]);

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (performanceReduced || reducedMotion || event.pointerType === 'touch' || !window.matchMedia('(pointer: fine)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const nextX = clampProgress((event.clientX - bounds.left) / bounds.width) - 0.5;
    const nextY = clampProgress((event.clientY - bounds.top) / bounds.height) - 0.5;
    pointerX.set(nextX);
    pointerY.set(nextY);
    sharedPointerX?.set(nextX);
    sharedPointerY?.set(nextY);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
    sharedPointerX?.set(0);
    sharedPointerY?.set(0);
  };

  return (
    <section
      ref={sectionRef}
      className={`scroll-chapter ${className}`}
      style={{
        '--chapter-desktop-height': `${desktopVh}vh`,
        '--chapter-mobile-height': `${mobileVh}vh`,
      } as CSSProperties}
      data-scroll-chapter={id}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      data-performance-reduced={performanceReduced ? 'true' : 'false'}
      aria-label={ariaLabel}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <motion.div className={`scroll-chapter-sticky ${stickyClassName}`}>
        {children({
          progress: smoothProgress,
          pointerX: smoothPointerX,
          pointerY: smoothPointerY,
          reducedMotion,
        })}
      </motion.div>
    </section>
  );
}
