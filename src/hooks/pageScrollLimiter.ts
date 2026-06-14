import { useEffect } from 'react';

const LINE_HEIGHT_PX = 16;
const MAX_FRAME_SECONDS = 0.05;
const WHEEL_DELTA_LINE = 1;
const WHEEL_DELTA_PAGE = 2;

export const PAGE_SCROLL_SPEED_PX_PER_SECOND = 1050;
export const MAX_QUEUED_VIEWPORTS = 0.9;
const CAPPED_SCROLL_TO_EVENT = 'capped-page-scroll-to';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function stepCappedScroll(current: number, target: number, maxDistance: number) {
  const distance = target - current;
  if (Math.abs(distance) <= maxDistance) return target;
  return current + Math.sign(distance) * maxDistance;
}

export function clampQueuedScrollTarget(
  current: number,
  target: number,
  delta: number,
  maxScroll: number,
  maxQueuedDistance: number,
) {
  return clamp(
    target + delta,
    Math.max(0, current - maxQueuedDistance),
    Math.min(maxScroll, current + maxQueuedDistance),
  );
}

export function normalizeWheelDelta(deltaY: number, deltaMode: number, viewportHeight: number) {
  if (deltaMode === WHEEL_DELTA_LINE) return deltaY * LINE_HEIGHT_PX;
  if (deltaMode === WHEEL_DELTA_PAGE) return deltaY * viewportHeight;
  return deltaY;
}

export function requestCappedPageScroll(top: number) {
  window.dispatchEvent(new CustomEvent<number>(CAPPED_SCROLL_TO_EVENT, { detail: top }));
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

function canNestedScrollerHandle(target: EventTarget | null, delta: number) {
  let element = target instanceof HTMLElement ? target : null;

  while (element && element !== document.body && element !== document.documentElement) {
    const style = window.getComputedStyle(element);
    const canScroll = /(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1;

    if (canScroll) {
      if (delta < 0 && element.scrollTop > 0) return true;
      if (delta > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1) return true;
    }

    element = element.parentElement;
  }

  return false;
}

function pageScrollIsLocked() {
  return document.body.style.overflow === 'hidden';
}

export function useCappedPageScroll() {
  useEffect(() => {
    let targetY = window.scrollY;
    let frame: number | null = null;
    let previousTime: number | null = null;
    let lastTouchY: number | null = null;

    const getMaxScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const getMaxQueuedDistance = () => window.innerHeight * MAX_QUEUED_VIEWPORTS;

    const animate = (time: number) => {
      const elapsedSeconds = previousTime === null
        ? 1 / 60
        : Math.min(MAX_FRAME_SECONDS, Math.max(0, (time - previousTime) / 1000));
      const currentY = window.scrollY;
      const nextY = stepCappedScroll(
        currentY,
        targetY,
        PAGE_SCROLL_SPEED_PX_PER_SECOND * elapsedSeconds,
      );

      previousTime = time;
      window.scrollTo(0, nextY);

      if (nextY === targetY) {
        frame = null;
        previousTime = null;
        return;
      }

      frame = requestAnimationFrame(animate);
    };

    const startAnimation = () => {
      if (frame === null && window.scrollY !== targetY) {
        frame = requestAnimationFrame(animate);
      }
    };

    const queueDelta = (delta: number) => {
      targetY = clampQueuedScrollTarget(
        window.scrollY,
        targetY,
        delta,
        getMaxScroll(),
        getMaxQueuedDistance(),
      );
      startAnimation();
    };

    const queueAbsoluteTarget = (nextTarget: number) => {
      targetY = clamp(nextTarget, 0, getMaxScroll());
      startAnimation();
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || pageScrollIsLocked()) return;

      const delta = normalizeWheelDelta(event.deltaY, event.deltaMode, window.innerHeight);
      if (delta === 0 || canNestedScrollerHandle(event.target, delta)) return;

      event.preventDefault();
      queueDelta(delta);
    };

    const handleTouchStart = (event: TouchEvent) => {
      lastTouchY = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touchY = event.touches[0]?.clientY;
      if (touchY === undefined || lastTouchY === null) return;

      const delta = lastTouchY - touchY;
      lastTouchY = touchY;
      if (pageScrollIsLocked() || delta === 0 || canNestedScrollerHandle(event.target, delta)) return;

      event.preventDefault();
      queueDelta(delta);
    };

    const handleTouchEnd = () => {
      lastTouchY = null;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented
        || event.metaKey
        || event.ctrlKey
        || event.altKey
        || pageScrollIsLocked()
        || isEditableTarget(event.target)
      ) {
        return;
      }

      const pageDistance = window.innerHeight * 0.82;
      const keyDeltas: Partial<Record<string, number>> = {
        ArrowDown: 72,
        ArrowUp: -72,
        PageDown: pageDistance,
        PageUp: -pageDistance,
        ' ': event.shiftKey ? -pageDistance : pageDistance,
      };
      const delta = keyDeltas[event.key];

      if (delta !== undefined) {
        event.preventDefault();
        queueDelta(delta);
        return;
      }

      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        queueAbsoluteTarget(event.key === 'Home' ? 0 : getMaxScroll());
      }
    };

    const syncExternalScroll = () => {
      if (frame === null) targetY = window.scrollY;
    };

    const handleScrollRequest = (event: Event) => {
      queueAbsoluteTarget((event as CustomEvent<number>).detail);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', syncExternalScroll, { passive: true });
    window.addEventListener(CAPPED_SCROLL_TO_EVENT, handleScrollRequest);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', syncExternalScroll);
      window.removeEventListener(CAPPED_SCROLL_TO_EVENT, handleScrollRequest);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);
}
