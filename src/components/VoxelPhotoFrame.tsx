import type { ReactNode } from 'react';

/** One CSS solid: both postcard faces, the raised rim, and four thickness faces. */
export function VoxelPhotoFrame({ flipped, front, back }: { flipped: boolean; front: ReactNode; back: ReactNode }) {
  return <span className="photo-frame-tilt">
    <span className="postcard-turn voxel-photo-frame" data-flipped={flipped}>
      <span className="postcard-face postcard-front" aria-hidden={flipped}>{front}</span>
      <span className="postcard-face postcard-back" aria-hidden={!flipped}>{back}</span>
      {['top', 'right', 'bottom', 'left'].map(side => <span key={side} className={`frame-side frame-side-${side}`} aria-hidden="true" />)}
      {['front', 'back'].map(face => <span key={face} className={`frame-rim frame-rim-${face}`} aria-hidden="true">
        {['top', 'right', 'bottom', 'left'].map(side => <span key={side} className={`frame-beam frame-beam-${side}`} />)}
        {['tl', 'tr', 'bl', 'br'].map(corner => <span key={corner} className={`frame-corner frame-corner-${corner}`} />)}
      </span>)}
    </span>
  </span>;
}
