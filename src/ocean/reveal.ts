import type { Rarity } from './catalog';

export const REEL_DURATION = 4200;
export type RevealStage = 'descent' | 'chest' | 'rift' | 'arrival' | 'catch';
export type RevealCue = { stage: RevealStage; duration: number };
const catchCue: RevealCue = { stage: 'catch', duration: 0 };

// Each tier has a longer, more elaborate entrance. Ultra gets a complete scene.
export const revealCues: Record<Rarity, readonly RevealCue[]> = {
  common: [{ stage: 'arrival', duration: 650 }, catchCue],
  uncommon: [{ stage: 'arrival', duration: 1100 }, catchCue],
  rare: [{ stage: 'arrival', duration: 1700 }, catchCue],
  epic: [{ stage: 'arrival', duration: 2300 }, catchCue],
  legendary: [{ stage: 'rift', duration: 1200 }, { stage: 'arrival', duration: 2000 }, catchCue],
  mythic: [{ stage: 'chest', duration: 1100 }, { stage: 'rift', duration: 1800 }, { stage: 'arrival', duration: 2100 }, catchCue],
  ultra: [{ stage: 'descent', duration: 2200 }, { stage: 'chest', duration: 2400 }, { stage: 'rift', duration: 2400 }, { stage: 'arrival', duration: 2800 }, catchCue],
};

export interface RevealScheduler {
  now(): number;
  schedule(callback: () => void, delay: number): unknown;
  cancel(handle: unknown): void;
}

/** A visible-time clock: hidden tabs and other overlays cannot eat the cutscene. */
export function createRevealPlayback(cues: readonly RevealCue[], onStage: (stage: RevealStage) => void, scheduler: RevealScheduler) {
  let index = 0, remaining = cues[0].duration, started = 0;
  let timer: unknown = null, disposed = false;
  const pause = () => {
    if (timer === null) return;
    remaining = Math.max(0, remaining - (scheduler.now() - started));
    scheduler.cancel(timer); timer = null;
  };
  const play = () => {
    if (disposed || timer !== null || cues[index].stage === 'catch') return;
    started = scheduler.now();
    timer = scheduler.schedule(() => {
      timer = null;
      if (disposed) return;
      index += 1; remaining = cues[index].duration;
      onStage(cues[index].stage); play();
    }, remaining);
  };
  const skip = () => {
    if (disposed || cues[index].stage === 'catch') return;
    pause(); index = cues.length - 1; remaining = 0; onStage('catch');
  };
  return { play, pause, skip, dispose: () => { pause(); disposed = true; } };
}
