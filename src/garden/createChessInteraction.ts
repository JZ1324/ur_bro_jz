import * as THREE from 'three';
import { Chess, type Square as RulesSquare } from 'chess.js';
import type { createMorph } from './createMorph';
import { createChessPieceMarks } from './createChessPieceMarks';
import { boardTop, chessIsInteractive, createChessLayout, initialPieces, pieceHeights, pieceName, promotedPieceVoxels, squareAt, squarePosition,
  type ChessPiece, type ChessSnapshot, type PieceKind, type PromotionKind, type Square } from './chess';

type Options = {
  host: HTMLDivElement;
  camera: THREE.OrthographicCamera;
  scene: THREE.Scene;
  morph: ReturnType<typeof createMorph>;
  squares: Map<Square, HTMLButtonElement>;
  invalidate: () => void;
  onChange: (snapshot: ChessSnapshot) => void;
  onRequestOverhead?: () => void;
  initialFen?: string;
};

const kindFromSymbol: Record<string, PieceKind> = { p: 'pawn', r: 'rook', n: 'knight', b: 'bishop', q: 'queen', k: 'king' };
const promotionSymbol: Record<PromotionKind, 'q' | 'r' | 'b' | 'n'> = { queen: 'q', rook: 'r', bishop: 'b', knight: 'n' };

function piecesForPosition(game: Chess): ChessPiece[] {
  const pieces = initialPieces().map(piece => ({ ...piece, square: null as Square | null }));
  const used = new Set<string>();
  for (const row of game.board()) for (const item of row) {
    if (!item) continue;
    const color = item.color === 'w' ? 'ivory' : 'sage';
    const kind = kindFromSymbol[item.type];
    const matches = pieces.filter(piece => piece.color === color && piece.kind === kind && !used.has(piece.id));
    const reservePawns = pieces.filter(piece => piece.color === color && piece.kind === 'pawn' && !used.has(piece.id));
    const reserveOthers = pieces.filter(piece => piece.color === color && piece.kind !== 'king' && !used.has(piece.id));
    const slot = matches.find(piece => piece.start === item.square)
      ?? matches[0]
      ?? reservePawns.find(piece => piece.start === item.square)
      ?? reservePawns[0]
      ?? reserveOthers.find(piece => piece.start === item.square)
      ?? reserveOthers[0];
    if (!slot) throw new Error(`Could not assign a 3D piece to ${item.square}`);
    slot.kind = kind;
    slot.square = item.square as Square;
    used.add(slot.id);
  }
  return pieces;
}

export function createChessInteraction({ host, camera, scene, morph, squares, invalidate, onChange, onRequestOverhead, initialFen }: Options) {
  const baseline = morph.getLayout('projects');
  const layout = createChessLayout(baseline);
  const resetFen = initialFen;
  let game = new Chess(resetFen);
  let pieces: readonly ChessPiece[] = resetFen ? piecesForPosition(game) : initialPieces();
  const history: (readonly ChessPiece[])[] = [];
  let selected: string | null = null;
  let pendingPromotion: ChessSnapshot['pendingPromotion'] = null;
  let active = false;
  let message = resetFen ? '' : 'Ivory moves first. Select an ivory piece.';
  let hover: Square | null = null;
  let focus: Square | null = null;
  let drag: { id: string; x: number; z: number } | null = null;
  let pieceMarks: ReturnType<typeof createChessPieceMarks> | undefined;
  let gesture: { pointer: number; x: number; y: number; piece: string | null; mouse: boolean; moved: boolean } | null = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const board = new THREE.Plane(new THREE.Vector3(0, 1, 0), -boardTop);
  const hit = new THREE.Vector3();
  const box = new THREE.Box3();
  const localRay = new THREE.Ray();
  const originalPieces = initialPieces();
  const ownerIndices = originalPieces.map((_, index) => Array.from(layout.owner).flatMap((owner, itemIndex) => owner === index ? [itemIndex] : []));
  const originalBounds = originalPieces.map((piece, pieceIndex) => {
    const origin = squarePosition(piece.start);
    return ownerIndices[pieceIndex].map(itemIndex => {
      const offset = itemIndex * 12;
      const center = new THREE.Vector3(baseline[offset] - origin.x, baseline[offset + 1] - boardTop, baseline[offset + 2] - origin.z);
      const half = new THREE.Vector3(baseline[offset + 3], baseline[offset + 4], baseline[offset + 5]).multiplyScalar(.5);
      return new THREE.Box3(center.clone().sub(half), center.clone().add(half));
    });
  });
  const promotedBounds = new Map<string, THREE.Box3[]>();
  const projected = new THREE.Vector3();
  const markers = new THREE.Group();
  markers.visible = false;
  scene.add(markers);

  const markerGeometry = new THREE.BoxGeometry();
  const markerMaterial = (color: string) => new THREE.MeshBasicMaterial({ color, depthWrite: false });
  const selectedMaterial = markerMaterial('#d6a34b');
  const hoverMaterial = markerMaterial('#efe4be');
  const captureMaterial = markerMaterial('#b45a50');
  const destinationMaterial = markerMaterial('#634d78');

  function makeOutline(material: THREE.MeshBasicMaterial, width = .025) {
    const group = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(markerGeometry, material);
      bar.position.set(i < 2 ? (i ? 1 : -1) * .3 : 0, 0, i >= 2 ? (i === 2 ? 1 : -1) * .3 : 0);
      bar.scale.set(i < 2 ? width : .625, .014, i < 2 ? .625 : width);
      group.add(bar);
    }
    markers.add(group);
    return group;
  }
  const selectedMarker = makeOutline(selectedMaterial);
  const targetMarker = makeOutline(hoverMaterial);
  const legalMarkers = [...squares.keys()].map(square => {
    const capture = makeOutline(captureMaterial, .048);
    const destination = new THREE.Mesh(markerGeometry, destinationMaterial);
    destination.scale.set(.18, .014, .18);
    destination.rotation.y = Math.PI / 4;
    markers.add(destination);
    return { square, capture, destination };
  });

  const sideName = (color: 'ivory' | 'sage') => color === 'ivory' ? 'Ivory' : 'Sage';
  const turn = () => game.turn() === 'w' ? 'ivory' : 'sage';
  const legalMoves = (from: Square) => game.moves({ square: from as RulesSquare, verbose: true });
  function isGameOver() { return game.isGameOver(); }
  function describePosition() {
    if (game.isCheckmate()) return `Checkmate. ${sideName(turn() === 'ivory' ? 'sage' : 'ivory')} wins.`;
    if (game.isStalemate()) return 'Draw by stalemate.';
    if (game.isThreefoldRepetition()) return 'Draw by threefold repetition.';
    if (game.isDrawByFiftyMoves()) return 'Draw by the fifty-move rule.';
    if (game.isInsufficientMaterial()) return 'Draw by insufficient material.';
    if (game.isDraw()) return 'The game is drawn.';
    return `${sideName(turn())} to move${game.isCheck() ? '. Check.' : '.'}`;
  }
  if (resetFen) message = describePosition();
  function currentLegalMoves() {
    if (!selected || pendingPromotion || isGameOver()) return [];
    const piece = pieces.find(item => item.id === selected);
    if (!piece?.square || piece.color !== turn()) return [];
    return legalMoves(piece.square);
  }
  function notify() {
    const legalSquares = [...new Set(currentLegalMoves().map(move => move.to as Square))];
    onChange({ active, pieces, selected, moves: history.length, message, turn: turn(), inCheck: game.isCheck(), gameOver: isGameOver(), legalSquares, pendingPromotion });
  }
  function sync(render = true) {
    morph.setLayout('projects', layout.build(pieces, selected, drag));
    if (render) invalidate();
  }
  function cancelGesture() {
    const pressed = gesture;
    gesture = null;
    if (pressed && host.hasPointerCapture(pressed.pointer)) host.releasePointerCapture(pressed.pointer);
    if (drag) { drag = null; sync(); }
    else if (pressed) invalidate();
    delete host.dataset.chessDragging;
  }
  function updatePiecesAfterMove(from: Square, to: Square, movingId: string, promotedTo: PromotionKind | undefined, move: ReturnType<Chess['move']>) {
    const moving = pieces.find(piece => piece.id === movingId)!;
    const captureSquare = move.isEnPassant() ? `${to[0]}${from[1]}` as Square : to;
    const castle = move.isKingsideCastle() || move.isQueensideCastle();
    const rank = from[1];
    const rookFrom = `${move.isKingsideCastle() ? 'h' : 'a'}${rank}` as Square;
    const rookTo = `${move.isKingsideCastle() ? 'f' : 'd'}${rank}` as Square;
    return pieces.map(piece => {
      if (piece.id === movingId) return { ...piece, square: to, kind: promotedTo ?? piece.kind };
      if (piece.square === captureSquare) return { ...piece, square: null };
      if (castle && piece.square === rookFrom && piece.color === moving.color && piece.kind === 'rook') return { ...piece, square: rookTo };
      return piece;
    });
  }
  function applyMove(from: Square, to: Square, id: string, promotion?: PromotionKind) {
    const candidates = legalMoves(from).filter(move => move.to === to);
    const candidate = promotion
      ? candidates.find(move => move.promotion === promotionSymbol[promotion])
      : candidates.find(move => !move.isPromotion()) ?? candidates.find(move => move.isPromotion());
    if (!candidate) return false;
    if (candidate.isPromotion() && !promotion) {
      pendingPromotion = { from, to, piece: id };
      selected = id;
      message = `Choose what the pawn becomes on ${to}. The move is waiting for your choice.`;
      drag = null;
      sync(); notify();
      return true;
    }
    const moved = game.move({ from, to, ...(promotion ? { promotion: promotionSymbol[promotion] } : {}) });
    if (!moved) return false;
    history.push(pieces);
    pieces = updatePiecesAfterMove(from, to, id, promotion, moved);
    pendingPromotion = null;
    selected = null;
    drag = null;
    message = `${moved.san}. ${describePosition()}`;
    onRequestOverhead?.();
    sync(); notify();
    return true;
  }
  function selectSquare(square: Square) {
    if (!active || host.dataset.paused === 'true') return;
    cancelGesture();
    if (pendingPromotion) return;
    if (isGameOver()) { message = describePosition(); notify(); return; }
    const occupant = pieces.find(piece => piece.square === square);
    const current = pieces.find(piece => piece.id === selected);
    if (current?.square === square) {
      selected = null;
      message = `${describePosition()} Select a piece.`;
    } else if (occupant && occupant.color === turn()) {
      selected = occupant.id;
      onRequestOverhead?.();
      const count = legalMoves(square).length;
      message = `${pieceName(occupant)} on ${square}. ${count ? `${count} legal ${count === 1 ? 'move' : 'moves'} shown.` : `No legal moves. ${describePosition()}`}`;
    } else if (current?.square) {
      if (!applyMove(current.square, square, current.id)) {
        message = `That move is not legal. Choose a highlighted square. ${describePosition()}`;
        sync(); notify();
      }
      return;
    } else if (occupant) {
      message = `It is ${sideName(turn())}'s turn. ${describePosition()}`;
    } else {
      message = `Select a ${sideName(turn()).toLowerCase()} piece. ${describePosition()}`;
    }
    sync(); notify();
  }
  function setRay(event: PointerEvent) {
    const rect = host.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
  }
  function getPieceBounds(index: number, piece: ChessPiece) {
    if (piece.kind === originalPieces[index].kind) return originalBounds[index];
    const key = `${index}:${piece.kind}`;
    let cached = promotedBounds.get(key);
    if (!cached) {
      cached = promotedPieceVoxels(piece.kind as PromotionKind, piece.color).map(part => {
        const center = new THREE.Vector3(part.x, part.y, part.z);
        const half = new THREE.Vector3(part.sx, part.sy, part.sz).multiplyScalar(.5);
        return new THREE.Box3(center.clone().sub(half), center.clone().add(half));
      });
      promotedBounds.set(key, cached);
    }
    return cached;
  }
  function pick(event: PointerEvent, includePieces = true) {
    setRay(event);
    let nearest: ChessPiece | undefined;
    let distance = Infinity;
    if (includePieces) for (const [index, piece] of pieces.entries()) {
      if (!piece.square) continue;
      const center = squarePosition(piece.square);
      const lift = piece.id === selected ? .12 : 0;
      box.min.set(center.x - .25, boardTop + lift, center.z - .25);
      box.max.set(center.x + .25, boardTop + pieceHeights[piece.kind] + lift, center.z + .25);
      if (raycaster.ray.intersectBox(box, hit)) {
        localRay.copy(raycaster.ray);
        localRay.origin.x -= center.x;
        localRay.origin.y -= boardTop + lift;
        localRay.origin.z -= center.z;
        for (const bounds of getPieceBounds(index, piece)) if (localRay.intersectBox(bounds, hit)) {
          const nextDistance = hit.distanceToSquared(localRay.origin);
          if (nextDistance < distance) { nearest = piece; distance = nextDistance; }
        }
      }
    }
    if (nearest) return { square: nearest.square, piece: nearest.id };
    if (!raycaster.ray.intersectPlane(board, hit)) return { square: null, piece: null };
    return { square: squareAt(hit.x, hit.z), piece: null };
  }
  function onDown(event: PointerEvent) {
    if (!active || host.dataset.paused === 'true' || event.button !== 0 || pendingPromotion || isGameOver()) return;
    if (!event.isPrimary) { cancelGesture(); return; }
    const target = pick(event);
    if (!target.square) return;
    gesture = { pointer: event.pointerId, x: event.clientX, y: event.clientY, piece: target.piece,
      mouse: event.pointerType === 'mouse' || event.pointerType === 'pen', moved: false };
    focus = null;
    if (gesture.mouse) host.setPointerCapture(event.pointerId);
  }
  function onMove(event: PointerEvent) {
    if (!active || host.dataset.paused === 'true') return;
    if (gesture && event.pointerId === gesture.pointer) {
      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 6) gesture.moved = true;
      const grabbed = pieces.find(piece => piece.id === gesture?.piece);
      if (gesture.moved && gesture.mouse && grabbed?.color === turn()) {
        if (!drag) {
          selected = grabbed.id;
          onRequestOverhead?.();
          message = `Moving ${pieceName(grabbed)}. Release on a highlighted square.`;
          notify();
        }
        setRay(event);
        if (raycaster.ray.intersectPlane(board, hit)) {
          drag = { id: grabbed.id, x: THREE.MathUtils.clamp(hit.x, -3.3, 3.3), z: THREE.MathUtils.clamp(hit.z, -3.3, 3.3) };
          hover = squareAt(hit.x, hit.z);
          host.dataset.chessDragging = 'true';
          sync();
        }
      }
      return;
    }
    const target = pick(event);
    if (hover !== target.square) { hover = target.square; invalidate(); }
    host.style.cursor = target.piece ? 'grab' : selected && target.square ? 'pointer' : '';
  }
  function onUp(event: PointerEvent) {
    if (!gesture || gesture.pointer !== event.pointerId) return;
    const saved = gesture;
    const dragging = drag?.id;
    const target = pick(event, !dragging);
    cancelGesture();
    if (dragging) {
      const piece = pieces.find(item => item.id === dragging);
      if (!piece?.square || !target.square || !applyMove(piece.square, target.square, dragging)) {
        message = `That move is not legal. The piece returned to its square. ${describePosition()}`;
        sync(); notify();
      }
    } else if (!saved.moved && target.square) selectSquare(target.square);
    else if (saved.moved && saved.piece) {
      const piece = pieces.find(item => item.id === saved.piece);
      if (piece && piece.color !== turn()) {
        message = `It is ${sideName(turn())}'s turn. ${describePosition()}`;
        notify();
      }
    }
  }
  function onCancel() { cancelGesture(); }
  function onLeave() { if (!gesture) { hover = null; invalidate(); } }
  host.addEventListener('pointerdown', onDown);
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerup', onUp);
  host.addEventListener('pointercancel', onCancel);
  host.addEventListener('lostpointercapture', onCancel);
  host.addEventListener('pointerleave', onLeave);
  notify();

  function placeMarker(marker: THREE.Object3D, square: Square, height: number) {
    const { x, z } = squarePosition(square);
    marker.position.set(x, boardTop + height, z);
  }

  return {
    get pointerDown() { return gesture !== null; },
    cancelInteraction: cancelGesture,
    selectSquare,
    focusSquare(square: Square | null) { focus = square; invalidate(); },
    clearSelection() {
      cancelGesture();
      if (pendingPromotion) {
        pendingPromotion = null;
        message = `Promotion canceled. The pawn remains on its original square. ${describePosition()}`;
      }
      selected = null; sync(); notify();
    },
    choosePromotion(kind: PromotionKind) {
      if (!active || !pendingPromotion) return;
      const pending = pendingPromotion;
      if (applyMove(pending.from, pending.to, pending.piece, kind)) return;
      pendingPromotion = null;
      message = `That promotion could not be completed. ${describePosition()}`;
      sync(); notify();
    },
    cancelPromotion() {
      if (!pendingPromotion) return;
      pendingPromotion = null;
      message = `Promotion canceled. Choose another legal move. ${describePosition()}`;
      sync(); notify();
    },
    undo() {
      if (!active || history.length === 0) return;
      cancelGesture();
      game.undo(); pieces = history.pop()!; selected = null; pendingPromotion = null;
      message = `Last move undone. ${describePosition()}`; sync(); notify();
    },
    reset() {
      if (!active) return;
      cancelGesture(); game = new Chess(resetFen); pieces = resetFen ? piecesForPosition(game) : initialPieces();
      history.length = 0; selected = null; pendingPromotion = null;
      message = `${sideName(turn())} to move. Starting position restored.`; sync(); notify();
    },
    update(progress: number, reducedMotion: boolean, overhead = 0) {
      const nextActive = chessIsInteractive(progress, reducedMotion);
      if (active !== nextActive) {
        active = nextActive;
        if (!active) {
          cancelGesture(); selected = null; hover = null; focus = null;
          message = history.length ? 'Your game is saved. Return to Projects to keep playing.' : `${sideName(turn())} moves first. Select an ${turn()} piece.`;
          sync(false);
        }
        host.dataset.chessActive = String(active);
        host.style.cursor = '';
        notify();
      }
      markers.visible = active;
      const markOpacity = active ? THREE.MathUtils.smoothstep(overhead, .82, .97) : 0;
      if (markOpacity > 0) pieceMarks ??= createChessPieceMarks(scene, pieces);
      pieceMarks?.update(pieces, selected, drag, markOpacity);
      if (!active) return;
      camera.updateMatrixWorld();
      const rect = host.getBoundingClientRect();
      for (const [square, element] of squares) {
        const { x, z } = squarePosition(square);
        projected.set(x, boardTop, z).project(camera);
        element.style.left = `${rect.left + (projected.x * .5 + .5) * rect.width}px`;
        element.style.top = `${rect.top + (-projected.y * .5 + .5) * rect.height}px`;
      }
      const selectedPiece = pieces.find(piece => piece.id === selected);
      selectedMarker.visible = !!selectedPiece?.square;
      if (selectedPiece?.square) placeMarker(selectedMarker, selectedPiece.square, .012);
      const moves = currentLegalMoves();
      const destinations = new Set(moves.map(move => move.to as Square));
      const captures = new Set(moves.filter(move => move.captured).map(move => move.to as Square));
      for (const { square, capture, destination } of legalMarkers) {
        capture.visible = captures.has(square);
        destination.visible = destinations.has(square) && !capture.visible;
        if (capture.visible) placeMarker(capture, square, .021);
        if (destination.visible) placeMarker(destination, square, .021);
      }
      const target = focus ?? hover;
      targetMarker.visible = !!target && target !== selectedPiece?.square && !destinations.has(target);
      if (target && targetMarker.visible) placeMarker(targetMarker, target, .03);
    },
    dispose() {
      cancelGesture();
      pieceMarks?.dispose();
      host.removeEventListener('pointerdown', onDown);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerup', onUp);
      host.removeEventListener('pointercancel', onCancel);
      host.removeEventListener('lostpointercapture', onCancel);
      host.removeEventListener('pointerleave', onLeave);
      delete host.dataset.chessActive;
      host.style.cursor = '';
      markerGeometry.dispose();
      [selectedMaterial, hoverMaterial, captureMaterial, destinationMaterial].forEach(material => material.dispose());
      scene.remove(markers);
    },
  };
}
