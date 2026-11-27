import { journeyFrame, sectionIds, type SectionId } from './journey.ts';

type Pose = { target: number[]; offset: number[]; height: number; width: number };
const solo: Pose = { target: [0, 2.6, 0], offset: [9, 7, 18], height: 7.6, width: 8.8 };
const poses: Record<SectionId, Pose> = {
  opening: { target: [0, 1.2, 0], offset: [12, 12, 17], height: 11.7, width: 13.6 },
  about: solo,
  projects: { target: [0, .95, 0], offset: [8, 22, 19], height: 7.8, width: 8.6 },
  school: solo, music: solo, memories: solo, contact: solo,
};

/** Camera and geometry share the same scroll sample, including backwards motion. */
export function sampleJourneyCamera(progress: number, aspect: number, mobile = false, reducedMotion = false, chessOverhead = 0) {
  const frame = journeyFrame(progress, reducedMotion);
  const a = poses[sectionIds[frame.from]], b = poses[sectionIds[frame.to]];
  const mix = (a: number, b: number) => a + (b - a) * frame.mix;
  const height = (pose: Pose) => Math.max(
    pose === poses.projects && !mobile ? 9.5 : pose.height,
    (pose === poses.opening && mobile ? 14.8 : pose.width) / Math.max(.1, aspect),
  );
  const target = a.target.map((v, i) => mix(v, b.target[i]));
  const offset = a.offset.map((v, i) => mix(v, b.offset[i]));
  const vertical = mix(height(a), height(b));
  if (chessOverhead === 0) return { target, offset, vertical };

  const [x, y, z] = offset;
  const distance = Math.hypot(x, y, z);
  const yaw = Math.atan2(x, z) * (1 - chessOverhead);
  const pitch = Math.atan2(y, Math.hypot(x, z));
  // Keep a small forward component so the default up vector still aligns the ranks.
  const tilt = pitch + (Math.PI / 2 - .001 - pitch) * chessOverhead;
  const horizontal = distance * Math.cos(tilt);
  const overheadHeight = 7.2 / Math.min(1, Math.max(.1, aspect));
  return {
    target,
    offset: [horizontal * Math.sin(yaw), distance * Math.sin(tilt), horizontal * Math.cos(yaw)],
    vertical: vertical + (overheadHeight - vertical) * chessOverhead,
  };
}
