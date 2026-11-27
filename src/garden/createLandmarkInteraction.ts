import * as THREE from 'three';
import type { SectionId } from './journey';

type Options = {
  canvas: HTMLCanvasElement;
  camera: THREE.Camera;
  pins: Map<SectionId, HTMLAnchorElement>;
  meshes: THREE.Mesh[];
  targets: Map<THREE.Object3D, SectionId>;
  isActive: () => boolean;
  onHighlight: (id: SectionId | null) => void;
};

/** Use the actual object surfaces for pointing; HTML links provide focus and touch targets. */
export function createLandmarkInteraction({ canvas, camera, pins, meshes, targets, isActive, onHighlight }: Options) {
  const abort = new AbortController();
  const options = { signal: abort.signal };
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let active: SectionId | null = null;
  let press: { id: SectionId; pointerId: number; x: number; y: number; touch: boolean } | null = null;
  let pinPress: { id: SectionId; reveal: boolean } | null = null;

  function highlight(id: SectionId | null) {
    const next = isActive() ? id : null;
    if (next === active) return;
    active = next;
    pins.forEach((pin, key) => { pin.dataset.active = String(key === next); });
    onHighlight(next);
  }

  function clear() {
    press = null;
    pinPress = null;
    highlight(null);
  }

  function pick(event: PointerEvent): SectionId | null {
    if (!isActive()) return null;
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    raycaster.setFromCamera(pointer, camera);
    // The first surface also accounts for rocks, plants and other foreground occluders.
    const hit = raycaster.intersectObjects(meshes, false)[0];
    return hit ? targets.get(hit.object) ?? null : null;
  }

  function isPin(target: EventTarget | null) {
    return target instanceof Element && [...pins.values()].some(pin => pin.contains(target));
  }

  canvas.addEventListener('pointermove', event => {
    if (press && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8) press = null;
    if (event.pointerType === 'touch') return;
    const id = pick(event);
    highlight(id);
    if (id) canvas.style.cursor = 'pointer';
  }, options);
  canvas.addEventListener('pointerdown', event => {
    const id = event.isPrimary && event.button === 0 ? pick(event) : null;
    press = id ? { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, touch: event.pointerType === 'touch' } : null;
    if (!id) highlight(null);
  }, options);
  canvas.addEventListener('pointerup', event => {
    const start = press;
    press = null;
    if (!start || start.pointerId !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8 || pick(event) !== start.id) return;
    if (start.touch && active !== start.id) {
      highlight(start.id);
      return;
    }
    pins.get(start.id)?.click();
  }, options);
  canvas.addEventListener('pointerleave', event => {
    press = null;
    if (event.pointerType !== 'touch' && !isPin(event.relatedTarget)) highlight(null);
  }, options);
  canvas.addEventListener('pointercancel', clear, options);

  pins.forEach((pin, id) => {
    pin.dataset.active = 'false';
    pin.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch') highlight(id);
    }, options);
    pin.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'touch') highlight(isPin(event.relatedTarget) ? active : event.relatedTarget === canvas ? pick(event) : null);
    }, options);
    pin.addEventListener('pointerdown', event => {
      pinPress = event.isPrimary && event.pointerType === 'touch' ? { id, reveal: active !== id } : null;
    }, options);
    pin.addEventListener('pointercancel', () => { pinPress = null; }, options);
    pin.addEventListener('click', event => {
      const reveal = pinPress?.id === id && pinPress.reveal;
      pinPress = null;
      if (reveal && isActive() && event.detail > 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        event.stopPropagation();
        highlight(id);
      }
    }, { ...options, capture: true });
    pin.addEventListener('focus', () => {
      if (pin.matches(':focus-visible')) highlight(id);
    }, options);
    pin.addEventListener('blur', () => {
      if (active === id) highlight(null);
    }, options);
    pin.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); highlight(null); }
    }, options);
  });

  document.addEventListener('pointerdown', event => {
    if (event.target !== canvas && !isPin(event.target)) clear();
  }, { ...options, capture: true });
  window.addEventListener('scroll', clear, { ...options, passive: true });
  window.addEventListener('blur', clear, options);

  return { clear, dispose: () => { clear(); abort.abort(); } };
}
