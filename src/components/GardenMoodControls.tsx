import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, CloudRain, Sparkles, Wind } from 'lucide-react';
import type { GardenMood } from '../garden/mood';

const moods = [
  { id: 'breeze', label: 'Blossom breeze', note: 'Warm light. Petals on the breeze.', icon: Wind },
  { id: 'rain', label: 'Soft rain', note: 'Silver skies. Ripples on the pond.', icon: CloudRain },
  { id: 'fireflies', label: 'Firefly night', note: 'Lanterns on. A little after-dark magic.', icon: Sparkles },
] as const;

export function GardenMoodControls({ mood, onChange, onWish, disabled = false }: { mood: GardenMood; onChange: (mood: GardenMood) => void; onWish: () => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [wishing, setWishing] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();
  const current = moods.find(option => option.id === mood)!;
  const Icon = current.icon;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  return <div className="garden-mood-controls" ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }} onKeyDown={event => {
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus({ preventScroll: true }); }
  }}>
    <p className={`garden-wish-note${wishing ? ' is-visible' : ''}`} role="status">{wishing ? 'A little wish, on its way.' : ''}</p>
    <div className="garden-mood-bar">
      <button ref={trigger} className="garden-mood-trigger" type="button" disabled={disabled} aria-expanded={open} aria-controls={panelId} aria-label={`Change garden mood, ${current.label}`} onClick={() => setOpen(value => !value)}>
        <Icon size={16} strokeWidth={1.5} aria-hidden="true" /><span>{current.label}</span><ChevronDown size={13} aria-hidden="true" />
      </button>
      {open && <div className="garden-mood-panel" id={panelId} role="group" aria-label="Garden atmosphere">
        <p>A change in the air</p>
        {moods.map(option => <button type="button" key={option.id} aria-pressed={mood === option.id} onClick={() => {
          onChange(option.id); setOpen(false); trigger.current?.focus({ preventScroll: true });
        }}><option.icon size={19} strokeWidth={1.4} aria-hidden="true" /><span><strong>{option.label}</strong><small>{option.note}</small></span>{mood === option.id && <Check size={15} aria-hidden="true" />}</button>)}
      </div>}
      <span className="garden-mood-divider" aria-hidden="true" />
      <button className="garden-wish-button" type="button" disabled={disabled} aria-label={wishing ? 'Wish sent' : 'Make a wish'} aria-disabled={wishing} onClick={() => {
        if (wishing) return;
        setOpen(false); setWishing(true); onWish();
        timer.current = setTimeout(() => { setWishing(false); timer.current = null; }, 5200);
      }}><Sparkles size={15} strokeWidth={1.5} aria-hidden="true" /><span>{wishing ? 'Wish sent' : 'Make a wish'}</span></button>
    </div>
  </div>;
}
