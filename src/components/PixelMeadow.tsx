import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { advanceCelestialCycle } from './celestialCycle';
import { gardenTiming } from './gardenTiming';
import { mapMeadowSceneProgress } from './scrollJourney';

type MeadowTheme = 'day' | 'evening';

type PixelMeadowProps = {
  progress: MotionValue<number>;
  journeyProgress: MotionValue<number>;
  pageProgress: MotionValue<number>;
  sectionRef: RefObject<HTMLElement | null>;
  theme: MeadowTheme;
  pointerX?: MotionValue<number>;
  pointerY?: MotionValue<number>;
  performanceReduced?: boolean;
};

type TerrainLayerSpec = {
  id: string;
  dayPath: string;
  eveningPath: string;
  contourReveal: [number, number];
  fillReveal: [number, number];
  opacity: number;
};

type TerrainTile = {
  sx: number;
  sy: number;
  size: number;
  threshold: number;
};

type LoadedTerrainLayer = {
  spec: TerrainLayerSpec;
  image: HTMLImageElement;
  tiles: TerrainTile[];
};

type BotanicalSpec = {
  id: string;
  frame: number;
  x: number;
  bottom: number;
  size: string;
  reveal: [number, number];
  depth: number;
  rotate?: number;
};

type CreatureKind = 'bee' | 'butterfly' | 'bird';

type WildAnimalKind = 'fox' | 'rabbit';

type CreatureSpec = {
  id: string;
  kind: CreatureKind;
  frame: number;
  idleFrame?: number;
  x: number;
  y: number;
  size: string;
  reveal: [number, number];
  direction?: number;
  drift?: number;
  phase?: number;
  speed?: number;
};

type WildAnimalSpec = {
  id: string;
  kind: WildAnimalKind;
  x: number;
  bottom: number;
  size: string;
  reveal: [number, number];
  depth: number;
  direction?: number;
};

type BushSpec = {
  id: string;
  x: number;
  bottom: number;
  size: string;
  reveal: [number, number];
  depth: number;
  variant: number;
  direction?: number;
};

type RoseSpriteSpec = {
  id: string;
  path: string;
  frameCount: number;
  bottom: number;
  size: string;
  grow: [number, number];
  bloom: [number, number];
};

const TERRAIN_TILE_SIZE = 6;
const TERRAIN_DPR_CAP = 1.25;

const terrainLayers: TerrainLayerSpec[] = [
  {
    id: 'distant',
    dayPath: '/garden-pixel/landscape-day-distant.png',
    eveningPath: '/garden-pixel/landscape-evening-distant.png',
    contourReveal: [0.42, 0.58],
    fillReveal: [0.48, 0.68],
    opacity: 0.56,
  },
  {
    id: 'midground',
    dayPath: '/garden-pixel/landscape-day-midground.png',
    eveningPath: '/garden-pixel/landscape-evening-midground.png',
    contourReveal: [0.5, 0.68],
    fillReveal: [0.57, 0.78],
    opacity: 0.76,
  },
  {
    id: 'foreground',
    dayPath: '/garden-pixel/landscape-day-foreground.png',
    eveningPath: '/garden-pixel/landscape-evening-foreground.png',
    contourReveal: [0.6, 0.76],
    fillReveal: [0.66, 0.9],
    opacity: 0.96,
  },
];

const moonlitStars = [
  { x: 12, y: 18, size: 2, delay: -1.2 },
  { x: 21, y: 29, size: 1, delay: -2.8 },
  { x: 31, y: 14, size: 1, delay: -0.5 },
  { x: 42, y: 25, size: 2, delay: -3.4 },
  { x: 53, y: 12, size: 1, delay: -1.8 },
  { x: 61, y: 31, size: 1, delay: -4.1 },
  { x: 72, y: 19, size: 2, delay: -2.2 },
  { x: 83, y: 27, size: 1, delay: -0.9 },
  { x: 91, y: 13, size: 1, delay: -3.1 },
] as const;

const meadowFireflies = [
  { x: 15, bottom: 25, delay: -0.6 },
  { x: 36, bottom: 19, delay: -2.4 },
  { x: 57, bottom: 27, delay: -1.3 },
  { x: 78, bottom: 20, delay: -3.2 },
  { x: 89, bottom: 30, delay: -1.9 },
] as const;

const botanicals: BotanicalSpec[] = [
  { id: 'grass-left', frame: 0, x: 5, bottom: 1, size: 'clamp(1.35rem, 2.4vw, 2rem)', reveal: [0.76, 0.86], depth: 34, rotate: -4 },
  { id: 'flowers-far-left', frame: 1, x: 10, bottom: 4, size: 'clamp(1rem, 1.8vw, 1.45rem)', reveal: [0.81, 0.9], depth: 35, rotate: 4 },
  { id: 'flowers-left', frame: 7, x: 18, bottom: 8, size: 'clamp(1.55rem, 2.7vw, 2.2rem)', reveal: [0.8, 0.9], depth: 36, rotate: -2 },
  { id: 'flowers-left-hill', frame: 3, x: 27, bottom: 15, size: 'clamp(1.05rem, 1.9vw, 1.5rem)', reveal: [0.85, 0.94], depth: 35, rotate: -4 },
  { id: 'grass-center-left', frame: 0, x: 34, bottom: 2, size: 'clamp(1.3rem, 2.3vw, 1.9rem)', reveal: [0.79, 0.88], depth: 34, rotate: 3 },
  { id: 'flowers-center-low', frame: 5, x: 42, bottom: 5, size: 'clamp(1.05rem, 1.9vw, 1.5rem)', reveal: [0.83, 0.92], depth: 36, rotate: -3 },
  { id: 'flowers-center', frame: 4, x: 51, bottom: 13, size: 'clamp(1.35rem, 2.4vw, 2rem)', reveal: [0.84, 0.93], depth: 35, rotate: 1 },
  { id: 'flowers-center-right-hill', frame: 6, x: 58, bottom: 9, size: 'clamp(.95rem, 1.75vw, 1.4rem)', reveal: [0.87, 0.96], depth: 35, rotate: 5 },
  { id: 'grass-center-right', frame: 0, x: 64, bottom: 3, size: 'clamp(1.45rem, 2.5vw, 2.05rem)', reveal: [0.82, 0.91], depth: 34, rotate: -3 },
  { id: 'flowers-right', frame: 2, x: 76, bottom: 6, size: 'clamp(1.4rem, 2.5vw, 2.05rem)', reveal: [0.87, 0.96], depth: 36, rotate: 2 },
  { id: 'flowers-right-hill', frame: 1, x: 89, bottom: 14, size: 'clamp(1rem, 1.8vw, 1.45rem)', reveal: [0.89, 0.98], depth: 35, rotate: -5 },
  { id: 'grass-right', frame: 0, x: 95, bottom: 1, size: 'clamp(1.35rem, 2.4vw, 2rem)', reveal: [0.85, 0.94], depth: 34, rotate: 4 },
];

const creatures: CreatureSpec[] = [
  { id: 'bird-far-left', kind: 'bird', frame: 5, x: 9, y: 21, size: 'clamp(.5rem, .9vw, .72rem)', reveal: [0.86, 0.94], direction: 1, phase: -1.7 },
  { id: 'bird-left', kind: 'bird', frame: 4, x: 27, y: 29, size: 'clamp(.72rem, 1.25vw, 1rem)', reveal: [0.88, 0.95], direction: 1 },
  { id: 'bird-right', kind: 'bird', frame: 4, x: 65, y: 24, size: 'clamp(.68rem, 1.15vw, .94rem)', reveal: [0.9, 0.97], direction: -1 },
  { id: 'bird-center', kind: 'bird', frame: 5, x: 46, y: 36, size: 'clamp(.58rem, 1vw, .82rem)', reveal: [0.92, 0.98], direction: 1 },
  { id: 'butterfly', kind: 'butterfly', frame: 2, idleFrame: 3, x: 25, y: 59, size: 'clamp(.88rem, 1.5vw, 1.2rem)', reveal: [0.91, 0.98], direction: -1 },
  { id: 'butterfly-left-trail', kind: 'butterfly', frame: 6, idleFrame: 3, x: 35, y: 68, size: 'clamp(.55rem, 1vw, .78rem)', reveal: [0.9, 0.97], direction: 1, drift: 6, phase: -2.1, speed: 4.2 },
  { id: 'butterfly-center-high', kind: 'butterfly', frame: 2, idleFrame: 3, x: 48, y: 50, size: 'clamp(.62rem, 1.1vw, .86rem)', reveal: [0.92, 0.98], direction: -1, drift: 5, phase: -3.4, speed: 5.2 },
  { id: 'butterfly-right', kind: 'butterfly', frame: 6, idleFrame: 3, x: 79, y: 63, size: 'clamp(.7rem, 1.25vw, 1rem)', reveal: [0.93, 0.99], direction: 1 },
  { id: 'butterfly-right-low', kind: 'butterfly', frame: 2, idleFrame: 3, x: 88, y: 72, size: 'clamp(.58rem, 1.05vw, .82rem)', reveal: [0.94, 1], direction: -1, drift: 6, phase: -1.2, speed: 4.5 },
  { id: 'bee', kind: 'bee', frame: 0, idleFrame: 1, x: 68, y: 57, size: 'clamp(.82rem, 1.4vw, 1.12rem)', reveal: [0.92, 0.99], direction: 1 },
  { id: 'bee-center-low', kind: 'bee', frame: 7, idleFrame: 1, x: 54, y: 73, size: 'clamp(.58rem, 1vw, .82rem)', reveal: [0.93, 0.99], direction: -1, drift: 3, phase: -1.8, speed: 3.2 },
  { id: 'bee-left', kind: 'bee', frame: 7, idleFrame: 1, x: 14, y: 68, size: 'clamp(.62rem, 1.1vw, .88rem)', reveal: [0.94, 1], direction: -1 },
  { id: 'bee-right-edge', kind: 'bee', frame: 0, idleFrame: 1, x: 94, y: 61, size: 'clamp(.5rem, .9vw, .74rem)', reveal: [0.95, 1], direction: 1, drift: 3, phase: -2.7, speed: 3.4 },
];

const wildAnimals: WildAnimalSpec[] = [
  {
    id: 'resting-fox',
    kind: 'fox',
    x: 70,
    bottom: 27,
    size: 'clamp(1.8rem, 2.6vw, 2.45rem)',
    reveal: [0.72, 0.86],
    depth: 22,
    direction: 1,
  },
  {
    id: 'rabbit-left',
    kind: 'rabbit',
    x: 21,
    bottom: 7,
    size: 'clamp(1.25rem, 2vw, 1.8rem)',
    reveal: [0.82, 0.92],
    depth: 33,
    direction: 1,
  },
  {
    id: 'rabbit-right',
    kind: 'rabbit',
    x: 61,
    bottom: 10,
    size: 'clamp(1.15rem, 1.9vw, 1.7rem)',
    reveal: [0.86, 0.96],
    depth: 33,
    direction: -1,
  },
  {
    id: 'rabbit-center-small',
    kind: 'rabbit',
    x: 44,
    bottom: 7,
    size: 'clamp(.9rem, 1.5vw, 1.3rem)',
    reveal: [0.89, 0.97],
    depth: 34,
    direction: -1,
  },
];

const bushes: BushSpec[] = [
  { id: 'bush-far-left', x: 5, bottom: 11, size: 'clamp(2.4rem, 4.4vw, 3.9rem)', reveal: [0.7, 0.82], depth: 25, variant: 0, direction: 1 },
  { id: 'bush-left', x: 31, bottom: 8, size: 'clamp(2.75rem, 5vw, 4.4rem)', reveal: [0.74, 0.86], depth: 31, variant: 1, direction: -1 },
  { id: 'bush-center', x: 48, bottom: 19, size: 'clamp(2.15rem, 3.8vw, 3.4rem)', reveal: [0.72, 0.84], depth: 24, variant: 2, direction: 1 },
  { id: 'bush-right', x: 73, bottom: 7, size: 'clamp(2.7rem, 4.8vw, 4.25rem)', reveal: [0.78, 0.9], depth: 31, variant: 0, direction: -1 },
  { id: 'bush-far-right', x: 94, bottom: 12, size: 'clamp(2.25rem, 4vw, 3.55rem)', reveal: [0.8, 0.92], depth: 25, variant: 1, direction: -1 },
];

const finalRose: RoseSpriteSpec = {
  id: 'final-rose',
  path: '/garden-pixel/rose-bloom-detailed-strip.png?v=rounded-1',
  frameCount: 8,
  bottom: 10,
  size: 'clamp(2.55rem, 4.1vw, 3.4rem)',
  grow: gardenTiming.finalRose.grow,
  bloom: gardenTiming.finalRose.bloom,
};

const roseHeadVisiblePercent = [64, 64, 66, 68, 71, 72, 73, 73];

function roseBloomFrame(value: number, bloom: [number, number], frameCount: number) {
  const bloomProgress = Math.max(0, Math.min(1, (value - bloom[0]) / (bloom[1] - bloom[0])));
  const finalVisibleFrame = Math.max(0, frameCount - 2);
  return Math.min(finalVisibleFrame, Math.floor(bloomProgress * (finalVisibleFrame + 1)));
}

function deterministicNoise(x: number, y: number) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createTerrainTiles(image: HTMLImageElement, spec: TerrainLayerSpec) {
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = image.naturalWidth;
  sourceCanvas.height = image.naturalHeight;
  const context = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!context) return [];

  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
  const alphaAt = (x: number, y: number) => {
    const safeX = Math.max(0, Math.min(sourceCanvas.width - 1, x));
    const safeY = Math.max(0, Math.min(sourceCanvas.height - 1, y));
    return pixels[(safeY * sourceCanvas.width + safeX) * 4 + 3];
  };
  const candidates: Array<{
    sx: number;
    sy: number;
    sampleX: number;
    sampleY: number;
    isContour: boolean;
  }> = [];
  let minVisibleY = sourceCanvas.height;
  let maxVisibleY = 0;

  for (let sy = 0; sy < sourceCanvas.height; sy += TERRAIN_TILE_SIZE) {
    for (let sx = 0; sx < sourceCanvas.width; sx += TERRAIN_TILE_SIZE) {
      const sampleX = Math.min(sourceCanvas.width - 1, sx + Math.floor(TERRAIN_TILE_SIZE / 2));
      const sampleY = Math.min(sourceCanvas.height - 1, sy + Math.floor(TERRAIN_TILE_SIZE / 2));
      const samples = [
        alphaAt(sampleX, sampleY),
        alphaAt(sx, sy),
        alphaAt(Math.min(sourceCanvas.width - 1, sx + TERRAIN_TILE_SIZE - 1), sampleY),
        alphaAt(sampleX, Math.min(sourceCanvas.height - 1, sy + TERRAIN_TILE_SIZE - 1)),
      ];
      if (Math.max(...samples) < 24) continue;

      minVisibleY = Math.min(minVisibleY, sampleY);
      maxVisibleY = Math.max(maxVisibleY, sampleY);
      candidates.push({
        sx,
        sy,
        sampleX,
        sampleY,
        isContour: alphaAt(sampleX, Math.max(0, sy - 2)) < 24,
      });
    }
  }

  const visibleHeight = Math.max(1, maxVisibleY - minVisibleY);
  const tiles = candidates.map((candidate) => {
    const xRatio = candidate.sampleX / sourceCanvas.width;
    const yRatio = (candidate.sampleY - minVisibleY) / visibleHeight;
    const noise = (deterministicNoise(candidate.sx, candidate.sy) - 0.5) * 0.025;
    const threshold = candidate.isContour
      ? spec.contourReveal[0] + xRatio * (spec.contourReveal[1] - spec.contourReveal[0])
      : spec.fillReveal[0] + (1 - yRatio) * (spec.fillReveal[1] - spec.fillReveal[0]) + noise;

    return {
      sx: candidate.sx,
      sy: candidate.sy,
      size: TERRAIN_TILE_SIZE,
      threshold: Math.max(0, Math.min(1, threshold)),
    };
  });

  return tiles.sort((a, b) => a.threshold - b.threshold);
}

function loadImage(path: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load meadow terrain: ${path}`));
    image.src = path;
  });
}

function PixelTerrainCanvas({
  progress,
  reducedMotion,
  theme,
  performanceReduced,
}: {
  progress: MotionValue<number>;
  reducedMotion: boolean;
  theme: MeadowTheme;
  performanceReduced: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let loadedLayers: LoadedTerrainLayer[] = [];
    let frame: number | null = null;
    let isVisible = !document.hidden;
    let cancelled = false;

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, performanceReduced ? 1 : TERRAIN_DPR_CAP);
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.imageSmoothingEnabled = false;
    };

    const draw = () => {
      frame = null;
      context.clearRect(0, 0, width, height);
      if (!isVisible) return;

      const value = reducedMotion ? 1 : progress.get();
      let drawnTiles = 0;
      for (const layer of loadedLayers) {
        const sourceWidth = layer.image.naturalWidth;
        const sourceHeight = layer.image.naturalHeight;

        if (layer.spec.id === 'distant' && value < 0.5) {
          const bridgeFade = Math.max(0, Math.min(1, (value - 0.28) / 0.22));
          context.globalAlpha = layer.spec.opacity * 0.32 * (1 - bridgeFade);
          context.drawImage(layer.image, 0, 0, sourceWidth, sourceHeight, 0, 0, width, height);
        }

        context.globalAlpha = layer.spec.opacity;

        for (const tile of layer.tiles) {
          if (tile.threshold > value) break;
          const dx = Math.floor((tile.sx / sourceWidth) * width);
          const dy = Math.floor((tile.sy / sourceHeight) * height);
          const dw = Math.ceil((tile.size / sourceWidth) * width) + 0.5;
          const dh = Math.ceil((tile.size / sourceHeight) * height) + 0.5;
          context.drawImage(
            layer.image,
            tile.sx,
            tile.sy,
            tile.size,
            tile.size,
            dx,
            dy,
            dw,
            dh,
          );
          drawnTiles += 1;
        }
      }
      context.globalAlpha = 1;
      canvas.dataset.meadowDrawProgress = value.toFixed(3);
      canvas.dataset.meadowDrawnTiles = String(drawnTiles);
    };

    const scheduleDraw = () => {
      if (frame === null) frame = requestAnimationFrame(draw);
    };
    const handleResize = () => {
      resize();
      scheduleDraw();
    };
    const handleVisibility = () => {
      isVisible = !document.hidden;
      scheduleDraw();
    };

    const loadLayers = async () => {
      try {
        loadedLayers = await Promise.all(terrainLayers.map(async (spec) => {
          const image = await loadImage(theme === 'evening' ? spec.eveningPath : spec.dayPath);
          return { spec, image, tiles: createTerrainTiles(image, spec) };
        }));
        if (!cancelled) scheduleDraw();
      } catch (error) {
        console.error(error);
      }
    };

    resize();
    const unsubscribe = progress.on('change', scheduleDraw);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);
    void loadLayers();

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [performanceReduced, progress, reducedMotion, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 h-full w-full"
      data-meadow-terrain-canvas
      data-meadow-theme={theme}
    />
  );
}

function useRange(progress: MotionValue<number>, input: [number, number], output: [number, number]) {
  return useTransform(progress, input, output, { clamp: true });
}

function PixelMoon() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-full w-full overflow-visible"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path
        fill="#F7EBC1"
        d="M23 2h-9v2h-4v3H7v4H5v10h2v4h3v3h4v2h9v-3h-4v-2h-3v-3h-2v-4h-1v-4h1v-4h2V7h3V5h4z"
      />
      <path fill="#D8C793" d="M10 7h5v3h-2v5H9v-4h1zM7 15h5v6H8v-2H7zm3 8h5v3h-5z" />
      <path fill="#A99868" d="M14 4h5v2h-5zM5 13h3v7H5zm3 10h3v3H8z" />
      <path fill="#F7EBC1" d="M24 11h2v2h2v2h-2v2h-2v-2h-2v-2h2z" />
      <rect x="28" y="6" width="2" height="2" fill="#F7EBC1" opacity=".72" />
      <rect x="27" y="23" width="1" height="1" fill="#D8C793" opacity=".72" />
    </svg>
  );
}

function CelestialCycle({
  theme,
  reducedMotion,
}: {
  theme: MeadowTheme;
  reducedMotion: boolean;
}) {
  const cycleRef = useRef({ theme, cycle: 0 });
  cycleRef.current = advanceCelestialCycle(cycleRef.current, theme);
  const cycle = cycleRef.current.cycle;
  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.9, ease: [0.45, 0, 0.2, 1] as const };

  return (
    <AnimatePresence initial={false} mode="sync">
      <motion.div
        key={`${theme}-${cycle}`}
        initial={reducedMotion ? false : { x: '-34vw', y: '18vh', rotate: -34, opacity: 0 }}
        animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
        exit={reducedMotion ? { opacity: 0 } : { x: '58vw', y: '18vh', rotate: 34, opacity: 0 }}
        transition={transition}
        className="pixel-garden-sprite absolute inset-0 h-full w-full"
        data-meadow-celestial-body={theme === 'evening' ? 'moon' : 'sun'}
        data-meadow-celestial-cycle={cycle}
      >
        {theme === 'evening' ? (
          <div className="h-full w-full -rotate-12 scale-110">
            <PixelMoon />
          </div>
        ) : (
          <div
            className="h-full w-full"
            style={{
              backgroundImage: 'url(/garden-pixel/meadow-sun-detailed.png)',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function MeadowAtmosphere({
  progress,
  theme,
  reducedMotion,
}: {
  progress: MotionValue<number>;
  theme: MeadowTheme;
  reducedMotion: boolean;
}) {
  const opacity = useRange(progress, [0.42, 0.74], [0, 1]);

  return (
    <motion.div
      className="absolute inset-0 z-[1] overflow-hidden"
      style={{ opacity: reducedMotion ? 1 : opacity }}
      data-meadow-atmosphere={theme}
    >
      <div
        className={`absolute inset-0 ${
          theme === 'evening'
            ? 'bg-[radial-gradient(circle_at_27%_54%,rgba(160,203,188,0.11),transparent_24%),radial-gradient(circle_at_74%_42%,rgba(217,130,147,0.07),transparent_20%),linear-gradient(to_bottom,rgba(114,151,151,0.06),transparent_54%)]'
            : 'bg-[radial-gradient(circle_at_27%_54%,rgba(255,223,158,0.13),transparent_25%),linear-gradient(to_bottom,rgba(255,244,209,0.08),transparent_58%)]'
        }`}
      />

      {theme === 'evening' && (
        <>
          <div className="absolute inset-x-0 top-[8%] h-[36%]">
            {moonlitStars.map((star) => (
              <span
                key={`${star.x}-${star.y}`}
                className="meadow-star absolute bg-[#DCE8D0] shadow-[0_0_5px_rgba(189,213,178,0.34)]"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: star.size,
                  height: star.size,
                  animationDelay: `${star.delay}s`,
                }}
              />
            ))}
          </div>
          {meadowFireflies.map((firefly) => (
            <span
              key={`${firefly.x}-${firefly.bottom}`}
              className="meadow-firefly absolute h-[3px] w-[3px] bg-[#D9E7A8] shadow-[0_0_7px_rgba(203,225,155,0.72)]"
              style={{
                left: `${firefly.x}%`,
                bottom: `${firefly.bottom}%`,
                animationDelay: `${firefly.delay}s`,
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}

function BotanicalSprite({
  spec,
  progress,
}: {
  spec: BotanicalSpec;
  progress: MotionValue<number>;
}) {
  const opacity = useRange(progress, spec.reveal, [0, 1]);
  const scale = useRange(progress, spec.reveal, [0.5, 1]);

  return (
    <motion.div
      className="pixel-garden-sprite absolute"
      style={{
        left: `${spec.x}%`,
        bottom: `${spec.bottom}%`,
        width: spec.size,
        aspectRatio: '1 / 1',
        opacity,
        scale,
        rotate: spec.rotate ?? 0,
        translateX: '-50%',
        backgroundImage: 'url(/garden-pixel/meadow-botanical-detailed-strip.png)',
        backgroundSize: '800% 100%',
        backgroundPosition: `${spec.frame * (100 / 7)}% 0%`,
        backgroundRepeat: 'no-repeat',
        transformOrigin: '50% 100%',
        zIndex: spec.depth,
      }}
      data-meadow-botanical={spec.id}
    />
  );
}

function FinalRose({
  spec,
  progress,
  scrollRange,
  reducedMotion,
}: {
  spec: RoseSpriteSpec;
  progress: MotionValue<number>;
  scrollRange: number;
  reducedMotion: boolean;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const anchorReadyRef = useRef(false);
  const [isAnchorReady, setIsAnchorReady] = useState(false);
  const anchorX = useMotionValue(0);
  const anchorY = useMotionValue(0);
  const anchorWidth = useMotionValue(0);
  const anchorHeight = useMotionValue(0);
  const opacity = useRange(progress, spec.grow, [0, 1]);
  const scale = useRange(progress, spec.grow, [0.5, 1]);
  const backgroundPosition = useTransform(progress, (value) => {
    const frame = roseBloomFrame(value, spec.bloom, spec.frameCount);
    return `${frame * (100 / (spec.frameCount - 1))}% 0%`;
  });
  const headClip = useTransform(progress, (value) => {
    const visible = roseHeadVisiblePercent[roseBloomFrame(value, spec.bloom, spec.frameCount)];
    return `inset(0 0 ${100 - visible}% 0)`;
  });
  const headY = useTransform(progress, (value) => {
    const visible = roseHeadVisiblePercent[roseBloomFrame(value, spec.bloom, spec.frameCount)];
    return `${100 - visible}%`;
  });
  const connectionY = useTransform(progress, (value) => (
    reducedMotion ? 0 : (value - 1) * scrollRange
  ));
  const portalY = useTransform([anchorY, connectionY], ([rawAnchorY, rawConnectionY]) => (
    Number(rawAnchorY) + Number(rawConnectionY)
  ));
  const trackingStart = Math.max(0, spec.grow[0] - 0.08);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const rect = anchor.getBoundingClientRect();
      anchorX.set(rect.left);
      anchorY.set(rect.top);
      anchorWidth.set(rect.width);
      anchorHeight.set(rect.height);
      if (!anchorReadyRef.current) {
        anchorReadyRef.current = true;
        setIsAnchorReady(true);
      }
    };
    const scheduleMeasure = () => {
      if (frame !== null) return;
      if (!reducedMotion && progress.get() < trackingStart) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(anchor);
    window.addEventListener('scroll', scheduleMeasure, { passive: true });
    window.addEventListener('resize', scheduleMeasure);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [anchorHeight, anchorWidth, anchorX, anchorY, progress, reducedMotion, trackingStart]);

  return (
    <>
      <div
        ref={anchorRef}
        className="absolute left-[30%] sm:left-[84%]"
        style={{
          bottom: `${spec.bottom}%`,
          width: spec.size,
          aspectRatio: '1 / 1',
          transform: 'translateX(-50%)',
        }}
        data-meadow-final-rose-anchor
      />
      {isAnchorReady && createPortal(
        <motion.div
          className="pointer-events-none fixed"
          style={{
            left: 0,
            top: 0,
            width: anchorWidth,
            height: anchorHeight,
            opacity,
            scale,
            x: anchorX,
            y: portalY,
            transformOrigin: '50% 100%',
            zIndex: 40,
          }}
          data-meadow-final-rose
        >
          <motion.span
            className="pixel-garden-sprite block h-full w-full"
            style={{
              clipPath: headClip,
              y: headY,
              backgroundImage: `url(${spec.path})`,
              backgroundSize: `${spec.frameCount * 100}% 100%`,
              backgroundPosition,
              backgroundRepeat: 'no-repeat',
            }}
          />
        </motion.div>,
        document.body,
      )}
    </>
  );
}

function CreatureSprite({
  spec,
  progress,
  isIdle,
  reducedMotion,
}: {
  spec: CreatureSpec;
  progress: MotionValue<number>;
  isIdle: boolean;
  reducedMotion: boolean;
}) {
  const [alternateFrame, setAlternateFrame] = useState(false);
  const opacity = useRange(progress, spec.reveal, [0, spec.kind === 'bird' ? 0.62 : 0.94]);
  const scale = useRange(progress, spec.reveal, [0.55, 1]);
  const canIdle = isIdle && !reducedMotion && spec.kind !== 'bird';

  useEffect(() => {
    if (!canIdle) {
      setAlternateFrame(false);
      return;
    }
    const interval = window.setInterval(
      () => setAlternateFrame((current) => !current),
      spec.kind === 'butterfly' ? 480 : 380,
    );
    return () => window.clearInterval(interval);
  }, [canIdle, spec.kind]);

  const idleAnimation = !canIdle
    ? { x: 0, y: 0, rotate: 0 }
    : spec.kind === 'bee'
      ? { x: [0, (spec.drift ?? 4), -2, 0], y: [0, -3, 1, 0], rotate: [0, 2, -1, 0] }
      : { x: [0, (spec.drift ?? 4) * (spec.direction ?? 1), 0], y: [0, -4, 0], rotate: [0, 2 * (spec.direction ?? 1), 0] };
  const frame = alternateFrame ? (spec.idleFrame ?? spec.frame + 1) : spec.frame;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${spec.x}%`,
        top: `${spec.y}%`,
        width: spec.size,
        aspectRatio: '1 / 1',
        opacity,
        scale,
        translateX: '-50%',
        translateY: '-50%',
        zIndex: spec.kind === 'bird' ? 18 : 46,
      }}
      data-meadow-creature={spec.id}
    >
      <motion.div
        className="pixel-garden-sprite h-full w-full"
        animate={idleAnimation}
        transition={{
          duration: spec.speed ?? (spec.kind === 'bee' ? 2.8 : 4.8),
          delay: spec.phase ?? 0,
          repeat: canIdle ? Infinity : 0,
          ease: 'easeInOut',
        }}
        style={{
          backgroundImage: 'url(/garden-pixel/meadow-creatures-detailed-strip.png)',
          backgroundSize: '800% 100%',
          backgroundPosition: `${frame * (100 / 7)}% 0%`,
          backgroundRepeat: 'no-repeat',
        }}
      />
    </motion.div>
  );
}

function PixelRabbit({
  theme,
  isIdle,
  reducedMotion,
}: {
  theme: MeadowTheme;
  isIdle: boolean;
  reducedMotion: boolean;
}) {
  const outline = theme === 'evening' ? '#26302A' : '#554B3D';
  const fur = theme === 'evening' ? '#92957F' : '#C9BDA4';
  const light = theme === 'evening' ? '#C4C6AA' : '#EFE3C9';
  const shadow = theme === 'evening' ? '#606753' : '#998A72';
  const pink = theme === 'evening' ? '#B97982' : '#D99B9C';

  return (
    <svg viewBox="0 0 64 72" className="h-full w-full overflow-visible" shapeRendering="crispEdges">
      <motion.g
        animate={isIdle && !reducedMotion ? { rotate: [0, -1.2, 0, 1.2, 0] } : { rotate: 0 }}
        transition={{ duration: 4.2, repeat: isIdle && !reducedMotion ? Infinity : 0, ease: 'easeInOut' }}
        style={{ transformOrigin: '32px 64px' }}
      >
        <path fill={outline} d="M22 2h8v26h-8zM36 0h8v29h-8zM18 27h7v-6h22v5h7v8h5v18h-6v8h-9v6H18v-4H9v-7H4V39h5v-7h9z" />
        <path fill={fur} d="M24 5h4v24h-4zM38 3h4v26h-4zM19 30h7v-6h19v5h7v8h5v13h-6v7h-9v5H20v-4h-9v-6H7V41h5v-7h7z" />
        <path fill={shadow} d="M20 29h10v7h-8v9h-9V35h7zM38 48h13v9h-9v5H29v-6h9zM22 24h8v6h-8z" />
        <path fill={light} d="M13 41h14v14h-7v4h-7zM27 35h14v14H27zM43 31h8v8h-8z" />
        <path fill={pink} d="M25 7h2v18h-2zM39 5h2v19h-2zM8 42h5v4H8z" />
        <rect x="45" y="34" width="4" height="4" fill="#201D19" />
        <rect x="52" y="41" width="5" height="3" fill={pink} />
        <rect x="22" y="61" width="12" height="4" fill={outline} />
        <rect x="39" y="58" width="13" height="4" fill={outline} />
        <rect x="28" y="39" width="3" height="3" fill={shadow} opacity=".75" />
        <rect x="33" y="45" width="2" height="2" fill={shadow} opacity=".72" />
        <rect x="17" y="48" width="3" height="3" fill={fur} opacity=".82" />
      </motion.g>
    </svg>
  );
}

function PixelFox({
  theme,
  isIdle,
  reducedMotion,
}: {
  theme: MeadowTheme;
  isIdle: boolean;
  reducedMotion: boolean;
}) {
  const outline = theme === 'evening' ? '#312521' : '#5A3328';
  const fur = theme === 'evening' ? '#A2583F' : '#C96E47';
  const light = theme === 'evening' ? '#C89B7E' : '#F0C29B';
  const shadow = theme === 'evening' ? '#693B34' : '#984A37';

  return (
    <svg viewBox="0 0 112 96" className="h-full w-full overflow-visible" shapeRendering="crispEdges">
      <motion.g
        animate={isIdle && !reducedMotion ? { y: [0, -0.5, 0], rotate: [0, 0.25, 0] } : { y: 0, rotate: 0 }}
        transition={{ duration: 5.4, repeat: isIdle && !reducedMotion ? Infinity : 0, ease: 'easeInOut' }}
        style={{ transformOrigin: '55px 89px' }}
      >
        <path fill={outline} d="M5 33h9v-9h9V8h12v13h14V7h12v20h8v8h7v17h-8v8h-8v27h-7v6H27v-5h-8V60h-7v-6H3v-8H0V37h5z" />
        <path fill={fur} d="M8 36h9v-9h9V13h7v13h19V12h6v18h8v8h6v11h-8v8h-9v27h-7v6H31v-5h-8V57h-8v-6H6v-4H3v-7h5z" />
        <path fill={shadow} d="M17 29h16v8h-9v13h-9V38h2zM44 31h17v7h5v12H54v-8H44zM25 58h15v27h-8v-8h-7zM45 60h10v24h-7V72h-3z" />
        <path fill={light} d="M8 39h22v10h-7v6H12v-5H5v-7h3zM35 46h20v11h-7v7H39v-9h-4z" />
        <path fill={outline} d="M23 9h12v20H18V21h5zM49 8h12v22H44V21h5z" />
        <path fill={fur} d="M26 14h6v12H22v-4h4zM52 13h6v14H48v-5h4z" />
        <rect x="27" y="35" width="5" height="5" fill="#211B18" />
        <rect x="2" y="41" width="6" height="4" fill="#211B18" />
        <rect x="20" y="28" width="4" height="3" fill={light} opacity=".72" />
        <rect x="48" y="30" width="4" height="3" fill={shadow} opacity=".78" />
        <rect x="35" y="68" width="4" height="4" fill={shadow} opacity=".72" />
        <motion.g
          animate={isIdle && !reducedMotion ? { rotate: [0, 2, -1, 0] } : { rotate: 0 }}
          transition={{ duration: 3.8, repeat: isIdle && !reducedMotion ? Infinity : 0, ease: 'easeInOut' }}
          style={{ transformOrigin: '60px 77px' }}
        >
          <path fill={outline} d="M55 61h16v-7h16v5h13v7h9v8h3v13h-7v6H69v-8h13v-6H65v-6H55z" />
          <path fill={fur} d="M59 64h14v-7h12v5h13v7h8v5h3v10h-7v6H73v-5h13v-9H69v-6H59z" />
          <path fill={shadow} d="M63 67h15v6h16v8H78v-5H63z" />
          <path fill={light} d="M98 69h8v6h3v9h-7v6H91v-8h7z" />
        </motion.g>
        <rect x="22" y="88" width="20" height="5" fill={outline} />
        <rect x="45" y="87" width="16" height="5" fill={outline} />
      </motion.g>
    </svg>
  );
}

function WildAnimalSprite({
  spec,
  progress,
  theme,
  isIdle,
  reducedMotion,
}: {
  spec: WildAnimalSpec;
  progress: MotionValue<number>;
  theme: MeadowTheme;
  isIdle: boolean;
  reducedMotion: boolean;
}) {
  const opacity = useRange(progress, spec.reveal, [0, spec.kind === 'fox' ? 0.88 : 0.96]);
  const scale = useRange(progress, spec.reveal, [0.58, 1]);

  return (
    <motion.div
      className="pixel-garden-sprite absolute"
      style={{
        left: `${spec.x}%`,
        bottom: `${spec.bottom}%`,
        width: spec.size,
        aspectRatio: spec.kind === 'fox' ? '7 / 6' : '8 / 9',
        opacity,
        scale,
        scaleX: spec.direction ?? 1,
        translateX: '-50%',
        transformOrigin: '50% 100%',
        zIndex: spec.depth,
      }}
      data-meadow-wild-animal={spec.id}
      data-meadow-wild-animal-kind={spec.kind}
    >
      {spec.kind === 'fox' ? (
        <PixelFox theme={theme} isIdle={isIdle} reducedMotion={reducedMotion} />
      ) : (
        <PixelRabbit theme={theme} isIdle={isIdle} reducedMotion={reducedMotion} />
      )}
    </motion.div>
  );
}

function PixelBush({
  spec,
  progress,
  theme,
  isIdle,
  reducedMotion,
}: {
  spec: BushSpec;
  progress: MotionValue<number>;
  theme: MeadowTheme;
  isIdle: boolean;
  reducedMotion: boolean;
}) {
  const opacity = useRange(progress, spec.reveal, [0, spec.depth < 30 ? 0.72 : 0.92]);
  const scale = useRange(progress, spec.reveal, [0.55, 1]);
  const outline = theme === 'evening' ? '#223526' : '#35533A';
  const shadow = theme === 'evening' ? '#344D36' : '#496E49';
  const leaf = theme === 'evening' ? '#536F4B' : '#648B58';
  const light = theme === 'evening' ? '#789265' : '#8FA873';
  const blossom = theme === 'evening' ? '#C45582' : '#C86B77';
  const blossomLight = theme === 'evening' ? '#F19ABB' : '#F0A493';
  const berries = theme === 'evening' ? '#8E315F' : '#8C354C';
  const offset = spec.variant * 3;

  return (
    <motion.div
      className="pixel-garden-sprite absolute"
      style={{
        left: `${spec.x}%`,
        bottom: `${spec.bottom}%`,
        width: spec.size,
        aspectRatio: '5 / 3',
        opacity,
        scale,
        scaleX: spec.direction ?? 1,
        translateX: '-50%',
        transformOrigin: '50% 100%',
        zIndex: spec.depth,
      }}
      data-meadow-bush={spec.id}
    >
      <motion.svg
        viewBox="0 0 80 48"
        className="h-full w-full overflow-visible"
        shapeRendering="crispEdges"
        animate={isIdle && !reducedMotion ? { rotate: [0, 0.6, -0.35, 0] } : { rotate: 0 }}
        transition={{ duration: 6 + spec.variant, repeat: isIdle && !reducedMotion ? Infinity : 0, ease: 'easeInOut' }}
        style={{ transformOrigin: '40px 46px' }}
      >
        <path fill={outline} d="M4 31h7V21h8v-8h10V7h14v5h12v7h10v7h8v15h-7v5H8v-5H1V34h3z" />
        <path fill={shadow} d="M7 32h7V23h8v-7h10v-6h10v5h12v7h9v7h7v10h-7v4H10v-4H4v-5h3z" />
        <path fill={leaf} d="M14 28h11V17h12v-5h8v7h12v6h9v11h-8v5H17v-5H9v-4h5z" />
        <path fill={light} d={`M${18 + offset} 19h8v5h-8zM${38 - offset} 16h9v5h-9zM${53 + offset} 27h8v5h-8zM${27 - offset} 32h7v4h-7z`} />
        <path fill={outline} d="M15 41h5v7h-5zM35 40h5v8h-5zM58 40h5v8h-5z" />
        <rect x={20 + offset} y="25" width="4" height="4" fill={blossom} />
        <rect x={21 + offset} y="24" width="2" height="2" fill={blossomLight} />
        <rect x={45 - offset} y="29" width="5" height="4" fill={blossom} />
        <rect x={46 - offset} y="28" width="2" height="2" fill={blossomLight} />
        <rect x={58 + offset} y="20" width="4" height="4" fill={berries} />
        <rect x={31 - offset} y="19" width="3" height="3" fill={berries} />
        <rect x={64 - offset} y="34" width="3" height="3" fill={blossomLight} />
        <rect x={12 + offset} y="34" width="3" height="3" fill={berries} />
      </motion.svg>
    </motion.div>
  );
}

export function PixelMeadow({
  progress,
  journeyProgress,
  pageProgress,
  sectionRef,
  theme,
  pointerX,
  pointerY,
  performanceReduced = false,
}: PixelMeadowProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const decorativeMotionReduced = reducedMotion || performanceReduced;
  const fallbackPointerX = useMotionValue(0);
  const fallbackPointerY = useMotionValue(0);
  const meadowPointerX = pointerX ?? fallbackPointerX;
  const meadowPointerY = pointerY ?? fallbackPointerY;
  const [mobileMotion, setMobileMotion] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  ));
  const [backdropHost, setBackdropHost] = useState<HTMLElement | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [scrollRange, setScrollRange] = useState(0);
  const visualProgress = useTransform(
    [progress, journeyProgress],
    ([localProgress, globalProgress]) => mapMeadowSceneProgress(
      Number(localProgress),
      Number(globalProgress),
      reducedMotion,
    ),
  );
  const finalRoseProgress = useTransform(pageProgress, (value) => (reducedMotion ? 1 : value));
  const celestialOpacity = useRange(visualProgress, [0.5, 0.72], [0, 0.82]);
  const celestialScale = useRange(visualProgress, [0.5, 0.72], [0.72, 1]);
  const pointerTravelX = mobileMotion ? 10 : 24;
  const pointerTravelY = mobileMotion ? 7 : 16;
  const pointerTilt = mobileMotion ? 0.85 : 2;
  const sceneX = useTransform(meadowPointerX, [-0.5, 0.5], decorativeMotionReduced ? [0, 0] : [-pointerTravelX, pointerTravelX]);
  const scenePointerY = useTransform(meadowPointerY, [-0.5, 0.5], decorativeMotionReduced ? [0, 0] : [-pointerTravelY, pointerTravelY]);
  const sceneDollyY = useTransform(visualProgress, [0, 0.42, 0.76, 1], reducedMotion ? [0, 0, 0, 0] : [46, 14, -18, -38]);
  const sceneY = useTransform([scenePointerY, sceneDollyY], ([pointerOffset, dollyOffset]) => (
    Number(pointerOffset) + Number(dollyOffset)
  ));
  const sceneRotateX = useTransform(meadowPointerY, [-0.5, 0.5], decorativeMotionReduced ? [0, 0] : [pointerTilt, -pointerTilt]);
  const sceneScale = useTransform(visualProgress, [0, 0.45, 0.78, 1], reducedMotion ? [1, 1, 1, 1] : [1, 1.025, 1.085, 1.12]);
  const celestialX = useTransform(visualProgress, [0.48, 0.7, 1], reducedMotion ? [0, 0, 0] : [-44, 0, 28]);
  const celestialY = useTransform(visualProgress, [0.48, 0.7, 1], reducedMotion ? [0, 0, 0] : [30, -12, 7]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateMobileMotion = () => setMobileMotion(mediaQuery.matches);
    updateMobileMotion();
    mediaQuery.addEventListener('change', updateMobileMotion);
    return () => mediaQuery.removeEventListener('change', updateMobileMotion);
  }, []);

  useEffect(() => {
    setBackdropHost(sectionRef.current?.closest<HTMLElement>('[data-living-archive]') ?? null);
  }, [sectionRef]);

  useEffect(() => {
    const updateScrollRange = () => {
      setScrollRange(Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
    };
    updateScrollRange();
    const layoutObserver = new ResizeObserver(updateScrollRange);
    layoutObserver.observe(document.documentElement);
    window.addEventListener('resize', updateScrollRange);
    window.addEventListener('load', updateScrollRange);
    return () => {
      layoutObserver.disconnect();
      window.removeEventListener('resize', updateScrollRange);
      window.removeEventListener('load', updateScrollRange);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setIsIdle(false);
      return;
    }

    const updateIdleState = () => {
      const remainingScroll = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      setIsIdle(remainingScroll <= 1);
    };
    let frame: number | null = null;
    const scheduleIdleStateUpdate = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        updateIdleState();
      });
    };

    updateIdleState();
    const unsubscribe = progress.on('change', scheduleIdleStateUpdate);
    window.addEventListener('scroll', scheduleIdleStateUpdate, { passive: true });
    window.addEventListener('resize', scheduleIdleStateUpdate);
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', scheduleIdleStateUpdate);
      window.removeEventListener('resize', scheduleIdleStateUpdate);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [progress, reducedMotion]);

  return (
    <>
      {backdropHost && createPortal(
        <motion.div
          className="pointer-events-none fixed inset-0 z-10 overflow-hidden [transform-style:preserve-3d]"
          style={{ x: sceneX, y: sceneY, rotateX: sceneRotateX, scale: sceneScale }}
          aria-hidden="true"
          data-meadow-backdrop-layer
        >
          <MeadowAtmosphere progress={visualProgress} theme={theme} reducedMotion={decorativeMotionReduced} />
          <PixelTerrainCanvas
            progress={visualProgress}
            reducedMotion={reducedMotion}
            theme={theme}
            performanceReduced={performanceReduced}
          />
        </motion.div>,
        backdropHost,
      )}

      <section
        ref={sectionRef}
        className="pixel-meadow pointer-events-none relative h-full min-h-[30rem] w-full overflow-hidden [transform-style:preserve-3d]"
        aria-hidden="true"
        data-pixel-meadow
        data-meadow-idle={isIdle ? 'true' : 'false'}
        data-meadow-reduced-motion={reducedMotion ? 'true' : 'false'}
      >
        <motion.div
          className="absolute inset-0 [transform-style:preserve-3d]"
          style={{ x: sceneX, y: sceneY, rotateX: sceneRotateX, scale: sceneScale }}
          data-meadow-scene-plane
        >

        <motion.div
          className="absolute bottom-[39%] left-[27%] z-[5] w-[clamp(2.5rem,4.6vw,3.8rem)]"
          style={{
            aspectRatio: '1 / 1',
            opacity: reducedMotion ? 0.82 : celestialOpacity,
            scale: reducedMotion ? 1 : celestialScale,
            x: celestialX,
            y: celestialY,
            translateX: '-50%',
          }}
          data-meadow-celestial
        >
          <CelestialCycle theme={theme} reducedMotion={decorativeMotionReduced} />
        </motion.div>

          {creatures.filter((creature) => creature.kind === 'bird').map((creature) => (
            <CreatureSprite key={creature.id} spec={creature} progress={visualProgress} isIdle={isIdle} reducedMotion={decorativeMotionReduced} />
          ))}

        {bushes.map((bush) => (
          <PixelBush
            key={bush.id}
            spec={bush}
            progress={visualProgress}
            theme={theme}
            isIdle={isIdle}
            reducedMotion={decorativeMotionReduced}
          />
        ))}

        {wildAnimals.map((animal) => (
          <WildAnimalSprite
            key={animal.id}
            spec={animal}
            progress={visualProgress}
            theme={theme}
            isIdle={isIdle}
            reducedMotion={decorativeMotionReduced}
          />
        ))}

        {botanicals.map((spec) => (
          <BotanicalSprite key={spec.id} spec={spec} progress={visualProgress} />
        ))}

        {creatures.filter((creature) => creature.kind !== 'bird').map((creature) => (
          <CreatureSprite key={creature.id} spec={creature} progress={visualProgress} isIdle={isIdle} reducedMotion={decorativeMotionReduced} />
        ))}
        </motion.div>

        <FinalRose
          spec={finalRose}
          progress={finalRoseProgress}
          scrollRange={scrollRange}
          reducedMotion={reducedMotion}
        />
      </section>
    </>
  );
}
