import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowRight, ArrowUp, Flower2, Pause, RotateCcw, X } from 'lucide-react';
import { Sprout } from './Sprout';
import type { TimeOfDay } from '../garden/landmarks';
import type { PlatformerApi } from '../game/createPlatformer';
import type { GameSnapshot } from '../game/simulation';
import { readGameRecord, recordCompletion } from '../game/save';
import './game.css';

const initial: GameSnapshot = { phase: 'ready', collected: 0, checkpoint: 0, falls: 0 };
type Props = { time: TimeOfDay; onClose(): void };

export function GameDialog({ time, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const api = useRef<PlatformerApi | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [snapshot, setSnapshot] = useState(initial);
  const [attempt, setAttempt] = useState(0);
  const [record, setRecord] = useState(readGameRecord);
  const [notice, setNotice] = useState('');
  const previous = useRef(initial);

  useLayoutEffect(() => {
    const element = dialog.current!;
    const origin = document.activeElement as HTMLElement | null;
    const scrollX = window.scrollX, scrollY = window.scrollY;
    const body = document.body;
    const properties = ['position', 'top', 'left', 'width', 'overflow'] as const;
    const saved = properties.map(key => [key, body.style[key]] as const);
    body.style.position = 'fixed'; body.style.top = `${-scrollY}px`; body.style.left = `${-scrollX}px`;
    body.style.width = '100%'; body.style.overflow = 'hidden';
    element.showModal();
    return () => {
      element.close();
      saved.forEach(([key, value]) => { body.style[key] = value; });
      window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
      origin?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    setLoadState('loading'); setSnapshot(initial); previous.current = initial; setNotice('');
    // Only the small dialog shell ships with the website. Physics and rendering
    // stay behind this import, including their WASM and model dependencies.
    void import('../game/createPlatformer').then(({ createPlatformer }) => createPlatformer({
      host: host.current!, controls: dialog.current!, time, signal: controller.signal,
      onChange: value => { if (!disposed) setSnapshot(value); },
      onError: () => { if (!disposed) setLoadState('error'); },
    })).then(instance => {
      if (disposed) instance.dispose();
      else { api.current = instance; setLoadState('ready'); }
    }).catch(error => {
      if (!disposed && !(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Hidden Garden could not start', error); setLoadState('error');
      }
    });
    return () => { disposed = true; controller.abort(); api.current?.dispose(); api.current = null; };
  }, [attempt, time]);

  useEffect(() => {
    if (snapshot.phase === 'complete' && previous.current.phase !== 'complete') setRecord(recordCompletion(snapshot.collected));
    if (snapshot.falls > previous.current.falls) setNotice('Back at your last checkpoint.');
    else if (snapshot.checkpoint > previous.current.checkpoint) setNotice('Checkpoint reached');
    else if (snapshot.falls === 0 && snapshot.checkpoint === 0) setNotice('');
    previous.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (loadState === 'error') { primary.current?.focus({ preventScroll: true }); return; }
    if (loadState !== 'ready') return;
    if (snapshot.phase === 'playing') host.current?.focus({ preventScroll: true });
    else primary.current?.focus({ preventScroll: true });
  }, [loadState, snapshot.phase]);

  const playing = loadState === 'ready' && snapshot.phase === 'playing';
  const ready = loadState === 'ready' && snapshot.phase === 'ready';
  const paused = loadState === 'ready' && snapshot.phase === 'paused';
  const complete = loadState === 'ready' && snapshot.phase === 'complete';

  return <dialog ref={dialog} className={`hidden-garden-dialog${time === 'dusk' ? ' game-dusk' : ''}`} aria-label="Hidden Garden adventure" onCancel={event => {
    event.preventDefault();
    if (playing) api.current?.pause();
    else if (paused) api.current?.resume();
    else onClose();
  }} onKeyDown={event => {
    event.stopPropagation();
    if (event.key !== 'Tab') return;
    // Keep Tab inside the game even when a browser would otherwise move focus
    // from the final dialog control into its own address bar.
    const buttons = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]')]
      .filter(element => element.getClientRects().length > 0);
    if (!buttons.length) return;
    event.preventDefault();
    const index = buttons.indexOf(document.activeElement as HTMLElement);
    const next = index < 0 ? (event.shiftKey ? buttons.length - 1 : 0) : (index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
    buttons[next].focus({ preventScroll: true });
  }}>
    <div className="game-world" ref={host} tabIndex={-1} role="group" aria-label="Garden playfield. Move with WASD or arrow keys. Space to jump. Escape to pause." />
    <header className="game-hud">
      {!playing && !ready && <div className="game-wordmark"><Sprout /><span>hidden garden<span className="game-wordmark-dot">.</span></span></div>}
      <div className="game-hud-actions">
        {loadState === 'ready' && !ready && <span className="game-flower-count" aria-label={`${snapshot.collected} of 12 blossoms collected`}><Flower2 size={19} strokeWidth={1.4} /><span>{snapshot.collected}<span className="game-count-total"> / 12</span></span></span>}
        {playing && <button className="game-icon-button" aria-label="Pause adventure" onClick={() => api.current?.pause()}><Pause size={18} /></button>}
        <button className="game-icon-button game-exit" aria-label="Return to website" onClick={onClose}><X size={20} strokeWidth={1.5} /></button>
      </div>
    </header>

    {loadState === 'loading' && <div className="game-screen game-loading-screen" role="status"><span className="game-loading-sprout"><Sprout /></span><p>A secret is growing.</p><span>Just a little moment.</span></div>}
    {loadState === 'error' && <div className="game-screen game-menu"><p className="game-eyebrow">A pause in the path</p><h2>The garden needs<br /><em>another moment.</em></h2><p>Something didn’t load. Your place on the website is safe.</p><button className="game-primary" ref={primary} onClick={() => setAttempt(value => value + 1)}>Try again <RotateCcw size={16} /></button><button className="game-text-button" onClick={onClose}>Return to the garden</button></div>}

    {ready && <div className="game-introduction">
      <h2>Hidden<br /><em>Garden</em></h2>
      <p className="game-intro-copy">Jump across the pond and find the treehouse.</p>
      <p className="game-intro-note">Collect up to 12 pink blossoms along the way. Lanterns mark checkpoints.</p>
      <button className="game-primary" ref={primary} onClick={() => api.current?.start()}>Start playing <ArrowRight size={18} strokeWidth={1.4} /></button>
      <div className="game-control-guide"><span className="game-keyboard-guide"><kbd>W A S D</kbd> or arrows to move <span>·</span> <kbd>Space</kbd> to jump</span><span className="game-touch-guide">Thumbstick to move <span>·</span> Tap ↑ to jump</span></div>
      {record.completed && <p className="game-personal-best">Welcome back. Your best wander: {record.best} of 12 blossoms.</p>}
    </div>}

    {paused && <div className="game-menu-shade"><div className="game-screen game-menu"><p className="game-eyebrow">No need to hurry</p><h2>A little<br /><em>breather.</em></h2><p>Your sprout will be right here.</p><button className="game-primary" ref={primary} onClick={() => api.current?.resume()}>Keep wandering <ArrowRight size={17} /></button><button className="game-text-button" onClick={() => api.current?.restart()}>Start the path again</button><button className="game-text-button" onClick={onClose}>Return to the garden</button><span className="game-menu-caption">Esc to continue</span></div></div>}

    {complete && <div className="game-menu-shade"><div className="game-screen game-menu game-complete"><span className="game-complete-flower"><Flower2 size={37} strokeWidth={1} /></span><p className="game-eyebrow">A small journey, just for you</p><h2>You made<br /><em>it home.</em></h2><p>{snapshot.collected === 12 ? 'Every blossom, kept close. What a lovely wander.' : `${snapshot.collected} of 12 blossoms gathered along the way.`}</p><p className="game-result-note">Best wander: {record.best} / 12 · Saved on this device</p><button className="game-primary" ref={primary} onClick={onClose}>Back to the garden <ArrowRight size={17} /></button><button className="game-text-button" onClick={() => api.current?.restart()}>Wander again</button></div></div>}

    {playing && <TouchControls api={api.current} />}
    <div className="game-notice" role="status" aria-live="polite">{playing ? notice : ''}</div>
  </dialog>;
}

function TouchControls({ api }: { api: PlatformerApi | null }) {
  const stick = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  function move(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointer.current !== event.pointerId) return;
    const element = stick.current!;
    const bounds = element.getBoundingClientRect();
    let x = (event.clientX - bounds.left - bounds.width / 2) / 34;
    let y = (bounds.top + bounds.height / 2 - event.clientY) / 34;
    const magnitude = Math.max(1, Math.hypot(x, y)); x /= magnitude; y /= magnitude;
    element.style.setProperty('--stick-x', `${x * 29}px`); element.style.setProperty('--stick-y', `${-y * 29}px`);
    api?.setStick(x, y);
  }
  function release(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null; api?.setStick(0, 0);
    stick.current?.style.setProperty('--stick-x', '0px'); stick.current?.style.setProperty('--stick-y', '0px');
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  useEffect(() => () => { api?.setStick(0, 0); }, [api]);
  return <div className="game-touch-controls">
    <div className="game-stick" ref={stick} role="group" aria-label="Thumbstick: drag to move" onPointerDown={event => {
      if (pointer.current !== null) return;
      event.preventDefault(); pointer.current = event.pointerId; event.currentTarget.setPointerCapture(event.pointerId); move(event);
    }} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}><span className="game-stick-lines" /><span className="game-stick-knob" /></div>
    <button className="game-jump" aria-label="Jump" onPointerDown={event => { event.preventDefault(); api?.jump(); }} onClick={event => { if (event.detail === 0) api?.jump(); }}><ArrowUp size={25} strokeWidth={1.6} /><span>jump</span></button>
  </div>;
}
