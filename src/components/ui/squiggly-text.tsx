import React, { useId } from 'react';
import { motion, useTime, useTransform } from 'motion/react';
import { cn } from '../../lib/utils';

export interface SquigglyTextProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  steps?: number;
  stepDuration?: number;
  scale?: number | [number, number];
  baseFrequency?: number;
  numOctaves?: number;
  as?: 'span' | 'div';
}

export function SquigglyText({
  children,
  steps = 5,
  stepDuration = 80,
  scale = [6, 8],
  baseFrequency = 0.02,
  numOctaves = 3,
  as = 'span',
  className,
  style,
}: SquigglyTextProps) {
  const reactId = useId();
  const safeId = reactId.replace(/[:_]/g, '');
  const filterId = (index: number) => `squiggly-${safeId}-${index}`;

  const filters = React.useMemo(
    () => Array.from({ length: steps }, (_, index) => `url(#${filterId(index)})`),
    // filterId is stable because safeId is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [steps, safeId],
  );

  const time = useTime();
  const filter = useTransform(time, (currentTime) => filters[Math.floor(currentTime / stepDuration) % filters.length]);

  const scaleAt = (index: number) => (Array.isArray(scale) ? scale[index % scale.length] : scale);
  const Wrapper = as === 'div' ? motion.div : motion.span;

  return (
    <Wrapper style={{ filter, ...style }} className={cn('relative inline-block whitespace-nowrap', className)}>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 overflow-hidden"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {Array.from({ length: steps }).map((_, index) => (
            <filter id={filterId(index)} key={index}>
              <feTurbulence baseFrequency={baseFrequency} numOctaves={numOctaves} result="noise" seed={index} />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale={scaleAt(index)} />
            </filter>
          ))}
        </defs>
      </svg>
      {children}
    </Wrapper>
  );
}
