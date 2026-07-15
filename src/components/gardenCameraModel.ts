import { resolveBackgroundState, type BackgroundPhase } from './archiveBackgroundModel';

export type GardenViewportMode = 'desktop' | 'mobile';

export type GardenDepthPreset =
  | 'sky'
  | 'distant'
  | 'middle'
  | 'foreground'
  | 'canopy'
  | 'content'
  | 'light';

export type GardenCameraState = {
  progress: number;
  phase: BackgroundPhase;
  phaseProgress: number;
  viewportMode: GardenViewportMode;
  cameraOffset: {
    x: number;
    y: number;
  };
  scale: number;
  roll: number;
  depthMultipliers: Record<GardenDepthPreset, number>;
  meadowBlend: number;
};

export type GardenJourneyStops = readonly [number, number, number, number, number];

export type GardenJourneyMeasurements = {
  totalScroll: number;
  viewportHeight: number;
  storiesTop: number;
  photosTop: number;
  meadowTop: number;
};

export const gardenDepthPresets: Record<GardenDepthPreset, number> = {
  sky: 0.04,
  content: 0.06,
  distant: 0.12,
  light: 0.24,
  middle: 0.34,
  foreground: 0.62,
  canopy: 0.85,
};

export const gardenCameraStops: GardenJourneyStops = [0, 0.22, 0.49, 0.78, 1];
export const defaultGardenJourneyStops: GardenJourneyStops = gardenCameraStops;

const desktopCameraX = [0, -40, 28, -44, 0] as const;
const mobileCameraX = desktopCameraX.map((value) => value * 0.45);
const cameraScale = [1, 1.06, 1.12, 1.08, 1] as const;
const cameraRoll = [0, -0.8, 0.6, -0.5, 0] as const;

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function interpolateKeyframes(value: number, stops: readonly number[], output: readonly number[]) {
  if (stops.length !== output.length || stops.length === 0) return 0;
  if (value <= stops[0]) return output[0];

  for (let index = 1; index < stops.length; index += 1) {
    if (value > stops[index]) continue;
    const start = stops[index - 1];
    const end = stops[index];
    const localProgress = end === start ? 1 : (value - start) / (end - start);
    return output[index - 1] + (output[index] - output[index - 1]) * localProgress;
  }

  return output[output.length - 1];
}

export function resolveGardenJourneyStops({
  totalScroll,
  viewportHeight,
  storiesTop,
  photosTop,
  meadowTop,
}: GardenJourneyMeasurements): GardenJourneyStops {
  if (totalScroll <= 0) return defaultGardenJourneyStops;

  const minimumGap = 0.045;
  const candidates = [
    0,
    clampProgress((storiesTop - viewportHeight * 0.55) / totalScroll),
    clampProgress((photosTop + viewportHeight * 0.12) / totalScroll),
    clampProgress((meadowTop - viewportHeight * 0.45) / totalScroll),
    1,
  ];

  for (let index = 1; index < candidates.length - 1; index += 1) {
    const remainingStops = candidates.length - 1 - index;
    const minimum = candidates[index - 1] + minimumGap;
    const maximum = 1 - remainingStops * minimumGap;
    candidates[index] = Math.max(minimum, Math.min(maximum, candidates[index]));
  }

  return [candidates[0], candidates[1], candidates[2], candidates[3], candidates[4]];
}

export function mapGardenJourneyProgress(
  value: number,
  sourceStops: GardenJourneyStops,
): number {
  return clampProgress(interpolateKeyframes(
    clampProgress(value),
    sourceStops,
    gardenCameraStops,
  ));
}

export function resolveGardenCameraState(
  value: number,
  viewportMode: GardenViewportMode,
): GardenCameraState {
  const background = resolveBackgroundState(value);
  const cameraTravel = viewportMode === 'mobile' ? 180 : 720;
  const cameraX = viewportMode === 'mobile' ? mobileCameraX : desktopCameraX;

  return {
    progress: background.progress,
    phase: background.phase,
    phaseProgress: background.phaseProgress,
    viewportMode,
    cameraOffset: {
      x: interpolateKeyframes(background.progress, gardenCameraStops, cameraX),
      y: -cameraTravel * background.progress,
    },
    scale: interpolateKeyframes(background.progress, gardenCameraStops, cameraScale),
    roll: interpolateKeyframes(background.progress, gardenCameraStops, cameraRoll),
    depthMultipliers: gardenDepthPresets,
    meadowBlend: Math.max(0, Math.min(1, (background.progress - 0.78) / 0.1)),
  };
}
