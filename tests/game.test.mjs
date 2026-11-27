import { test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier3d-compat';
import { GardenSimulation, initializePhysics } from '../src/game/simulation.ts';
import { blossoms, checkpoints, FORWARD, goal, platforms, PLAYER_FEET, RIGHT, STEP, surface } from '../src/game/level.ts';

await initializePhysics();
function settle(sim, frames = 15) { for (let i = 0; i < frames; i++) sim.step(); }
function place(sim, position) {
  sim.body.setTranslation(position, true); sim.body.setNextKinematicTranslation(position);
  sim.velocity = { x: 0, y: 0, z: 0 }; sim.world.step();
}
function atPlatform(sim, platform) {
  place(sim, { x: platform.position.x, y: surface(platform) + PLAYER_FEET + .025, z: platform.position.z });
  settle(sim);
}
function withGame(fn) {
  const sim = new GardenSimulation();
  try { sim.start(); settle(sim); fn(sim); } finally { sim.dispose(); }
}
function inputToward(from, to, magnitude = 1) {
  const dx = to.x - from.x, dz = to.z - from.z, length = Math.hypot(dx, dz) || 1;
  return { x: (dx * RIGHT.x + dz * RIGHT.z) / length * magnitude,
    y: (dx * FORWARD.x + dz * FORWARD.z) / length * magnitude, jump: false };
}

test('sprout rests on a platform, jumps once, and lands without tunnelling', () => withGame(sim => {
  assert.equal(sim.grounded, true);
  const bottom = sim.position.y;
  sim.step({ x: 0, y: 0, jump: true });
  assert.ok(sim.velocity.y > 0); assert.equal(sim.grounded, false);
  settle(sim, 8);
  const upward = sim.velocity.y;
  sim.step({ x: 0, y: 0, jump: true });
  assert.ok(sim.velocity.y < upward, 'a second airborne press cannot double-jump');
  settle(sim, 70);
  assert.ok(Math.abs(sim.position.y - bottom) < .02);
  assert.equal(sim.grounded, true);
}));

test('character stops against solid walls and diagonal input stays normalized', () => withGame(sim => {
  const wall = sim.world.createCollider(RAPIER.ColliderDesc.cuboid(.2, 4, 8).setTranslation(1.8, 1, 0));
  sim.world.step();
  for (let i = 0; i < 60; i++) sim.step({ x: 1, y: 0, jump: false });
  assert.ok(sim.position.x < 1.8 - .2 - .23);
  sim.world.removeCollider(wall, true); atPlatform(sim, platforms[0]);
  for (let i = 0; i < 10; i++) sim.step({ x: 1, y: 1, jump: false });
  assert.ok(Math.hypot(sim.velocity.x, sim.velocity.z) <= 4.11);
}));

test('jump buffer accepts an early press just before landing', () => withGame(sim => {
  place(sim, { x: 0, y: PLAYER_FEET + .16, z: 0 });
  sim.grounded = false; sim.velocity.y = -2;
  sim.step({ x: 0, y: 0, jump: true });
  settle(sim, 5);
  assert.ok(sim.velocity.y > 0, 'buffered jump fires on the next grounded step');
}));

test('a brief step off an edge still allows a jump', () => withGame(sim => {
  // Preserve the preceding grounded tick, then leave the edge as normal.
  place(sim, { x: platforms[0].size[0] / 2 + .3, y: PLAYER_FEET + .02, z: 0 });
  sim.grounded = true;
  sim.step({ x: 0, y: 0, jump: false });
  settle(sim, 2);
  sim.step({ x: 0, y: 0, jump: true });
  assert.ok(sim.velocity.y > 0, 'coyote grace accepts the jump after leaving the edge');
}));

test('blossoms count once and checkpoints preserve them across falls', () => withGame(sim => {
  const first = blossoms[0];
  place(sim, first.position); settle(sim, 12);
  assert.equal(sim.collected.size, 1); settle(sim, 20); assert.equal(sim.collected.size, 1);
  atPlatform(sim, platforms[6]); assert.equal(sim.checkpoint, 1);
  place(sim, { x: 100, y: -6, z: 100 }); sim.step();
  assert.equal(sim.falls, 1); assert.equal(sim.collected.size, 1);
  assert.ok(Math.hypot(sim.position.x - checkpoints[0].position.x, sim.position.z - checkpoints[0].position.z) < .01);
  sim.restart(); settle(sim);
  assert.equal(sim.checkpoint, 0); assert.equal(sim.collected.size, 0); assert.equal(sim.falls, 0);
  assert.ok(Math.hypot(sim.position.x, sim.position.z) < .01);
}));

test('pause freezes time and position; reaching home wins with optional blossoms', () => withGame(sim => {
  sim.step({ x: 1, y: 0, jump: true }); sim.pause();
  const before = sim.position;
  for (let i = 0; i < 300; i++) sim.step({ x: 1, y: 1, jump: true });
  assert.deepEqual(sim.position, before); assert.equal(sim.phase, 'paused');
  sim.resume(); atPlatform(sim, platforms.at(-1));
  assert.equal(sim.phase, 'complete'); assert.equal(sim.collected.size, 0);
  assert.ok(Math.hypot(sim.position.x - goal.x, sim.position.z - goal.z) < .01);
}));

test('the entire authored course is reachable with regular movement and single jumps', () => withGame(sim => {
  let steps = 0;
  for (let i = 1; i < platforms.length; i++) {
    const source = platforms[i - 1], target = platforms[i];
    let arrived = false, jumped = false;
    for (let frame = 0; frame < 500; frame++) {
      const p = sim.position;
      const distance = Math.hypot(target.position.x - p.x, target.position.z - p.z);
      if ((sim.grounded && distance < .22 && Math.abs(p.y - PLAYER_FEET - surface(target)) < .1) || sim.phase === 'complete') { arrived = true; break; }
      const input = inputToward(p, target.position, Math.min(1, distance * 2));
      const dx = (target.position.x - p.x) / distance, dz = (target.position.z - p.z) / distance;
      const edgeX = (source.position.x + Math.sign(dx) * source.size[0] / 2 - p.x) / dx;
      const edgeZ = (source.position.z + Math.sign(dz) * source.size[2] / 2 - p.z) / dz;
      if (!jumped && sim.grounded && Math.min(edgeX, edgeZ) < .55) { input.jump = true; jumped = true; }
      sim.step(input); steps++;
      assert.equal(sim.falls, 0, `fall between ${source.id} and ${target.id}`);
    }
    assert.equal(arrived, true, `reach ${target.id}`);
  }
  assert.equal(sim.phase, 'complete'); assert.equal(sim.checkpoint, 2);
  assert.equal(sim.collected.size, 12);
  assert.ok(steps * STEP > 20, 'course has a substantive traversal');
}));
