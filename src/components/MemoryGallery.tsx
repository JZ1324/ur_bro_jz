import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, Maximize2, Pause, Play, RotateCw } from 'lucide-react';
import { memories } from '../content/profile';
import { EditorialDialog } from './EditorialDialog';
import { VoxelPhotoFrame } from './VoxelPhotoFrame';

type Memory = typeof memories[number];

function Postcard({ memory, flipped, onFlip, label }: { memory: Memory; flipped: boolean; onFlip: () => void; label: string }) {
  return <button type="button" className="memory-postcard" onClick={onFlip} aria-label={label} aria-pressed={flipped}>
    <VoxelPhotoFrame flipped={flipped} front={
        <img src={memory.image} alt={memory.alt} width={933} height={1400} loading="lazy" decoding="async" />
      } back={<>
        <span className="postcard-note">{memory.caption}</span>
        <span className="postcard-postmark" aria-hidden="true" />
        <span className="postcard-stamps" data-paired={memory.stamps.length > 1}>
          {memory.stamps.map(stamp => <img key={stamp} src={`${import.meta.env.BASE_URL}photo-gallery/stamps/${stamp}`} alt="" width={500} height={500} loading="lazy" decoding="async" />)}
        </span>
        <span className="postcard-signature">from JZ</span>
      </>} />
  </button>;
}

function MemoryCard({ memory, index, onEnlarge }: { memory: Memory; index: number; onEnlarge: () => void }) {
  const [flipped, setFlipped] = useState(false);
  return <figure>
    <Postcard memory={memory} flipped={flipped} onFlip={() => setFlipped(value => !value)} label={`${flipped ? 'Show front of' : 'Flip'} photo ${index + 1}: ${memory.caption}`} />
    <figcaption><span>{String(index + 1).padStart(2, '0')}</span>{memory.caption}</figcaption>
    <button className="memory-enlarge" onClick={onEnlarge} aria-label={`View photo ${index + 1}: ${memory.caption}`}>View larger<Maximize2 size={12} /></button>
  </figure>;
}

export function MemoryGallery({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [viewer, setViewer] = useState<{ index: number; flipped: boolean } | null>(null);
  const [playing, setPlaying] = useState(false);
  const open = viewer !== null;
  useEffect(() => { onOpenChange?.(open); }, [open, onOpenChange]);

  useEffect(() => {
    if (!open || !playing) return;
    const interval = window.setInterval(() => {
      if (!document.hidden) setViewer(current => current && ({ index: (current.index + 1) % memories.length, flipped: false }));
    }, 5000);
    function pauseWhenHidden() { if (document.hidden) setPlaying(false); }
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', pauseWhenHidden); };
  }, [open, playing]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      setPlaying(false);
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      setViewer(current => current && ({ index: (current.index + direction + memories.length) % memories.length, flipped: false }));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function movePhoto(direction: number) {
    setPlaying(false);
    setViewer(current => current && ({ index: (current.index + direction + memories.length) % memories.length, flipped: false }));
  }

  return <>
    <p className="memory-hint"><RotateCw size={13} />Tap a photo to read the note on the back.</p>
    <div className="memory-gallery" data-scroll-reveal="stagger" data-cat-stop="photos">{memories.map((memory, index) => <MemoryCard key={memory.image} memory={memory} index={index} onEnlarge={() => setViewer({ index, flipped: false })} />)}</div>
    <button type="button" className="memory-slideshow" onClick={() => { setViewer({ index: 0, flipped: false }); setPlaying(true); }}><Play size={14} />Play slideshow<span>{memories.length} postcards</span></button>
    <EditorialDialog open={open} onClose={() => { setPlaying(false); setViewer(null); }} title="photo viewer" className="photo-dialog">
      {viewer && <>
        <figure>
          <Postcard memory={memories[viewer.index]} flipped={viewer.flipped} onFlip={() => { setPlaying(false); setViewer(current => current && ({ ...current, flipped: !current.flipped })); }} label={viewer.flipped ? 'Show photo' : 'Turn postcard over'} />
          <figcaption>{memories[viewer.index].caption}</figcaption>
        </figure>
        <p className="photo-flip-hint"><RotateCw size={13} />{viewer.flipped ? 'Tap the note to see the photo' : 'Tap the photo to read the note'}</p>
        <div className="photo-navigation">
          <button className="round-control" aria-label="Previous photo" onClick={() => movePhoto(-1)}><ArrowLeft size={22} /></button>
          <p aria-live={playing ? 'off' : 'polite'}>{viewer.index + 1} / {memories.length}</p>
          <button className="round-control" aria-label="Next photo" onClick={() => movePhoto(1)}><ArrowRight size={22} /></button>
        </div>
        <div className="photo-tools">
          <button type="button" aria-label={playing ? 'Pause slideshow' : 'Play slideshow'} aria-pressed={playing} onClick={() => { setViewer(current => current && ({ ...current, flipped: false })); setPlaying(value => !value); }}>{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? 'Pause wander' : 'Play slideshow'}</button>
          <a href={memories[viewer.index].image} download={`garden-memory-${viewer.index + 1}.jpg`}><Download size={15} />Save photo</a>
        </div>
      </>}
    </EditorialDialog>
  </>;
}
