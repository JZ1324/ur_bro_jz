import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useReducedMotion, useTransform, type MotionValue } from 'motion/react';

type Range = [number, number];

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
  const xValue = useTransform(progress, inputRange, [x[0] * factor, x[1] * factor]);
  const scaleValue = useTransform(progress, inputRange, scale);
  const opacityValue = useTransform(progress, inputRange, opacity);
  const rotateValue = useTransform(progress, inputRange, rotate);
  const filterValue = useTransform(progress, inputRange, [`blur(${blur[0]}px)`, `blur(${blur[1]}px)`]);

  const motionStyle = prefersReducedMotion
    ? { ...style }
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
