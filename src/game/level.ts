export type Vec3 = { x: number; y: number; z: number };
export type Platform = { id: string; position: Vec3; size: [number, number, number]; kind: 'grass' | 'stone' | 'wood'; area: number };
export type Blossom = { id: string; position: Vec3 };
export type Checkpoint = { platform: string; position: Vec3; name: string };

// These orthogonal ground-plane directions match the fixed camera, so up means
// away from the viewer and right means right on screen on every device.
export const RIGHT = { x: 0.848, z: -0.530 };
export const FORWARD = { x: -0.530, z: -0.848 };
export const AREA_NAMES = ['The lily pond', 'The wooden way', 'Among the blossoms'];
export const PLAYER_RADIUS = .24;
export const PLAYER_HALF_HEIGHT = .26;
export const PLAYER_FEET = PLAYER_RADIUS + PLAYER_HALF_HEIGHT;
export const MOVE_SPEED = 4.1;
export const JUMP_SPEED = 7;
export const GRAVITY = 18;
export const STEP = 1 / 60;

export function coursePoint(right: number, forward: number, y: number): Vec3 {
  return { x: right * RIGHT.x + forward * FORWARD.x, y, z: right * RIGHT.z + forward * FORWARD.z };
}

function platform(id: string, u: number, v: number, top: number, width: number, depth: number, kind: Platform['kind'], area: number): Platform {
  const height = kind === 'wood' ? .38 : .85;
  return { id, position: coursePoint(u, v, top - height / 2), size: [width, height, depth], kind, area };
}

// One authored route, with broad landings and optional blossom detours.
// Top surfaces and collision boxes are generated from this same source.
export const platforms: Platform[] = [
  platform('entrance', 0, 0, 0, 7, 6, 'grass', 0),
  platform('pond-1', 0, 5.3, .15, 3, 3, 'stone', 0),
  platform('pond-2', 2.3, 9.3, .35, 3.1, 3.1, 'stone', 0),
  platform('pond-3', 5.3, 12.8, .55, 3.2, 3.2, 'stone', 0),
  platform('pond-4', 8.2, 16.4, .45, 3.1, 3.1, 'stone', 0),
  platform('pond-5', 8.2, 20.7, .65, 3.1, 3.1, 'stone', 0),
  platform('rest-1', 5.7, 25.5, .8, 6.5, 6, 'grass', 1),
  platform('wood-1', .7, 29.7, 1.05, 3.5, 3.5, 'wood', 1),
  platform('wood-2', -3, 33.3, 1.35, 3.4, 3.4, 'wood', 1),
  platform('wood-3', -6.9, 36.8, 1.5, 3.4, 3.4, 'wood', 1),
  platform('wood-4', -7.4, 41.6, 1.8, 3.4, 3.4, 'wood', 1),
  platform('wood-5', -4.9, 45.9, 2.05, 3.4, 3.4, 'wood', 1),
  platform('rest-2', -.2, 50.7, 2.3, 6.5, 6, 'grass', 2),
  platform('climb-1', 4.7, 55.2, 2.7, 3.6, 3.6, 'grass', 2),
  platform('climb-2', 8.3, 59, 3.15, 3.6, 3.6, 'grass', 2),
  platform('climb-3', 9.8, 63.8, 3.6, 3.6, 3.6, 'grass', 2),
  platform('climb-4', 7.2, 68.1, 4.05, 3.6, 3.6, 'grass', 2),
  platform('climb-5', 3.4, 71.9, 4.5, 3.6, 3.6, 'grass', 2),
  platform('treehouse', -.5, 77.4, 4.85, 8, 7, 'grass', 2),
];

export function surface(p: Platform) { return p.position.y + p.size[1] / 2; }
export function feetOn(p: Platform): Vec3 { return { x: p.position.x, y: surface(p), z: p.position.z }; }
export const start = feetOn(platforms[0]);
export const checkpoints: Checkpoint[] = [
  { platform: 'rest-1', position: feetOn(platforms[6]), name: 'The wooden way' },
  { platform: 'rest-2', position: feetOn(platforms[12]), name: 'Among the blossoms' },
];
export const goal = feetOn(platforms[18]);
const blossomPlatforms = [1, 2, 3, 5, 7, 8, 9, 11, 13, 14, 16, 17];
export const blossoms: Blossom[] = blossomPlatforms.map((index, i) => {
  const p = feetOn(platforms[index]);
  // The small lateral offsets encourage exploration without forcing precision.
  const offset = i % 3 === 1 ? .7 : i % 3 === 2 ? -.6 : 0;
  return { id: `blossom-${i + 1}`, position: { x: p.x + RIGHT.x * offset, y: p.y + .8, z: p.z + RIGHT.z * offset } };
});

export const LEVEL_ASSET = '/models/hidden-garden.glb';
