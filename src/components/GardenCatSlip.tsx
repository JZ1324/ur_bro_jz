import { clamp, smoothstep } from '../garden/journey';

type Point = { x: number; y: number };

export function catSlipLayout(divider: number, width: number) {
  const gap = clamp(width * .115, 66, 120);
  const x = clamp(width * .243, 63, 295);
  const y = divider - 9;
  return {
    banana: { x, y },
    puddle: { x: x + gap, y: y + 17 },
    tossed: { x: Math.min(width - 24, x + gap * 2.04), y: y - 30 },
  };
}

const slipLaunchesAt = 126;
export const slipLandsAt = 700;
const slipClimbsAt = 1050;
export const slipEndsAt = 1480;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function catSlipFrame(elapsed: number, layout: ReturnType<typeof catSlipLayout>, feet: number, height: number, path: Point) {
  const { banana, puddle, tossed } = layout;
  const throwTime = clamp((elapsed - 32) / 535);
  const peel = {
    x: mix(banana.x, tossed.x, smoothstep(throwTime)),
    y: mix(banana.y, tossed.y, throwTime) - 67 * Math.sin(throwTime * Math.PI),
    tilt: mix(-13, 328, throwTime),
  };

  const launchX = banana.x + 17;
  const launchY = banana.y - feet + 6;
  if (elapsed < slipLaunchesAt) {
    const skid = smoothstep(elapsed / slipLaunchesAt);
    return {
      x: mix(banana.x, launchX, skid),
      y: mix(banana.y - feet, launchY, skid),
      tilt: -43 * skid,
      stretch: mix(1, .72, skid),
      phase: 'slipping',
      peel,
    };
  }

  if (elapsed < slipLandsAt) {
    const p = (elapsed - slipLaunchesAt) / (slipLandsAt - slipLaunchesAt);
    const arc = 4 * p * (1 - p);
    const lift = clamp(height * .205, 112, 170);
    return {
      x: mix(launchX, puddle.x, p),
      y: mix(launchY, puddle.y - feet, p) - lift * arc,
      tilt: mix(-43, -416, smoothstep(p)),
      stretch: 1 + .2 * arc - .28 * (1 - smoothstep(p / .14)),
      phase: 'airborne',
      peel,
    };
  }

  if (elapsed < slipClimbsAt) {
    const p = (elapsed - slipLandsAt) / (slipClimbsAt - slipLandsAt);
    return {
      x: puddle.x + 4 * Math.sin(p * Math.PI * 4),
      y: puddle.y - feet * .54 + 2 * Math.sin(p * Math.PI * 5),
      tilt: mix(-56, -12, p) + 12 * Math.sin(p * Math.PI * 4),
      stretch: mix(.68, .88, p),
      phase: 'stuck',
      peel,
    };
  }

  const p = clamp((elapsed - slipClimbsAt) / (slipEndsAt - slipClimbsAt));
  const easing = smoothstep(p);
  return {
    x: mix(puddle.x, path.x, easing),
    y: mix(puddle.y - feet * .54, path.y, easing) - 25 * Math.sin(p * Math.PI),
    tilt: mix(-12, 0, easing) + 19 * Math.sin(2 * p * Math.PI),
    stretch: mix(.88, 1, easing),
    phase: 'climbing',
    peel,
  };
}

export function CatSlipLines() {
  return <svg className="scroll-cat-slip-lines" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeLinecap="round" focusable="false">
    <path className="scroll-cat-skid-lines" strokeWidth="2.4" d="M10 64q11 2 24 0M18 73q9 1 17-2M65 62l7 4m-5 2 2 5" />
    <path className="scroll-cat-flight-lines" strokeWidth="2.4" d="M23 63q-6 7-9 16m15-10q-3 4-5 9M29 20l-4-7m17 5 1-8M68 35l8-5" />
  </svg>;
}

export function CatSlipScenery() {
  return <>
    <svg className="scroll-cat-banana" viewBox="0 0 54 39" focusable="false">
      <g stroke="#674727" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
        <path fill="#efba51" d="M24 23C17 24 9 21 5 16c1 7 4 15 13 16 5 1 10-2 13-5" />
        <path fill="#ffe08b" d="M26 24C22 19 24 10 27 4l5 1c-1 6-2 13 1 16 5 4 11 5 17 1-3 9-11 13-18 10-2 2-5 4-9 4-5 0-7-3-9-6 5 1 10-1 12-6Z" />
        <path fill="none" d="M28 9c-1 5-1 10 1 14m3 4c4 2 8 2 12-1m-19 3c-2 2-3 2-6 3" />
        <path fill="#976b39" d="m27 4 1-2 5 2-1 2Z" />
      </g>
    </svg>
    <div className="scroll-cat-puddle">
      <svg viewBox="0 0 102 47" focusable="false">
        <path fill="#72503b" stroke="#5a3c2d" strokeWidth="1.4" d="M9 19c10-7 19-5 27-11 10-7 26-4 33 1 6 4 13 3 22 6 15 5 10 16-3 20-12 4-19 4-29 5-20 4-36 0-48-5C1 30 1 25 9 19Z" />
        <path fill="#9d7557" d="M20 18c10-5 14-3 21-8 8-5 21-1 26 3 7 4 17 5 17 9-5 3-13 4-21 3-14-1-17 3-27 2-9-1-17-4-16-9Z" opacity=".76" />
        <g fill="none" stroke="#dbaf80" strokeLinecap="round" opacity=".8">
          <path d="M17 25c6 3 13 3 18 3m26-9c5 0 11 1 16 3M41 34c9 2 19 1 26 0" />
        </g>
        <path fill="#72503b" d="M10 41c5-2 10-1 8 2-2 2-8 3-10 1-1-1 0-2 2-3Zm82-4c6-2 9 1 5 3-4 2-9-1-5-3Z" />
      </svg>
      <div className="scroll-cat-mud-splash">
        {Array.from({ length: 6 }, (_, index) => <i key={index} />)}
      </div>
    </div>
  </>;
}

export function CatMudCoat() {
  return <svg className="scroll-cat-mud-coat" viewBox="0 0 256 256" focusable="false">
    <path fill="#926748" d="M42 174c8-8 15-2 17 4 4 6 9 1 15 6 6 4 3 9 0 13-4 9-20 10-28 6-9-4-11-22-4-29Zm120 18c0-6 6-6 10-10 3-3 0-9 7-11 7-4 12 6 14 6 6 1 10 4 9 12-4 14-14 21-25 19-9 0-16-7-15-16Z" />
    <path fill="#b98960" d="M49 181c5-6 8 4 13 3 6-1 7 4 4 7-6 4-20 0-17-10Zm123 12c5-2 3-8 7-11 3-1 4 1 5 3 2 4 9 1 9 6-3 5-17 7-21 2Z" />
    <path fill="#926748" d="M184 132c8-5 11 2 8 6l-6 2c-4 0-6-5-2-8Zm-9 14c2-2 7 0 6 3-3 3-8 1-6-3ZM62 151c7-4 8 5 3 6-6 1-7-3-3-6Z" />
  </svg>;
}
