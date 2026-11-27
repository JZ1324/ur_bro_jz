import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ArrowRight, RotateCcw, Waves, X } from 'lucide-react';
import { rarityInfo, type Fish } from '../ocean/catalog';
import { createRevealPlayback, revealCues, type RevealStage } from '../ocean/reveal';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { FishIllustration } from './FishIllustration';
import './ocean-reveal.css';

type Props = { fish: Fish; preview: boolean; duplicate?: boolean; saved?: boolean; paused: boolean; onClose: () => void };
const cueText: Record<Exclude<RevealStage, 'catch' | 'arrival'>, string> = {
  descent: 'Descending into the abyss', chest: 'The chest is waking', rift: 'A rift opens in the deep',
};
const particles = Array.from({ length: 30 }, (_, index) => ({
  '--particle-x': `${(index * 37 + 11) % 100}%`,
  '--particle-y': `${(index * 23 + 7) % 100}%`,
  '--particle-delay': `${-(index % 7) * .7}s`,
  '--particle-size': `${2 + index % 4}px`,
  '--particle-angle': `${index * 137.5}deg`,
} as CSSProperties));

function containFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
  const first = controls[0], last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus({ preventScroll: true }); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus({ preventScroll: true }); }
}

function AwakeningChest() {
  return <svg className="reveal-chest" viewBox="0 0 200 150" aria-hidden="true">
    <ellipse cx="100" cy="130" rx="61" ry="8" fill="#010812" opacity=".6" />
    <path d="m40 70 51 24 71-25v37l-71 26-51-25Z" fill="#163d50" stroke="#79b8c1" strokeWidth="1.5" />
    <path d="m91 94 71-25v37l-71 26Z" fill="#0b263a" />
    <path d="m53 77 9 4v35l-9-4Zm53 12 9-3v36l-9 4Zm36-13 8-3v35l-8 3Z" fill="#c6cfac" />
    <path className="reveal-chest-light" d="m41 69 50-19 70 19-70 24Z" fill="#d3ffff" />
    <g className="reveal-chest-lid"><path d="m40 70 0-19 50-24 72 28v14L91 94Z" fill="#3a7280" stroke="#a7d1cb" strokeWidth="1.5" /><path d="m40 51 50-24 72 28-71 24Z" fill="#64a0a5" /><path d="m55 44 49 21 0 23-11 4V76L44 55Zm72-2 10 4-70 29-10-5Z" fill="#ded9ae" /><path d="m119 69 14-5v18l-14 5Z" fill="#f7e8bd" /></g>
  </svg>;
}

export function OceanCatchReveal({ fish, preview, duplicate = false, saved = true, paused, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null), titleId = useId(), noteId = useId();
  const primaryControl = useRef<HTMLButtonElement>(null);
  const reduced = useRef(typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const cues = revealCues[fish.rarity];
  const [stage, setStage] = useState<RevealStage>(() => reduced.current ? 'catch' : cues[0].stage);
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  const [run, setRun] = useState(0);
  const player = useRef<ReturnType<typeof createRevealPlayback> | null>(null);
  const suspended = paused || hidden;
  const finished = stage === 'catch';
  const showingFish = stage === 'arrival' || finished;
  const rarity = rarityInfo(fish.rarity);
  useBodyScrollLock(true);

  useEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    const changed = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  }, []);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => { reduced.current = media.matches; if (media.matches) player.current?.skip(); };
    media.addEventListener('change', changed);
    const playback = createRevealPlayback(cues, setStage, {
      now: () => performance.now(), schedule: (callback, delay) => window.setTimeout(callback, delay), cancel: handle => window.clearTimeout(handle as number),
    });
    player.current = playback;
    setStage(reduced.current ? 'catch' : cues[0].stage);
    if (reduced.current) playback.skip();
    else if (!paused && !document.hidden) playback.play();
    const frame = run > 0 ? requestAnimationFrame(() => primaryControl.current?.focus({ preventScroll: true })) : 0;
    return () => { cancelAnimationFrame(frame); playback.dispose(); player.current = null; media.removeEventListener('change', changed); };
  }, [cues, run]);
  useEffect(() => {
    if (suspended) player.current?.pause();
    else player.current?.play();
  }, [suspended, run]);

  const title = showingFish ? fish.name : stage === 'rift' && fish.rarity === 'legendary' ? 'Something golden surfaces' : cueText[stage as keyof typeof cueText];
  const note = preview ? 'Animation preview · no fish added to your collection' : !saved ? 'Catch kept for this visit · browser storage unavailable' : duplicate ? 'Another catch of this species · saved to your ocean' : 'A new discovery · saved to your ocean';

  return <dialog ref={dialog} className="ocean-reveal-dialog" data-rarity={fish.rarity} aria-labelledby={titleId} aria-describedby={noteId} onKeyDown={containFocus} onCancel={event => { event.preventDefault(); onClose(); }} style={{ '--reveal-color': rarity.color } as CSSProperties}>
    <div key={run} className="ocean-reveal-scene" data-rarity={fish.rarity} data-stage={stage} data-paused={suspended}>
      <div className="reveal-seascape" aria-hidden="true"><div className="reveal-surface" /><div className="reveal-depth-rays" /><svg className="reveal-seabed" viewBox="0 0 1440 280" preserveAspectRatio="none"><path d="M0 78 124 53l76 64 83-21 139 103 78-49 105 57 96-42 104 47 94-90 64 18 119-81 128 22 130-49v248H0Z" fill="#06151f" /><path d="m0 128 126-22 120 73 141-10 135 60 119-27 134 36 99-35 73 17 182-98 133 24 178-58v192H0Z" fill="#030c17" /></svg></div>
      <div className="reveal-particles" aria-hidden="true">{particles.map((style, index) => <i key={index} style={style} />)}</div>
      <div className="reveal-spotlight" aria-hidden="true" />
      <div className="reveal-rays" aria-hidden="true" />
      <div className="reveal-portal" aria-hidden="true"><i /><i /><i /></div>
      <div className="reveal-chest-wrap"><AwakeningChest /></div>
      <div className="reveal-creature" aria-hidden="true"><FishIllustration fish={fish} /></div>

      <header className="reveal-hud"><span><Waves size={14} />{preview ? 'Reveal preview' : 'Tide chest'}<i />{rarity.name}</span><button type="button" className="reveal-close" aria-label="Close reveal" onClick={onClose}><X size={18} /></button></header>
      {fish.rarity === 'ultra' && <div className="reveal-chapters" aria-label="Cutscene progress">{cues.map((cue, index) => <span key={cue.stage} data-active={cues.findIndex(item => item.stage === stage) >= index} aria-current={stage === cue.stage ? 'step' : undefined}><i />{String(index + 1).padStart(2, '0')}<span>{cue.stage === 'catch' ? 'Discovery' : cue.stage === 'rift' ? 'Breach' : cue.stage}</span></span>)}</div>}
      <div className="reveal-caption" aria-live="polite" aria-atomic="true"><span className="reveal-tier" data-visible={showingFish}>{rarity.name}{fish.rarity === 'ultra' ? ' · 0.1% chance' : ' catch'}</span><h2 id={titleId}>{title}</h2><p>{finished ? fish.note : showingFish ? (fish.rarity === 'ultra' ? 'From the deepest water. Into your ocean.' : 'Look what the tide brought in.') : ' '}</p></div>
      <footer className="reveal-controls"><p id={noteId}>{note}</p><div>{finished && preview && !reduced.current && <button key="replay" type="button" className="reveal-replay" onClick={() => setRun(value => value + 1)}><RotateCcw size={14} />Replay</button>}<button key="primary" ref={primaryControl} type="button" className={finished ? 'reveal-continue' : 'reveal-skip'} onClick={finished ? onClose : () => player.current?.skip()}>{finished ? preview ? 'Back to fish guide' : 'Back to chest' : 'Skip animation'}<ArrowRight size={15} /></button></div></footer>
    </div>
  </dialog>;
}
