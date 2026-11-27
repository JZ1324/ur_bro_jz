import { clamp, smoothstep } from './journey';

export type GardenPoint = { x: number; y: number };

export function sharedGardenStep(elapsed: number, remaining: number) {
  const pace = 1.3 + .33 * smoothstep((remaining - 90) / 430);
  return Math.min(35, pace * clamp(elapsed, 8, 38));
}

export function sharedGardenCatPath(
  from: GardenPoint,
  to: GardenPoint,
  scene: DOMRectReadOnly,
  lane: DOMRectReadOnly | undefined,
  scroll: number,
  size: number,
) {
  const clearance = size / 2 + 4;
  const left = Math.max(size / 2, Math.min(from.x, scene.left - clearance));
  const across = lane?.height && to.x > scene.right + clearance;
  const top = (lane?.height ? lane.top + lane.height / 2 : scene.top - clearance) + scroll;
  const bottom = scene.bottom + scroll + clearance;

  const points = across
    ? [from, { x: left, y: top }, { x: to.x, y: top }, to]
    : [from, { x: left, y: top }, { x: left, y: bottom }, { x: to.x, y: bottom }, to];
  const sections = points.slice(1).map((end, index) => {
    const start = points[index];
    return { start, end, distance: Math.hypot(end.x - start.x, end.y - start.y) };
  }).filter(section => section.distance > 0);
  const length = sections.reduce((sum, section) => sum + section.distance, 0);
  return { sections, length, end: to };
}

export function pointOnGardenPath(path: ReturnType<typeof sharedGardenCatPath>, distance: number) {
  let remaining = clamp(distance, 0, path.length);
  for (const { start, end, distance: length } of path.sections) {
    if (remaining <= length) {
      const t = remaining / length;
      return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
    }
    remaining -= length;
  }
  return path.end;
}
