export const WATER_LEVEL = -.22;
export const POND_CALL_POINT = { x: 0, z: 1.5 };
const STEP = 1 / 60;
const TILE = .32;
const TAU = Math.PI * 2;
const CLEARANCE = .47;

export type PondPoint = { x: number; z: number };
export type Koi = PondPoint & { heading: number; turn: number; speed: number; size: number; phase: number; goal: PondPoint };

// Match the authored water tiles in garden_voxels.py, converted from Z-up to Y-up.
export function isPondPoint(x: number, z: number, clearance = 0): boolean {
  const wet = (px: number, pz: number) => {
    const tx = Math.round(px / TILE) * TILE, tz = Math.round(pz / TILE) * TILE;
    return ((tx + .15) / 2.3) ** 2 + ((tz - 1.5) / 1.85) ** 2 < 1
      || ((tx - .9) / 1.4) ** 2 + ((tz - .1) / 1.1) ** 2 < 1;
  };
  if (!Number.isFinite(x) || !Number.isFinite(z) || !wet(x, z)) return false;
  for (let i = 0; clearance > 0 && i < 12; i++) {
    const angle = i / 12 * TAU;
    if (!wet(x + Math.cos(angle) * clearance, z + Math.sin(angle) * clearance)) return false;
  }
  return true;
}

const restingPlaces: PondPoint[] = [
  { x: -.8, z: 1.35 }, { x: .65, z: 2.4 }, { x: 1.35, z: 1.55 },
  { x: -1.45, z: 1.8 }, { x: .35, z: .05 }, { x: -.45, z: 2.6 },
];
const waypoints: PondPoint[] = [...restingPlaces, { x: .6, z: 1.2 }, { x: 1.4, z: .15 }, { x: -.1, z: 1.8 }];
const angleDifference = (to: number, from: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

export function createKoiSchool() {
  const fish: Koi[] = restingPlaces.map((point, i) => ({
    ...point, heading: i * 2.4, turn: 0, speed: .15 + i * .012,
    size: .86 + (i % 3) * .10, phase: i * 1.7, goal: { ...waypoints[(i + 2) % waypoints.length] },
  }));
  let elapsed = 0;
  let accumulator = 0;
  let target: PondPoint | null = null;
  let remaining = 0;
  const routes = fish.map((_, i) => i + 2);

  function call(x: number, z: number, instant = false) {
    if (!isPondPoint(x, z)) return false;
    // Keep a gathering far enough from a stepped bank for the whole body to fit.
    let closest: PondPoint = { x, z };
    if (!isPondPoint(x, z, .48)) {
      let distance = Infinity;
      for (let tx = -2; tx <= 2; tx += .16) for (let tz = -.6; tz <= 3; tz += .16) {
        const next = (tx - x) ** 2 + (tz - z) ** 2;
        if (next < distance && isPondPoint(tx, tz, .48)) { distance = next; closest = { x: tx, z: tz }; }
      }
    }
    target = closest;
    remaining = 9;
    if (instant) {
      fish.forEach((koi, i) => {
        const angle = i / fish.length * TAU;
        const px = closest.x + Math.cos(angle) * .56, pz = closest.z + Math.sin(angle) * .56;
        if (isPondPoint(px, pz, CLEARANCE)) { koi.x = px; koi.z = pz; }
        koi.heading = Math.atan2(closest.x - koi.x, closest.z - koi.z);
        koi.turn = 0;
      });
    }
    return true;
  }

  function step() {
    elapsed += STEP;
    remaining = Math.max(0, remaining - STEP);
    if (!remaining) target = null;
    fish.forEach((koi, i) => {
      const gathering = target !== null;
      const orbit = elapsed * .22 + i / fish.length * TAU;
      let gx = target ? target.x + Math.cos(orbit) * .38 : koi.goal.x;
      let gz = target ? target.z + Math.sin(orbit) * .38 : koi.goal.z;
      if (!target && Math.hypot(gx - koi.x, gz - koi.z) < .35) {
        routes[i] = (routes[i] + 2) % waypoints.length;
        koi.goal = { ...waypoints[routes[i]] };
        gx = koi.goal.x; gz = koi.goal.z;
      }
      let dx = gx - koi.x, dz = gz - koi.z;
      const distance = Math.max(.01, Math.hypot(dx, dz));
      dx /= distance; dz /= distance;
      if (!gathering) { dx += Math.sin(elapsed * .43 + koi.phase) * .24; dz += Math.cos(elapsed * .37 + koi.phase) * .24; }
      for (const other of fish) {
        if (other === koi) continue;
        const sx = koi.x - other.x, sz = koi.z - other.z;
        const separation = Math.hypot(sx, sz);
        if (separation > .001 && separation < .55) {
          const force = (1 - separation / .55) * 2;
          dx += sx / separation * force; dz += sz / separation * force;
        }
      }
      let desired = Math.atan2(dx, dz);
      const lookahead = .44;
      if (!isPondPoint(koi.x + Math.sin(koi.heading) * lookahead, koi.z + Math.cos(koi.heading) * lookahead, CLEARANCE)) {
        // Pick a clear turn before the nose reaches a bank, including the inlet.
        let bestScore = -Infinity;
        for (let direction = 0; direction < 24; direction++) {
          const angle = direction / 24 * TAU;
          if (!isPondPoint(koi.x + Math.sin(angle) * lookahead, koi.z + Math.cos(angle) * lookahead, CLEARANCE)) continue;
          const score = Math.cos(angleDifference(angle, desired)) + .35 * Math.cos(angleDifference(angle, koi.heading));
          if (score > bestScore) { bestScore = score; desired = angle; }
        }
      }
      const turn = Math.max(-1.8, Math.min(1.8, angleDifference(desired, koi.heading) * 2.2));
      koi.turn += (turn - koi.turn) * .09;
      koi.heading = (koi.heading + koi.turn * STEP) % TAU;
      const pace = gathering ? .32 : .17 + .045 * Math.sin(elapsed * .55 + koi.phase);
      koi.speed += (pace * (1 - Math.min(.55, Math.abs(turn) * .25)) - koi.speed) * .04;
      const nx = koi.x + Math.sin(koi.heading) * koi.speed * STEP;
      const nz = koi.z + Math.cos(koi.heading) * koi.speed * STEP;
      if (isPondPoint(nx, nz, CLEARANCE)) { koi.x = nx; koi.z = nz; }
    });
  }

  return {
    fish,
    get elapsed() { return elapsed; },
    get target() { return target; },
    get remaining() { return remaining; },
    call,
    update(dt: number) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      accumulator += Math.min(dt, .1);
      while (accumulator + 1e-10 >= STEP) { step(); accumulator -= STEP; }
    },
  };
}
