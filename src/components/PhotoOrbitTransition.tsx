import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';

type PhotoSlot = {
  id: string;
  src?: string;
  alt: string;
  angle: number;
  tilt: number;
  depth: number;
  mobileHidden?: boolean;
};

const photoSlots: PhotoSlot[] = [
  {
    id: 'photo-01',
    src: '/photo-gallery/photo-01.jpg',
    alt: 'Rocky coastline beside a bright blue ocean',
    angle: -158,
    tilt: -8,
    depth: 0.55,
  },
  {
    id: 'photo-02',
    src: '/photo-gallery/photo-02.jpg',
    alt: 'Yellow tent surrounded by misty mountains',
    angle: -88,
    tilt: 7,
    depth: 0.82,
  },
  {
    id: 'photo-03',
    src: '/photo-gallery/photo-03.jpg',
    alt: 'Small alpine village beneath the mountains',
    angle: -18,
    tilt: -4,
    depth: 1,
  },
  {
    id: 'photo-04',
    src: '/photo-gallery/photo-04.jpg',
    alt: 'Silhouette sitting at a train platform during sunset',
    angle: 54,
    tilt: 9,
    depth: 0.72,
    mobileHidden: true,
  },
  {
    id: 'photo-05',
    src: '/photo-gallery/photo-05.jpg',
    alt: 'Bicycle resting beneath a cloudy blue sky',
    angle: 126,
    tilt: -6,
    depth: 0.64,
    mobileHidden: true,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function orbitPoint(angle: number, progress: number, depth: number) {
  const scrollRotation = (progress - 0.5) * 118;
  const radians = ((angle + scrollRotation) * Math.PI) / 180;
  const exitSpread = clamp((progress - 0.68) / 0.32, 0, 1);

  return {
    xFactor: Math.cos(radians) * (0.78 + exitSpread * 0.1),
    yFactor: Math.sin(radians) * (0.74 + exitSpread * 0.1) + exitSpread * 0.12,
    scale: 0.88 + depth * 0.13 - exitSpread * 0.08,
    opacity: 0.62 + depth * 0.36 - exitSpread * 0.38,
    rotate: angle * 0.035 + scrollRotation * 0.08,
  };
}

function BlankPhotoFace({ slot }: { slot: PhotoSlot }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[0.18rem] [backface-visibility:hidden]">
      {slot.src ? (
        <img
          src={slot.src}
          alt={slot.alt}
          width="933"
          height="1400"
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="relative h-full w-full bg-[linear-gradient(145deg,color-mix(in_srgb,var(--color-accent)_34%,var(--color-bg)),color-mix(in_srgb,var(--color-surface)_82%,var(--color-muted)))]">
          <span className="absolute left-[16%] top-[18%] h-[42%] w-[48%] rounded-full bg-accent/12 blur-xl" />
          <span className="absolute bottom-[16%] right-[12%] h-px w-[44%] rotate-[-14deg] bg-warm-accent/35" />
          <span className="absolute bottom-[10%] left-[10%] h-1.5 w-1.5 rotate-45 border border-accent/35" />
        </div>
      )}
      <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-border/35" />
    </div>
  );
}

function PhotoBack() {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[0.18rem] bg-[color-mix(in_srgb,var(--color-surface)_88%,var(--color-bg))] [backface-visibility:hidden]"
      style={{ transform: 'rotateY(180deg)' }}
    >
      <span className="absolute inset-x-[14%] top-[24%] h-px bg-border/55" />
      <span className="absolute inset-x-[22%] top-[36%] h-px bg-border/35" />
      <span className="absolute inset-x-[18%] top-[48%] h-px bg-border/45" />
      <span className="absolute bottom-[18%] right-[14%] h-7 w-7 rotate-6 border border-dashed border-warm-accent/40" />
      <span className="absolute bottom-[12%] left-[14%] h-2 w-2 rotate-45 bg-accent/25" />
      <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-border/35" />
    </div>
  );
}

function OrbitPhoto({
  slot,
  progress,
  pointerX,
  pointerY,
  orbitWidth,
  orbitHeight,
  reducedMotion,
}: {
  slot: PhotoSlot;
  progress: MotionValue<number>;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  orbitWidth: MotionValue<number>;
  orbitHeight: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const x = useTransform([progress, pointerX, orbitWidth], ([rawProgress, rawPointerX, rawWidth]) => {
    const point = orbitPoint(slot.angle, reducedMotion ? 0.5 : Number(rawProgress), slot.depth);
    const width = Number(rawWidth);
    const cornerSafety = clamp(width * 0.2, 94, 126);
    const safeRadius = Math.max(0, width / 2 - cornerSafety);
    return point.xFactor * safeRadius + Number(rawPointerX) * slot.depth * Math.min(20, width * 0.025);
  });
  const y = useTransform([progress, pointerY, orbitHeight], ([rawProgress, rawPointerY, rawHeight]) => {
    const point = orbitPoint(slot.angle, reducedMotion ? 0.5 : Number(rawProgress), slot.depth);
    const height = Number(rawHeight);
    const cornerSafety = clamp(height * 0.22, 98, 132);
    const safeRadius = Math.max(0, height / 2 - cornerSafety);
    return point.yFactor * safeRadius + Number(rawPointerY) * slot.depth * Math.min(14, height * 0.025);
  });
  const scale = useTransform(progress, (value) => orbitPoint(slot.angle, reducedMotion ? 0.5 : value, slot.depth).scale);
  const opacity = useTransform(progress, (value) => orbitPoint(slot.angle, reducedMotion ? 0.5 : value, slot.depth).opacity);
  const rotate = useTransform(progress, (value) => slot.tilt + orbitPoint(slot.angle, reducedMotion ? 0.5 : value, slot.depth).rotate);

  return (
    <motion.button
      type="button"
      onClick={() => setFlipped((current) => !current)}
      className={`absolute left-1/2 top-1/2 aspect-[4/5] w-[clamp(6.2rem,11vw,8.5rem)] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-[0.22rem] bg-[#D9D1C1] p-[clamp(0.34rem,0.7vw,0.5rem)] pb-[clamp(0.7rem,1.4vw,1rem)] shadow-xl shadow-black/20 outline-none focus-visible:ring-2 focus-visible:ring-accent dark:bg-[#EEE5D5] ${slot.mobileHidden ? 'hidden sm:block' : ''}`}
      style={{ x, y, scale, rotate, opacity, zIndex: Math.round(slot.depth * 10) }}
      whileHover={reducedMotion ? undefined : { scale: 1.04 }}
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      aria-label={`${flipped ? 'Show front of' : 'Flip'} ${slot.alt}`}
      aria-pressed={flipped}
      data-photo-orbit-slot={slot.id}
    >
      <motion.span
        className="relative block h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }}
      >
        <BlankPhotoFace slot={slot} />
        <PhotoBack />
      </motion.span>
    </motion.button>
  );
}

export function PhotoOrbitTransition() {
  const sectionRef = useRef<HTMLElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const reducedMotion = Boolean(useReducedMotion());
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const orbitWidth = useMotionValue(0);
  const orbitHeight = useMotionValue(0);
  const smoothPointerX = useSpring(pointerX, { stiffness: 120, damping: 24, mass: 0.3 });
  const smoothPointerY = useSpring(pointerY, { stiffness: 120, damping: 24, mass: 0.3 });
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 95, damping: 26, mass: 0.25 });
  const orbitRotate = useTransform([smoothProgress, smoothPointerX], ([rawProgress, rawPointerX]) => (
    reducedMotion ? 0 : -7 + Number(rawProgress) * 14 + Number(rawPointerX) * 5
  ));
  const orbitScale = useTransform(smoothProgress, [0, 0.5, 1], reducedMotion ? [1, 1, 1] : [0.94, 1, 0.96]);

  useEffect(() => {
    const orbit = orbitRef.current;
    if (!orbit) return;

    const updateBounds = () => {
      orbitWidth.set(orbit.clientWidth);
      orbitHeight.set(orbit.clientHeight);
    };
    const observer = new ResizeObserver(updateBounds);
    observer.observe(orbit);
    updateBounds();

    return () => observer.disconnect();
  }, [orbitHeight, orbitWidth]);

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (reducedMotion || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(clamp((event.clientX - bounds.left) / bounds.width - 0.5, -0.5, 0.5));
    pointerY.set(clamp((event.clientY - bounds.top) / bounds.height - 0.5, -0.5, 0.5));
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <section
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      className="relative h-[62vh] min-h-[31rem] max-h-[44rem] w-full overflow-hidden"
      aria-label="Interactive personal photo carousel"
      data-photo-orbit
    >
      <motion.div
        ref={orbitRef}
        className="absolute inset-[4%_2%_8%] rounded-[50%]"
        style={{ rotate: orbitRotate, scale: orbitScale }}
      >
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-[44%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-dashed border-border/20 opacity-45 [mask-image:linear-gradient(to_right,transparent,black_28%,black_72%,transparent)]" />
        <span className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-warm-accent/25" />
        {photoSlots.map((slot) => (
          <OrbitPhoto
            key={slot.id}
            slot={slot}
            progress={smoothProgress}
            pointerX={smoothPointerX}
            pointerY={smoothPointerY}
            orbitWidth={orbitWidth}
            orbitHeight={orbitHeight}
            reducedMotion={reducedMotion}
          />
        ))}
      </motion.div>
    </section>
  );
}
