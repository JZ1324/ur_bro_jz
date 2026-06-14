import { useCallback, useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'motion/react';
import {
  cubicPoint,
  resamplePathByDistance,
  sampleCubicSegments,
  type GardenCubicSegment,
  type GardenPoint,
} from './gardenPath';
import { gardenTiming } from './gardenTiming';
import { drawPixelVine, progressivePoints } from './pixelVineDrawing';
import {
  connectedBloomTiming,
  resolveVineAttachments,
  vineGrowthToPageProgress,
  type VineAttachment,
} from './gardenVineAttachments';

type GardenScrollSceneProps = {
  progress: MotionValue<number>;
  theme: GardenTheme;
};

type GardenTheme = 'day' | 'evening';

type VinePathAttachment = {
  segmentIndex: number;
  t: number;
};

type BloomSpriteSpec = {
  id: string;
  attachment: VinePathAttachment;
  size: string;
  grow: [number, number];
  bloom: [number, number];
  breeze: number;
  path?: string;
  themedPaths?: Record<GardenTheme, string>;
  particlePalettes?: Record<GardenTheme, string[]>;
};

const vineSegments: GardenCubicSegment[] = [
  {
    start: { x: 91, y: 17.8 },
    controlA: { x: 94, y: 24 },
    controlB: { x: 79, y: 31 },
    end: { x: 56, y: 34 },
  },
  {
    start: { x: 56, y: 34 },
    controlA: { x: 35, y: 36.5 },
    controlB: { x: 14.5, y: 34 },
    end: { x: 10, y: 43 },
  },
  {
    start: { x: 10, y: 43 },
    controlA: { x: 4.5, y: 54 },
    controlB: { x: 25, y: 57.5 },
    end: { x: 52, y: 61 },
  },
  {
    start: { x: 52, y: 61 },
    controlA: { x: 76, y: 64.5 },
    controlB: { x: 92.5, y: 71.5 },
    end: { x: 86.5, y: 84 },
  },
];

const vineParticleTargets = vineSegments.flatMap((segment, segmentIndex) => (
  Array.from({ length: 25 }, (_, index) => cubicPoint(segment, (index + (segmentIndex === 0 ? 0 : 1)) / 25))
));

const bloomSprites: BloomSpriteSpec[] = [
  {
    id: 'opening-rose',
    attachment: { segmentIndex: 0, t: 0 },
    size: 'clamp(2.6rem, 4.2vw, 3.5rem)',
    grow: [0, 0.05],
    bloom: [0.03, 0.34],
    breeze: 0.58,
  },
  {
    id: 'vine-rose-e',
    attachment: { segmentIndex: 0, t: 0.25 },
    size: 'clamp(1.15rem, 1.75vw, 1.55rem)',
    grow: [0.06, 0.1],
    bloom: [0.1, 0.22],
    breeze: 0.18,
    themedPaths: {
      day: '/garden-pixel/rose-bloom-pink-day-strip.png?v=rounded-1',
      evening: '/garden-pixel/rose-bloom-pink-evening-strip.png?v=rounded-1',
    },
  },
  {
    id: 'vine-rose-a',
    attachment: { segmentIndex: 0, t: 0.54 },
    size: 'clamp(1.45rem, 2.2vw, 1.9rem)',
    grow: [0.13, 0.18],
    bloom: [0.18, 0.31],
    breeze: -0.24,
  },
  {
    id: 'vine-rose-f',
    attachment: { segmentIndex: 0, t: 0.82 },
    size: 'clamp(1.1rem, 1.65vw, 1.5rem)',
    grow: [0.2, 0.24],
    bloom: [0.24, 0.36],
    breeze: 0.17,
  },
  {
    id: 'vine-rose-b',
    attachment: { segmentIndex: 1, t: 0.34 },
    size: 'clamp(1.35rem, 2vw, 1.8rem)',
    grow: [0.27, 0.33],
    bloom: [0.33, 0.46],
    breeze: 0.2,
    themedPaths: {
      day: '/garden-pixel/rose-bloom-pink-day-strip.png?v=rounded-1',
      evening: '/garden-pixel/rose-bloom-pink-evening-strip.png?v=rounded-1',
    },
  },
  {
    id: 'vine-rose-g',
    attachment: { segmentIndex: 1, t: 0.68 },
    size: 'clamp(1.15rem, 1.75vw, 1.55rem)',
    grow: [0.36, 0.41],
    bloom: [0.41, 0.53],
    breeze: -0.18,
  },
  {
    id: 'middle-pink-rose',
    attachment: { segmentIndex: 1, t: 1 },
    size: 'clamp(2.15rem, 3.7vw, 3rem)',
    grow: [0.34, 0.43],
    bloom: [0.43, 0.68],
    breeze: -0.35,
    themedPaths: {
      day: '/garden-pixel/rose-bloom-pink-day-strip.png?v=rounded-1',
      evening: '/garden-pixel/rose-bloom-pink-evening-strip.png?v=rounded-1',
    },
    particlePalettes: {
      day: ['#673044', '#965062', '#c56875', '#e58990', '#f9beae', '#78945f'],
      evening: ['#491439', '#801f60', '#bb3084', '#e65ba5', '#ffa8d2', '#9bc27e'],
    },
  },
  {
    id: 'vine-rose-h',
    attachment: { segmentIndex: 2, t: 0.28 },
    size: 'clamp(1.1rem, 1.65vw, 1.5rem)',
    grow: [0.46, 0.51],
    bloom: [0.51, 0.63],
    breeze: 0.17,
    themedPaths: {
      day: '/garden-pixel/rose-bloom-pink-day-strip.png?v=rounded-1',
      evening: '/garden-pixel/rose-bloom-pink-evening-strip.png?v=rounded-1',
    },
  },
  {
    id: 'vine-rose-c',
    attachment: { segmentIndex: 2, t: 0.62 },
    size: 'clamp(1.4rem, 2.1vw, 1.85rem)',
    grow: [0.49, 0.55],
    bloom: [0.55, 0.68],
    breeze: -0.22,
  },
  {
    id: 'vine-rose-i',
    attachment: { segmentIndex: 2, t: 0.88 },
    size: 'clamp(1.15rem, 1.75vw, 1.55rem)',
    grow: [0.59, 0.64],
    bloom: [0.64, 0.76],
    breeze: 0.18,
  },
  {
    id: 'vine-rose-d',
    attachment: { segmentIndex: 3, t: 0.42 },
    size: 'clamp(1.4rem, 2.1vw, 1.85rem)',
    grow: [0.67, 0.73],
    bloom: [0.73, 0.86],
    breeze: 0.22,
    themedPaths: {
      day: '/garden-pixel/rose-bloom-pink-day-strip.png?v=rounded-1',
      evening: '/garden-pixel/rose-bloom-pink-evening-strip.png?v=rounded-1',
    },
  },
  {
    id: 'vine-rose-j',
    attachment: { segmentIndex: 3, t: 0.72 },
    size: 'clamp(1.1rem, 1.65vw, 1.5rem)',
    grow: [0.78, 0.83],
    bloom: [0.83, 0.92],
    breeze: -0.17,
  },
];

function bloomPathPoint(spec: BloomSpriteSpec) {
  return cubicPoint(vineSegments[spec.attachment.segmentIndex], spec.attachment.t);
}

const roseHeadVisiblePercent = [64, 64, 66, 68, 71, 72, 73, 73];

function roseBloomFrame(value: number, bloom: [number, number]) {
  const bloomProgress = Math.max(0, Math.min(1, (value - bloom[0]) / (bloom[1] - bloom[0])));
  return Math.min(6, Math.floor(bloomProgress * 7));
}

const leafSprites = [
  { id: 'leaf-a', x: 70, y: 31.4, frame: 1, rotate: -12, reveal: [0.1, 0.2] as [number, number], breeze: 0.38 },
  { id: 'leaf-b', x: 28, y: 35.7, frame: 2, rotate: 16, reveal: [0.29, 0.39] as [number, number], breeze: -0.32 },
  { id: 'leaf-c', x: 31, y: 58.5, frame: 1, rotate: 188, reveal: [0.48, 0.58] as [number, number], breeze: -0.38 },
  { id: 'leaf-d', x: 72, y: 66.8, frame: 2, rotate: 20, reveal: [0.66, 0.76] as [number, number], breeze: 0.34 },
];

function range(progress: MotionValue<number>, input: [number, number], output: [number, number]) {
  return useTransform(progress, input, output, { clamp: true });
}

function PixelVineCanvas({
  rawProgress,
  reducedMotion,
  theme,
  onAttachmentsChange,
}: {
  rawProgress: MotionValue<number>;
  reducedMotion: boolean;
  theme: GardenTheme;
  onAttachmentsChange: (attachments: Record<string, VineAttachment>) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let width = 0;
    let height = 0;
    let ratio = 1;
    let fullVinePoints: GardenPoint[] = [];
    const styles = getComputedStyle(document.documentElement);
    const palette = {
      ink: styles.getPropertyValue('--garden-vine-ink').trim(),
      shadow: styles.getPropertyValue('--garden-pixel-shadow').trim(),
      core: styles.getPropertyValue('--garden-vine').trim(),
      leaf: styles.getPropertyValue('--garden-leaf').trim(),
      light: styles.getPropertyValue('--garden-vine-bright').trim(),
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const pixelScale = width < 640 ? 1.5 : 2;
      canvas.width = Math.round((width * ratio) / pixelScale);
      canvas.height = Math.round((height * ratio) / pixelScale);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.style.imageRendering = 'pixelated';
      context.setTransform(ratio / pixelScale, 0, 0, ratio / pixelScale, 0, 0);
      context.imageSmoothingEnabled = false;
    };

    const buildFullVinePath = () => {
      const rose = document.querySelector<HTMLElement>('[data-meadow-final-rose-anchor]');
      if (!rose) return;

      const roseRect = rose.getBoundingClientRect();
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - height);
      const end = {
        x: roseRect.left + roseRect.width * 0.5,
        y: window.scrollY + roseRect.top + roseRect.height * 0.78 - maxScroll,
      };
      const mainPoints = sampleCubicSegments(vineSegments, 96).map((point) => ({
        x: (point.x / 100) * width,
        y: (point.y / 100) * height,
      }));
      const start = mainPoints[mainPoints.length - 1];
      const previous = mainPoints[mainPoints.length - 2];
      const tangentLength = Math.max(1, Math.hypot(start.x - previous.x, start.y - previous.y));
      const tangent = {
        x: (start.x - previous.x) / tangentLength,
        y: (start.y - previous.y) / tangentLength,
      };
      const distance = Math.max(1, Math.hypot(end.x - start.x, end.y - start.y));
      const continuation: GardenCubicSegment = {
        start,
        controlA: {
          x: start.x + tangent.x * distance * 0.38,
          y: start.y + tangent.y * distance * 0.38,
        },
        controlB: {
          x: end.x + Math.min(28, width * 0.025),
          y: end.y - distance * 0.34,
        },
        end,
      };
      const densePath = [...mainPoints, ...sampleCubicSegments([continuation], 160).slice(1)];
      fullVinePoints = resamplePathByDistance(densePath, width < 640 ? 3 : 4);
      canvas.dataset.vineTotalPoints = String(fullVinePoints.length);
      onAttachmentsChange(resolveVineAttachments(
        fullVinePoints,
        bloomSprites.map((spec) => {
          const target = bloomPathPoint(spec);
          return {
            id: spec.id,
            target: {
              x: (target.x / 100) * width,
              y: (target.y / 100) * height,
            },
          };
        }),
      ));
    };

    const draw = () => {
      frameRef.current = null;
      context.clearRect(0, 0, width, height);

      const growth = reducedMotion
        ? 1
        : window.scrollY <= 1
        ? 0
        : Math.max(0, Math.min(
          1,
          (rawProgress.get() - gardenTiming.vine.start) / (gardenTiming.vine.end - gardenTiming.vine.start),
        ));
      canvas.dataset.vineGrowth = growth.toFixed(4);
      if (growth <= 0 || fullVinePoints.length < 2) {
        canvas.dataset.vineDrawnPoints = '0';
        return;
      }

      const points = progressivePoints(fullVinePoints, growth).map((point, index) => {
        const edgeFade = Math.min(1, index / 8, (fullVinePoints.length - 1 - index) / 8);
        const organicOffset = Math.sin(index * 0.87) * 0.55 * edgeFade;
        return {
          x: point.x,
          y: point.y + organicOffset,
        };
      });
      canvas.dataset.vineDrawnPoints = String(points.length);
      drawPixelVine(context, points, palette, {
        thickness: width < 640 ? 4.25 : 6,
        detailScale: width < 640 ? 0.82 : 1.15,
        seed: 2,
        endDetailClearance: 34,
      });
    };

    const scheduleDraw = () => {
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(draw);
    };

    resize();
    const unsubscribe = rawProgress.on('change', scheduleDraw);
    const handleResize = () => {
      resize();
      buildFullVinePath();
      scheduleDraw();
    };
    const handleLoad = () => {
      buildFullVinePath();
      scheduleDraw();
    };
    const layoutObserver = new ResizeObserver(handleLoad);
    layoutObserver.observe(document.documentElement);
    buildFullVinePath();
    window.addEventListener('scroll', scheduleDraw, { passive: true });
    window.addEventListener('resize', handleResize);
    window.addEventListener('load', handleLoad);
    draw();
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', scheduleDraw);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('load', handleLoad);
      layoutObserver.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [onAttachmentsChange, rawProgress, reducedMotion, theme]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" data-pixel-vine-canvas />;
}

function PixelBloomSprite({
  spec,
  attachment,
  progress,
  breezeX,
  theme,
}: {
  spec: BloomSpriteSpec;
  attachment?: VineAttachment;
  progress: MotionValue<number>;
  breezeX: MotionValue<number>;
  theme: GardenTheme;
}) {
  const connection = vineGrowthToPageProgress(
    attachment?.growth ?? 1,
    [gardenTiming.vine.start, gardenTiming.vine.end],
  );
  const timing = connectedBloomTiming(connection, spec.grow, spec.bloom);
  const opacity = range(progress, timing.grow, [0, 1]);
  const scale = range(progress, timing.grow, [0.72, 1]);
  const backgroundPosition = useTransform(progress, (value) => {
    const frame = roseBloomFrame(value, timing.bloom);
    return `${frame * (100 / 7)}% 0%`;
  });
  const headClip = useTransform(progress, (value) => {
    const visible = roseHeadVisiblePercent[roseBloomFrame(value, timing.bloom)];
    return `inset(0 0 ${100 - visible}% 0)`;
  });
  const headY = useTransform(progress, (value) => {
    const visible = roseHeadVisiblePercent[roseBloomFrame(value, timing.bloom)];
    return `${100 - visible}%`;
  });
  const sway = useTransform(breezeX, (value) => value * spec.breeze * 0.35);

  return (
    <div
      className="absolute"
      style={{
        left: attachment?.x ?? 0,
        top: attachment?.y ?? 0,
        width: spec.size,
        aspectRatio: '1 / 1',
        transform: 'translate(-50%, -100%)',
        visibility: attachment ? 'visible' : 'hidden',
      }}
    >
      <motion.div
        className="h-full w-full"
        style={{
          opacity,
          scale,
          rotate: sway,
          transformOrigin: '50% 100%',
        }}
        data-garden-flower={spec.id}
        data-vine-attachment-growth={attachment?.growth.toFixed(4)}
        data-vine-attachment-x={attachment?.x.toFixed(1)}
        data-vine-attachment-y={attachment?.y.toFixed(1)}
      >
        <motion.span
          className="pixel-garden-sprite block h-full w-full"
          style={{
            clipPath: headClip,
            y: headY,
            backgroundImage: `url(${spec.themedPaths?.[theme] ?? spec.path ?? '/garden-pixel/rose-bloom-detailed-strip.png?v=rounded-1'})`,
            backgroundSize: '800% 100%',
            backgroundPosition,
            backgroundRepeat: 'no-repeat',
          }}
        />
      </motion.div>
    </div>
  );
}

function PixelLeaf({
  leaf,
  progress,
  breezeX,
}: {
  leaf: typeof leafSprites[number];
  progress: MotionValue<number>;
  breezeX: MotionValue<number>;
}) {
  const opacity = range(progress, leaf.reveal, [0, 0.78]);
  const scale = range(progress, leaf.reveal, [0.4, 1]);
  const drift = useTransform(breezeX, (value) => value * leaf.breeze);

  return (
    <div
      className="absolute"
      style={{
        left: `${leaf.x}%`,
        top: `${leaf.y}%`,
        width: 'clamp(1.2rem, 2vw, 1.7rem)',
        aspectRatio: '1 / 1',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <motion.div
        className="pixel-garden-sprite h-full w-full"
        style={{
          opacity,
          scale,
          x: drift,
          rotate: leaf.rotate,
          backgroundImage: 'url(/garden-pixel/bud-leaves-detailed-strip.png)',
          backgroundSize: '400% 100%',
          backgroundPosition: `${leaf.frame * (100 / 3)}% 0%`,
          backgroundRepeat: 'no-repeat',
        }}
      />
    </div>
  );
}

function PixelParticleCanvas({
  progress,
  reducedMotion,
  theme,
}: {
  progress: MotionValue<number>;
  reducedMotion: boolean;
  theme: GardenTheme;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let isVisible = !document.hidden;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const particleCap = isMobile ? 48 : 90;
    const defaultPalette = ['#65162b', '#a8243b', '#d84759', '#f08a79', '#78945f', '#c9d3b0'];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = () => {
      frameRef.current = null;
      context.clearRect(0, 0, width, height);
      if (!isVisible) return;

      const value = progress.get();
      const activePoint = vineParticleTargets[Math.min(
        vineParticleTargets.length - 1,
        Math.floor((value / 0.84) * vineParticleTargets.length),
      )];
      const activeBloom = bloomSprites.find((sprite) => value >= sprite.grow[0] - 0.03 && value <= sprite.bloom[1] + 0.04);
      const palette = activeBloom?.particlePalettes?.[theme] ?? defaultPalette;
      const center = activeBloom ? bloomPathPoint(activeBloom) : activePoint;
      if (!center || value <= 0.005 || value >= 0.94) return;

      const centerX = (center.x / 100) * width;
      const centerY = (center.y / 100) * height;
      for (let index = 0; index < particleCap; index += 1) {
        const angle = index * 2.399 + value * 8;
        const radius = 5 + ((index * 11) % (activeBloom ? 48 : 28));
        const size = 2 + (index % 3);
        context.globalAlpha = 0.22 + (index % 4) * 0.1;
        context.fillStyle = palette[index % palette.length];
        context.fillRect(
          Math.round(centerX + Math.cos(angle) * radius + pointerRef.current.x * 0.006),
          Math.round(centerY + Math.sin(angle) * radius + pointerRef.current.y * 0.004),
          size,
          size,
        );
      }
      context.globalAlpha = 1;
    };

    const scheduleDraw = () => {
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(draw);
    };
    const handlePointer = (event: PointerEvent) => {
      pointerRef.current = {
        x: event.clientX - window.innerWidth / 2,
        y: event.clientY - window.innerHeight / 2,
      };
      scheduleDraw();
    };
    const handleVisibility = () => {
      isVisible = !document.hidden;
      scheduleDraw();
    };

    resize();
    const unsubscribe = progress.on('change', scheduleDraw);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointer, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    scheduleDraw();

    return () => {
      unsubscribe();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointer);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [progress, reducedMotion, theme]);

  if (reducedMotion) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 h-full w-full" />;
}

type FallingPetal = {
  x: number;
  y: number;
  speed: number;
  drift: number;
  driftSpeed: number;
  flutter: number;
  flutterSpeed: number;
  phase: number;
  baseRotation: number;
  rock: number;
  rockSpeed: number;
  size: number;
  spriteIndex: number;
};

const fallingPetalFrameSize = 64;
const fallingPetalFrameCount = 8;

function FallingPetalCanvas({
  reducedMotion,
  theme,
}: {
  reducedMotion: boolean;
  theme: GardenTheme;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let frame: number | null = null;
    let previousTime = performance.now();
    let isVisible = !document.hidden;
    let petals: FallingPetal[] = [];
    let spriteReady = false;
    const sprite = new Image();
    const spritePath = theme === 'evening'
      ? '/garden-pixel/falling-petals-evening-strip.png'
      : '/garden-pixel/falling-petals-day-strip.png';

    const makePetals = () => {
      const count = width < 640 ? 7 : width < 1024 ? 10 : 14;
      petals = Array.from({ length: count }, (_, index) => ({
        x: ((index * 67 + 19) % 101) / 100 * width,
        y: ((index * 41 + 13) % 103) / 100 * height,
        speed: 10 + (index % 5) * 1.5,
        drift: 11 + (index % 4) * 3.5,
        driftSpeed: 0.14 + (index % 3) * 0.025,
        flutter: 1.5 + (index % 3) * 0.75,
        flutterSpeed: 0.65 + (index % 4) * 0.09,
        phase: index * 1.71,
        baseRotation: index * 0.63,
        rock: 0.22 + (index % 3) * 0.08,
        rockSpeed: 0.38 + (index % 4) * 0.045,
        size: width < 640 ? 14 + (index % 3) * 3 : 16 + (index % 4) * 3,
        spriteIndex: index % fallingPetalFrameCount,
      }));
      canvas.dataset.fallingPetalCount = String(count);
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.imageSmoothingEnabled = false;
      makePetals();
    };

    const draw = (time: number) => {
      frame = null;
      if (!isVisible) return;
      const delta = Math.min(0.05, Math.max(0, (time - previousTime) / 1000));
      previousTime = time;
      context.clearRect(0, 0, width, height);

      petals.forEach((petal, index) => {
        petal.y += petal.speed * delta;
        if (petal.y > height + 16) {
          petal.y = -12 - (index % 4) * 18;
          petal.x = ((index * 73 + time * 0.0007) % 101) / 100 * width;
        }
        const seconds = time / 1000;
        const sway = Math.sin(seconds * petal.driftSpeed + petal.phase) * petal.drift;
        const flutter = Math.sin(seconds * petal.flutterSpeed + petal.phase * 1.8) * petal.flutter;
        const x = petal.x + sway + flutter;
        const y = petal.y + Math.sin(seconds * petal.flutterSpeed * 0.62 + petal.phase) * petal.flutter * 0.35;
        const rotation = petal.baseRotation
          + Math.sin(seconds * petal.rockSpeed + petal.phase) * petal.rock
          + Math.sin(seconds * petal.flutterSpeed * 0.54 + petal.phase * 0.7) * 0.08;
        const size = petal.size;

        context.save();
        context.translate(x, y);
        context.rotate(rotation);
        context.globalAlpha = 0.38 + (index % 3) * 0.08;
        if (spriteReady) {
          context.drawImage(
            sprite,
            petal.spriteIndex * fallingPetalFrameSize,
            0,
            fallingPetalFrameSize,
            fallingPetalFrameSize,
            -size / 2,
            -size / 2,
            size,
            size,
          );
        }
        context.restore();
      });
      context.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    const handleVisibility = () => {
      isVisible = !document.hidden;
      previousTime = performance.now();
      if (isVisible && frame === null) frame = requestAnimationFrame(draw);
      canvas.dataset.fallingPetalsPaused = isVisible ? 'false' : 'true';
    };

    const handleSpriteLoad = () => {
      spriteReady = true;
    };

    sprite.decoding = 'async';
    sprite.addEventListener('load', handleSpriteLoad);
    sprite.src = spritePath;
    canvas.dataset.fallingPetalSprite = spritePath;
    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
      sprite.removeEventListener('load', handleSpriteLoad);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [reducedMotion, theme]);

  if (reducedMotion) return null;
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full"
      data-falling-petal-canvas
      data-falling-petal-theme={theme}
    />
  );
}

export function GardenScrollScene({ progress, theme }: GardenScrollSceneProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const gardenProgress = useTransform(progress, (value) => (reducedMotion ? 1 : value));
  const breezeX = useMotionValue(0);
  const [attachments, setAttachments] = useState<Record<string, VineAttachment>>({});
  const handleAttachmentsChange = useCallback((next: Record<string, VineAttachment>) => {
    setAttachments((current) => {
      const ids = Object.keys(next);
      const unchanged = ids.length === Object.keys(current).length && ids.every((id) => (
        current[id]
        && Math.abs(current[id].x - next[id].x) < 0.25
        && Math.abs(current[id].y - next[id].y) < 0.25
        && Math.abs(current[id].growth - next[id].growth) < 0.0001
      ));
      return unchanged ? current : next;
    });
  }, []);

  useEffect(() => {
    if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return;
    const handlePointer = (event: PointerEvent) => {
      breezeX.set(((event.clientX / window.innerWidth) * 2 - 1) * 4);
    };
    const settle = () => {
      breezeX.set(0);
    };
    window.addEventListener('pointermove', handlePointer, { passive: true });
    document.documentElement.addEventListener('mouseleave', settle);
    return () => {
      window.removeEventListener('pointermove', handlePointer);
      document.documentElement.removeEventListener('mouseleave', settle);
    };
  }, [breezeX, reducedMotion]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[15] overflow-hidden" aria-hidden="true" data-garden-scene>
      <PixelVineCanvas
        rawProgress={progress}
        reducedMotion={reducedMotion}
        theme={theme}
        onAttachmentsChange={handleAttachmentsChange}
      />

      {leafSprites.map((leaf) => (
        <PixelLeaf key={leaf.id} leaf={leaf} progress={gardenProgress} breezeX={breezeX} />
      ))}

      {bloomSprites.map((sprite) => (
        <PixelBloomSprite
          key={sprite.id}
          spec={sprite}
          attachment={attachments[sprite.id]}
          progress={gardenProgress}
          breezeX={breezeX}
          theme={theme}
        />
      ))}

      <PixelParticleCanvas progress={gardenProgress} reducedMotion={reducedMotion} theme={theme} />
      <FallingPetalCanvas reducedMotion={reducedMotion} theme={theme} />
    </div>
  );
}
