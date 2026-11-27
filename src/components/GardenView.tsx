import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ArrowUpRight, Fish, RotateCcw } from 'lucide-react';
import type { GardenApi } from '../garden/createGarden';
import { gardenPins } from '../garden/landmarks';
import type { Theme } from '../themePreference';
import type { SectionId } from '../garden/journey';
import type { NavigateHandler } from '../hooks/useJourney';
import { sectionContent } from '../content/profile';
import { initialChessSnapshot, pieceName, squares, type ChessSnapshot, type PromotionKind, type Square } from '../garden/chess';
import { plantInfo, type GardenPlant } from '../garden/plantings';
import type { GardenMood } from '../garden/mood';

type Props = {
  active: SectionId;
  theme: Theme;
  mood: GardenMood;
  onReadyChange: (ready: boolean) => void;
  plants: GardenPlant[];
  paused: boolean;
  onEditPlant: (plant: GardenPlant) => void;
  onOpenGame: () => void;
  onNavigate: NavigateHandler;
  onChessChange: (snapshot: ChessSnapshot) => void;
  onDiscoverChess: () => void;
};
export type GardenHandle = {
  setJourneyProgress: (progress: number) => void;
  focusChessBoard: (reveal?: boolean) => void;
  undoChess: () => void;
  resetChess: () => void;
  chooseChessPromotion: (kind: PromotionKind) => void;
  cancelChessPromotion: () => void;
  makeWish: () => void;
};

export const GardenView = forwardRef<GardenHandle, Props>(function GardenView(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const secret = useRef<HTMLButtonElement>(null);
  const pond = useRef<HTMLButtonElement>(null);
  const plantPins = useRef(new Map<string, HTMLButtonElement>());
  const pins = useRef(new Map<SectionId, HTMLAnchorElement>());
  const chessSquares = useRef(new Map<Square, HTMLButtonElement>());
  const api = useRef<GardenApi | null>(null);
  const currentProps = useRef(props);
  const journeyProgress = useRef(0);
  currentProps.current = props;
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [progress, setProgress] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [chess, setChess] = useState(initialChessSnapshot);
  const [focusedSquare, setFocusedSquare] = useState<Square>('e2');

  useImperativeHandle(ref, () => ({
    focusChessBoard: reveal => api.current?.focusChessBoard(reveal),
    undoChess: () => api.current?.undoChess(),
    resetChess: () => api.current?.resetChess(),
    chooseChessPromotion: kind => api.current?.chooseChessPromotion(kind),
    cancelChessPromotion: () => api.current?.cancelChessPromotion(),
    makeWish: () => api.current?.makeWish(),
    setJourneyProgress: value => {
    journeyProgress.current = value;
    api.current?.setJourneyProgress(value);
  } }), []);

  useEffect(() => {
    if (!host.current) return;
    setState('loading');
    currentProps.current.onReadyChange(false);
    setProgress(0);
    let disposed = false;
    const element = host.current;
    void import('../garden/createGarden').then(({ createGarden }) => {
      if (disposed) return;
      api.current = createGarden(element, pins.current, {
        onReady: () => {
          if (disposed) return;
          api.current?.setTheme(currentProps.current.theme);
          api.current?.setMood(currentProps.current.mood);
          api.current?.setPlants(currentProps.current.plants);
          api.current?.setJourneyProgress(journeyProgress.current);
          api.current?.setPaused(currentProps.current.paused);
          setState('ready');
          currentProps.current.onReadyChange(true);
        },
        onProgress: percent => { if (!disposed) setProgress(percent); },
        onError: () => { if (!disposed) { setState('error'); currentProps.current.onReadyChange(false); } },
        onChessChange: value => { if (!disposed) { setChess(value); currentProps.current.onChessChange(value); } },
      }, chessSquares.current, secret.current, plantPins.current, pond.current);
      api.current.setJourneyProgress(journeyProgress.current);
      api.current.setTheme(currentProps.current.theme);
      api.current.setMood(currentProps.current.mood);
      api.current.setPlants(currentProps.current.plants);
      api.current.setPaused(currentProps.current.paused);
    }).catch(() => { if (!disposed) { setState('error'); currentProps.current.onReadyChange(false); } });
    return () => { disposed = true; api.current?.dispose(); api.current = null; };
  }, [attempt]);

  useEffect(() => { api.current?.setTheme(props.theme); }, [props.theme]);
  useEffect(() => { api.current?.setMood(props.mood); }, [props.mood]);
  useEffect(() => { api.current?.setPlants(props.plants); }, [props.plants]);
  useEffect(() => { api.current?.setPaused(props.paused); }, [props.paused]);

  return <div className="garden-viewport" data-scene-state={state}>
    <div className="garden-canvas" ref={host} role="img" aria-hidden={state !== 'ready' || undefined} aria-label={props.active === 'projects' ? `An interactive ivory and sage chess set. ${chess.pieces.filter(piece => piece.square).length} pieces on the board.` : sectionContent[props.active].object} onPointerDown={() => { if (chess.active) props.onDiscoverChess(); }} />
    <div className="chess-keyboard-grid" role="grid" aria-label="Movable chessboard" aria-describedby="chess-keyboard-help" hidden={!chess.active || state !== 'ready'} onFocus={props.onDiscoverChess}>
      <span className="sr-only" id="chess-keyboard-help">Use arrow keys to choose a square. Enter or Space selects one of your pieces, then moves it to a highlighted legal square. Ivory moves first; the sides alternate. Escape cancels a selection.</span>
      {Array.from({ length: 8 }, (_, row) => <div role="row" key={row}>{squares.slice(row * 8, row * 8 + 8).map(square => {
        const piece = chess.pieces.find(item => item.square === square);
        return <div role="gridcell" key={square}><button type="button" data-chess-square={square}
          ref={element => { if (element) chessSquares.current.set(square, element); else chessSquares.current.delete(square); }}
          aria-label={`${square}: ${piece ? pieceName(piece) : 'empty'}${chess.legalSquares.includes(square) ? ', legal destination' : ''}`} aria-pressed={!!piece && chess.selected === piece.id}
          tabIndex={square === focusedSquare ? 0 : -1}
          onClick={() => api.current?.selectChessSquare(square)}
          onFocus={() => { setFocusedSquare(square); api.current?.focusChessSquare(square); }}
          onBlur={() => api.current?.focusChessSquare(null)}
          onKeyDown={event => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); api.current?.clearChessSelection(); return; }
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault(); event.stopPropagation();
            const file = square.charCodeAt(0) - 97, rank = Number(square[1]);
            const nextFile = event.key === 'Home' ? 0 : event.key === 'End' ? 7 : Math.max(0, Math.min(7, file + (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0)));
            const nextRank = Math.max(1, Math.min(8, rank + (event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0)));
            const next = `${String.fromCharCode(97 + nextFile)}${nextRank}` as Square;
            chessSquares.current.get(next)?.focus({ preventScroll: true });
          }}>{square}</button></div>;
      })}</div>)}
    </div>
    <nav className="garden-pins" aria-label="Places in the garden" aria-hidden={state !== 'ready' ? true : undefined}>
      {gardenPins.map(item => <a key={item.id} href={`#${item.id}`} ref={element => {
        if (element) pins.current.set(item.id, element); else pins.current.delete(item.id);
      }} className="landmark-pin" onClick={event => props.onNavigate(event, item.id)} aria-label={`Explore ${item.label.toLowerCase()}`} tabIndex={state === 'ready' && props.active === 'opening' ? 0 : -1}>
        <span className="pin-glint" aria-hidden="true" />
        <span className="landmark-tooltip" aria-hidden="true">{item.label}<ArrowUpRight className="pin-arrow" size={13} strokeWidth={1.5} /></span>
      </a>)}
    </nav>
    <button ref={secret} className="garden-secret" hidden={state !== 'ready' || props.active !== 'opening'} aria-label="Explore the curious mushroom" onClick={props.onOpenGame}><span className="garden-secret-hint">A little secret</span></button>
    <button ref={pond} className="garden-pond" hidden={state !== 'ready' || props.active !== 'opening'} aria-label="Call the koi to the surface" onClick={() => api.current?.callKoi()}><Fish size={15} aria-hidden="true" />Call the koi</button>
    <div className="planted-pins" aria-label="Your plantings">{props.plants.map(plant => <button key={plant.id} ref={element => { if (element) plantPins.current.set(plant.id, element); else plantPins.current.delete(plant.id); }} className="planted-pin" hidden={state !== 'ready' || props.active !== 'contact'} aria-label={`Open planted ${plantInfo(plant.kind).name.toLowerCase()}${plant.author ? ` from ${plant.author}` : ''}`} onClick={() => props.onEditPlant(plant)}><span>{plant.note || plantInfo(plant.kind).name}</span></button>)}</div>
    {state === 'loading' && <div className="garden-loading" role="status"><span className="loading-flower">✳</span><p>A little world is growing.</p><div className="loading-track"><span style={{ width: `${Math.max(6, progress)}%` }} /></div></div>}
    {state === 'error' && <div className="garden-loading garden-error" role="status"><span className="loading-flower">✳</span><p>A quiet moment in the garden.</p><span>The stories are still here. Keep scrolling.</span><button className="text-button" onClick={() => setAttempt(n => n + 1)}><RotateCcw size={15} />Try the garden again</button></div>}
  </div>;
});
