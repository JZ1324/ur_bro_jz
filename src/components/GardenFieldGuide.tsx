import { useEffect, useState } from 'react';
import { CloudRain, Headphones, Moon, Sparkles, Sun, Volume2, VolumeX, Waves, Wind } from 'lucide-react';
import type { SectionId } from '../garden/journey';
import { EditorialDialog } from './EditorialDialog';
import { useGardenSoundscape } from '../hooks/useGardenSoundscape';
import type { Theme } from '../themePreference';
import type { GardenMood } from '../garden/mood';

const atmospheres = [
  { id: 'breeze', label: 'Blossom breeze', icon: Wind },
  { id: 'rain', label: 'Soft rain', icon: CloudRain },
  { id: 'fireflies', label: 'Firefly night', icon: Sparkles },
] as const;
type Props = {
  open: boolean; active: SectionId; onClose: () => void; onSoundChange: (playing: boolean) => void;
  theme: Theme; onThemeChange: (theme: Theme) => void; mood: GardenMood; onMoodChange: (mood: GardenMood) => void;
  onWish: () => void; sceneAvailable: boolean;
};

export function GardenFieldGuide({ open, active, onClose, onSoundChange, theme, onThemeChange, mood, onMoodChange, onWish, sceneAvailable }: Props) {
  const sound = useGardenSoundscape();
  const [wishing, setWishing] = useState(false);
  const canWish = sceneAvailable && active === 'opening';
  useEffect(() => { onSoundChange(sound.soundscape !== 'quiet'); }, [sound.soundscape, onSoundChange]);
  useEffect(() => {
    if (!wishing) return;
    const timer = setTimeout(() => setWishing(false), 5200);
    return () => clearTimeout(timer);
  }, [wishing]);

  return <><EditorialDialog open={open} onClose={onClose} title="Garden settings" className="field-guide-dialog">
    <h2>Garden settings</h2>
    <section className="guide-atmosphere" aria-labelledby="guide-atmosphere-title">
      <div className="guide-sound-heading"><h3 id="guide-atmosphere-title">Garden weather</h3><Wind size={22} strokeWidth={1.35} /></div>
      <div className="guide-moods" role="group" aria-label="Garden atmosphere">{atmospheres.map(option => <button type="button" key={option.id} aria-pressed={mood === option.id} onClick={() => onMoodChange(option.id)}><option.icon size={18} strokeWidth={1.4} /><span>{option.label}</span></button>)}</div>
      <div className="guide-appearance">
        <div className="guide-theme-controls" role="group" aria-label="Colour theme">
          <button type="button" aria-pressed={theme === 'light'} onClick={() => onThemeChange('light')}><Sun size={17} strokeWidth={1.4} />Light</button>
          <button type="button" aria-pressed={theme === 'dark'} onClick={() => onThemeChange('dark')}><Moon size={17} strokeWidth={1.4} />Dark</button>
        </div>
        <button type="button" className="guide-wish" disabled={!canWish || wishing} aria-describedby={!canWish ? 'guide-wish-hint' : undefined} onClick={() => { setWishing(true); onWish(); }}><Sparkles size={16} strokeWidth={1.4} />{wishing ? 'Wish sent' : 'Make a wish'}</button>
      </div>
      {!canWish && <p id="guide-wish-hint" className="guide-wish-hint">{sceneAvailable ? 'You can make a wish at the entrance.' : 'Make a wish from the garden entrance once it loads.'}</p>}
    </section>
    <section className="guide-soundscape" aria-label="Garden soundscapes">
      <div className="guide-sound-heading"><h3>Background sound</h3><Headphones size={22} strokeWidth={1.35} /></div>
      <div className="soundscape-options" role="group" aria-label="Choose a soundscape">
        <button type="button" aria-pressed={sound.soundscape === 'quiet'} onClick={() => void sound.choose('quiet')}><VolumeX size={17} />Off</button>
        <button type="button" aria-pressed={sound.soundscape === 'rain'} onClick={() => void sound.choose('rain')}><CloudRain size={17} />Rain</button>
        <button type="button" aria-pressed={sound.soundscape === 'stream'} onClick={() => void sound.choose('stream')}><Waves size={17} />Stream</button>
      </div>
      {sound.soundscape !== 'quiet' && <label className="soundscape-volume"><Volume2 size={16} /><span>Volume</span><input aria-label="Soundscape volume" type="range" min={0} max={100} value={sound.volume} onChange={event => sound.setVolume(Number(event.target.value))} /><output>{sound.volume}%</output></label>}
      {sound.error && <p className="soundscape-error" role="status">{sound.error}</p>}
    </section>
  </EditorialDialog><p className="guide-wish-status" role="status" aria-live="polite">{wishing ? 'Wish sent.' : ''}</p></>;
}
