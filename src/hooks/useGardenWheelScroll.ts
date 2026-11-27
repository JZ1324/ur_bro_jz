import { useEffect, type RefObject } from 'react';
import { clamp } from '../garden/journey';

function usesOwnScroll(target: Element, garden: HTMLElement) {
  for (let node: Element | null = target; node && node !== garden; node = node.parentElement) {
    if (node.scrollHeight > node.clientHeight && /^(auto|scroll)$/.test(getComputedStyle(node).overflowY)) return true;
  }
  return false;
}

export function useGardenWheelScroll(root: RefObject<HTMLElement | null>, paused: boolean) {
  useEffect(() => {
    const garden = root.current;
    if (!garden || paused) return;

    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let remaining = 0;
    let previousTime = 0;
    let appliedY = window.scrollY;

    function clear() {
      cancelAnimationFrame(frame);
      frame = 0;
      remaining = 0;
      previousTime = 0;
    }

    function advance(time: number) {
      frame = 0;
      if (Math.abs(window.scrollY - appliedY) > 1 || garden?.hasAttribute('data-blast-scroll-paused') || document.querySelector('dialog[open]')) {
        clear();
        return;
      }

      const elapsed = previousTime ? Math.min(time - previousTime, 32) : 16;
      const limit = clamp(innerHeight * .95, 520, 840) * elapsed / 1000;
      const distance = Math.trunc(clamp(remaining, -limit, limit));
      previousTime = time;
      if (Math.abs(remaining) < 1) return;
      if (!distance) {
        frame = requestAnimationFrame(advance);
        return;
      }
      const before = window.scrollY;
      window.scrollBy({ top: distance, behavior: 'instant' });
      appliedY = window.scrollY;
      remaining -= distance;
      if (appliedY === before) clear();
      else if (Math.abs(remaining) >= 1) frame = requestAnimationFrame(advance);
    }

    function onWheel(event: WheelEvent) {
      const target = event.target;
      const mode = event.deltaMode;
      const delta = event.deltaY * (mode === WheelEvent.DOM_DELTA_LINE ? 16 : mode === WheelEvent.DOM_DELTA_PAGE ? innerHeight : 1);
      if (event.defaultPrevented || !event.cancelable || motion.matches || event.ctrlKey || event.metaKey
        || event.shiftKey || event.altKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !delta
        || !(target instanceof Element) || target.closest('[role="dialog"]') || document.querySelector('dialog[open]')
        || usesOwnScroll(target, garden!)) {
        clear();
        return;
      }

      const page = document.scrollingElement!;
      if (delta < 0 ? window.scrollY <= 0 : window.scrollY >= page.scrollHeight - page.clientHeight - 1) {
        clear();
        return;
      }

      event.preventDefault();
      if (remaining * delta < 0) clear();
      const queueLimit = clamp(innerHeight * .16, 75, 135);
      remaining = clamp(remaining + delta, -queueLimit, queueLimit);
      if (!frame && Math.abs(remaining) >= 1) {
        appliedY = window.scrollY;
        previousTime = 0;
        frame = requestAnimationFrame(advance);
      }
    }

    garden.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', clear);
    window.addEventListener('pointerdown', clear);
    window.addEventListener('hashchange', clear);
    motion.addEventListener('change', clear);
    return () => {
      clear();
      garden.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', clear);
      window.removeEventListener('pointerdown', clear);
      window.removeEventListener('hashchange', clear);
      motion.removeEventListener('change', clear);
    };
  }, [root, paused]);
}
