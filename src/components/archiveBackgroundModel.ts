export type BackgroundPhase = 'profile' | 'archive' | 'clearing' | 'meadow';
export type ArchiveBackgroundTheme = 'day' | 'evening';

type BackgroundPhaseRange = {
  phase: BackgroundPhase;
  start: number;
  end: number;
};

export type BackgroundLayerPolicy = {
  distant: boolean;
  middle: boolean;
  foreground: boolean;
  canopy: boolean;
  light: boolean;
  animated: boolean;
};

export const backgroundPhaseRanges: BackgroundPhaseRange[] = [
  { phase: 'profile', start: 0, end: 0.22 },
  { phase: 'archive', start: 0.22, end: 0.49 },
  { phase: 'clearing', start: 0.49, end: 0.78 },
  { phase: 'meadow', start: 0.78, end: 1 },
];

function clampProgress(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function resolveBackgroundState(value: number) {
  const progress = clampProgress(value);
  const range = backgroundPhaseRanges.find(({ end }) => progress < end)
    ?? backgroundPhaseRanges[backgroundPhaseRanges.length - 1];
  const span = Math.max(0.0001, range.end - range.start);

  return {
    progress,
    phase: range.phase,
    phaseProgress: clampProgress((progress - range.start) / span),
  };
}

export function getArchiveBackgroundAssets(theme: ArchiveBackgroundTheme) {
  return {
    distant: `/garden-pixel/landscape-quiet-${theme}-distant.png`,
    middle: `/garden-pixel/landscape-${theme}-midground.png`,
    foreground: `/garden-pixel/landscape-quiet-${theme}-foreground.png`,
  } as const;
}

export function getBackgroundLayerPolicy(
  performanceReduced: boolean,
  reducedMotion: boolean,
): BackgroundLayerPolicy {
  if (reducedMotion) {
    return {
      distant: true,
      middle: true,
      foreground: true,
      canopy: false,
      light: false,
      animated: false,
    };
  }

  if (performanceReduced) {
    return {
      distant: true,
      middle: true,
      foreground: true,
      canopy: false,
      light: false,
      animated: true,
    };
  }

  return {
    distant: true,
    middle: true,
    foreground: true,
    canopy: true,
    light: true,
    animated: true,
  };
}
