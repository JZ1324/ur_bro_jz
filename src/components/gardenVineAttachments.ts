import type { GardenPoint } from './gardenPath';

export type VineAttachment = GardenPoint & {
  growth: number;
};

export type VineAttachmentTarget = {
  id: string;
  target: GardenPoint;
};

export function resolveVineAttachments(
  points: GardenPoint[],
  targets: VineAttachmentTarget[],
) {
  if (points.length === 0) return {} as Record<string, VineAttachment>;

  return Object.fromEntries(targets.map(({ id, target }) => {
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    points.forEach((point, index) => {
      const distance = Math.hypot(point.x - target.x, point.y - target.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return [
      id,
      {
        ...points[closestIndex],
        growth: points.length === 1 ? 1 : closestIndex / (points.length - 1),
      },
    ];
  }));
}

export function vineGrowthToPageProgress(
  growth: number,
  vineRange: readonly [number, number],
) {
  return vineRange[0] + Math.max(0, Math.min(1, growth)) * (vineRange[1] - vineRange[0]);
}

export function connectedBloomTiming(
  connection: number,
  preferredGrow: [number, number],
  preferredBloom: [number, number],
) {
  const growEnd = Math.max(connection + 0.018, preferredGrow[1]);
  const bloomStart = Math.max(growEnd, preferredBloom[0]);
  return {
    connection,
    grow: [connection, growEnd] as [number, number],
    bloom: [bloomStart, Math.max(bloomStart + 0.08, preferredBloom[1])] as [number, number],
  };
}
