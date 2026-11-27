import type { GameInput } from './simulation';

export function createGameInput(element: HTMLElement, onPause: () => void) {
  const held = new Set<string>();
  let stick = { x: 0, y: 0 };
  let jump = false;
  let enabled = false;
  const movement = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
  function down(event: KeyboardEvent) {
    if (event.code === 'Escape') return; // Native dialog cancel owns Escape.
    if (!enabled || !movement.has(event.code) || event.metaKey || event.ctrlKey || event.altKey) return;
    // Space on an actual UI button must still activate that button.
    if (event.code === 'Space' && event.target instanceof HTMLButtonElement) return;
    event.preventDefault(); event.stopPropagation();
    held.add(event.code);
    if (event.code === 'Space' && !event.repeat) jump = true;
  }
  function up(event: KeyboardEvent) { held.delete(event.code); }
  function clear() { held.clear(); stick = { x: 0, y: 0 }; jump = false; }
  function blur() { clear(); onPause(); }
  function visibility() { if (document.hidden) blur(); }
  element.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  document.addEventListener('visibilitychange', visibility);
  return {
    setEnabled(value: boolean) { enabled = value; clear(); },
    setStick(x: number, y: number) { if (enabled) stick = { x, y }; },
    jump() { if (enabled) jump = true; },
    read(): GameInput {
      const result = { x: stick.x + Number(held.has('KeyD') || held.has('ArrowRight')) - Number(held.has('KeyA') || held.has('ArrowLeft')),
        y: stick.y + Number(held.has('KeyW') || held.has('ArrowUp')) - Number(held.has('KeyS') || held.has('ArrowDown')), jump };
      jump = false; return result;
    },
    clear,
    dispose() {
      clear(); element.removeEventListener('keydown', down); window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility);
    },
  };
}
