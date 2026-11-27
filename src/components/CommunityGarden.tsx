import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, Check, Flower2, RotateCcw, RotateCw, Sprout, X } from 'lucide-react';
import { FlowerCat, FlowerYellow, OceanWaves, SunBurst } from 'trazo-stickers';
import { readCommunity, type GardenFilter, type GardenPage } from '../garden/community';
import { plantInfo, type GardenPlant } from '../garden/plantings';
import type { TimeOfDay } from '../garden/landmarks';
import type { NavigateHandler } from '../hooks/useJourney';
import { PlantIllustration } from './PlantIllustration';
import './community.css';

type Scene = ReturnType<typeof import('../garden/createCommunityGarden')['createCommunityGarden']>;
type Props = { time: TimeOfDay; paused: boolean; revision: number; onPlant(): void; onEdit(plant: GardenPlant): void; onNavigate: NavigateHandler };
const filters: { id: GardenFilter; name: string }[] = [{ id: 'all', name: 'Everything' }, { id: 'flowers', name: 'Flowers' }, { id: 'plants', name: 'Plants' }, { id: 'fruit', name: 'Fruit' }];

export function CommunityGarden({ time, paused, revision, onPlant, onEdit, onNavigate }: Props) {
  const section = useRef<HTMLElement>(null), canvas = useRef<HTMLDivElement>(null), scene = useRef<Scene | null>(null);
  const note = useRef<HTMLDivElement>(null);
  const noteTrigger = useRef<HTMLButtonElement | null>(null);
  const plantButton = useRef<HTMLButtonElement>(null);
  const [near, setNear] = useState(false), [visible, setVisible] = useState(false);
  const [filter, setFilter] = useState<GardenFilter>('all'), [page, setPage] = useState(1);
  const [data, setData] = useState<GardenPage | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [renderFailed, setRenderFailed] = useState(false), [retry, setRetry] = useState(0), [refresh, setRefresh] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const latest = useRef({ time, paused, visible, data, selectedId }); latest.current = { time, paused, visible, data, selectedId };
  const selected = data?.plants.find(plant => plant.id === selectedId) ?? null;

  useEffect(() => {
    const node = section.current!;
    const prefetch = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setNear(true); }, { rootMargin: '700px' }); prefetch.observe(node);
    const visibility = new IntersectionObserver(([entry]) => { setVisible(entry.isIntersecting); }, { threshold: 0 }); visibility.observe(node);
    return () => { prefetch.disconnect(); visibility.disconnect(); };
  }, []);
  useEffect(() => {
    if (!near) return;
    const controller = new AbortController(); setBusy(true);
    readCommunity(filter, page, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setData(result); setError(''); setBusy(false);
    }).catch(reason => { if (!controller.signal.aborted) { setError(reason instanceof Error ? reason.message : 'The garden is resting. Please try again.'); setBusy(false); } });
    return () => controller.abort();
  }, [near, filter, page, revision, refresh]);
  useEffect(() => {
    if (!visible || paused) return;
    const update = () => { if (!document.hidden) setRefresh(value => value + 1); };
    const timer = window.setInterval(update, 20000); window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); window.removeEventListener('focus', update); document.removeEventListener('visibilitychange', update); };
  }, [visible, paused]);
  useEffect(() => {
    if (!near) return;
    let disposed = false; setRenderFailed(false); setSceneReady(false);
    import('../garden/createCommunityGarden').then(({ createCommunityGarden }) => {
      if (disposed) return;
      scene.current = createCommunityGarden(canvas.current!, showNote, () => { if (!disposed) setRenderFailed(true); });
      scene.current.setPlants(latest.current.data?.plants ?? []); scene.current.setTime(latest.current.time);
      scene.current.setPaused(latest.current.paused || !latest.current.visible); scene.current.select(latest.current.selectedId);
      setSceneReady(true);
    }).catch(() => { if (!disposed) setRenderFailed(true); });
    return () => { disposed = true; scene.current?.dispose(); scene.current = null; };
  }, [near, retry]);
  useEffect(() => { scene.current?.setPlants(data?.plants ?? []); }, [data]);
  useEffect(() => { scene.current?.select(selectedId); }, [selectedId]);
  useEffect(() => { scene.current?.setTime(time); }, [time]);
  useEffect(() => { scene.current?.setPaused(paused || !visible); }, [paused, visible]);

  function showNote(id: string, trigger?: HTMLButtonElement) {
    noteTrigger.current = trigger ?? null;
    setSelectedId(id);
    requestAnimationFrame(() => {
      const card = note.current; if (!card) return;
      card.focus({ preventScroll: true });
      const rect = card.getBoundingClientRect();
      if (rect.top < 24 || rect.bottom > innerHeight - 24) card.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  }
  function closeNote() {
    setSelectedId(null);
    const trigger = noteTrigger.current;
    (trigger?.isConnected ? trigger : plantButton.current)?.focus();
  }
  function changeFilter(value: GardenFilter) { setFilter(value); setPage(1); setSelectedId(null); }
  function changePage(value: number) { setPage(value); setSelectedId(null); }

  const empty = data?.total === 0;
  const selectedName = selected ? plantInfo(selected.kind).name : '';

  return (
    <section ref={section} id="shared-garden" className="community-garden" aria-labelledby="community-title">
      <div className="community-inner">
        <header className="community-heading" data-cat-stop="sprinkler" data-scroll-reveal>
          <h2 id="community-title">
            <span className="sticker-anchor title-sticker-anchor">
              Shared garden<FlowerYellow className="garden-sticker" color="#bf9050" rotate={15} focusable="false" />
            </span>
          </h2>
          <p>Planted by the people who visit.</p>
        </header>

        <div className="community-cat-lane" aria-hidden="true" />
        <div className="community-landscape">
          <figure className="community-scene" aria-label={`Shared 3D garden${data ? ` with ${data.plants.length} visible plantings` : ''}.${data?.plants.length ? ' Read and select plantings in the list below.' : ''}`}>
            <div className="community-stage">
              <div ref={canvas} className="community-canvas" />
              {!sceneReady && !renderFailed && <div className="community-scene-loading"><Sprout size={25} strokeWidth={1.3} /><span>Loading the garden…</span></div>}
              {renderFailed && (
                <div className="community-scene-loading">
                  <Sprout size={25} strokeWidth={1.3} />
                  <p>The 3D garden couldn’t load.</p>
                  <button onClick={() => setRetry(value => value + 1)}>Retry 3D view</button>
                </div>
              )}
            </div>
            {sceneReady && !renderFailed && (
              <figcaption className="community-turn">
                <button aria-label="Turn garden left" onClick={() => scene.current?.turn(-1)}><RotateCcw size={16} strokeWidth={1.5} /></button>
                <span>Turn the garden</span>
                <button aria-label="Turn garden right" onClick={() => scene.current?.turn(1)}><RotateCw size={16} strokeWidth={1.5} /></button>
              </figcaption>
            )}
          </figure>

          <div className="community-dock">
            <aside className="community-note" aria-label="Garden notes">
              <span className="community-note-mark" data-cat-stop="flower" data-note-open={selected ? true : undefined} aria-hidden="true">
                {!selected && <FlowerCat size={62} rotate={-8} focusable="false" />}
              </span>
              {selected ? (
                <div ref={note} className="community-postcard" tabIndex={-1} role="group" aria-label={`${selectedName} from ${selected.author}`}>
                  <button className="community-note-close" aria-label="Close planting note" onClick={closeNote}><X size={17} /></button>
                  <PlantIllustration kind={selected.kind} colors={selected.colors} design={selected.design} />
                  <h3>{selectedName}</h3>
                  <p className="community-handwriting">{selected.note || 'No note left with this one.'}</p>
                  <p className="community-from">From <strong>{selected.author}</strong></p>
                  {selected.accountLinked && <span className="plant-account-badge"><Check size={10} />Garden account</span>}
                  <time dateTime={new Date(selected.createdAt).toISOString()}>{new Date(selected.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</time>
                  {selected.canEdit && <button className="community-edit" onClick={() => onEdit(selected)}>Edit my planting <ArrowRight size={13} /></button>}
                </div>
              ) : (
                <div className="community-invitation">
                  <h3>{empty ? 'Plant the first seed' : 'Garden notes'}</h3>
                  <p>{empty ? 'Choose what to grow and leave a note for the next visitor.' : 'Pick a plant to read the note someone left.'}</p>
                </div>
              )}
            </aside>
            <button ref={plantButton} className="community-plant" onClick={onPlant}>
              <Flower2 size={18} strokeWidth={1.5} />
              <span>Add to the garden</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {error && <div className="community-error" role="alert"><span>{error}</span><button onClick={() => setRefresh(value => value + 1)} disabled={busy}>Try again</button></div>}

        {!!data?.total && (
          <div className="community-guestbook" aria-busy={busy}>
            <div className="community-list-heading">
              <h3>Plantings <span>{data.count.toLocaleString()}</span></h3>
              <div className="community-filters" role="group" aria-label="Filter shared garden">
                {filters.map(item => <button key={item.id} aria-pressed={filter === item.id} onClick={() => changeFilter(item.id)}>{item.name}</button>)}
              </div>
            </div>
            {data.plants.length > 0 ? (
              <div className="community-plant-list">
                {data.plants.map(plant => (
                  <button key={plant.id} aria-pressed={selected?.id === plant.id} onClick={event => showNote(plant.id, event.currentTarget)} aria-label={`Read ${plantInfo(plant.kind).name.toLowerCase()} from ${plant.author}`}>
                    <PlantIllustration kind={plant.kind} colors={plant.colors} design={plant.design} />
                    <span><strong>{plantInfo(plant.kind).name}</strong><small>from {plant.author}</small></span>
                    <ArrowRight size={15} strokeWidth={1.5} />
                  </button>
                ))}
              </div>
            ) : !busy && <p className="community-empty">No {filter} planted yet.</p>}
            {data.pages > 1 && (
              <nav className="community-pagination" aria-label="Garden patches">
                <button disabled={data.page <= 1 || busy} onClick={() => changePage(data.page - 1)}><ArrowLeft size={15} />Newer plantings</button>
                <span>{data.page} / {data.pages}</span>
                <button disabled={data.page >= data.pages || busy} onClick={() => changePage(data.page + 1)}>Older plantings<ArrowRight size={15} /></button>
              </nav>
            )}
          </div>
        )}

        <footer className="community-footer">
          <a href="#opening" onClick={event => onNavigate(event, 'opening')}><SunBurst className="link-sticker" color="var(--color-warm-accent)" rotate={12} focusable="false" />Back to the beginning <ArrowRight size={14} /></a>
          <a href="#ocean"><OceanWaves className="link-sticker" color="var(--sage)" focusable="false" />Visit the reef <ArrowDown size={14} /></a>
        </footer>
      </div>
    </section>
  );
}
