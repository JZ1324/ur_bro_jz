import RAPIER from '@dimforge/rapier3d-compat';
import { blossoms, checkpoints, FORWARD, goal, GRAVITY, JUMP_SPEED, MOVE_SPEED, platforms, PLAYER_FEET, PLAYER_HALF_HEIGHT, PLAYER_RADIUS, RIGHT, start, STEP, type Vec3 } from './level.ts';

export type Phase = 'ready' | 'playing' | 'paused' | 'complete';
export type GameSnapshot = { phase: Phase; collected: number; checkpoint: number; falls: number };
export type GameInput = { x: number; y: number; jump: boolean };
export const NO_INPUT: GameInput = { x: 0, y: 0, jump: false };
let initialization: Promise<void> | undefined;
export function initializePhysics() {
  initialization ??= RAPIER.init().catch(error => { initialization = undefined; throw error; });
  return initialization;
}

export class GardenSimulation {
  readonly world: RAPIER.World;
  readonly body: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  readonly controller: RAPIER.KinematicCharacterController;
  readonly collected = new Set<string>();
  phase: Phase = 'ready';
  checkpoint = 0;
  falls = 0;
  grounded = false;
  velocity = { x: 0, y: 0, z: 0 };
  private grace = 0;
  private jumpBuffer = 0;
  private disposed = false;

  constructor() {
    this.world = new RAPIER.World({ x: 0, y: -GRAVITY, z: 0 });
    this.world.timestep = STEP;
    for (const p of platforms) {
      this.world.createCollider(RAPIER.ColliderDesc.cuboid(p.size[0] / 2, p.size[1] / 2, p.size[2] / 2)
        .setTranslation(p.position.x, p.position.y, p.position.z));
    }
    this.body = this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
    this.collider = this.world.createCollider(RAPIER.ColliderDesc.capsule(PLAYER_HALF_HEIGHT, PLAYER_RADIUS), this.body);
    this.controller = this.world.createCharacterController(.015);
    this.controller.enableSnapToGround(.15);
    this.controller.enableAutostep(.18, .2, false);
    this.controller.setMaxSlopeClimbAngle(Math.PI / 4);
    this.place(start);
    // Initialize the scene query acceleration structure before the first move.
    this.world.step();
  }

  get position(): Vec3 { const p = this.body.translation(); return { x: p.x, y: p.y, z: p.z }; }
  get snapshot(): GameSnapshot { return { phase: this.phase, collected: this.collected.size, checkpoint: this.checkpoint, falls: this.falls }; }
  start() { if (this.phase === 'ready') this.phase = 'playing'; }
  pause() { if (this.phase === 'playing') { this.phase = 'paused'; this.jumpBuffer = 0; } }
  resume() { if (this.phase === 'paused') this.phase = 'playing'; }
  restart() {
    this.collected.clear(); this.checkpoint = 0; this.falls = 0;
    this.place(start); this.world.step(); this.phase = 'playing';
  }

  private place(feet: Vec3) {
    const center = { x: feet.x, y: feet.y + PLAYER_FEET + .025, z: feet.z };
    this.body.setTranslation(center, true);
    this.body.setNextKinematicTranslation(center);
    this.velocity = { x: 0, y: 0, z: 0 };
    this.grounded = false; this.grace = 0; this.jumpBuffer = 0;
  }

  step(input: GameInput = NO_INPUT) {
    if (this.disposed || this.phase !== 'playing') return;
    const length = Math.max(1, Math.hypot(input.x, input.y));
    const x = input.x / length, y = input.y / length;
    const targetX = (RIGHT.x * x + FORWARD.x * y) * MOVE_SPEED;
    const targetZ = (RIGHT.z * x + FORWARD.z * y) * MOVE_SPEED;
    const acceleration = this.grounded ? .38 : .22;
    this.velocity.x += (targetX - this.velocity.x) * acceleration;
    this.velocity.z += (targetZ - this.velocity.z) * acceleration;
    this.grace = this.grounded ? .11 : Math.max(0, this.grace - STEP);
    this.jumpBuffer = input.jump ? .14 : Math.max(0, this.jumpBuffer - STEP);
    if (this.jumpBuffer > 0 && this.grace > 0) {
      this.velocity.y = JUMP_SPEED;
      this.grounded = false; this.grace = 0; this.jumpBuffer = 0;
    }
    this.velocity.y = Math.max(-20, this.velocity.y - GRAVITY * STEP);
    const desired = { x: this.velocity.x * STEP, y: this.velocity.y * STEP, z: this.velocity.z * STEP };
    this.controller.computeColliderMovement(this.collider, desired);
    const movement = this.controller.computedMovement();
    const position = this.position;
    this.body.setNextKinematicTranslation({ x: position.x + movement.x, y: position.y + movement.y, z: position.z + movement.z });
    this.grounded = this.controller.computedGrounded() && this.velocity.y <= 0;
    if (this.grounded || (this.velocity.y > 0 && movement.y < desired.y - .001)) this.velocity.y = 0;
    this.world.step();
    this.updateProgress();
  }

  private updateProgress() {
    const p = this.position;
    if (p.y < -5) {
      this.falls++;
      this.place(this.checkpoint ? checkpoints[this.checkpoint - 1].position : start);
      this.world.step();
      return;
    }
    for (const blossom of blossoms) {
      if (Math.hypot(p.x - blossom.position.x, p.y - blossom.position.y, p.z - blossom.position.z) < .95) this.collected.add(blossom.id);
    }
    for (let i = this.checkpoint; i < checkpoints.length; i++) {
      const point = checkpoints[i].position;
      if (this.grounded && Math.hypot(p.x - point.x, p.z - point.z) < 2 && Math.abs(p.y - PLAYER_FEET - point.y) < .25) this.checkpoint = i + 1;
    }
    if (this.grounded && Math.hypot(p.x - goal.x, p.z - goal.z) < 1.6 && Math.abs(p.y - PLAYER_FEET - goal.y) < .25) this.phase = 'complete';
  }

  dispose() { if (!this.disposed) { this.disposed = true; this.world.free(); } }
}
