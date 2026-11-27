import * as THREE from 'three';
import { boardTop, pieceHeights, squarePosition, squareSize, type ChessPiece, type PieceKind } from './chess';

const silhouettes: Record<PieceKind, string> = {
  pawn: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9.5 12h5c0 2.1 1 4 2.5 5H7c1.5-1 2.5-2.9 2.5-5ZM6 18.5h12V21H6Z',
  rook: 'M4 3h4v3h2V3h4v3h2V3h4v6l-3 2.5v5H7v-5L4 9ZM5 18h14v3H5Z',
  knight: 'M16 3c2.7 2 3.7 5.7 3.7 9.5V21H6v-3c0-3 2.7-5.4 6.5-7.3L8 13l-3.6-2.8L10 5.6l.6-3.4L14 4Zm-4.9 3.4a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z',
  bishop: 'M12 2c2.2 2 6 5.4 6 9 0 2.4-2.2 4.3-6 4.3s-6-1.9-6-4.3c0-3.6 3.8-7 6-9Zm2.3 3.7-3.8 5.4 1.5 1 3.8-5.4ZM8 16.5h8l2 4.5H6Z',
  queen: 'M4 4a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 4 4Zm8-2a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 12 2Zm8 2a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 20 4ZM4 8l5 3 3-5 3 5 5-3-2.5 8.5h-11ZM6 18h12v3H6Z',
  king: 'M11 2h2v2.5h2.5v2H13V9h-2V6.5H8.5v-2H11ZM6.5 9.5c2 0 3.7 1 5.5 2.6 1.8-1.6 3.5-2.6 5.5-2.6 2.3 0 3.4 2 .9 7H5.6c-2.5-5-1.4-7 .9-7ZM5 18h14v3H5Z',
};

function markMaterial(piece: ChessPiece) {
  const ivory = piece.color === 'ivory';
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const context = canvas.getContext('2d')!;
  context.scale(4, 4);
  context.beginPath();
  context.arc(12, 12, 11.4, 0, Math.PI * 2);
  context.fillStyle = ivory ? '#fff3d9' : '#1c4035';
  context.fill();
  context.lineWidth = .75;
  context.strokeStyle = ivory ? '#88724f' : '#9cbea8';
  context.stroke();
  context.translate(2.4, 2.4);
  context.scale(.8, .8);
  context.fillStyle = ivory ? '#392d24' : '#f0f7dc';
  context.fill(new Path2D(silhouettes[piece.kind]), 'evenodd');

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.SpriteMaterial({ map, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
}

export function createChessPieceMarks(scene: THREE.Scene, position: readonly ChessPiece[]) {
  const group = new THREE.Group();
  const materials = new Map<string, THREE.SpriteMaterial>();
  function materialFor(piece: ChessPiece) {
    const key = `${piece.color}-${piece.kind}`;
    let material = materials.get(key);
    if (!material) {
      material = markMaterial(piece);
      materials.set(key, material);
    }
    return material;
  }
  const sprites = position.map(piece => {
    const sprite = new THREE.Sprite(materialFor(piece));
    sprite.scale.setScalar(squareSize * .69);
    sprite.renderOrder = 10;
    group.add(sprite);
    return sprite;
  });
  scene.add(group);

  return {
    update(pieces: readonly ChessPiece[], selected: string | null, drag: { id: string; x: number; z: number } | null, opacity: number) {
      group.visible = opacity > 0;
      if (!group.visible) return;
      pieces.forEach((piece, index) => {
        const sprite = sprites[index];
        sprite.visible = piece.square !== null;
        if (!piece.square) return;
        const { x, z } = drag?.id === piece.id ? drag : squarePosition(piece.square);
        const lift = piece.id === selected ? .12 : 0;
        sprite.position.set(x, boardTop + pieceHeights[piece.kind] + lift + .02, z);
        sprite.material = materialFor(piece);
        sprite.material.opacity = opacity;
        sprite.renderOrder = drag?.id === piece.id ? 11 : 10;
      });
    },
    dispose() {
      scene.remove(group);
      for (const material of materials.values()) {
        material.map?.dispose();
        material.dispose();
      }
    },
  };
}
