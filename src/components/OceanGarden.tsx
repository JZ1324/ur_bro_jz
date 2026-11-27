import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, BookOpen, Check, Fish as FishIcon, Gift, Play, Search, Waves, X } from 'lucide-react';
import { ConchShell, Starfish } from 'trazo-stickers';
import { GardenDoodles } from './GardenDoodles';
import { caseChance, cases, fishCatalog, getFish, rarities, rarityInfo, rarityRank, rollFish, shopAt, tideAt, TIDE_LENGTH, type Fish, type Habitat, type Rarity, type ShopOffer } from '../ocean/catalog';
import { addFish, claimOffer, emptyCollection, OCEAN_STORAGE_KEY, offerClaimed, readCollection, saveCollection } from '../ocean/collection';
import { FishIllustration } from './FishIllustration';
import { OceanView } from './OceanView';
import { OceanCatchReveal } from './OceanCatchReveal';
import { REEL_DURATION } from '../ocean/reveal';
import { EditorialDialog } from './EditorialDialog';
import './ocean.css';
import './ocean-chest.css';
import { useGardenAccount } from '../account/AccountProvider';
import { GardenAccountNote } from './GardenAccount';

const WINNER_INDEX = 26;
const sortedCatalog = [...fishCatalog].sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity));
const guideFilters = ['all', ...rarities.map(rarity => rarity.id)] as const;
const chestPanes = [{ id: 'cases', name: 'Cases', icon: Gift }, { id: 'shop', name: 'Live shop', icon: Waves }, { id: 'collection', name: 'Collection', icon: FishIcon }] as const;
type ChestPane = typeof chestPanes[number]['id'];
type Reveal = { fish: Fish; strip: Fish[]; id: number; duplicate: boolean };
type RevealPhase = 'idle' | 'preparing' | 'spinning' | 'celebrating' | 'revealed';
const rarityStyle = (fish: Fish) => ({ '--fish-rarity': rarityInfo(fish.rarity).color }) as CSSProperties;

function RarityBadge({ fish }: { fish: Fish }) {
  return <span className="ocean-rarity" data-rarity={fish.rarity} style={rarityStyle(fish)}><i />{rarityInfo(fish.rarity).name}</span>;
}
const chestPaint = {
  reef: { lid: '#639e9d', end: '#376f78', front: '#245863' },
  kelp: { lid: '#609a84', end: '#356f62', front: '#224e4a' },
  abyss: { lid: '#747da9', end: '#4b547c', front: '#323f61' },
};

function TideChest({ habitat, color }: { habitat: Habitat; color: string }) {
  const paint = chestPaint[habitat];
  return <svg viewBox="0 0 200 140" className="ocean-chest" aria-hidden="true">
    <ellipse cx="100" cy="120" rx="69" ry="9" fill="#031e28" opacity=".45" />
    <path d="m37 64 73-25 55 25-74 27Z" fill={paint.lid} />
    <path d="m37 64 54 27v37l-51-24Z" fill={paint.end} />
    <path d="m91 91 74-27-3 40-71 24Z" fill={paint.front} />
    <path d="m40 86 51 25 72-25" fill="none" stroke="#102f3a" strokeWidth="3" opacity=".55" />
    <path d="m46 61 9-3 54 26v35l-9 3V88Zm85-12 10 4-73 26v35l-9-4V75Z" fill="#c29c66" />
    <path d="m37 64 54 26 74-26v5L91 96 37 69Z" fill="#e0bd83" />
    <path d="m118 84 18-6v15l-9 8-9-3Z" fill="#f3d89d" />
    <path d="m125 87 5-2v6l-5 2Z" fill="#514a42" />
    {habitat === 'reef' && <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M92 65 89 45 77 35 75 20M87 46 66 42 59 32m32 19 14-16 1-16m-1 18 15-6 6-11" stroke="#9c5d5c" strokeWidth="11" />
      <path d="M92 61 90 43 78 33 76 18M86 44 67 40 60 30m32 19 13-16 2-16m-1 18 14-6 6-11" stroke={color} strokeWidth="8" />
    </g>}
    {habitat === 'kelp' && <g>
      <path d="M94 65C58 62 76 39 55 26c26 3 34 15 32 25 1 6 5 10 7 14Z" fill="#70b59a" />
      <path d="M94 65c-18-30 15-32 5-58 33 23-1 39-5 58Z" fill={color} />
      <path d="M95 65c4-23 25-16 35-41 6 28-9 38-35 41Z" fill="#5da88d" />
    </g>}
    {habitat === 'abyss' && <g>
      <path d="m75 60-8-21 6-15 15 14 3 23Z" fill="#8c91d4" />
      <path d="m105 58 7-24 18-13-2 26-15 16Z" fill="#9299e1" />
      <path d="m86 53 1-28 13-19 13 22-7 29-12 9Z" fill={color} />
      <path d="m100 6 1 24-7 36-8-13 1-28Z" fill="#c7c9fc" />
      <path d="m100 6 13 22-12 2Z" fill="#e0e1ff" />
    </g>}
  </svg>;
}

export function OceanGarden({ paused }: { paused: boolean }) {
  const account = useGardenAccount();
  const [requesting, setRequesting] = useState(false);
  const section = useRef<HTMLElement>(null), busy = useRef(false), serial = useRef(0);
  const story = useRef<HTMLElement>(null), storyTrigger = useRef<HTMLButtonElement | null>(null);
  const caseButton = useRef<HTMLButtonElement>(null);
  const reef = useRef<HTMLDivElement>(null);
  const chestBody = useRef<HTMLDivElement>(null), paneButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const [collection, setCollection] = useState(() => account.user ? account.ocean : readCollection());
  const current = useRef(collection); current.current = collection;
  const pendingCollection = useRef<ReturnType<typeof emptyCollection> | null>(null);
  const [now, setNow] = useState(Date.now), [visible, setVisible] = useState(false);
  const [habitat, setHabitat] = useState<Habitat>('reef');
  const [reveal, setReveal] = useState<Reveal | null>(null), [phase, setPhase] = useState<RevealPhase>('idle');
  const [message, setMessage] = useState(''), [storageAvailable, setStorageAvailable] = useState(true);
  const [showAll, setShowAll] = useState(false), [selected, setSelected] = useState<Fish | null>(null);
  const [discovered, setDiscovered] = useState(false);
  const [pane, setPane] = useState<ChestPane>('cases');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');
  const [search, setSearch] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [revealPreview, setRevealPreview] = useState<{ fish: Fish; id: number } | null>(null);
  const tide = tideAt(now), stock = useMemo(() => shopAt(tide * TIDE_LENGTH), [tide]);
  const selectedCase = cases.find(item => item.id === habitat)!;
  const opening = phase === 'preparing' || phase === 'spinning' || phase === 'celebrating';
  const presenting = phase === 'celebrating' || revealPreview !== null;
  const controlsLocked = opening || revealPreview !== null || requesting;
  const savingLocked = controlsLocked || account.busy || !account.ready;
  const fishIds = useMemo(() => Object.keys(collection.fish).sort((a, b) => rarityRank(getFish(b)!.rarity) - rarityRank(getFish(a)!.rarity)), [collection.fish]);
  const total = Object.values(collection.fish).reduce((sum, quantity) => sum + quantity, 0);
  const seconds = Math.max(1, Math.ceil(((tide + 1) * TIDE_LENGTH - now) / 1000));
  const countdown = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const guideFish = (showAll ? sortedCatalog : fishIds.map(id => getFish(id)!)).filter(fish =>
    (rarityFilter === 'all' || fish.rarity === rarityFilter) && fish.name.toLowerCase().includes(search.trim().toLowerCase()));

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(section.current!); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || paused || presenting || !discovered || pane !== 'shop') return;
    const tick = () => { if (!document.hidden) setNow(Date.now()); };
    tick(); const timer = window.setInterval(tick, 1000);
    window.addEventListener('focus', tick); document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); window.removeEventListener('focus', tick); document.removeEventListener('visibilitychange', tick); };
  }, [visible, paused, presenting, discovered, pane]);
  useEffect(() => {
    if (account.user) return;
    const sync = (event: StorageEvent) => {
      if (event.key !== `garden:${OCEAN_STORAGE_KEY}`) return;
      const saved = readCollection();
      if (busy.current) {
        const pending = pendingCollection.current;
        if (pending && Object.entries(pending.fish).every(([id, count]) => (saved.fish[id] ?? 0) >= count)) pendingCollection.current = saved;
        return;
      }
      current.current = saved; setCollection(saved);
    };
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, [account.user]);
  useEffect(() => {
    if (!account.user) return;
    if (busy.current) {
      const pending = pendingCollection.current;
      if (pending && Object.entries(pending.fish).every(([id, count]) => (account.ocean.fish[id] ?? 0) >= count)) pendingCollection.current = account.ocean;
    } else { current.current = account.ocean; setCollection(account.ocean); }
  }, [account.ocean, account.user]);
  useEffect(() => {
    if (phase !== 'preparing') return;
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setPhase('spinning')); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [phase]);
  useEffect(() => {
    if (phase !== 'spinning') return;
    const timer = window.setTimeout(() => setPhase('celebrating'), REEL_DURATION);
    return () => clearTimeout(timer);
  }, [phase, reveal]);

  function keep(next: typeof collection) {
    current.current = next; setCollection(next); setStorageAvailable(account.user ? true : saveCollection(next));
  }
  function finishReveal() {
    if (!pendingCollection.current) return;
    const next = pendingCollection.current; pendingCollection.current = null; busy.current = false;
    current.current = next; setCollection(next); setPhase('revealed');
    const fish = reveal?.fish ?? getFish(next.lastCatch!)!;
    setMessage(`${rarityInfo(fish.rarity).name} catch: ${fish.name}. ${reveal?.duplicate ? 'Another little friend for your ocean.' : 'A new species has joined your ocean.'}`);
    requestAnimationFrame(() => caseButton.current?.focus({ preventScroll: true }));
  }
  async function openCase() {
    if (busy.current || paused || !account.ready || account.busy) return;
    busy.current = true;
    setRequesting(true);
    try {
      const base = account.user ? account.ocean : storageAvailable ? readCollection() : current.current;
      const saved = account.user ? await account.catchFish({ source: 'case', habitat }) : null;
      const fish = saved ? getFish(saved.fishId)! : rollFish(habitat), duplicate = !!base.fish[fish.id];
      const next = saved?.ocean ?? addFish(base, fish, 'case');
      // The server confirms account saves before the reveal starts. Guest catches
      // retain their existing immediate device save.
      pendingCollection.current = next; setStorageAvailable(account.user ? true : saveCollection(next));
      const strip = Array.from({ length: 32 }, () => rollFish(fish.habitat)); strip[WINNER_INDEX] = fish;
      setReveal({ fish, strip, id: ++serial.current, duplicate }); setMessage(''); setPreviewId(null);
      setPhase(matchMedia('(prefers-reduced-motion: reduce)').matches ? 'celebrating' : 'preparing');
    } catch (reason) { busy.current = false; setMessage(reason instanceof Error ? reason.message : 'Could not save your catch. Try again.'); }
    finally { setRequesting(false); }
  }
  async function collect(offer: ShopOffer) {
    if (busy.current || paused || !account.ready || account.busy) return;
    busy.current = true; setRequesting(true);
    try {
      const time = Date.now(), base = storageAvailable ? readCollection() : current.current;
      const saved = account.user ? await account.catchFish({ source: 'shop', tide: offer.tide, index: offer.index }) : null;
      const next = saved?.ocean ?? claimOffer(base, offer, time);
      setNow(time);
      if (!next) { setMessage('The tide changed. Take a look at the new arrivals.'); return; }
      keep(next);
      setMessage(`${saved ? getFish(saved.fishId)!.name : offer.fish.name} added to your collection.`);
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Could not save your catch. Try again.'); }
    finally { busy.current = false; setRequesting(false); }
  }
  function meet(fish: Fish, trigger: HTMLButtonElement) {
    storyTrigger.current = trigger; setSelected(fish);
    requestAnimationFrame(() => {
      const card = story.current; if (!card) return;
      card.focus({ preventScroll: true });
      const rect = card.getBoundingClientRect(), bounds = chestBody.current?.getBoundingClientRect();
      if (bounds && (rect.top < bounds.top + 16 || rect.bottom > bounds.bottom - 16)) card.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  }
  function closeStory() { setSelected(null); (storyTrigger.current ?? paneButtons.current[2])?.focus({ preventScroll: true }); storyTrigger.current = null; }
  function preview(fish: Fish) {
    setPreviewId(fish.id); setDiscovered(false);
    requestAnimationFrame(() => {
      reef.current?.focus({ preventScroll: true });
      reef.current?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
  }
  function watchReveal(fish: Fish) {
    if (busy.current || paused) return;
    busy.current = true;
    setRevealPreview({ fish, id: ++serial.current });
  }
  function closeRevealPreview() {
    busy.current = false; setRevealPreview(null);
    if (account.user || storageAvailable) { const saved = account.user ? account.ocean : readCollection(); current.current = saved; setCollection(saved); }
  }
  function openChest(next: ChestPane = 'cases') {
    if (controlsLocked || paused) return;
    setPane(next); setMessage(''); setNow(Date.now()); setDiscovered(true);
    requestAnimationFrame(() => paneButtons.current[chestPanes.findIndex(item => item.id === next)]?.focus({ preventScroll: true }));
  }
  function closeChest() {
    if (pendingCollection.current) finishReveal();
    setDiscovered(false);
  }
  function choosePane(next: ChestPane) {
    if (controlsLocked) return;
    setPane(next); if (next !== pane) setMessage('');
    if (next === 'shop') setNow(Date.now());
    requestAnimationFrame(() => {
      if (chestBody.current) chestBody.current.scrollTop = 0;
      paneButtons.current[chestPanes.findIndex(item => item.id === next)]?.focus({ preventScroll: true });
    });
  }
  function chooseCase(next: Habitat) {
    if (controlsLocked || next === habitat) return;
    setHabitat(next); setReveal(null); setPhase('idle'); setMessage('');
  }
  function chooseGuide(all: boolean) {
    setShowAll(all); setRarityFilter('all'); setSearch(''); setSelected(null); storyTrigger.current = null;
    requestAnimationFrame(() => { if (chestBody.current) chestBody.current.scrollTop = 0; });
  }
  function navigatePanes(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % chestPanes.length : event.key === 'ArrowLeft' ? (index + chestPanes.length - 1) % chestPanes.length : event.key === 'Home' ? 0 : event.key === 'End' ? chestPanes.length - 1 : null;
    if (next === null || controlsLocked) return;
    event.preventDefault(); choosePane(chestPanes[next].id); paneButtons.current[next]?.focus();
  }

  return <section className="ocean-garden" ref={section} aria-labelledby="ocean-title">
    <svg className="ocean-surface" viewBox="0 0 1440 85" preserveAspectRatio="none" aria-hidden="true"><path d="M0 85V42C180 82 300 2 510 29s285 68 510 28 310-8 420-24v52Z" fill="currentColor" /></svg>
    <div className="ocean-inner">
      <header className="ocean-heading" data-scroll-reveal>
        <h2 id="ocean-title"><span className="sticker-anchor title-sticker-anchor">The reef<Starfish className="garden-sticker reef-sticker" rotate={16} focusable="false" /></span></h2>
        <p>Select a fish to learn its name.</p>
      </header>
      <div className="ocean-playground">
        <div className="ocean-reef" ref={reef} tabIndex={-1}><OceanView fishIds={fishIds} paused={paused || discovered || presenting} previewId={previewId} onClosePreview={() => { setPreviewId(null); reef.current?.focus({ preventScroll: true }); }} /></div>
        <div className="ocean-dock">
          <button className="ocean-discovery" type="button" data-cat-stop="reef" aria-expanded={discovered} aria-haspopup="dialog" aria-label="Open ocean chest" onClick={() => openChest()} disabled={controlsLocked || paused}>
            <TideChest habitat={habitat} color={selectedCase.color} />
            <span className="ocean-dock-cta">Open a chest<ArrowRight size={17} aria-hidden="true" /></span>
          </button>
          <button className="ocean-collection-link" type="button" onClick={() => openChest('collection')} disabled={controlsLocked || paused} aria-label={`Open my fish, ${fishIds.length} of ${fishCatalog.length} species`}>
            <span className="ocean-collection-link-row"><span><FishIcon size={17} aria-hidden="true" />My fish</span><strong>{fishIds.length} / {fishCatalog.length}</strong></span>
            <progress value={fishIds.length} max={fishCatalog.length} aria-hidden="true" />
          </button>
        </div>
      </div>
      <footer className="ocean-footer"><GardenDoodles arrangement="reef" /><a href="#shared-garden"><ConchShell size={25} rotate={-13} focusable="false" />Back to the garden<ArrowUp size={14} aria-hidden="true" /></a></footer>
      <GardenAccountNote storageAvailable={storageAvailable} />
      <div className="garden-cat-nap-space" aria-hidden="true"><span data-cat-stop="nap" /></div>
    </div>
    <EditorialDialog open={discovered} onClose={closeChest} title="Ocean chest" className="ocean-chest-dialog">
      <header className="ocean-chest-heading">
        <h2>Ocean chest</h2>
        <div className="ocean-collection-progress"><span><FishIcon size={14} /><strong>{fishIds.length}</strong> / {fishCatalog.length} discovered</span><progress value={fishIds.length} max={fishCatalog.length} aria-label="Species discovered" /></div>
      </header>
      <GardenAccountNote storageAvailable={storageAvailable} />
      <div className="ocean-chest-tabs" role="tablist" aria-label="Fishing activities">{chestPanes.map((item, index) => <button key={item.id} ref={element => { paneButtons.current[index] = element; }} type="button" id={`ocean-tab-${item.id}`} role="tab" aria-selected={pane === item.id} aria-controls={`ocean-${item.id}`} tabIndex={pane === item.id ? 0 : -1} disabled={controlsLocked} onClick={() => choosePane(item.id)} onKeyDown={event => navigatePanes(event, index)}><item.icon size={16} aria-hidden="true" />{item.name}{item.id === 'collection' && <span>{fishIds.length}</span>}</button>)}</div>
      <div className="ocean-chest-body" ref={chestBody}>
      <div className={`ocean-status${storageAvailable && pane !== 'shop' ? ' ocean-sr-only' : ''}`} role="status" aria-live="polite" aria-atomic="true" hidden={!message && storageAvailable}>{message}{!storageAvailable && <span>Your browser couldn’t save this visit. Keep this page open to keep your catches.</span>}</div>
        <div id="ocean-cases" className="ocean-case-panel" role="tabpanel" aria-labelledby="ocean-tab-cases" tabIndex={0} aria-busy={opening} hidden={pane !== 'cases'}>
          <div className="ocean-case-layout">
          <div className="ocean-case-picker">
            <h3>Choose a case.</h3><p>Each case has a different set of fish.</p>
            <div className="ocean-case-tabs" role="group" aria-label="Choose a fish case">{cases.map(item => <button key={item.id} aria-pressed={habitat === item.id} onClick={() => chooseCase(item.id)} disabled={controlsLocked} style={{ '--case-color': item.color } as CSSProperties}><TideChest habitat={item.id} color={item.color} /><span><strong>{item.name.replace(' case', '')}</strong><small>{fishCatalog.filter(fish => fish.habitat === item.id).length} species</small></span><Check className="ocean-case-check" size={15} aria-hidden="true" /></button>)}</div>
            <span className="ocean-picker-note"><Gift size={14} />Always free to open</span>
          </div>
          <div className="ocean-case-stage">
          <div className={`ocean-case-window is-${phase}`}>
            {reveal ? <><span className="ocean-reel-pointer" aria-hidden="true" /><div className="ocean-reel" key={reveal.id} aria-hidden="true" style={{ transform: phase !== 'preparing' && phase !== 'idle' ? `translateX(calc(-${WINNER_INDEX} * (var(--reel-card-width) + 8px)))` : 'translateX(0)' }}>
              {reveal.strip.map((fish, index) => <div key={index} className={`ocean-reel-card${index === WINNER_INDEX && (phase === 'revealed' || phase === 'celebrating') ? ' is-winner' : ''}`} data-rarity={fish.rarity} data-finish={fish.finish} style={rarityStyle(fish)}><FishIllustration fish={fish} /><span>{fish.name}</span><small>{rarityInfo(fish.rarity).name}</small></div>)}
            </div></> : <TideChest key={habitat} habitat={habitat} color={selectedCase.color} />}
          </div>
          <div className="ocean-case-result" aria-live="polite" aria-atomic="true">{phase === 'revealed' && reveal ? <><RarityBadge fish={reveal.fish} /><strong>{reveal.fish.name}</strong><span>{reveal.duplicate ? 'One more of this species.' : 'Your first of this species.'} Added to your ocean.</span></> : <><span className="ocean-case-kicker">{opening ? 'A catch is on its way' : `${rarities.length} rarities to discover`}</span><strong>{selectedCase.name}</strong><span>{opening ? 'Opening your case…' : selectedCase.subtitle}</span></>}</div>
          <button ref={caseButton} className="ocean-open-button" onClick={openCase} disabled={savingLocked || paused} aria-disabled={savingLocked || paused}>{opening || requesting ? <><Waves size={17} />Finding your fish…</> : <><Gift size={17} />{reveal ? 'Open another case' : `Open ${selectedCase.name}`}<span>Free<ArrowRight size={15} /></span></>}</button>
          {opening ? <button className="ocean-skip-reveal" onClick={() => { finishReveal(); requestAnimationFrame(() => caseButton.current?.focus({ preventScroll: true })); }}>Skip to my catch <ArrowRight size={14} /></button> : phase === 'revealed' && reveal ? <button className="ocean-skip-reveal" onClick={() => { chooseGuide(false); choosePane('collection'); }}>View my collection<ArrowRight size={14} /></button> : <p className="ocean-case-footnote">Free to open, as often as you like.</p>}
          </div>
          </div>
          <details className="ocean-odds"><summary><span>Catch odds <small>Same chances in every case</small></span><ArrowDown size={15} /></summary><p>Each opening is independent. Every rarity is possible.</p><dl>{rarities.map(item => <div key={item.id}><dt><i style={{ background: item.color }} />{item.name}</dt><dd>{item.chance}%</dd></div>)}</dl></details>
        </div>
      <section id="ocean-shop" className="ocean-shop" role="tabpanel" aria-labelledby="ocean-tab-shop" tabIndex={0} hidden={pane !== 'shop'}>
        <div className="ocean-section-heading"><div><h3 id="ocean-shop-title"><i className="ocean-live-dot" />Live shop</h3><p>Four fish you can add to your reef for free.</p></div><div className="ocean-tide-clock"><Waves size={18} strokeWidth={1.2} /><span>New arrivals in<strong>{countdown}</strong></span></div></div>
        <div className="ocean-stock">{stock.map(offer => {
          const claimed = offerClaimed(collection, offer);
          return <article className={`ocean-offer${claimed ? ' is-claimed' : ''}`} key={offer.id} data-rarity={offer.fish.rarity} data-finish={offer.fish.finish} style={rarityStyle(offer.fish)}>
            <div className="ocean-offer-top"><RarityBadge fish={offer.fish} /><span>FREE</span></div><FishIllustration fish={offer.fish} /><h4>{offer.fish.name}</h4>
            <button onClick={() => collect(offer)} disabled={claimed || savingLocked || paused} aria-label={claimed ? `${offer.fish.name} collected this tide` : `Collect ${offer.fish.name} for free`}>{claimed ? <><Check size={15} />Collected</> : <>Take me home<ArrowRight size={15} /></>}</button>
          </article>;
        })}</div>
        <p className="ocean-shop-note">Collect each fish once per tide. The selection changes every 90 seconds.</p>
      </section>

      <section id="ocean-collection" className="ocean-collection" role="tabpanel" aria-labelledby="ocean-tab-collection" tabIndex={0} hidden={pane !== 'collection'}>
        <div className="ocean-section-heading"><div><h3 id="ocean-collection-title">{showAll ? 'The field guide' : 'Your collection'}</h3><p>{showAll ? `${fishCatalog.length} species, from the shallows to the deep.` : total ? `${total} fish · ${fishIds.length} species · ${account.user ? 'saved to your account' : 'saved on this device'}` : `A home for every catch. ${account.user ? 'Saved to your account.' : 'Saved on this device.'}`}</p></div></div>
        <div className="ocean-collection-toolbar">
          <div className="ocean-guide-switch" role="group" aria-label="Collection view"><button aria-pressed={!showAll} onClick={() => chooseGuide(false)}><FishIcon size={15} />My fish<span>{fishIds.length}</span></button><button aria-pressed={showAll} onClick={() => chooseGuide(true)}><BookOpen size={15} />Field guide<span>{fishCatalog.length}</span></button></div>
          {(showAll || fishIds.length > 0) && <div className="ocean-search"><Search size={15} aria-hidden="true" /><input type="search" aria-label="Search fish" placeholder="Find a fish…" value={search} onChange={event => { setSearch(event.target.value); setSelected(null); }} />{search && <button aria-label="Clear fish search" onClick={() => { setSearch(''); chestBody.current?.querySelector<HTMLInputElement>('input')?.focus(); }}><X size={14} /></button>}</div>}
        </div>
        {(showAll || fishIds.length > 0) && <div className="ocean-guide-filters" role="group" aria-label="Filter fish by rarity">{guideFilters.map(filter => <button key={filter} data-rarity={filter} aria-pressed={rarityFilter === filter} onClick={() => { setRarityFilter(filter); setSelected(null); }}>{filter === 'all' ? 'All rarities' : rarityInfo(filter).name}</button>)}</div>}
        {selected && <aside ref={story} tabIndex={-1} className="ocean-specimen" data-rarity={selected.rarity} data-finish={selected.finish} aria-label={`About ${selected.name}`} style={rarityStyle(selected)}><FishIllustration fish={selected} /><div><RarityBadge fish={selected} /><h4>{selected.name}</h4><p>{selected.note}</p><span className="ocean-specimen-count">{collection.fish[selected.id] ? `${collection.fish[selected.id]} at home in your ocean` : 'Still to discover.'}</span><span className="ocean-specimen-chance">{cases.find(item => item.id === selected.habitat)!.name} · {caseChance(selected).toLocaleString('en', { maximumFractionDigits: 3 })}% per opening</span><div className="ocean-specimen-actions"><button className="ocean-preview-button" onClick={() => preview(selected)} disabled={controlsLocked || paused}><Waves size={14} />Preview in reef<ArrowUp size={13} /></button><button className="ocean-preview-button" onClick={() => watchReveal(selected)} disabled={controlsLocked || paused}><Play size={13} />Preview unboxing<ArrowRight size={13} /></button></div></div><button onClick={closeStory} aria-label="Close fish story"><X size={17} /></button></aside>}
        <span className="ocean-sr-only" role="status">{guideFish.length} species shown</span>
        {guideFish.length ? <div className="ocean-fish-guide">{guideFish.map(fish => <button key={fish.id} className={`ocean-guide-fish${collection.fish[fish.id] ? '' : ' is-undiscovered'}${selected?.id === fish.id ? ' is-selected' : ''}`} data-rarity={fish.rarity} data-finish={fish.finish} style={rarityStyle(fish)} aria-pressed={selected?.id === fish.id} aria-label={`Meet ${fish.name}, ${rarityInfo(fish.rarity).name}, ${collection.fish[fish.id] ? `${collection.fish[fish.id]} collected` : 'undiscovered'}`} onClick={event => meet(fish, event.currentTarget)}><span className="ocean-guide-count">{collection.fish[fish.id] ? <><Check size={11} />×{collection.fish[fish.id]}</> : 'Undiscovered'}</span><FishIllustration fish={fish} /><strong>{fish.name}</strong><RarityBadge fish={fish} /></button>)}</div> : <div className="ocean-empty-collection"><FishIcon size={36} strokeWidth={1} /><p>{search || rarityFilter !== 'all' ? 'No fish found.' : 'Your first catch is waiting.'}</p><span>{search || rarityFilter !== 'all' ? 'Try another name or explore a different rarity.' : 'Open a case or meet the visitors in the live shop.'}</span>{search || rarityFilter !== 'all' ? <button className="ocean-empty-action" onClick={() => { setSearch(''); setRarityFilter('all'); }}>Clear filters<ArrowRight size={15} /></button> : <button className="ocean-empty-action" onClick={() => choosePane('cases')}>Open a free case<ArrowRight size={15} /></button>}</div>}
      </section>
      </div>
    </EditorialDialog>
    {phase === 'celebrating' && reveal && <OceanCatchReveal key={`catch-${reveal.id}`} fish={reveal.fish} preview={false} duplicate={reveal.duplicate} saved={storageAvailable} paused={paused} onClose={finishReveal} />}
    {revealPreview && <OceanCatchReveal key={`preview-${revealPreview.id}`} fish={revealPreview.fish} preview paused={paused} onClose={closeRevealPreview} />}
  </section>;
}
