import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Flower2, RotateCcw, Undo2 } from 'lucide-react';
import { DoubleHearts, CurlyArrow, FlowerRed, HeartBurst, SolidStar, SparkleFour, Spiral, SpikyGrass, YellowPencil } from 'trazo-stickers';
import { profileData, projects } from '../data/site';
import { profile, sectionContent } from '../content/profile';
import { sectionIds, type SectionId } from '../garden/journey';
import type { Theme } from '../themePreference';
import { useGardenWheelScroll } from '../hooks/useGardenWheelScroll';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useJourney } from '../hooks/useJourney';
import { Header } from './Header';
import { Sprout } from './Sprout';
import { GardenAccountDialog } from './GardenAccount';
import { Introduction } from './Introduction';
import { GardenView, type GardenHandle } from './GardenView';
import { GardenControls } from './GardenControls';
import { MiniMusicPlayer } from './MiniMusicPlayer';
import { MemoryGallery } from './MemoryGallery';
import { GardenDoodles } from './GardenDoodles';
import { GardenScrollCat } from './GardenScrollCat';
import { useScrollReveals } from '../hooks/useScrollReveals';
import { GardenFieldGuide } from './GardenFieldGuide';
import { initialChessSnapshot, type PromotionKind, type PendingPromotion } from '../garden/chess';
import { PlantCollection } from './PlantCollection';
import { CommunityGarden } from './CommunityGarden';
import { MAX_PLANTS, plantInfo, upsertPlant, type GardenPlant } from '../garden/plantings';
import { useGardenAccount } from '../account/AccountProvider';
import { accountRequest } from '../account/api';
import { deleteSharedPlant, publishPlant } from '../garden/community';
import { DeferredFeature, FeatureBoundary } from './DeferredFeature';
import { readGardenMood, saveGardenMood, type GardenMood } from '../garden/mood';

const GameDialog = lazy(() => import('./GameDialog').then(module => ({ default: module.GameDialog })));
const PlantStudio = lazy(() => import('./PlantStudio').then(module => ({ default: module.PlantStudio })));
const OceanGarden = lazy(() => import('./OceanGarden').then(module => ({ default: module.OceanGarden })));

type Props = {
  theme: Theme;
  paused: boolean;
  onThemeChange: (theme: Theme) => void;
  onArchiveMap: () => void;
  onProjects: () => void;
  onProject: (id: string) => void;
  onFaith: () => void;
  onSecret: () => void;
};

const featuredProjects = projects.filter(project => project.featured);
const chapterStickers: Partial<Record<SectionId, ReactNode>> = {
  about: <DoubleHearts className="garden-sticker" color="var(--color-warm-accent)" rotate={11} focusable="false" />,
  school: <YellowPencil className="garden-sticker" rotate={-12} focusable="false" />,
  music: <Spiral className="garden-sticker" color="var(--sage)" rotate={15} focusable="false" />,
  memories: <SparkleFour className="garden-sticker" color="var(--color-warm-accent)" rotate={-10} focusable="false" />,
  contact: <FlowerRed className="garden-sticker" color="var(--color-warm-accent)" rotate={-12} focusable="false" />,
};

const promotionChoices: { kind: PromotionKind; label: string; ivoryMark: string; sageMark: string }[] = [
  { kind: 'queen', label: 'Queen', ivoryMark: '♕', sageMark: '♛' },
  { kind: 'rook', label: 'Rook', ivoryMark: '♖', sageMark: '♜' },
  { kind: 'bishop', label: 'Bishop', ivoryMark: '♗', sageMark: '♝' },
  { kind: 'knight', label: 'Knight', ivoryMark: '♘', sageMark: '♞' },
];

function ChessPromotionDialog({ pending, color, onChoose, onCancel }: {
  pending: PendingPromotion | null;
  color: 'ivory' | 'sage';
  onChoose: (kind: PromotionKind) => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const firstChoice = useRef<HTMLButtonElement>(null);
  const returnSquare = useRef<string | null>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (pending && !element.open) {
      returnSquare.current = pending.to;
      element.showModal();
      firstChoice.current?.focus({ preventScroll: true });
    } else if (!pending && element.open) {
      element.close();
      if (returnSquare.current) {
        document.querySelector<HTMLButtonElement>(`[data-chess-square="${returnSquare.current}"]`)?.focus({ preventScroll: true });
        returnSquare.current = null;
      }
    }
  }, [pending]);
  return <dialog ref={dialog} className="chess-promotion-dialog" aria-labelledby="chess-promotion-title"
    onCancel={event => { event.preventDefault(); onCancel(); }}>
    <div className="chess-promotion-surface">
      <p className="detail-label">One last choice</p>
      <h2 id="chess-promotion-title">Promote the pawn</h2>
      <p>Choose what your pawn on {pending?.to} becomes.</p>
      <div className="chess-promotion-options">
        {promotionChoices.map((choice, index) => <button type="button" key={choice.kind} ref={index === 0 ? firstChoice : undefined}
          onClick={() => onChoose(choice.kind)} aria-label={`Promote to ${choice.label}`}>
          <span aria-hidden="true">{color === 'ivory' ? choice.ivoryMark : choice.sageMark}</span>{choice.label}
        </button>)}
      </div>
      <button className="chess-promotion-cancel" type="button" onClick={onCancel}>Cancel this move</button>
    </div>
  </dialog>;
}

function ChapterDetails({ section, actions, onPhotoOpenChange }: { section: SectionId; actions: Props; onPhotoOpenChange: (open: boolean) => void }) {
  switch (section) {
    case 'about': return <div className="chapter-details about-details">
      <GardenDoodles arrangement="about" />
      <div className="faith-note"><blockquote>“{profile.faith.quote}”<cite>Romans 12:21</cite></blockquote><p>{profile.faith.description}</p></div>
      <button className="section-link chapter-action" onClick={actions.onFaith}>My faith<ArrowUpRight size={15} strokeWidth={1.5} /></button>
    </div>;
    case 'projects': return <div className="chapter-details project-details">
      <ul className="project-list" data-scroll-reveal="stagger" data-cat-stop="projects">{featuredProjects.map(project => <li key={project.id}>
        <h3><button type="button" onClick={() => actions.onProject(project.id)}>{project.title}<ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" /></button></h3>
        <p>{project.description}</p>
      </li>)}</ul>
    </div>;
    case 'music': return <div className="chapter-details music-details">
      {profileData.track && <MiniMusicPlayer track={profileData.track} variant="editorial" />}
      <button className="song-note chapter-action" data-cat-stop="song-note" onClick={actions.onSecret} aria-label="Open classified name puzzle"><SparkleFour className="link-sticker" color="var(--color-warm-accent)" rotate={14} focusable="false" /><span className="song-note-copy">This song is staying here for a reason.</span><ArrowUpRight size={15} strokeWidth={1.5} /></button>
    </div>;
    case 'memories': return <div className="chapter-details"><MemoryGallery onOpenChange={onPhotoOpenChange} /></div>;
    case 'contact': return <div className="chapter-details contact-details">
      {profile.contact.links.map(link => {
        const Sticker = link.detail === profile.handle ? HeartBurst : SolidStar;
        return <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
          <Sticker className="link-sticker social-sticker" color="var(--color-warm-accent)" rotate={-12} focusable="false" />
          <span><strong>{link.label}</strong><span>{link.detail}</span></span>
          <ArrowUpRight size={19} strokeWidth={1.5} aria-hidden="true" />
        </a>;
      })}
    </div>;
    default: return null;
  }
}

function GardenEntrance({ onEnter }: { onEnter: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useBodyScrollLock(true);

  useLayoutEffect(() => {
    const entrance = dialog.current;
    entrance?.showModal();
    return () => entrance?.close();
  }, []);

  return <dialog ref={dialog} className="garden-entrance" aria-labelledby="garden-entrance-title" onCancel={event => event.preventDefault()}>
    <div className="garden-entrance-mark" aria-hidden="true">
      <SparkleFour className="garden-entrance-spark" focusable="false" />
      <Sprout />
      <DoubleHearts className="garden-entrance-hearts" focusable="false" />
    </div>
    <h2 id="garden-entrance-title">JZ’s garden</h2>
    <button type="button" className="primary-button" data-blast-sound onClick={onEnter}>
      Enter <ArrowRight size={17} aria-hidden="true" />
    </button>
  </dialog>;
}

export function GardenHome(props: Props) {
  const root = useRef<HTMLElement>(null);
  const [entered, setEntered] = useState(false);
  const garden = useRef<GardenHandle>(null);
  useScrollReveals(root);
  const [gameOpen, setGameOpen] = useState(false);
  const [studio, setStudio] = useState<{ plant?: GardenPlant } | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);
  const overlayOpen = !entered || props.paused || gameOpen || studio !== null || photoOpen;
  const { active, sceneSection, sceneVisible, onNavigate, onSkip } = useJourney(root, overlayOpen);
  const [chess, setChess] = useState(initialChessSnapshot);
  const [chessDiscovered, setChessDiscovered] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  useGardenWheelScroll(root, overlayOpen || guideOpen);
  const [soundOn, setSoundOn] = useState(false);
  const [mood, setMood] = useState(readGardenMood);
  const changeMood = (value: GardenMood) => {
    setMood(value); saveGardenMood(value);
    props.onThemeChange(value === 'fireflies' ? 'dark' : 'light');
  };
  const account = useGardenAccount();
  const plants = account.plants;
  const [plantStatus, setPlantStatus] = useState('');
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [removed, setRemoved] = useState<{ plant: GardenPlant; index: number } | null>(null);
  const [revision, setRevision] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const currentPlants = useRef(plants);
  currentPlants.current = plants;
  const littlePatch = useMemo(() => plants.slice(-MAX_PLANTS), [plants]);
  useEffect(() => {
    garden.current?.setJourneyProgress(sceneSection === 'opening' ? 0 : sectionIds.indexOf('projects') / (sectionIds.length - 1));
  }, [sceneSection]);
  const time = props.theme === 'dark' ? 'dusk' : 'day';
  useEffect(() => {
    setStudio(null); setRemoved(null); setRevision(value => value + 1);
  }, [account.user?.id]);

  function keepPlants(next: GardenPlant[], message: string) {
    currentPlants.current = next;
    setStorageAvailable(account.keepPlants(next));
    setPlantStatus(message);
  }
  async function plant(planting: GardenPlant) {
    const source = studio;
    const saved = await publishPlant(planting);
    keepPlants(upsertPlant(currentPlants.current, saved), `${plantInfo(saved.kind).name} ${planting.shared ? 'updated' : 'planted in the shared garden'}.`);
    setRevision(value => value + 1);
    setStudio(current => current === source ? null : current);
    setRemoved(null);
  }
  async function removePlant(planting: GardenPlant) {
    const source = studio;
    if (planting.shared) await deleteSharedPlant(planting);
    else if (account.user) await accountRequest(`/account/keepsakes/${encodeURIComponent(planting.id)}`, undefined, 'DELETE');
    setRemoved({ plant: planting, index: currentPlants.current.findIndex(item => item.id === planting.id) });
    keepPlants(currentPlants.current.filter(item => item.id !== planting.id), 'Planting removed.');
    setRevision(value => value + 1);
    setStudio(current => current === source ? null : current);
  }
  async function undoRemove() {
    if (!removed) return;
    try {
      const restored = removed.plant.shared ? await publishPlant({ ...removed.plant, shared: false }) : account.user
        ? (await accountRequest<{ plant: GardenPlant }>('/account/keepsakes', removed.plant)).plant : removed.plant;
      const next = currentPlants.current.filter(item => item.id !== restored.id);
      next.splice(Math.max(0, removed.index), 0, restored);
      keepPlants(next, 'Planting restored.');
      setRemoved(null);
      setRevision(value => value + 1);
    } catch (error) { setPlantStatus(error instanceof Error ? error.message : 'Could not restore that planting.'); }
  }

  return <>
    <main className="garden-app" data-theme={props.theme} data-garden-mood={mood} ref={root} data-active-section={active}>
      {!entered && <GardenEntrance onEnter={() => setEntered(true)} />}
      <a className="skip-link" href="#about" onClick={event => onSkip(event, 'about')}>Skip to my story</a>
      <Header active={active} onNavigate={onNavigate} onArchive={props.onArchiveMap} />
      <GardenAccountDialog />
      <div className="journey-world">
      <div className="stage-track" data-scene={sceneSection} data-visible={sceneVisible}><div className="garden-stage"><GardenView ref={garden} active={sceneSection} theme={props.theme} mood={mood} onReadyChange={setSceneReady} plants={littlePatch} onEditPlant={plant => setStudio({ plant })} onOpenGame={() => setGameOpen(true)} paused={overlayOpen || guideOpen || !sceneVisible} onNavigate={onNavigate} onChessChange={setChess} onDiscoverChess={() => setChessDiscovered(true)} /></div></div>
      <div className="journey-sections">{sectionIds.map(id => {
        const content = sectionContent[id];
        const title = <h2 id={`${id}-title`} tabIndex={-1} data-scroll-reveal>{chapterStickers[id] ? <span className="sticker-anchor title-sticker-anchor">{content.label}{chapterStickers[id]}</span> : content.label}</h2>;
        return <section key={id} id={id} className={`journey-section section-${id}`} data-journey-section={id} aria-labelledby={`${id}-title`}>
          {id === 'opening' ? <Introduction onNavigate={onNavigate}><GardenControls onGuide={() => setGuideOpen(true)} soundOn={soundOn} /></Introduction> : <div className="section-copy" data-cat-stop={id === 'school' ? 'butterfly' : undefined}>
            {id === 'projects' ? <div className="project-heading">
              {title}
              {sceneReady && <button className="section-link" type="button" disabled={!chess.active} onClick={() => garden.current?.focusChessBoard(true)}>{chessDiscovered ? 'Focus board' : 'Play chess'}<ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" /></button>}
            </div> : title}
            {content.body && <p className="section-description" data-scroll-reveal>{content.body}</p>}
            {id === 'projects' && <div id="garden-chess-controls" className="chess-actions" role="group" aria-label="Chess actions" inert={!sceneReady || !chessDiscovered || !chess.active || chess.moves === 0}>
              <button type="button" onClick={() => {
                garden.current?.undoChess();
                if (chess.moves === 1) garden.current?.focusChessBoard();
              }}><Undo2 size={15} aria-hidden="true" />Undo move</button>
              <button type="button" onClick={() => {
                garden.current?.resetChess();
                garden.current?.focusChessBoard();
              }}><RotateCcw size={15} aria-hidden="true" />Reset board</button>
              {(chess.inCheck || chess.gameOver) && <span className="chess-alert">{chess.gameOver ? chess.message : 'Check'}</span>}
            </div>}
            {id === 'projects' && <p className="sr-only" role="status" aria-atomic="true">{chessDiscovered && chess.active ? chess.message : ''}</p>}
            <ChapterDetails section={id} actions={props} onPhotoOpenChange={setPhotoOpen} />
            {id === 'projects' && <div className="sticker-anchor">
              <button className="section-link all-projects-link" type="button" onClick={props.onProjects}>All projects<ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" /></button>
              <CurlyArrow className="garden-sticker" color="var(--sage)" rotate={165} focusable="false" />
            </div>}
            {id === 'contact' && <div className="plant-moment">
              <div className="sticker-anchor">
                <button className="plant-button" data-cat-stop="plant" disabled={!account.ready || account.busy} onClick={() => setStudio({})}><Flower2 size={17} strokeWidth={1.4} />Plant something</button>
                <HeartBurst className="garden-sticker planting-sticker" color="var(--color-warm-accent)" rotate={15} focusable="false" />
              </div>
              <p className="quiet-caption">Pick a plant, choose its colours and leave a note for whoever visits next.{!storageAvailable && ' Your planting is shared, but this browser couldn’t save a copy.'}</p>
              <a className="shared-garden-link" href="#shared-garden"><SpikyGrass className="link-sticker" color="var(--sage)" rotate={-7} focusable="false" />See what everyone has planted<ArrowDown size={13} /></a>
              <p className="plant-update" role="status">{plantStatus}{removed && <button onClick={() => { void undoRemove(); }}>Undo</button>}</p>
              <PlantCollection plants={plants} onEdit={plant => setStudio({ plant })} />
            </div>}
            {id !== 'about' && <GardenDoodles arrangement={id} />}
          </div>}
        </section>;
      })}</div>
      </div>
      <CommunityGarden time={time} paused={overlayOpen || guideOpen} revision={revision} onPlant={() => setStudio({})} onEdit={plant => setStudio({ plant })} onNavigate={onNavigate} />
      <GardenScrollCat paused={overlayOpen || guideOpen} rain={mood === 'rain'} />
      <DeferredFeature anchor="ocean"><OceanGarden key={account.user?.id ?? 'guest'} paused={overlayOpen || guideOpen} /></DeferredFeature>
      {gameOpen && <FeatureBoundary onClose={() => setGameOpen(false)}><Suspense fallback={<p role="status">Loading the game…</p>}><GameDialog time={time} onClose={() => setGameOpen(false)} /></Suspense></FeatureBoundary>}
      {studio && <FeatureBoundary onClose={() => setStudio(null)}><Suspense fallback={<p role="status">Loading the planting studio…</p>}><PlantStudio plant={studio.plant} onSave={plant} onRemove={removePlant} onClose={() => setStudio(null)} /></Suspense></FeatureBoundary>}
    </main>
    <GardenFieldGuide open={guideOpen} active={active} onClose={() => setGuideOpen(false)} onSoundChange={setSoundOn}
      theme={props.theme} onThemeChange={props.onThemeChange} mood={mood} onMoodChange={changeMood}
      sceneAvailable={sceneReady && sceneVisible && sceneSection === 'opening' && !overlayOpen} onWish={() => {
        setGuideOpen(false);
        requestAnimationFrame(() => requestAnimationFrame(() => garden.current?.makeWish()));
      }} />
    <ChessPromotionDialog pending={chess.pendingPromotion} color={chess.turn}
      onChoose={kind => garden.current?.chooseChessPromotion(kind)} onCancel={() => garden.current?.cancelChessPromotion()} />
  </>;
}
