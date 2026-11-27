import { LAST_STAGE, sectionIds } from './journey';

export const squareSize = .64;
export const boardTop = .83;
const files = 'abcdefgh';
export type Square = `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
export type PieceKind = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type ChessPiece = { id: string; kind: PieceKind; color: 'ivory' | 'sage'; start: Square; square: Square | null };
export type PromotionKind = Exclude<PieceKind, 'pawn' | 'king'>;
export type PendingPromotion = { from: Square; to: Square; piece: string };
export type ChessSnapshot = {
  active: boolean;
  pieces: readonly ChessPiece[];
  selected: string | null;
  moves: number;
  message: string;
  turn: 'ivory' | 'sage';
  inCheck: boolean;
  gameOver: boolean;
  legalSquares: readonly Square[];
  pendingPromotion: PendingPromotion | null;
};
export type VoxelPart = { x: number; y: number; z: number; sx: number; sy: number; sz: number; color: readonly [number, number, number] };
export const squares = Array.from({ length: 64 }, (_, i) => `${files[i % 8]}${8 - Math.floor(i / 8)}` as Square);
export const pieceHeights: Record<PieceKind, number> = { pawn: .69, rook: .86, knight: .99, bishop: 1.08, queen: 1.18, king: 1.34 };

export function squarePosition(square: Square) {
  return { x: (files.indexOf(square[0]) - 3.5) * squareSize, z: (4.5 - Number(square[1])) * squareSize };
}

export function squareAt(x: number, z: number): Square | null {
  if (x < -2.56 || x >= 2.56 || z <= -2.56 || z > 2.56) return null;
  return `${files[Math.floor(x / squareSize + 4)]}${Math.floor(4 - z / squareSize) + 1}` as Square;
}

export function initialPieces(): ChessPiece[] {
  const back: PieceKind[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  return [1, 2, 7, 8].flatMap(rank => [...files].map((file, index) => {
    const square = `${file}${rank}` as Square;
    const color = rank <= 2 ? 'ivory' : 'sage';
    return { id: `${color}-${square}`, color, kind: rank === 2 || rank === 7 ? 'pawn' : back[index], start: square, square } as ChessPiece;
  }));
}

export const pieceName = (piece: ChessPiece) => `${piece.color === 'ivory' ? 'Ivory' : 'Sage'} ${piece.kind}`;

export function initialChessSnapshot(): ChessSnapshot {
  return { active: false, pieces: initialPieces(), selected: null, moves: 0, message: 'Ivory moves first. Select an ivory piece.', turn: 'ivory', inCheck: false, gameOver: false, legalSquares: [], pendingPromotion: null };
}

/** A compact, eleven-block replacement silhouette for a pawn after promotion. */
export function promotedPieceVoxels(kind: PromotionKind, color: 'ivory' | 'sage'): VoxelPart[] {
  const ivory = color === 'ivory';
  const body: VoxelPart['color'] = ivory ? [0.964, 0.807, 0.597] : [0.064, 0.150, 0.094];
  const edge: VoxelPart['color'] = ivory ? [0.552, 0.434, 0.224] : [0.184, 0.283, 0.166];
  const inset: VoxelPart['color'] = ivory ? [0.216, 0.168, 0.103] : [0.018, 0.047, 0.030];
  const parts: VoxelPart[] = [];
  const add = (x: number, y: number, z: number, sx: number, sy: number, sz: number, paint = body) => parts.push({ x, y, z, sx, sy, sz, color: paint });
  // Keep the recognizable stepped foot and collar of the authored chess set.
  add(0, .045, 0, .46, .09, .46, edge);
  add(0, .11, 0, .40, .07, .40);
  add(0, .18, 0, .32, .07, .32);
  const height = pieceHeights[kind];
  const shaftTop = kind === 'rook' ? .49 : kind === 'knight' ? .53 : kind === 'bishop' ? .58 : kind === 'queen' ? .69 : .79;
  add(0, (.22 + shaftTop) / 2, 0, .21, shaftTop - .22, .21);
  add(0, shaftTop + .035, 0, .29, .07, .29, edge);
  if (kind === 'rook') {
    add(0, .60, 0, .33, .18, .33);
    add(0, .70, 0, .43, .08, .43, edge);
    for (const x of [-.145, .145]) for (const z of [-.145, .145]) add(x, .80, z, .14, .12, .14);
  } else if (kind === 'knight') {
    add(0, .66, .07, .25, .24, .29);
    add(0, .80, .015, .25, .20, .28);
    add(0, .90, -.08, .28, .16, .33);
    add(0, .83, -.175, .27, .11, .16);
    add(0, .68, .205, .16, .25, .06, edge);
    add(-.085, .95, .035, .075, .08, .10, inset);
  } else if (kind === 'bishop') {
    add(0, .72, 0, .33, .09, .33);
    add(-.09, .84, 0, .11, .14, .22, body);
    add(.07, .91, 0, .13, .18, .22, edge);
    add(0, 1.015, 0, .12, .035, .13, edge);
    add(0, 1.055, 0, .06, .045, .07, inset);
    add(0, 1.07, 0, .11, .02, .11, body);
  } else if (kind === 'queen') {
    add(0, .94, 0, .30, .16, .30);
    add(0, 1.035, 0, .40, .07, .40, edge);
    for (const [x, z] of [[-.15, -.15], [-.15, .15], [.15, -.15], [.15, .15]]) add(x, 1.12, z, .10, .10, .10);
  } else {
    add(0, .91, 0, .34, .08, .34);
    add(0, 1.015, 0, .25, .13, .25);
    add(0, 1.205, 0, .095, .27, .095);
    add(0, 1.23, 0, .29, .085, .095);
    add(0, 1.23, 0, .095, .085, .29, edge);
    add(0, height - .035, 0, .13, .07, .13, inset);
  }
  if (parts.length !== 11) throw new Error(`Promotion silhouette for ${kind} must use eleven voxel slots`);
  return parts;
}

export function chessIsInteractive(progress: number, reducedMotion = false) {
  const local = progress * LAST_STAGE - sectionIds.indexOf('projects');
  return local >= -1e-7 && local < (reducedMotion ? 1 : 2 / 3);
}

/** The authored pieces sit wholly above the board, each within its starting square. */
export function createChessLayout(baseline: Float32Array) {
  const pieces = initialPieces();
  const owner = new Int16Array(baseline.length / 12).fill(-1);
  const ownedCounts = new Uint16Array(32);
  const ownedIndices: number[][] = Array.from({ length: 32 }, () => []);
  for (let i = 0; i < owner.length; i++) {
    if (baseline[i * 12 + 1] <= boardTop) continue;
    const square = squareAt(baseline[i * 12], baseline[i * 12 + 2]);
    const index = pieces.findIndex(piece => piece.start === square);
    if (index < 0) throw new Error('Unassigned chess geometry');
    owner[i] = index;
    ownedCounts[index]++;
    ownedIndices[index].push(i);
  }
  if (ownedCounts.some(count => count === 0)) throw new Error('Incomplete chess geometry');

  return {
    owner,
    build(position: readonly ChessPiece[], selected: string | null, drag?: { id: string; x: number; z: number } | null) {
      const result = baseline.slice();
      const offsets = pieces.map(original => {
        const piece = position.find(item => item.id === original.id)!;
        const start = squarePosition(original.start);
        const end = piece.square ? squarePosition(piece.square) : start;
        const dragging = drag?.id === piece.id;
        return { x: (dragging ? drag.x : end.x) - start.x, z: (dragging ? drag.z : end.z) - start.z,
          lifted: piece.id === selected, captured: piece.square === null };
      });
      const originalPieces = initialPieces();
      for (const [pieceIndex, piece] of position.entries()) {
        const original = originalPieces[pieceIndex];
        if (original.kind !== 'pawn' || piece.kind === original.kind || !piece.square) continue;
        const template = promotedPieceVoxels(piece.kind as PromotionKind, piece.color);
        const origin = squarePosition(original.start);
        for (const [slot, itemIndex] of ownedIndices[pieceIndex].entries()) {
          const part = template[slot];
          const offset = itemIndex * 12;
          result[offset] = origin.x + part.x;
          result[offset + 1] = boardTop + part.y;
          result[offset + 2] = origin.z + part.z;
          result[offset + 3] = part.sx;
          result[offset + 4] = part.sy;
          result[offset + 5] = part.sz;
          result[offset + 6] = result[offset + 7] = result[offset + 8] = 0;
          result[offset + 9] = part.color[0];
          result[offset + 10] = part.color[1];
          result[offset + 11] = part.color[2];
        }
      }
      for (let i = 0; i < owner.length; i++) {
        if (owner[i] < 0) continue;
        const offset = offsets[owner[i]], index = i * 12;
        result[index] += offset.x;
        result[index + 1] += offset.lifted ? .12 : 0;
        result[index + 2] += offset.z;
        if (offset.captured) result.fill(.00001, index + 3, index + 6);
      }
      return result;
    },
  };
}
