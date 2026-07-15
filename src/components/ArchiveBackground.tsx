import type { CSSProperties } from 'react';
import {
  motion,
  useTransform,
  type MotionValue,
} from 'motion/react';
import {
  getArchiveBackgroundAssets,
  getBackgroundLayerPolicy,
  type ArchiveBackgroundTheme,
} from './archiveBackgroundModel';
import { gardenDepthPresets } from './gardenCameraModel';
import type { GardenCameraRig } from '../hooks/useGardenCameraRig';

type ArchiveBackgroundProps = {
  camera: GardenCameraRig;
  theme: ArchiveBackgroundTheme;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  performanceReduced: boolean;
};

type CanopyLeafSpec = {
  id: string;
  side: 'left' | 'right';
  edge: string;
  top: string;
  size: string;
  frame: number;
  rotate: number;
  delay: number;
};

const canopyLeaves: CanopyLeafSpec[] = [
  { id: 'left-a', side: 'left', edge: '-1.1rem', top: '4%', size: 'clamp(3.3rem,7vw,6rem)', frame: 1, rotate: 18, delay: -1.4 },
  { id: 'left-b', side: 'left', edge: '2.7rem', top: '12%', size: 'clamp(2.6rem,5vw,4.6rem)', frame: 2, rotate: 43, delay: -3.8 },
  { id: 'left-c', side: 'left', edge: '-0.4rem', top: '31%', size: 'clamp(2.4rem,4.6vw,4rem)', frame: 1, rotate: 78, delay: -5.1 },
  { id: 'right-a', side: 'right', edge: '-1.2rem', top: '6%', size: 'clamp(3.5rem,7.4vw,6.2rem)', frame: 2, rotate: 202, delay: -2.3 },
  { id: 'right-b', side: 'right', edge: '3rem', top: '18%', size: 'clamp(2.5rem,5.2vw,4.5rem)', frame: 1, rotate: 226, delay: -4.7 },
  { id: 'right-c', side: 'right', edge: '-0.3rem', top: '39%', size: 'clamp(2.25rem,4.4vw,3.9rem)', frame: 2, rotate: 258, delay: -6.2 },
];

const scrollStops = [0, 0.22, 0.49, 0.7, 0.78, 0.88, 1];

export function ArchiveBackground({
  camera,
  theme,
  pointerX,
  pointerY,
  performanceReduced,
}: ArchiveBackgroundProps) {
  const assets = getArchiveBackgroundAssets(theme);
  const policy = getBackgroundLayerPolicy(performanceReduced, camera.reducedMotion);
  const pointerEnabled = policy.animated && !performanceReduced && camera.viewportMode === 'desktop';
  const worldScale = useTransform(camera.cameraScale, (value) => policy.animated ? value : 1);
  const worldRoll = useTransform(camera.cameraRoll, (value) => policy.animated ? value : 0);

  const distantX = useTransform([camera.cameraX, pointerX], ([cameraOffset, pointerOffset]) => (
    policy.animated
      ? Number(cameraOffset) * gardenDepthPresets.distant + (pointerEnabled ? Number(pointerOffset) * 5 : 0)
      : 0
  ));
  const distantY = useTransform([camera.cameraY, pointerY], ([cameraOffset, pointerOffset]) => (
    policy.animated
      ? Number(cameraOffset) * gardenDepthPresets.distant + (pointerEnabled ? Number(pointerOffset) * 5 : 0)
      : 0
  ));
  const middleX = useTransform([camera.cameraX, pointerX], ([cameraOffset, pointerOffset]) => (
    policy.animated
      ? Number(cameraOffset) * gardenDepthPresets.middle + (pointerEnabled ? Number(pointerOffset) * 9 : 0)
      : 0
  ));
  const middleY = useTransform([camera.cameraY, pointerY], ([cameraOffset, pointerOffset]) => (
    policy.animated
      ? Number(cameraOffset) * gardenDepthPresets.middle + (pointerEnabled ? Number(pointerOffset) * 9 : 0)
      : 0
  ));
  const foregroundX = useTransform([camera.cameraX, pointerX], ([cameraOffset, pointerOffset]) => (
    policy.animated
      ? Number(cameraOffset) * gardenDepthPresets.foreground + (pointerEnabled ? Number(pointerOffset) * 13 : 0)
      : 0
  ));
  const foregroundY = useTransform([camera.cameraY, pointerY], ([cameraOffset, pointerOffset]) => (
    policy.animated
      ? Number(cameraOffset) * gardenDepthPresets.foreground + (pointerEnabled ? Number(pointerOffset) * 13 : 0)
      : 0
  ));
  const canopyX = useTransform([camera.cameraX, pointerX], ([cameraOffset, pointerOffset]) => (
    policy.animated
      ? Number(cameraOffset) * gardenDepthPresets.canopy + (pointerEnabled ? Number(pointerOffset) * 18 : 0)
      : 0
  ));
  const canopyY = useTransform([camera.cameraY, pointerY], ([cameraOffset, pointerOffset]) => (
    policy.animated
      ? Number(cameraOffset) * gardenDepthPresets.canopy + (pointerEnabled ? Number(pointerOffset) * 18 : 0)
      : 0
  ));
  const distantScale = useTransform(
    camera.progress,
    scrollStops,
    policy.animated
      ? [1.02, 1.06, 1.1, 1.12, 1.08, 1.04, 1.02]
      : [1.06, 1.06, 1.06, 1.06, 1.06, 1.06, 1.06],
  );
  const middleScale = useTransform(camera.progress, scrollStops, policy.animated
    ? [1.04, 1.09, 1.14, 1.16, 1.1, 1.05, 1.03]
    : [1.08, 1.08, 1.08, 1.08, 1.08, 1.08, 1.08]);
  const foregroundScale = useTransform(camera.progress, scrollStops, policy.animated
    ? [1.08, 1.12, 1.18, 1.22, 1.12, 1.06, 1.03]
    : [1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1]);
  const distantOpacity = useTransform(
    camera.progress,
    scrollStops,
    policy.animated
      ? [0.22, 0.42, 0.4, 0.32, 0.2, 0, 0]
      : [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
  );
  const middleOpacity = useTransform(camera.progress, scrollStops, policy.animated
    ? [0.06, 0.34, 0.38, 0.26, 0.1, 0, 0]
    : [0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.22]);
  const foregroundOpacity = useTransform(camera.progress, scrollStops, policy.animated
    ? [0, 0.2, 0.3, 0.32, 0.1, 0, 0]
    : [0.16, 0.16, 0.16, 0.16, 0.16, 0.16, 0.16]);
  const canopyOpacity = useTransform(camera.progress, scrollStops, [0.18, 0.56, 0.5, 0.24, 0, 0, 0]);
  const phaseTintOpacity = useTransform(camera.progress, scrollStops, policy.animated
    ? [0.08, 0.15, 0.24, 0.3, 0.2, 0.08, 0.05]
    : [0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12]);
  const lightOpacity = useTransform(camera.progress, scrollStops, [0.08, 0.22, 0.3, 0.36, 0.14, 0.02, 0]);

  const lightX = useTransform([camera.cameraX, pointerX], ([cameraOffset, pointerOffset]) => (
    policy.animated
      ? Number(cameraOffset) * gardenDepthPresets.light + (pointerEnabled ? Number(pointerOffset) * 12 : 0)
      : 0
  ));
  const lightY = useTransform([camera.cameraY, pointerY], ([cameraOffset, pointerOffset]) => (
    policy.animated
      ? Number(cameraOffset) * gardenDepthPresets.light + (pointerEnabled ? Number(pointerOffset) * 12 : 0)
      : 0
  ));
  const lightXDesktop = useTransform(camera.progress, scrollStops, ['88%', '58%', '14%', '48%', '78%', '84%', '84%']);
  const lightYDesktop = useTransform(camera.progress, scrollStops, ['13%', '27%', '42%', '54%', '67%', '76%', '76%']);
  const lightXMobile = useTransform(camera.progress, scrollStops, ['12%', '11%', '13%', '10%', '19%', '22%', '22%']);
  const lightYMobile = useTransform(camera.progress, scrollStops, ['10%', '27%', '44%', '58%', '72%', '82%', '82%']);

  const hazeClass = theme === 'evening'
    ? 'bg-[radial-gradient(circle_at_22%_12%,rgba(122,166,174,0.12),transparent_33%),radial-gradient(circle_at_76%_42%,rgba(190,213,178,0.09),transparent_31%),linear-gradient(to_bottom,rgba(11,25,30,0.12),rgba(27,54,48,0.08)_62%,transparent)]'
    : 'bg-[radial-gradient(circle_at_24%_10%,rgba(255,226,170,0.15),transparent_34%),radial-gradient(circle_at_78%_44%,rgba(228,154,120,0.1),transparent_32%),linear-gradient(to_bottom,rgba(255,246,219,0.1),rgba(208,190,137,0.07)_64%,transparent)]';
  const lightClass = theme === 'evening'
    ? 'bg-[radial-gradient(circle,rgba(189,213,178,0.2)_0%,rgba(110,158,151,0.1)_28%,transparent_69%)]'
    : 'bg-[radial-gradient(circle,rgba(255,224,160,0.24)_0%,rgba(228,154,120,0.1)_30%,transparent_70%)]';

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden"
      aria-hidden="true"
      data-archive-background
      data-archive-background-theme={theme}
      data-archive-background-phase={camera.phase}
      data-archive-background-performance={performanceReduced ? 'reduced' : 'full'}
      data-archive-background-motion={camera.reducedMotion ? 'reduced' : 'full'}
    >
      <motion.div className={`absolute inset-0 ${hazeClass}`} style={{ opacity: phaseTintOpacity }} />

      <motion.div
        className="absolute inset-0 [transform-style:preserve-3d]"
        style={{ scale: worldScale, rotate: worldRoll }}
        data-archive-background-world
      >
        {policy.distant && (
          <motion.img
            src={assets.distant}
            alt=""
            width={1024}
            height={512}
            draggable={false}
            className="archive-background-landscape absolute -bottom-[8%] left-[-6%] h-[58%] w-[112%] object-fill"
            style={{
              opacity: distantOpacity,
              scale: distantScale,
              x: distantX,
              y: distantY,
            }}
            data-archive-background-layer="distant"
          />
        )}

        {policy.middle && (
          <motion.img
            src={assets.middle}
            alt=""
            width={1024}
            height={512}
            draggable={false}
            className="archive-background-landscape archive-background-middle absolute -bottom-[13%] left-[-8%] h-[66%] w-[116%] object-fill"
            style={{
              opacity: middleOpacity,
              scale: middleScale,
              x: middleX,
              y: middleY,
            }}
            data-archive-background-layer="middle"
          />
        )}

        {policy.foreground && (
          <motion.img
            src={assets.foreground}
            alt=""
            width={1024}
            height={512}
            draggable={false}
            className="archive-background-landscape archive-background-foreground absolute -bottom-[21%] left-[-10%] h-[72%] w-[120%] object-fill"
            style={{
              opacity: foregroundOpacity,
              scale: foregroundScale,
              x: foregroundX,
              y: foregroundY,
            }}
            data-archive-background-layer="foreground"
          />
        )}

        {policy.canopy && (
          <motion.div
            className="archive-background-canopy absolute inset-0"
            style={{ opacity: canopyOpacity, x: canopyX, y: canopyY }}
            data-archive-background-layer="canopy"
          >
            {canopyLeaves.map((leaf) => (
              <span
                key={leaf.id}
                className={`archive-background-canopy-leaf archive-background-canopy-leaf--${leaf.side} absolute ${leaf.id === 'left-c' ? 'archive-background-canopy-leaf-mobile-hidden' : ''}`}
                style={{
                  top: leaf.top,
                  width: leaf.size,
                  aspectRatio: '1 / 1',
                  rotate: `${leaf.rotate}deg`,
                  animationDelay: `${leaf.delay}s`,
                  ...(leaf.side === 'left' ? { left: leaf.edge } : { right: leaf.edge }),
                  '--archive-canopy-frame': `${leaf.frame * (100 / 3)}%`,
                } as CSSProperties & { '--archive-canopy-frame': string }}
              />
            ))}
          </motion.div>
        )}

        {policy.light && (
          <>
            <motion.div
              className="archive-background-light archive-background-light--desktop absolute"
              style={{ left: lightXDesktop, top: lightYDesktop, x: lightX, y: lightY, opacity: lightOpacity }}
              data-archive-background-layer="light"
            >
              <span className={`archive-background-light-breathe block h-full w-full ${lightClass}`} />
            </motion.div>
            <motion.div
              className="archive-background-light archive-background-light--mobile absolute"
              style={{ left: lightXMobile, top: lightYMobile, x: lightX, y: lightY, opacity: lightOpacity }}
              data-archive-background-layer="light-mobile"
            >
              <span className={`archive-background-light-breathe block h-full w-full ${lightClass}`} />
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
