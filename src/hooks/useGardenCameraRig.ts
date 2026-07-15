import { useEffect, useState, type RefObject } from 'react';
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import {
  defaultGardenJourneyStops,
  mapGardenJourneyProgress,
  resolveGardenCameraState,
  resolveGardenJourneyStops,
  type GardenJourneyStops,
  type GardenViewportMode,
} from '../components/gardenCameraModel';
import type { BackgroundPhase } from '../components/archiveBackgroundModel';

export type GardenCameraRig = {
  progress: MotionValue<number>;
  cameraX: MotionValue<number>;
  cameraY: MotionValue<number>;
  cameraScale: MotionValue<number>;
  cameraRoll: MotionValue<number>;
  phase: BackgroundPhase;
  viewportMode: GardenViewportMode;
  reducedMotion: boolean;
};

export function useGardenCameraRig(
  pageProgress: MotionValue<number>,
  journeyRef: RefObject<HTMLElement | null>,
): GardenCameraRig {
  const reducedMotion = Boolean(useReducedMotion());
  const [viewportMode, setViewportMode] = useState<GardenViewportMode>(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
      ? 'mobile'
      : 'desktop'
  ));
  const [phase, setPhase] = useState<BackgroundPhase>(() => (
    resolveGardenCameraState(pageProgress.get(), viewportMode).phase
  ));
  const [journeyStops, setJourneyStops] = useState<GardenJourneyStops>(defaultGardenJourneyStops);
  const mappedProgress = useMotionValue(pageProgress.get());
  const smoothProgress = useSpring(mappedProgress, {
    stiffness: 170,
    damping: 30,
    mass: 0.3,
    restDelta: 0.0001,
  });
  const cameraProgress = useTransform(smoothProgress, (value) => (
    Math.max(0, Math.min(1, value))
  ));
  const cameraX = useTransform(cameraProgress, (value) => (
    resolveGardenCameraState(value, viewportMode).cameraOffset.x
  ));
  const cameraY = useTransform(cameraProgress, (value) => (
    resolveGardenCameraState(value, viewportMode).cameraOffset.y
  ));
  const cameraScale = useTransform(cameraProgress, (value) => (
    resolveGardenCameraState(value, viewportMode).scale
  ));
  const cameraRoll = useTransform(cameraProgress, (value) => (
    resolveGardenCameraState(value, viewportMode).roll
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateViewportMode = () => setViewportMode(mediaQuery.matches ? 'mobile' : 'desktop');
    updateViewportMode();
    mediaQuery.addEventListener('change', updateViewportMode);
    return () => mediaQuery.removeEventListener('change', updateViewportMode);
  }, []);

  useEffect(() => {
    const root = journeyRef.current;
    if (!root) return;

    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const stories = root.querySelector<HTMLElement>('[data-vine-anchor="stories"]');
      const photos = root.querySelector<HTMLElement>('[data-vine-anchor="photos"]');
      const meadow = root.querySelector<HTMLElement>('[data-vine-anchor="meadow"]');
      if (!stories || !photos || !meadow) return;

      const documentTop = (element: HTMLElement) => element.getBoundingClientRect().top + window.scrollY;
      const nextStops = resolveGardenJourneyStops({
        totalScroll: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
        viewportHeight: window.innerHeight,
        storiesTop: documentTop(stories),
        photosTop: documentTop(photos),
        meadowTop: documentTop(meadow),
      });
      setJourneyStops((current) => (
        current.every((stop, index) => Math.abs(stop - nextStops[index]) < 0.0005)
          ? current
          : nextStops
      ));
    };
    const scheduleMeasure = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(root);
    root.querySelectorAll<HTMLElement>('[data-vine-anchor]').forEach((anchor) => observer.observe(anchor));
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('load', scheduleMeasure);
    measure();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('load', scheduleMeasure);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [journeyRef]);

  useEffect(() => {
    const updateMappedProgress = (value: number) => {
      mappedProgress.set(mapGardenJourneyProgress(value, journeyStops));
    };
    updateMappedProgress(pageProgress.get());
    return pageProgress.on('change', updateMappedProgress);
  }, [journeyStops, mappedProgress, pageProgress]);

  useEffect(() => {
    const updatePhase = (value: number) => {
      const nextPhase = resolveGardenCameraState(value, viewportMode).phase;
      setPhase((current) => current === nextPhase ? current : nextPhase);
    };
    updatePhase(cameraProgress.get());
    return cameraProgress.on('change', updatePhase);
  }, [cameraProgress, viewportMode]);

  return {
    progress: cameraProgress,
    cameraX,
    cameraY,
    cameraScale,
    cameraRoll,
    phase,
    viewportMode,
    reducedMotion,
  };
}
