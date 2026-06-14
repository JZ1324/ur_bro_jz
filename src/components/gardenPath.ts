export type GardenPoint = {
  x: number;
  y: number;
};

export type GardenCubicSegment = {
  start: GardenPoint;
  controlA: GardenPoint;
  controlB: GardenPoint;
  end: GardenPoint;
};

export function cubicPoint(segment: GardenCubicSegment, t: number): GardenPoint {
  const inverse = 1 - t;
  const inverseSquared = inverse * inverse;
  const tSquared = t * t;

  return {
    x: inverseSquared * inverse * segment.start.x
      + 3 * inverseSquared * t * segment.controlA.x
      + 3 * inverse * tSquared * segment.controlB.x
      + tSquared * t * segment.end.x,
    y: inverseSquared * inverse * segment.start.y
      + 3 * inverseSquared * t * segment.controlA.y
      + 3 * inverse * tSquared * segment.controlB.y
      + tSquared * t * segment.end.y,
  };
}

export function sampleCubicSegments(segments: GardenCubicSegment[], samplesPerSegment: number) {
  return segments.flatMap((segment, segmentIndex) => (
    Array.from({ length: samplesPerSegment + 1 }, (_, index) => cubicPoint(segment, index / samplesPerSegment))
      .filter((_, index) => segmentIndex === 0 || index > 0)
  ));
}

export function pathLength(points: GardenPoint[]) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].y - points[index - 1].y,
    );
  }
  return total;
}

export function resamplePathByDistance(points: GardenPoint[], spacing: number) {
  if (points.length < 2 || spacing <= 0) return points;

  const sampled = [points[0]];
  let previous = points[0];
  let distanceUntilNext = spacing;

  for (let index = 1; index < points.length; index += 1) {
    const target = points[index];
    let segmentLength = Math.hypot(target.x - previous.x, target.y - previous.y);

    while (segmentLength >= distanceUntilNext) {
      const ratio = distanceUntilNext / segmentLength;
      previous = {
        x: previous.x + (target.x - previous.x) * ratio,
        y: previous.y + (target.y - previous.y) * ratio,
      };
      sampled.push(previous);
      segmentLength = Math.hypot(target.x - previous.x, target.y - previous.y);
      distanceUntilNext = spacing;
    }

    distanceUntilNext -= segmentLength;
    previous = target;
  }

  const finalPoint = points[points.length - 1];
  const sampledEnd = sampled[sampled.length - 1];
  if (sampledEnd.x !== finalPoint.x || sampledEnd.y !== finalPoint.y) sampled.push(finalPoint);
  return sampled;
}
