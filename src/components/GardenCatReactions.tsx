import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createCartoonBlastSound } from '../garden/catSounds';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

export function GardenCatReactions() {
  return <svg className="scroll-cat-reactions" viewBox="0 0 84 84" fill="none" strokeLinecap="round" strokeLinejoin="round" focusable="false">
    <g className="cat-reaction" data-reaction="music">
      <g className="cat-music-note" stroke="var(--color-warm-accent)" strokeWidth="2">
        <path d="M24 35v-13l8-2v12" />
        <path fill="var(--color-warm-accent)" d="M24 34c-3-2-7 0-6 3 2 3 6 0 6-3Zm8-3c-3-1-7 1-6 3 2 3 6 0 6-3Z" />
      </g>
      <g className="cat-music-note" stroke="var(--sage)" strokeWidth="2">
        <path d="M58 29V17c4 3 7 3 7 7" />
        <path fill="var(--sage)" d="M58 28c-3-1-7 1-5 4 2 2 6-1 5-4Z" />
      </g>
    </g>
    <g className="cat-reaction" data-reaction="plant">
      <path className="cat-plant-soil" fill="#a57552" d="M16 80c5-3 12-3 18 0l-2 2-13 1Zm-2-8c2-2 4 0 2 2-2 1-4 0-2-2Zm21 0c3-2 5 0 3 2-1 2-5 0-3-2Z" />
      <g className="cat-plant-sprout" stroke="var(--reaction-ink)" strokeWidth="1.35">
        <path d="M25 80c1-6 1-11 4-16" />
        <path d="M27 73c-5 .5-9-2-10-6 5-.5 9 1 10 6Zm1-2c0-6 3-9 8-9 .2 5-3 9-8 9Z" fill="var(--sage)" />
      </g>
    </g>
    <g className="cat-reaction" data-reaction="reef">
      <g className="cat-reef-bubble">
        <path d="M24 49c4-.3 8 3 8 7.5 0 4-3 7.4-7.5 7.4-4.6 0-8-3-8-7.4 0-4.1 3.2-7.6 7.5-7.5Z" />
        <path d="M20 55c.1-1.4 1-2.5 2.4-3" />
      </g>
      <g className="cat-reef-bubble">
        <path d="M61 41c2.8 0 5.4 2.2 5.4 5.1 0 3-2.1 5.4-5.3 5.5-2.9 0-5.4-2.3-5.4-5.1 0-3.1 2.1-5.5 5.3-5.5Z" />
        <path d="M58.6 45.4c.2-1.1.8-1.7 1.8-2.1" />
      </g>
      <path className="cat-reef-pop" d="m62 21 3-4m-1 8 5-1m-12-5-2-4m4 13-2 4" strokeWidth="1.7" />
    </g>
  </svg>;
}

export function GardenCatSongShot({ layer }: { layer: RefObject<SVGSVGElement | null> }) {
  return <svg ref={layer} className="scroll-cat-reactions scroll-cat-song-shot" viewBox="0 0 84 84" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <g transform="translate(-32 17)">
      <g className="cat-note-trigger">
        <path d="M91 53h13l2 5H89Z" fill="#cfaa82" stroke="#775553" strokeWidth="1.4" />
        <path className="cat-note-plunger" d="M94 53v-4c0-2.5 7-2.5 7 0v4Z" fill="#ef8f87" stroke="#775553" strokeWidth="1.4" />
      </g>
      <path className="cat-note-click" d="m90 43-3-3m12 4 1-5m5 8 4-3" stroke="#fbc582" strokeWidth="2" />
    </g>
  </svg>;
}

const blastScrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

export function GardenSongBlast() {
  const layer = useRef<HTMLDivElement>(null);
  const seenBlast = useRef(false);
  const [scrollPaused, setScrollPaused] = useState(false);
  useBodyScrollLock(scrollPaused);

  useLayoutEffect(() => {
    const element = layer.current;
    if (!element) return;
    const sound = createCartoonBlastSound();
    const garden = element.closest('.garden-app');
    let resumeScroll = 0;

    function stopScrollInput(event: Event) {
      if (!garden?.hasAttribute('data-blast-scroll-paused')) return;
      if (event instanceof KeyboardEvent && (
        !blastScrollKeys.has(event.key) || event.altKey || event.ctrlKey || event.metaKey ||
        (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]'))
      )) return;
      if (event.cancelable) event.preventDefault();
    }

    function onGesture(event: Event) {
      if (event.target instanceof Element && event.target.closest('[data-blast-sound]')) return;
      void sound.unlock();
    }

    function onSoundButton(event: Event) {
      const button = event.target instanceof Element && event.target.closest('[data-blast-sound]');
      if (button) void sound.unlock();
    }

    function releaseScroll() {
      garden?.removeAttribute('data-blast-scroll-paused');
      setScrollPaused(false);
    }

    function onPress(event: Event) {
      if (!(event instanceof AnimationEvent) || event.animationName !== 'cat-note-press-paw') return;
      if (document.hidden || seenBlast.current || !garden) return;
      seenBlast.current = true;
      garden.setAttribute('data-blast-scroll-paused', '');
      setScrollPaused(true);
      resumeScroll = window.setTimeout(releaseScroll, 3000);
    }

    function onImpact(event: AnimationEvent) {
      if (event.animationName !== 'song-blast-cloud' || document.hidden) return;
      sound.play();
      if (garden?.hasAttribute('data-blast-scroll-paused')) {
        window.clearTimeout(resumeScroll);
        resumeScroll = window.setTimeout(releaseScroll, 850);
      }
    }
    window.addEventListener('wheel', stopScrollInput, { capture: true, passive: false });
    window.addEventListener('touchmove', stopScrollInput, { capture: true, passive: false });
    window.addEventListener('keydown', stopScrollInput, true);
    window.addEventListener('pointerup', onGesture);
    window.addEventListener('keydown', onGesture);
    element.addEventListener('animationstart', onImpact);
    garden?.addEventListener('animationstart', onPress);
    garden?.addEventListener('click', onSoundButton);
    void sound.unlock();
    return () => {
      window.clearTimeout(resumeScroll);
      garden?.removeAttribute('data-blast-scroll-paused');
      window.removeEventListener('wheel', stopScrollInput, true);
      window.removeEventListener('touchmove', stopScrollInput, true);
      window.removeEventListener('keydown', stopScrollInput, true);
      window.removeEventListener('pointerup', onGesture);
      window.removeEventListener('keydown', onGesture);
      element.removeEventListener('animationstart', onImpact);
      garden?.removeEventListener('animationstart', onPress);
      garden?.removeEventListener('click', onSoundButton);
      sound.dispose();
    };
  }, []);

  return <div ref={layer} className="song-blast" aria-hidden="true">
    <div className="song-blast-distortion" />
    <svg className="song-blast-art" viewBox="0 0 300 180" fill="none" strokeLinecap="round" strokeLinejoin="round" focusable="false">
      <g className="cat-note-drop" stroke="#543a54" strokeWidth="2">
        <path d="m143 89-7-15 12 5 12-5-3 15Z" fill="#eea17e" />
        <path d="M150 85c10 0 16 9 16 19 0 10-7 19-16 25-10-6-16-15-16-25 0-10 6-19 16-19Z" fill="#c8acdb" />
        <path d="m151 94 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#ffe1a0" strokeWidth="1.4" />
      </g>
      <g className="song-blast-cloud">
        <ellipse className="song-blast-ring" cx="150" cy="141" rx="133" ry="22" stroke="#ffd2a0" strokeWidth="3" />
        <path d="M121 130c7-13 11-24 10-40-28 10-52 1-59-13-19 1-31-19-18-31-4-18 13-28 31-25 9-14 30-17 47-10 17-13 41-12 58 1 20-3 36 5 42 18 19 1 30 12 25 25-2 14-15 21-31 21-8 15-31 20-57 15 0 14 3 27 11 39 12 1 20 6 28 12-28 10-85 11-115 1 9-7 17-10 28-13Z" fill="#edaa97" stroke="#805869" strokeWidth="2.4" />
        <path d="M67 56c18 18 43 1 56 9 21 12 37 10 55 1 19-9 38 3 57-13M134 106c8 4 22 4 31 0m-32 17c10 5 26 6 35 0" stroke="#ffe3bd" strokeWidth="3" />
        <path d="M94 38c6-7 18-9 27-5m67-1c10-5 19-2 24 5" stroke="#ffefce" strokeWidth="3" />
        <path d="m40 78-10 3m25 26-11 7m208-14 13 5m-3-39 12-5m-174 91-18 6m127-6 19 5" stroke="#ffda9c" strokeWidth="3" />
      </g>
    </svg>
  </div>;
}
