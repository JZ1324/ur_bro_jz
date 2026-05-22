import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useReducedMotion, useTransform, type MotionValue } from 'motion/react';

type Range = [number, number];

type ParallaxLayerProps = {
  progress: MotionValue<number>;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  y?: Range;
  scale?: Range;
  opacity?: Range;
  inputRange?: Range;
  mobileFactor?: number;
};

export function ParallaxLayer({
  progress,
  children,
  className,
  style,
  y = [0, 0],
  scale = [1, 1],
  opacity = [1, 1],
  inputRange = [0, 1],
  mobileFactor = 0.5,
}: ParallaxLayerProps) {
  const prefersReducedMotion = useReducedMotion();
  const [factor, setFactor] = useState(1);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateFactor = () => setFactor(mediaQuery.matches ? mobileFactor : 1);

    updateFactor();
    mediaQuery.addEventListener('change', updateFactor);

    return () => mediaQuery.removeEventListener('change', updateFactor);
  }, [mobileFactor]);

  const yValue = useTransform(progress, inputRange, [y[0] * factor, y[1] * factor]);
  const scaleValue = useTransform(progress, inputRange, scale);
  const opacityValue = useTransform(progress, inputRange, opacity);

  const motionStyle = prefersReducedMotion
    ? { ...style }
    : {
        ...style,
        y: yValue,
        scale: scaleValue,
        opacity: opacityValue,
      };

  return (
    <motion.div className={className} style={motionStyle}>
      {children}
    </motion.div>
  );
}
