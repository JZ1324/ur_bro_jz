import test from 'node:test';
import assert from 'node:assert/strict';
import { rarities } from './catalog';
import { createRevealPlayback, revealCues, type RevealScheduler, type RevealStage } from './reveal';

function fakeClock() {
  let now = 0, serial = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const scheduler: RevealScheduler = {
    now: () => now,
    schedule: (callback, delay) => { const id = ++serial; timers.set(id, { at: now + delay, callback }); return id; },
    cancel: handle => { timers.delete(handle as number); },
  };
  return {
    scheduler,
    advance: (duration: number) => {
      const target = now + duration;
      for (;;) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > target) break;
        now = next[1].at; timers.delete(next[0]); next[1].callback();
      }
      now = target;
    },
    pending: () => timers.size,
  };
}

test('rarer catches have progressively longer entrances and Ultra has a complete cutscene', () => {
  let previous = 0;
  for (const rarity of rarities) {
    const cues = revealCues[rarity.id];
    const duration = cues.reduce((total, cue) => total + cue.duration, 0);
    assert.ok(duration > previous); previous = duration;
    assert.equal(cues.at(-1)?.stage, 'catch');
    assert.ok(cues.slice(0, -1).every(cue => cue.duration > 0));
  }
  assert.deepEqual(revealCues.ultra.map(cue => cue.stage), ['descent', 'chest', 'rift', 'arrival', 'catch']);
});

test('all seven reveals reach the final catch once and stop scheduling', () => {
  for (const rarity of rarities) {
    const clock = fakeClock(), stages: RevealStage[] = [];
    const playback = createRevealPlayback(revealCues[rarity.id], stage => stages.push(stage), clock.scheduler);
    playback.play(); playback.play(); clock.advance(30_000);
    assert.deepEqual(stages, revealCues[rarity.id].slice(1).map(cue => cue.stage));
    assert.equal(clock.pending(), 0);
    playback.play(); playback.skip(); clock.advance(30_000);
    assert.equal(stages.filter(stage => stage === 'catch').length, 1);
  }
});

test('backgrounding preserves the exact remaining time without restarting a chapter', () => {
  const clock = fakeClock(), stages: RevealStage[] = [];
  const playback = createRevealPlayback(revealCues.ultra, stage => stages.push(stage), clock.scheduler);
  playback.play(); clock.advance(1000); playback.pause(); playback.pause();
  clock.advance(120_000);
  assert.deepEqual(stages, []); assert.equal(clock.pending(), 0);
  playback.play(); clock.advance(1199); assert.deepEqual(stages, []);
  clock.advance(1); assert.deepEqual(stages, ['chest']);
  clock.advance(900); playback.pause(); clock.advance(60_000);
  playback.play(); clock.advance(1500); assert.deepEqual(stages, ['chest', 'rift']);
});

test('skip and reduced-motion playback jump directly to the catch without late stages', () => {
  for (const started of [false, true]) {
    const clock = fakeClock(), stages: RevealStage[] = [];
    const playback = createRevealPlayback(revealCues.ultra, stage => stages.push(stage), clock.scheduler);
    if (started) { playback.play(); clock.advance(900); }
    playback.skip(); playback.skip(); playback.play(); clock.advance(60_000);
    assert.deepEqual(stages, ['catch']); assert.equal(clock.pending(), 0);
  }
});

test('closing or replaying disposes the old scene with no stray callbacks', () => {
  const clock = fakeClock(), stages: RevealStage[] = [];
  const old = createRevealPlayback(revealCues.ultra, stage => stages.push(stage), clock.scheduler);
  old.play(); clock.advance(2000); old.dispose(); old.play(); old.skip();
  clock.advance(60_000); assert.deepEqual(stages, []); assert.equal(clock.pending(), 0);
  const replay = createRevealPlayback(revealCues.ultra, stage => stages.push(stage), clock.scheduler);
  replay.play(); clock.advance(2200); assert.deepEqual(stages, ['chest']);
  replay.dispose();
});
