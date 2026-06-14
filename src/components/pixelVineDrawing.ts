export type PixelVinePoint = {
  x: number;
  y: number;
};

export type PixelVinePalette = {
  ink: string;
  shadow: string;
  core: string;
  leaf: string;
  light: string;
};

type DrawPixelVineOptions = {
  thickness?: number;
  detailScale?: number;
  seed?: number;
  startDetailClearance?: number;
  endDetailClearance?: number;
};

function snap(value: number, grid = 2) {
  return Math.round(value / grid) * grid;
}

function pointDirection(points: PixelVinePoint[], index: number) {
  const previous = points[Math.max(0, index - 1)];
  const next = points[Math.min(points.length - 1, index + 1)];
  const angle = Math.atan2(next.y - previous.y, next.x - previous.x);
  return {
    angle,
    normalX: -Math.sin(angle),
    normalY: Math.cos(angle),
  };
}

function drawStroke(
  context: CanvasRenderingContext2D,
  points: PixelVinePoint[],
  color: string,
  width: number,
  normalOffset = 0,
) {
  if (points.length < 2) return;

  context.beginPath();
  points.forEach((point, index) => {
    const { normalX, normalY } = pointDirection(points, index);
    const x = snap(point.x + normalX * normalOffset);
    const y = snap(point.y + normalY * normalOffset);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = 'square';
  context.lineJoin = 'round';
  context.stroke();
}

function drawLeaf(
  context: CanvasRenderingContext2D,
  point: PixelVinePoint,
  angle: number,
  side: number,
  palette: PixelVinePalette,
  scale: number,
) {
  const leafAngle = angle + side * 0.88;
  const unit = Math.max(2, snap(scale * 3.5, 2));
  const baseX = snap(point.x + Math.cos(angle + side * Math.PI / 2) * unit);
  const baseY = snap(point.y + Math.sin(angle + side * Math.PI / 2) * unit);

  context.save();
  context.translate(baseX, baseY);
  context.rotate(leafAngle);
  context.fillStyle = palette.ink;
  context.beginPath();
  context.ellipse(unit * 1.8, 0, unit * 2, unit * 0.9, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = palette.leaf;
  context.beginPath();
  context.ellipse(unit * 1.8, 0, unit * 1.55, unit * 0.52, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = palette.light;
  context.fillRect(unit * 1.3, -1, unit * 1.4, 1);
  context.restore();
}

function drawLeafPair(
  context: CanvasRenderingContext2D,
  point: PixelVinePoint,
  angle: number,
  side: number,
  palette: PixelVinePalette,
  scale: number,
) {
  drawLeaf(context, point, angle, side, palette, scale);
  drawLeaf(context, point, angle + 0.16, -side, palette, scale * 0.82);
}

function drawThorn(
  context: CanvasRenderingContext2D,
  point: PixelVinePoint,
  angle: number,
  side: number,
  palette: PixelVinePalette,
  scale: number,
) {
  const unit = Math.max(2, snap(scale * 2, 2));
  context.save();
  context.translate(snap(point.x), snap(point.y));
  context.rotate(angle);
  context.fillStyle = palette.ink;
  context.beginPath();
  context.moveTo(-unit, side * unit * 0.45);
  context.lineTo(unit * 1.8, side * unit * 0.45);
  context.lineTo(unit * 0.15, side * unit * 2.5);
  context.closePath();
  context.fill();
  context.fillStyle = palette.light;
  context.fillRect(-unit * 0.5, side > 0 ? unit * 0.45 : -unit * 0.8, unit, unit * 0.42);
  context.restore();
}

function drawTendril(
  context: CanvasRenderingContext2D,
  point: PixelVinePoint,
  angle: number,
  side: number,
  palette: PixelVinePalette,
  scale: number,
) {
  const unit = Math.max(2, snap(scale * 2.5, 2));
  const tangentX = Math.cos(angle);
  const tangentY = Math.sin(angle);
  const normalX = -tangentY;
  const normalY = tangentX;

  for (let step = 0; step < 7; step += 1) {
    const turn = Math.sin((step / 6) * Math.PI) * side * unit * 2.5;
    const forward = step * unit * 1.1;
    const x = snap(point.x + tangentX * forward + normalX * turn);
    const y = snap(point.y + tangentY * forward + normalY * turn);
    context.fillStyle = step === 0 ? palette.ink : palette.leaf;
    context.fillRect(x - unit / 2, y - unit / 2, unit, unit);
  }
}

export function progressivePoints(points: PixelVinePoint[], progress: number) {
  const clamped = Math.max(0, Math.min(1, progress));
  if (clamped <= 0 || points.length === 0) return [];
  if (clamped >= 1) return points;

  const position = (points.length - 1) * clamped;
  const wholeIndex = Math.floor(position);
  const fraction = position - wholeIndex;
  const visible = points.slice(0, wholeIndex + 1);
  const next = points[Math.min(points.length - 1, wholeIndex + 1)];
  const current = points[wholeIndex];

  visible.push({
    x: current.x + (next.x - current.x) * fraction,
    y: current.y + (next.y - current.y) * fraction,
  });
  return visible;
}

export function drawPixelVine(
  context: CanvasRenderingContext2D,
  points: PixelVinePoint[],
  palette: PixelVinePalette,
  {
    thickness = 5,
    detailScale = 1,
    seed = 0,
    startDetailClearance = 16,
    endDetailClearance = 24,
  }: DrawPixelVineOptions = {},
) {
  if (points.length < 2) return;

  drawStroke(context, points, palette.shadow, thickness + 4, 1);
  drawStroke(context, points, palette.ink, thickness + 2.5);
  drawStroke(context, points, palette.core, thickness);

  for (let index = 7 + seed; index < points.length - 3; index += 13) {
    const point = points[index];
    const { angle } = pointDirection(points, index);
    const unit = Math.max(2, snap(detailScale * 2.5, 2));
    context.save();
    context.translate(snap(point.x), snap(point.y));
    context.rotate(angle);
    context.fillStyle = Math.floor(index / 13) % 2 === 0 ? palette.ink : palette.leaf;
    context.fillRect(-unit, -thickness / 2 + 1, unit * 2, Math.max(2, thickness - 2));
    context.fillStyle = palette.light;
    context.fillRect(-unit / 2, -thickness / 2, unit, Math.max(1, thickness * 0.2));
    context.restore();
  }

  for (let index = 5 + seed; index < points.length - 2; index += 8) {
    const point = points[index];
    const { normalX, normalY } = pointDirection(points, index);
    const unit = Math.max(2, snap(detailScale * 2, 2));
    const side = Math.floor(index / 8) % 2 === 0 ? 1 : -1;
    const textureX = snap(point.x + normalX * side * thickness * 0.22);
    const textureY = snap(point.y + normalY * side * thickness * 0.22);
    context.fillStyle = side > 0 ? palette.light : palette.ink;
    context.fillRect(textureX - unit / 2, textureY - unit / 2, unit, unit);
  }

  const nodeSpacing = 12;
  let nodeNumber = 0;
  const firstNodeIndex = Math.max(nodeSpacing + seed, startDetailClearance);
  for (let index = firstNodeIndex; index < points.length - endDetailClearance; index += nodeSpacing) {
    const point = points[index];
    const { angle, normalX, normalY } = pointDirection(points, index);
    const side = nodeNumber % 2 === 0 ? 1 : -1;
    const unit = Math.max(2, snap(detailScale * 2, 2));
    const nodeX = snap(point.x);
    const nodeY = snap(point.y);

    context.save();
    context.translate(nodeX, nodeY);
    context.rotate(angle);
    context.fillStyle = palette.ink;
    context.fillRect(-unit, -thickness / 2, unit * 1.5, thickness);
    context.restore();

    context.fillStyle = palette.light;
    context.fillRect(
      snap(nodeX - normalX * unit * 0.5),
      snap(nodeY - normalY * unit * 0.5),
      unit,
      unit,
    );

    if (nodeNumber % 5 === 0) {
      drawLeafPair(context, point, angle, side, palette, detailScale * 1.02);
    } else if (nodeNumber % 5 === 1 || nodeNumber % 5 === 3) {
      drawLeaf(context, point, angle, side, palette, detailScale * 1.08);
    } else if (nodeNumber % 5 === 2) {
      drawTendril(context, point, angle, side, palette, detailScale);
    } else {
      drawThorn(context, point, angle, side, palette, detailScale);
    }
    nodeNumber += 1;
  }

}
