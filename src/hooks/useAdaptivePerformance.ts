import { useEffect, useState } from 'react';

export type PerformanceMode = 'full' | 'reduced';
export type FrameWindowQuality = 'healthy' | 'neutral' | 'slow';

export type PerformanceTrackerState = {
  mode: PerformanceMode;
  slowWindows: number;
  healthyWindows: number;
};

export const initialPerformanceTrackerState: PerformanceTrackerState = {
  mode: 'full',
  slowWindows: 0,
  healthyWindows: 0,
};

const WINDOW_DURATION_MS = 2_000;
const WARMUP_DURATION_MS = 1_500;
const MAX_FRAME_DELTA_MS = 250;
const MIN_WINDOW_SAMPLES = 30;

export function classifyFrameWindow(frameDeltas: number[]): FrameWindowQuality {
  if (frameDeltas.length < MIN_WINDOW_SAMPLES) return 'neutral';

  const averageDelta = frameDeltas.reduce((total, delta) => total + delta, 0) / frameDeltas.length;
  const missedFrameRatio = frameDeltas.filter((delta) => delta >= 25).length / frameDeltas.length;

  if (averageDelta >= 24 || missedFrameRatio >= 0.35) return 'slow';
  if (averageDelta <= 19.5 && missedFrameRatio <= 0.15) return 'healthy';
  return 'neutral';
}

export function advancePerformanceTracker(
  state: PerformanceTrackerState,
  quality: FrameWindowQuality,
): PerformanceTrackerState {
  if (quality === 'slow') {
    const slowWindows = state.slowWindows + 1;
    return {
      mode: state.mode === 'full' && slowWindows >= 2 ? 'reduced' : state.mode,
      slowWindows,
      healthyWindows: 0,
    };
  }

  if (quality === 'healthy') {
    const healthyWindows = state.healthyWindows + 1;
    return {
      mode: state.mode === 'reduced' && healthyWindows >= 4 ? 'full' : state.mode,
      slowWindows: 0,
      healthyWindows,
    };
  }

  return { ...state, slowWindows: 0, healthyWindows: 0 };
}

export function useAdaptivePerformance(): PerformanceMode {
  const [mode, setMode] = useState<PerformanceMode>('full');

  useEffect(() => {
    let frame: number | null = null;
    let previousTime: number | null = null;
    const startedAt = performance.now();
    let warmupEndsAt = startedAt + WARMUP_DURATION_MS;
    let windowStartedAt = warmupEndsAt;
    let samples: number[] = [];
    let tracker = initialPerformanceTrackerState;

    const resetSampling = () => {
      previousTime = null;
      samples = [];
      warmupEndsAt = performance.now() + WARMUP_DURATION_MS;
      windowStartedAt = warmupEndsAt;
    };

    const sample = (time: number) => {
      if (document.hidden) {
        frame = null;
        return;
      }
      frame = requestAnimationFrame(sample);

      if (previousTime === null) {
        previousTime = time;
        return;
      }

      const delta = time - previousTime;
      previousTime = time;
      if (delta <= 0 || delta > MAX_FRAME_DELTA_MS || time < warmupEndsAt) return;

      samples.push(delta);
      if (time - windowStartedAt < WINDOW_DURATION_MS) return;

      tracker = advancePerformanceTracker(tracker, classifyFrameWindow(samples));
      setMode((current) => (current === tracker.mode ? current : tracker.mode));
      samples = [];
      windowStartedAt = time;
    };

    const handleVisibilityChange = () => {
      resetSampling();
      if (!document.hidden && frame === null) frame = requestAnimationFrame(sample);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    frame = requestAnimationFrame(sample);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.performanceMode = mode;
    return () => {
      delete document.documentElement.dataset.performanceMode;
    };
  }, [mode]);

  return mode;
}
