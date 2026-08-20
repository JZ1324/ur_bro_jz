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
  entry: PhotoEntryPoint;
  stamps: string[];
  stampTilt: number;
  note: string;
};

export type PhotoEntryPoint = {
  x: number;
  y: number;
};

export const photoEntryPoints: readonly PhotoEntryPoint[] = [
  { x: -1.15, y: 0.35 },
  { x: -0.78, y: -0.78 },
  { x: 0, y: -1.15 },
  { x: 0.78, y: -0.78 },
  { x: 1.15, y: 0.35 },
];

export const photoHoverSpring = {
  type: 'spring',
  stiffness: 360,
  damping: 24,
} as const;

export const photoOrbitVisualEnvelope = {
  hoverScale: 1.08,
  maxParentScale: 1.02,
  maxParentRotate: 11.5,
} as const;

export function resolvePhotoHoverScale(hovered: boolean) {
  return hovered ? photoOrbitVisualEnvelope.hoverScale : 1;
}

const photoSlots: PhotoSlot[] = [
  {
    id: 'photo-01',
    src: '/photo-gallery/photo-01.jpg',
    alt: 'Rocky coastline beside a bright blue ocean',
    angle: -158,
    tilt: -8,
    depth: 0.55,
    entry: photoEntryPoints[0],
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
    entry: photoEntryPoints[1],
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
    entry: photoEntryPoints[2],
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
    entry: photoEntryPoints[3],
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
    entry: photoEntryPoints[4],
    stamps: ['/photo-gallery/stamps/stamp-05.png'],
    stampTilt: -2,
    note: 'bike ride',
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export type PhotoOrbitPoint = {
  entry: PhotoEntryPoint;
  arrival: number;
  orbitXFactor: number;
  orbitYFactor: number;
  scale: number;
  opacity: number;
  rotate: number;
};

export function resolvePhotoOrbitPoint(angle: number, progress: number, depth: number, index: number): PhotoOrbitPoint {
  const entry = photoEntryPoints[index] ?? photoEntryPoints[0];
  const rawArrival = mapChapterProgress(progress, 0, 0.28);
  const arrival = rawArrival ** 2.2;
  const orbitProgress = mapChapterProgress(progress, 0.28, 0.8);
  const scrollRotation = (orbitProgress - 0.5) * 160;
  const radians = ((angle + scrollRotation) * Math.PI) / 180;
  const exitSpread = mapChapterProgress(progress, 0.78, 1);
  const entrySide = index % 2 === 0 ? -1 : 1;
  const entryScale = 0.82;
  const orbitScale = 0.94;
  const exitScale = 0.86;

  return {
    entry,
    arrival,
    orbitXFactor: Math.cos(radians) * (0.82 + exitSpread * 0.42),
    orbitYFactor: Math.sin(radians) * (0.72 + exitSpread * 0.36)
      + exitSpread * (index % 2 === 0 ? -0.62 : 0.78),
    scale: entryScale + (orbitScale - entryScale) * arrival + (exitScale - orbitScale) * exitSpread,
    opacity: (0.72 + depth * 0.28 + arrival * 0.08) * (1 - exitSpread * 0.94),
    rotate: entrySide * (1 - arrival) * 16 + angle * 0.035 + scrollRotation * 0.1 + exitSpread * entrySide * 16,
  };
}

export function resolvePhotoOrbitOffset(
  point: PhotoOrbitPoint,
  width: number,
  height: number,
) {
  const entryRadiusX = Math.max(0, width / 2 - clamp(width * 0.06, 22, 48));
  const entryRadiusY = Math.max(0, height / 2 - clamp(height * 0.08, 28, 54));
  const orbitRadiusX = Math.max(0, width / 2 - clamp(width * 0.2, 94, 126));
  const orbitRadiusY = Math.max(0, height / 2 - clamp(height * 0.22, 98, 132));
  const inverseArrival = 1 - point.arrival;
  // Leave room for the card's own rotation plus its hover spring and the
  // rotating/scaling orbit parent. Keeping only the resting card inside these
  // bounds still lets a hovered corner reach a clipping ancestor.
  const safeInsetX = clamp(width * 0.28, 102.5, 140);
  const safeInsetY = clamp(height * 0.23, 112, 142);
  const rawX = point.entry.x * entryRadiusX * inverseArrival + point.orbitXFactor * orbitRadiusX * point.arrival;
  const rawY = point.entry.y * entryRadiusY * inverseArrival + point.orbitYFactor * orbitRadiusY * point.arrival;

  return {
    x: clamp(rawX, -width / 2 + safeInsetX, width / 2 - safeInsetX),
    y: clamp(rawY, -height / 2 + safeInsetY, height / 2 - safeInsetY),
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
      <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-border/35 dark:ring-border/40" />
    </div>
  );
}

function PhotoBack({ slot }: { slot: PhotoSlot }) {
  const hasPairedStamps = slot.stamps.length > 1;

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[0.18rem] bg-[#E9E1D2] text-[#675E50] transition-colors duration-300 [backface-visibility:hidden] dark:bg-surface-raised dark:text-muted"
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
      <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#B9AA93]/32 dark:ring-border/45" />
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
  performanceReduced,
  supportsFineHover,
  index,
}: {
  slot: PhotoSlot;
  progress: MotionValue<number>;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  orbitWidth: MotionValue<number>;
  orbitHeight: MotionValue<number>;
  reducedMotion: boolean;
  performanceReduced: boolean;
  supportsFineHover: boolean;
  index: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const x = useTransform([progress, pointerX, orbitWidth, orbitHeight], ([rawProgress, rawPointerX, rawWidth, rawHeight]) => {
    const point = resolvePhotoOrbitPoint(slot.angle, reducedMotion ? 0.55 : Number(rawProgress), slot.depth, index);
    const width = Number(rawWidth);
    const height = Number(rawHeight);
    const offset = resolvePhotoOrbitOffset(point, width, height);
    const pointerOffset = performanceReduced ? 0 : Number(rawPointerX);
    const pointerShift = pointerOffset * slot.depth * Math.min(36, width * 0.055);
    const safeInset = clamp(width * 0.28, 102.5, 140);
    return clamp(offset.x + pointerShift, -width / 2 + safeInset, width / 2 - safeInset);
  });
  const y = useTransform([progress, pointerY, orbitWidth, orbitHeight], ([rawProgress, rawPointerY, rawWidth, rawHeight]) => {
    const point = resolvePhotoOrbitPoint(slot.angle, reducedMotion ? 0.55 : Number(rawProgress), slot.depth, index);
    const height = Number(rawHeight);
    const width = Number(rawWidth);
    const offset = resolvePhotoOrbitOffset(point, width, height);
    const pointerOffset = performanceReduced ? 0 : Number(rawPointerY);
    const pointerShift = pointerOffset * slot.depth * Math.min(30, height * 0.05);
    const safeInset = clamp(height * 0.23, 112, 142);
    return clamp(offset.y + pointerShift, -height / 2 + safeInset, height / 2 - safeInset);
  });
  const scale = useTransform(progress, (value) => resolvePhotoOrbitPoint(slot.angle, reducedMotion ? 0.55 : value, slot.depth, index).scale);
  const opacity = useTransform(progress, (value) => resolvePhotoOrbitPoint(slot.angle, reducedMotion ? 0.55 : value, slot.depth, index).opacity);
  const rotate = useTransform(progress, (value) => slot.tilt + resolvePhotoOrbitPoint(slot.angle, reducedMotion ? 0.55 : value, slot.depth, index).rotate);
  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 aspect-[4/5] w-[clamp(4.5rem,19vw,5.1rem)] -translate-x-1/2 -translate-y-1/2 overflow-visible sm:w-[clamp(5.25rem,8.5vw,7rem)]"
      style={{ x, y, scale, rotate, opacity, zIndex: Math.round(slot.depth * 10) }}
      data-photo-orbit-motion-layer={slot.id}
    >
      <motion.button
        type="button"
        onClick={() => setFlipped((current) => !current)}
        className="pointer-events-auto relative block h-full w-full cursor-pointer rounded-[0.22rem] bg-[#D9D1C1] p-[clamp(0.34rem,0.7vw,0.5rem)] pb-[clamp(0.7rem,1.4vw,1rem)] shadow-xl shadow-black/20 ring-1 ring-[#BEB39F]/25 outline-none transition-[background-color,box-shadow,ring-color] duration-300 focus-visible:ring-2 focus-visible:ring-accent dark:bg-surface-raised dark:shadow-black/50 dark:ring-border/50"
        initial={false}
        animate={{ scale: resolvePhotoHoverScale(false) }}
        whileHover={supportsFineHover && !reducedMotion ? { scale: resolvePhotoHoverScale(true) } : undefined}
        whileTap={reducedMotion ? undefined : { scale: 0.98 }}
        transition={reducedMotion ? { duration: 0 } : photoHoverSpring}
        aria-label={`${flipped ? 'Show front of' : 'Flip'} ${slot.alt}`}
        aria-pressed={flipped}
        data-photo-orbit-slot={slot.id}
        data-photo-orbit-interaction-layer
      >
        <motion.span
          className="relative block h-full w-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }}
          data-photo-orbit-flip-layer
        >
          <BlankPhotoFace slot={slot} />
          <PhotoBack slot={slot} />
        </motion.span>
      </motion.button>
    </motion.div>
  );
}

type PhotoOrbitTransitionProps = {
  progress?: MotionValue<number>;
  pointerX?: MotionValue<number>;
  pointerY?: MotionValue<number>;
  reducedMotion?: boolean;
  performanceReduced?: boolean;
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
  performanceReduced = false,
  theme = 'day',
}: PhotoOrbitTransitionProps = {}) {
  const orbitRef = useRef<HTMLDivElement>(null);
  const [supportsFineHover, setSupportsFineHover] = useState(false);
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
    reducedMotion ? 0 : -7 + Number(rawProgress) * 14 + (performanceReduced ? 0 : Number(rawPointerX) * 9)
  ));
  const orbitScale = useTransform(progress, [0, 0.5, 1], reducedMotion ? [1, 1, 1] : [0.96, 1.02, 0.94]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updateHoverSupport = () => setSupportsFineHover(mediaQuery.matches);
    updateHoverSupport();
    mediaQuery.addEventListener('change', updateHoverSupport);
    return () => mediaQuery.removeEventListener('change', updateHoverSupport);
  }, []);

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
      className="relative h-full min-h-[31rem] w-full overflow-visible"
      aria-label="Interactive personal photo carousel"
      data-photo-orbit
    >
      {scatterPetals.map((petal) => (
        <ScatterPetal
          key={petal.id}
          petal={petal}
          progress={progress}
          reducedMotion={reducedMotion || performanceReduced}
          theme={theme}
        />
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
              performanceReduced={performanceReduced}
              supportsFineHover={supportsFineHover}
              index={index}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
