import { Headphones, SlidersHorizontal } from 'lucide-react';

export function GardenControls({ onGuide, soundOn }: { onGuide: () => void; soundOn: boolean }) {
  return <button type="button" className="guide-toggle" onClick={onGuide} aria-label={soundOn ? 'Garden settings, sound is on' : undefined} aria-haspopup="dialog">
    {soundOn ? <Headphones size={17} strokeWidth={1.5} aria-hidden="true" /> : <SlidersHorizontal size={17} strokeWidth={1.5} aria-hidden="true" />}
    <span>Garden settings</span>
    {soundOn && <span className="sound-on-dot" aria-hidden="true" />}
  </button>;
}
