import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { mapChapterProgress } from './scrollJourney';

type PhotoSlot = {
  id: string;
  src?: string;
  alt: string;
  angle: number;
  tilt: number;
  depth: number;
  stamps: string[];
  stampTilt: number;
  note: string;
};

const photoSlots: PhotoSlot[] = [
  {
    id: 'photo-01',
    src: '/photo-gallery/photo-01.jpg',
    alt: 'Rocky coastline beside a bright blue ocean',
    angle: -158,
    tilt: -8,
    depth: 0.55,
    stamps: ['/photo-gallery/stamps/stamp-01.png'],
    stampTilt: -4,
    note: 'bike ride to the beach',
  },
  {
    id: 'photo-02',
    src: '/photo-gallery/photo-02.jpg',
    alt: 'Yellow tent surrounded by misty mountains',
    angle: -88,
    tilt: 7,
    depth: 0.82,
    stamps: ['/photo-gallery/stamps/stamp-02.png'],
    stampTilt: 3,
    note: 'camp photo',
  },
  {
    id: 'photo-03',
    src: '/photo-gallery/photo-03.jpg',
    alt: 'Small alpine village beneath the mountains',
    angle: -18,
    tilt: -4,
    depth: 1,
    stamps: ['/photo-gallery/stamps/stamp-03.png', '/photo-gallery/stamps/stamp-06.png'],
    stampTilt: -3,
    note: 'camp photo',
  },
  {
    id: 'photo-04',
    src: '/photo-gallery/photo-04.jpg',
    alt: 'Silhouette sitting at a train platform during sunset',
    angle: 54,
    tilt: 9,
    depth: 0.72,
    stamps: ['/photo-gallery/stamps/stamp-04.png'],
    stampTilt: 4,
    note: 'photo shoot',
  },
  {
    id: 'photo-05',
    src: '/photo-gallery/photo-05.jpg',
    alt: 'Bicycle resting beneath a cloudy blue sky',
    angle: 126,
    tilt: -6,
    depth: 0.64,
    stamps: ['/photo-gallery/stamps/stamp-05.png'],
    stampTilt: -2,
    note: 'bike ride',
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function orbitPoint(angle: number, progress: number, depth: number, index: number) {
  const arrival = mapChapterProgress(progress, 0.02, 0.3);
  const orbitProgress = mapChapterProgress(progress, 0.22, 0.82);
  const scrollRotation = (orbitProgress - 0.5) * 92;
  const radians = ((angle + scrollRotation) * Math.PI) / 180;
  const exitSpread = mapChapterProgress(progress, 0.78, 1);
  const entrySide = index % 2 === 0 ? -1 : 1;
  const entryLift = index === 2 ? -0.38 : index < 2 ? -0.22 : 0.22;

  return {
    xFactor: Math.cos(radians) * (0.64 + exitSpread * 0.42)
      + entrySide * (1 - arrival) * (0.28 + depth * 0.18),
    yFactor: Math.sin(radians) * (0.58 + exitSpread * 0.35)
      + entryLift * (1 - arrival)
      + exitSpread * (index % 2 === 0 ? -0.55 : 0.7),
    scale: 1.4 - arrival * (0.38 - depth * 0.07) - exitSpread * 0.15,
    opacity: Math.min(1, arrival * 1.45) * (0.68 + depth * 0.32) * (1 - exitSpread * 0.92),
    rotate: entrySide * (1 - arrival) * 18 + angle * 0.035 + scrollRotation * 0.08 + exitSpread * entrySide * 14,
    blur: (1 - arrival) * (10 + depth * 4) + exitSpread * 7,
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
      <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-border/35 dark:ring-[#8B9B79]/25" />
    </div>
  );
}

function PhotoBack({ slot }: { slot: PhotoSlot }) {
  const hasPairedStamps = slot.stamps.length > 1;

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[0.18rem] bg-[#E9E1D2] text-[#675E50] transition-colors duration-300 [backface-visibility:hidden] dark:bg-[#20271D] dark:text-[#ADB79C]"
      style={{ transform: 'rotateY(180deg)' }}
      data-photo-back
    >
      <span className="absolute inset-0 bg-[linear-gradient(155deg,rgba(255,255,255,0.2),transparent_44%),repeating-linear-gradient(0deg,rgba(100,80,58,0.025)_0_1px,transparent_1px_3px)] dark:bg-[linear-gradient(155deg,rgba(204,219,181,0.06),transparent_44%),repeating-linear-gradient(0deg,rgba(198,213,176,0.025)_0_1px,transparent_1px_3px)]" />
      <span className="absolute bottom-[12%] top-[14%] left-[56%] w-px bg-[#8B7B66]/24 dark:bg-[#9BAA89]/24" />

      <span
        className="absolute left-[9%] top-[22%] w-[40%] -rotate-3 font-[Caveat] text-[clamp(0.58rem,1.25vw,0.82rem)] font-medium leading-[1.05] tracking-[0.01em] text-[#675646]/80 dark:text-[#C7BFA7]/82"
        data-photo-note={slot.note}
      >
        {slot.note}
      </span>
      <span className="absolute left-[10%] top-[53%] h-px w-[32%] -rotate-2 bg-[#776B5A]/25 dark:bg-[#AAB99A]/22" />
      <span className="absolute bottom-[13%] left-[11%] h-2 w-2 rotate-45 border border-[#9A725D]/35 dark:border-[#D18A72]/35" />

      <span className="absolute right-[38%] top-[20%] h-[30%] w-[30%] rounded-full border border-[#756856]/20 dark:border-[#9BAA89]/20" />
      <span className="absolute right-[42%] top-[24%] h-[22%] w-[22%] rounded-full border border-[#756856]/18 dark:border-[#9BAA89]/18" />
      <span className="absolute right-[24%] top-[30%] h-px w-[34%] -rotate-6 bg-[#756856]/22 dark:bg-[#9BAA89]/22" />
      <span className="absolute right-[22%] top-[36%] h-px w-[36%] -rotate-6 bg-[#756856]/18 dark:bg-[#9BAA89]/18" />
      <span className="absolute right-[25%] top-[42%] h-px w-[31%] -rotate-6 bg-[#756856]/16 dark:bg-[#9BAA89]/16" />

      <span
        className={`absolute right-[7%] top-[7%] ${hasPairedStamps ? 'h-[43%] w-[45%]' : 'h-[39%] w-[34%]'}`}
        style={{ transform: `rotate(${slot.stampTilt}deg)` }}
      >
        {slot.stamps.map((stamp, index) => (
          <img
            key={stamp}
            src={stamp}
            alt=""
            width="500"
            height="500"
            loading="lazy"
            decoding="async"
            aria-hidden="true"
            data-photo-stamp
            className={`absolute object-contain drop-shadow-[1px_2px_1px_rgba(72,54,38,0.2)] transition-[filter] duration-300 dark:brightness-[0.76] dark:saturate-[0.78] dark:drop-shadow-[1px_2px_1px_rgba(0,0,0,0.38)] ${
              hasPairedStamps
                ? index === 0
                  ? 'left-0 top-0 h-[76%] w-[66%] -rotate-6'
                  : 'bottom-0 right-0 h-[76%] w-[66%] rotate-6'
                : 'inset-0 h-full w-full'
            }`}
          />
        ))}
      </span>
      <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#B9AA93]/32 dark:ring-[#8B9B79]/28" />
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
  index,
}: {
  slot: PhotoSlot;
  progress: MotionValue<number>;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  orbitWidth: MotionValue<number>;
  orbitHeight: MotionValue<number>;
  reducedMotion: boolean;
  index: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const x = useTransform([progress, pointerX, orbitWidth], ([rawProgress, rawPointerX, rawWidth]) => {
    const point = orbitPoint(slot.angle, reducedMotion ? 0.55 : Number(rawProgress), slot.depth, index);
    const width = Number(rawWidth);
    const cornerSafety = clamp(width * 0.2, 94, 126);
    const safeRadius = Math.max(0, width / 2 - cornerSafety);
    return point.xFactor * safeRadius + Number(rawPointerX) * slot.depth * Math.min(36, width * 0.055);
  });
  const y = useTransform([progress, pointerY, orbitHeight], ([rawProgress, rawPointerY, rawHeight]) => {
    const point = orbitPoint(slot.angle, reducedMotion ? 0.55 : Number(rawProgress), slot.depth, index);
    const height = Number(rawHeight);
    const cornerSafety = clamp(height * 0.22, 98, 132);
    const safeRadius = Math.max(0, height / 2 - cornerSafety);
    return point.yFactor * safeRadius + Number(rawPointerY) * slot.depth * Math.min(30, height * 0.05);
  });
  const scale = useTransform(progress, (value) => orbitPoint(slot.angle, reducedMotion ? 0.55 : value, slot.depth, index).scale);
  const opacity = useTransform(progress, (value) => orbitPoint(slot.angle, reducedMotion ? 0.55 : value, slot.depth, index).opacity);
  const rotate = useTransform(progress, (value) => slot.tilt + orbitPoint(slot.angle, reducedMotion ? 0.55 : value, slot.depth, index).rotate);
  const filter = useTransform(progress, (value) => `blur(${orbitPoint(slot.angle, reducedMotion ? 0.55 : value, slot.depth, index).blur}px)`);

  return (
    <motion.button
      type="button"
      onClick={() => setFlipped((current) => !current)}
      className="absolute left-1/2 top-1/2 aspect-[4/5] w-[clamp(5rem,22vw,5.75rem)] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-[0.22rem] bg-[#D9D1C1] p-[clamp(0.34rem,0.7vw,0.5rem)] pb-[clamp(0.7rem,1.4vw,1rem)] shadow-xl shadow-black/20 ring-1 ring-[#BEB39F]/25 outline-none transition-[background-color,box-shadow,ring-color] duration-300 focus-visible:ring-2 focus-visible:ring-accent sm:w-[clamp(6.2rem,11vw,8.5rem)] dark:bg-[#252C22] dark:shadow-black/45 dark:ring-[#667359]/35"
      style={{ x, y, scale, rotate, opacity, filter, zIndex: Math.round(slot.depth * 10) }}
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
        <PhotoBack slot={slot} />
      </motion.span>
    </motion.button>
  );
}

type PhotoOrbitTransitionProps = {
  progress?: MotionValue<number>;
  pointerX?: MotionValue<number>;
  pointerY?: MotionValue<number>;
  reducedMotion?: boolean;
  theme?: 'day' | 'evening';
};

const scatterPetals = Array.from({ length: 9 }, (_, index) => ({
  id: `photo-petal-${index}`,
  x: ((index * 37) % 90) + 5,
  drift: index % 2 === 0 ? -70 - index * 8 : 64 + index * 7,
  delay: index * 0.014,
  frame: index % 8,
}));

function ScatterPetal({
  petal,
  progress,
  reducedMotion,
  theme,
}: {
  petal: typeof scatterPetals[number];
  progress: MotionValue<number>;
  reducedMotion: boolean;
  theme: 'day' | 'evening';
}) {
  const opacity = useTransform(progress, [0.78 + petal.delay, 0.86 + petal.delay, 1], [0, 0.9, 0]);
  const y = useTransform(progress, [0.78, 1], [-20, 260 + petal.frame * 18]);
  const x = useTransform(progress, [0.78, 1], [0, petal.drift]);
  const rotate = useTransform(progress, [0.78, 1], [0, petal.drift * 1.8]);

  return (
    <motion.span
      className="pixel-garden-sprite pointer-events-none absolute top-[44%] z-20 h-5 w-5"
      style={{
        left: `${petal.x}%`,
        x,
        y,
        rotate,
        opacity: reducedMotion ? 0 : opacity,
        backgroundImage: `url(/garden-pixel/falling-petals-${theme}-strip.png)`,
        backgroundSize: '800% 100%',
        backgroundPosition: `${petal.frame * (100 / 7)}% 0`,
      }}
      aria-hidden="true"
      data-photo-scatter-petal
    />
  );
}

export function PhotoOrbitTransition({
  progress: progressProp,
  pointerX: pointerXProp,
  pointerY: pointerYProp,
  reducedMotion = false,
  theme = 'day',
}: PhotoOrbitTransitionProps = {}) {
  const orbitRef = useRef<HTMLDivElement>(null);
  const fallbackProgress = useMotionValue(0.55);
  const fallbackPointerX = useMotionValue(0);
  const fallbackPointerY = useMotionValue(0);
  const progress = progressProp ?? fallbackProgress;
  const pointerX = pointerXProp ?? fallbackPointerX;
  const pointerY = pointerYProp ?? fallbackPointerY;
  const initialOrbitWidth = typeof window === 'undefined' ? 320 : Math.min(window.innerWidth * 0.92, 640);
  const initialOrbitHeight = typeof window === 'undefined' ? 480 : Math.max(320, Math.min(window.innerHeight * 0.88, 620));
  const orbitWidth = useMotionValue(initialOrbitWidth);
  const orbitHeight = useMotionValue(initialOrbitHeight);
  const orbitRotate = useTransform([progress, pointerX], ([rawProgress, rawPointerX]) => (
    reducedMotion ? 0 : -7 + Number(rawProgress) * 14 + Number(rawPointerX) * 9
  ));
  const orbitScale = useTransform(progress, [0, 0.5, 1], reducedMotion ? [1, 1, 1] : [0.96, 1.02, 0.92]);

  useEffect(() => {
    const orbit = orbitRef.current;
    if (!orbit) return;

    const updateBounds = () => {
      if (orbit.clientWidth > 0) orbitWidth.set(orbit.clientWidth);
      if (orbit.clientHeight > 0) orbitHeight.set(orbit.clientHeight);
    };
    const observer = new ResizeObserver(updateBounds);
    observer.observe(orbit);
    updateBounds();

    return () => observer.disconnect();
  }, [orbitHeight, orbitWidth]);

  return (
    <div
      className="relative h-full min-h-[31rem] w-full overflow-hidden"
      style={{
        maskImage: 'radial-gradient(ellipse 94% 90% at center, black 68%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 94% 90% at center, black 68%, transparent 100%)',
      }}
      aria-label="Interactive personal photo carousel"
      data-photo-orbit
    >
      {scatterPetals.map((petal) => (
        <ScatterPetal key={petal.id} petal={petal} progress={progress} reducedMotion={reducedMotion} theme={theme} />
      ))}
      <div className="absolute inset-[4%_0_8%] flex justify-center">
        <motion.div
          ref={orbitRef}
          className="relative h-full w-[min(92%,40rem)] rounded-[50%]"
          style={{ rotate: orbitRotate, scale: orbitScale }}
        >
          <span className="pointer-events-none absolute left-1/2 top-1/2 h-[44%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-dashed border-border/20 opacity-45 [mask-image:linear-gradient(to_right,transparent,black_28%,black_72%,transparent)]" />
          <span className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-warm-accent/25" />
          {photoSlots.map((slot, index) => (
            <OrbitPhoto
              key={slot.id}
              slot={slot}
              progress={progress}
              pointerX={pointerX}
              pointerY={pointerY}
              orbitWidth={orbitWidth}
              orbitHeight={orbitHeight}
              reducedMotion={reducedMotion}
              index={index}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
