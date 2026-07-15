import type { GardenCubicSegment } from './gardenPath';

export type ScrollChapterId = 'profile' | 'photos' | 'meadow';

export type ParallaxDepth = 'background' | 'middle' | 'foreground';

export type VineAnchorId = 'profile' | 'stories' | 'now' | 'photos' | 'meadow';

export type VineAnchor = {
  id: VineAnchorId;
  x: number;
  y: number;
};

export const desktopVineSegments: GardenCubicSegment[] = [
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
    controlA: { x: 63.5, y: 68.6667 },
    // Ease into the rose's vertical landing stem instead of reaching past it
    // and doubling back into a sharp V.
    controlB: { x: 84, y: 76.3333 },
    end: { x: 84, y: 84 },
  },
];

export const mobileVineSegments: GardenCubicSegment[] = [
  {
    start: { x: 12, y: 10 },
    controlA: { x: 5, y: 19 },
    controlB: { x: 19, y: 27 },
    end: { x: 11, y: 35 },
  },
  {
    start: { x: 11, y: 35 },
    controlA: { x: 4, y: 43 },
    controlB: { x: 20, y: 48 },
    end: { x: 13, y: 55 },
  },
  {
    start: { x: 13, y: 55 },
    controlA: { x: 7, y: 63 },
    controlB: { x: 18, y: 70 },
    end: { x: 9, y: 76 },
  },
  {
    start: { x: 9, y: 76 },
    controlA: { x: 8, y: 80 },
    controlB: { x: 17, y: 84 },
    end: { x: 22, y: 87 },
  },
];

export function getVineContinuationSegments(
  start: { x: number; y: number },
  end: { x: number; y: number },
  _width: number,
  _height: number,
  isMobile: boolean,
): GardenCubicSegment[] {
  if (isMobile) {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    return [
      {
        start,
        controlA: { x: start.x + deltaX * 0.3, y: start.y + deltaY * 0.18 },
        controlB: { x: end.x - deltaX * 0.12, y: end.y - deltaY * 0.2 },
        end,
      },
    ];
  }

  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  return [
    {
      start,
      // Keep the landing stem between its two anchors. The former lateral
      // handles overshot the rose and produced a visible hook at the meadow.
      controlA: { x: start.x + deltaX * 0.34, y: start.y + deltaY * 0.34 },
      controlB: { x: start.x + deltaX * 0.72, y: start.y + deltaY * 0.72 },
      end,
    },
  ];
}

export function getVineLandingProgress(endY: number, height: number) {
  if (height <= 0) return 0;
  return clampProgress((endY / height - 0.68) / 0.18);
}

export function getVineDrawProgress(growth: number, _landingProgress: number) {
  return {
    mainGrowth: clampProgress(growth / 0.965),
    // Complete the stem before the final bloom appears. On reverse scroll the
    // bloom therefore disappears before its supporting stem retracts.
    continuationGrowth: clampProgress((growth - 0.965) / 0.02),
  };
}

export function clampProgress(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function mapChapterProgress(value: number, start: number, end: number) {
  if (end <= start) return value >= end ? 1 : 0;
  return clampProgress((value - start) / (end - start));
}

export function mapMeadowVisualProgress(value: number, reducedMotion = false) {
  return reducedMotion ? 1 : mapChapterProgress(value, 0, 0.82);
}

export function mapMeadowSceneProgress(
  localProgress: number,
  journeyProgress: number,
  reducedMotion = false,
) {
  if (reducedMotion) return 1;
  const localReveal = mapMeadowVisualProgress(localProgress);
  const cameraPrelude = mapChapterProgress(journeyProgress, 0.78, 0.84) * 0.76;
  return Math.max(localReveal, cameraPrelude);
}

export function getVineSegments(isMobile: boolean) {
  return isMobile ? mobileVineSegments : desktopVineSegments;
}

export function getChapterHeight(desktopVh: number, mobileVh: number, isMobile: boolean, reducedMotion: boolean) {
  if (reducedMotion) return 'auto';
  return `${isMobile ? mobileVh : desktopVh}vh`;
}
