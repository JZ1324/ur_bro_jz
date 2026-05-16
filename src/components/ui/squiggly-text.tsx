import React, { useId } from "react";
import { motion } from "motion/react";

interface SquigglyTextProps {
  children: React.ReactNode;
  className?: string;
  baseFrequency?: number;
  scale?: number | [number, number];
  stepDuration?: number;
}

export const SquigglyText = ({
  children,
  className,
  baseFrequency = 0.02,
  scale = 2,
  stepDuration = 100,
}: SquigglyTextProps) => {
  const id = useId();

  return (
    <span className={`relative inline-block ${className || ""}`}>
      <motion.span
        style={{
          filter: `url(#${id})`,
        }}
        className="relative z-10 block"
      >
        {children}
      </motion.span>

      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id={id}>
            <motion.feTurbulence
              baseFrequency={baseFrequency}
              numOctaves="3"
              result="noise"
              seed="0"
              animate={{
                seed: [0, 1, 2, 3, 4],
              }}
              transition={{
                duration: (stepDuration / 1000) * 5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={Array.isArray(scale) ? 0 : scale}
              animate={Array.isArray(scale) ? {
                 scale: [scale[0], scale[1], scale[0]]
              } : {}}
               transition={Array.isArray(scale) ? {
                duration: (stepDuration / 1000) * 2,
                repeat: Infinity,
                ease: "easeInOut",
              } : {}}
            />
          </filter>
        </defs>
      </svg>
    </span>
  );
};
