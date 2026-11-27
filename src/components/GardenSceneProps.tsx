import type { RefObject } from 'react';

export function GardenSceneProps({ layer }: { layer: RefObject<HTMLDivElement | null> }) {
  return <div ref={layer} className="garden-scene-props" aria-hidden="true">
    <svg data-cat-prop="knight" viewBox="0 56 30 32" fill="none" overflow="visible" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <g className="cat-knight">
        <path d="M24 85h-17l2-4h12l3 4Zm-3-5H10c1-4 3-6 5-9l-5 2-4-4 4-5 2-3-.1-5 4 3c5-1 9 4 9 10 0 4-2 8-4 11Z" fill="var(--story-paper)" stroke="var(--story-ink)" strokeWidth="1.65" />
        <path d="m13 65 1.2-.3m6 3c1 2-.6 6-2 8" stroke="var(--story-ink)" strokeWidth="1.4" />
      </g>
      <path className="cat-knight-surprise" d="m19 50-3-5m8 3 2-5m2 9 5-2" stroke="#be8750" strokeWidth="1.9" />
    </svg>
    <svg data-cat-prop="butterfly" viewBox="30 19 38 40" fill="none" overflow="visible" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <g className="cat-butterfly">
        <g className="cat-butterfly-wings" stroke="#85576c" strokeWidth="1.25">
          <path d="M49 35c-6-12-15-10-14-3 0 5 5 7 9 6-3 4-1 8 3 6 2-1 2-5 2-9Z" fill="#e9aab9" />
          <path d="M49 35c3-10 11-15 13-8 2 4-1 8-7 10 5 1 5 6 .5 7-3 1-6-5-6.5-9Z" fill="#f3cb8b" />
          <path d="m48 32-2-4m4 4 3-4m-4 7 1 8" />
        </g>
        <g className="cat-stolen-daisy">
          <path d="m50 49-4 8m2-4q5-2 5 0" stroke="#6f9d61" strokeWidth="1.4" />
          <path d="M48 50c-4 0-5-4-2-5-2-3 1-5 4-3 2-4 6-2 6 1 4 1 4 4 .4 5-.4 4-3.5 5-6 2Z" fill="#efadc3" stroke="#a3667a" strokeWidth="1.1" />
          <circle cx="51" cy="46" r="1.9" fill="#f7d27d" />
        </g>
      </g>
    </svg>
    <svg data-cat-prop="leaf" viewBox="18 14 65 43" fill="none" overflow="visible" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <g className="cat-leaf-umbrella">
        <path d="M49 52c1-9 5-18 10-24m-9 24q-.4 3-3 2" stroke="var(--story-ink)" strokeWidth="2.15" />
        <path d="M23 34c3-17 25-26 42-15 6 4 10 9 12 14-8-1-12 1-17 4-6-4-13-4-19 0-6-3-12-4-18-3Z" fill="#a0aa66" stroke="#4f6145" strokeWidth="1.8" />
        <path d="M29 29c13-7 30-11 41-4M42 34c2-5 5-7 8-10m9 10q-1-5-3-9" stroke="#667d4c" strokeWidth="1.25" />
      </g>
    </svg>
    <svg data-cat-prop="sprinkler" viewBox="0 0 56 50" fill="none" overflow="visible" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <g className="cat-spray" stroke="var(--sprinkler-water)" strokeWidth="2.1">
        <path d="M19 22C10-7-3-6-10 18" pathLength="26" strokeDasharray="26" />
        <path d="M26 21C27-33 61-40 76-7" pathLength="26" strokeDasharray="26" />
        <path d="M34 21C50-17 76-18 96 15" pathLength="26" strokeDasharray="26" />
        <path d="M40 23C61 3 86 8 103 31" pathLength="26" strokeDasharray="26" />
        <path d="m-10 23-1 3m18-30-1.5 2.5m56-18 2 2m13 16 1 3m21 21 2 3m5 13 1.5 3m-20-6 1 3" opacity=".7" />
      </g>
      <g className="cat-sprinkler" stroke="#3f5846" strokeWidth="1.7">
        <ellipse cx="27" cy="44" rx="19" ry="3.6" fill="currentColor" opacity=".17" stroke="none" />
        <path d="M3 44c1-7 6-8 10-6l6 2" strokeWidth="4.6" />
        <path d="M3 44c1-7 6-8 10-6l6 2" stroke="#82a36b" strokeWidth="2.5" />
        <path d="M24 34h7l9 8c1 1-.1 2.5-1.4 2.2l-10.8-3.1-11.9 3.5c-1.5.3-2-1.3-.8-2.3z" fill="#a3b58a" />
        <path d="M20 36l5 .5-.2 5.1-5.4-.7a1.3 1.3 0 0 1-.9-1.2l.2-2.4a1.3 1.3 0 0 1 1.3-1.3Z" fill="#d1a462" />
        <path d="M25 25h5.5l1 13a17 17 0 0 1-7.7.1z" fill="#7f9d74" />
        <path d="M17 22c5.5-2 15.8-2.7 21-.7l.5 5c-6 .6-14.3 1.1-21 .3l-1-2a2 2 0 0 1 .5-2.6Z" fill="#dc9d64" />
        <path d="m38 21 3.2-.3.5 5.4-3.2.3z" fill="#f1c688" />
        <path d="m20 22 .1-2m7 1.1.1-1.8m6.6 1.9v-1.8" strokeWidth="1.45" />
      </g>
      <path className="cat-wash-spark" d="m45 17 1-3 .8 3 3.2 1-3.2 1-.8 3-1-3-3-1Z" fill="#f8db84" />
    </svg>
    <svg data-cat-prop="camera" viewBox="24 17 46 32" fill="none" overflow="visible" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <g className="cat-camera">
        <g className="cat-photo-camera" stroke="var(--reaction-ink)" strokeWidth="1.65">
          <path fill="var(--paper)" d="m31 27 5-.4 2.6-4 7-.2 3 3.5 5 .1q3-.1 3.3 3.5l.2 11.5q0 3.2-3 3.1l-22 .4q-3.2.2-3.2-3l-.3-11.3q0-3 2.4-3.2Z" />
          <path d="M42 29c4-.3 7 2.5 6.7 6-.3 3.2-3.1 5.2-6.2 5.1-3.3-.1-6-2.9-5.6-5.8.2-2.9 2.5-5.1 5.1-5.3Z" fill="var(--color-accent-soft)" />
          <path d="m51 30 2-.2" stroke="var(--color-warm-accent)" />
        </g>
        <path className="cat-photo-spark" d="m58 21 2 4 4 1-4 2-1 4-2-4-3-1 3-2Z" fill="#f2c675" stroke="#ae7d45" strokeWidth="1.5" />
      </g>
    </svg>
  </div>;
}
