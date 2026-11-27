import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Fish, Waves, X } from 'lucide-react';
import { fishCatalog, getFish } from '../ocean/catalog';
import { FishIllustration } from './FishIllustration';
type Scene = ReturnType<typeof import('../ocean/createOcean')['createOcean']>;

export function OceanView({ fishIds, paused, previewId, onClosePreview }: { fishIds: string[]; paused: boolean; previewId: string | null; onClosePreview: () => void }) {
  const host = useRef<HTMLDivElement>(null), scene = useRef<Scene | null>(null);
  const meetButton = useRef<HTMLButtonElement>(null);
  const [near, setNear] = useState(false), [visible, setVisible] = useState(false), [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  const [metId, setMetId] = useState<string | null>(null);
  const preview = previewId ? getFish(previewId) : undefined;
  const met = metId ? getFish(metId) : undefined;
  const latest = useRef({ fishIds, paused, visible, previewId }); latest.current = { fishIds, paused, visible, previewId };
  useEffect(() => {
    const prefetch = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setNear(true); }, { rootMargin: '500px' });
    const visibility = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    prefetch.observe(host.current!); visibility.observe(host.current!);
    return () => { prefetch.disconnect(); visibility.disconnect(); };
  }, []);
  useEffect(() => {
    if (!near) return;
    let disposed = false; setReady(false); setFailed(false);
    import('../ocean/createOcean').then(({ createOcean }) => {
      if (disposed) return;
      scene.current = createOcean(host.current!, () => { if (!disposed) setFailed(true); }, id => { if (!disposed) setMetId(id); });
      scene.current.setFish(latest.current.fishIds, latest.current.previewId); scene.current.setPaused(latest.current.paused || !latest.current.visible); setReady(true);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; scene.current?.dispose(); scene.current = null; };
  }, [near, retry]);
  useEffect(() => { scene.current?.setFish(fishIds, previewId); setMetId(null); }, [fishIds, previewId]);
  useEffect(() => { scene.current?.setPaused(paused || !visible); }, [paused, visible]);
  return <figure className="ocean-world" aria-label={`A living voxel reef. ${fishIds.length ? `${fishIds.length} collected species swim here with the local fish.` : 'Local fish swim here. Collect your first fish to join them.'} Tap a fish or use Meet a fish to learn its name.${preview ? ` Previewing ${preview.name}; this does not add it to your collection.` : ''}`}>
    <div className="ocean-view-stage">
      <div className="ocean-light-rays" aria-hidden="true" />
      <div className="ocean-canvas" ref={host} style={failed ? { visibility: 'hidden' } : undefined} />
      {preview && <div className="ocean-reef-preview" data-finish={preview.finish}><span role="status">Preview · {preview.name}</span><button onClick={onClosePreview} aria-label="End creature preview"><X size={14} /></button></div>}
      {met && <div className="ocean-fish-greeting" style={preview ? { top: 70 } : undefined}>
        <FishIllustration fish={met} /><div role="status" aria-live="polite" aria-atomic="true"><strong>{met.name}</strong><span>Swimming over to say hey.</span></div>
        <button type="button" aria-label="Close fish greeting" onClick={() => { setMetId(null); meetButton.current?.focus({ preventScroll: true }); }}><X size={15} /></button>
      </div>}
      {(!ready || failed) && <div className="ocean-scene-fallback">
        {failed ? <><div className="ocean-fallback-fish">{(preview ? [preview] : fishCatalog.slice(0, 5)).map(fish => <FishIllustration key={fish.id} fish={fish} />)}</div><p>The reef couldn’t load. Your fish are still saved.</p><button onClick={() => setRetry(value => value + 1)}>Retry the reef</button></> : <><Waves size={24} strokeWidth={1} /><p>Loading the reef…</p></>}
      </div>}
    </div>
    <figcaption><button ref={meetButton} type="button" className="ocean-meet-fish" aria-label="Meet the next fish in the reef" disabled={!ready || failed || paused} onClick={() => scene.current?.meetNext()}><Fish size={16} strokeWidth={1.4} aria-hidden="true" />Meet a fish<ArrowRight size={14} aria-hidden="true" /></button></figcaption>
  </figure>;
}
