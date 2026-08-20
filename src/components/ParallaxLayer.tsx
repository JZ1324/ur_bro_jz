import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useReducedMotion, useTransform, type MotionValue } from 'motion/react';

type Range = [number, number];
export type ParallaxPreset = 'custom' | 'calm-content' | 'cinematic-content';

export function getCalmContentKeyframes(inputRange: Range, factor = 1) {
  const [start, end] = inputRange;
  const span = Math.max(0, end - start);
  return {
    input: [start, start + span * 0.15, end - span * 0.15, end],
    y: [14 * factor, 0, 0, -18 * factor],
    x: [0, 0, 0, 0],
    scale: [0.995, 1, 1, 0.998],
    opacity: [0.97, 1, 1, 0.98],
    rotate: [0, 0, 0, 0],
    blur: [0, 0, 0, 0],
  };
}

export function getCinematicContentKeyframes(inputRange: Range, factor = 1) {
  const [start, end] = inputRange;
  const span = Math.max(0, end - start);
  return {
    input: [start, start + span * 0.225, end - span * 0.225, end],
    y: [44 * factor, 0, 0, -56 * factor],
    x: [0, 0, 0, 0],
    scale: [0.965, 1, 1, 0.975],
    opacity: [0.84, 1, 1, 0.72],
    rotate: [0, 0, 0, 0],
    blur: [0, 0, 0, 0],
  };
}

type ParallaxLayerProps = {
  progress: MotionValue<number>;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  y?: Range;
  x?: Range;
  scale?: Range;
  opacity?: Range;
  rotate?: Range;
  blur?: Range;
  inputRange?: Range;
  mobileFactor?: number;
  preset?: ParallaxPreset;
  performanceReduced?: boolean;
};

export function ParallaxLayer({
  progress,
  children,
  className,
  style,
  y = [0, 0],
  x = [0, 0],
  scale = [1, 1],
  opacity = [1, 1],
  rotate = [0, 0],
  blur = [0, 0],
  inputRange = [0, 1],
  mobileFactor = 0.55,
  preset = 'custom',
  performanceReduced = false,
}: ParallaxLayerProps) {
  const prefersReducedMotion = useReducedMotion();
  const [factor, setFactor] = useState(1);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateFactor = () => setFactor(
      mediaQuery.matches
        ? preset === 'calm-content'
          ? Math.min(mobileFactor, 4 / 9)
          : preset === 'cinematic-content'
            ? Math.min(mobileFactor, 0.55)
            : mobileFactor
        : 1,
    );

    updateFactor();
    mediaQuery.addEventListener('change', updateFactor);

    return () => mediaQuery.removeEventListener('change', updateFactor);
  }, [mobileFactor, preset]);

  const calmKeyframes = getCalmContentKeyframes(inputRange, factor);
  const cinematicKeyframes = getCinematicContentKeyframes(inputRange, factor);
  const presetKeyframes = preset === 'calm-content'
    ? calmKeyframes
    : preset === 'cinematic-content'
      ? cinematicKeyframes
      : null;
  const resolvedInput = presetKeyframes?.input ?? inputRange;
  const resolvedY = presetKeyframes?.y ?? [y[0] * factor, y[1] * factor];
  const resolvedX = presetKeyframes?.x ?? [x[0] * factor, x[1] * factor];
  const resolvedScale = presetKeyframes?.scale ?? scale;
  const resolvedOpacity = presetKeyframes?.opacity ?? opacity;
  const resolvedRotate = presetKeyframes?.rotate ?? rotate;
  const resolvedBlur = presetKeyframes?.blur ?? blur;

  const yValue = useTransform(progress, resolvedInput, resolvedY);
  const xValue = useTransform(progress, resolvedInput, resolvedX);
  const scaleValue = useTransform(progress, resolvedInput, resolvedScale);
  const opacityValue = useTransform(progress, resolvedInput, resolvedOpacity);
  const rotateValue = useTransform(progress, resolvedInput, resolvedRotate);
  const filterValue = useTransform(progress, resolvedInput, resolvedBlur.map((value) => `blur(${value}px)`));

  const motionStyle = prefersReducedMotion || performanceReduced
    ? { ...style }
    : preset !== 'custom'
      ? {
          ...style,
          y: yValue,
          scale: scaleValue,
          opacity: opacityValue,
        }
    : {
        ...style,
        x: xValue,
        y: yValue,
        scale: scaleValue,
        opacity: opacityValue,
        rotate: rotateValue,
        filter: filterValue,
      };

  return (
    <motion.div className={className} style={motionStyle}>
      {children}
    </motion.div>
  );
}
