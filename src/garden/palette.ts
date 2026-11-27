import * as THREE from 'three';

// The authored assets keep their original geometry and colour IDs. Repaint once
// on load so the GLB and the matching scroll-morph tree use the same art direction.
// Close values within each material keep individual voxels from looking speckled.
const swatches = [
  // Meadow, earth, moss and evergreen foliage.
  ['91a861 9bb76c a5bb75 86a35c 789754 abc07b', '809a78 869e7d 8ba481 7c9773 76906e 91a985'],
  ['927258 aa8768 886c53 9c7c5f b29372', '846e5c 8c7663 7e6858 87715f 947d68'],
  ['5b793d 77934b 889f54 9fb366 698b42', '5e795a 6e8864 78916d 829973 66815e'],
  ['385f42 55784c 6c8852 466c43 7d955b', '34594a 426d58 507760 3b6452 5c8064'],
  // Cedar bark and a restrained range of dusty blossom pinks.
  ['72513f 80604a 926d53 614534 a17a58', '6e5146 785b4c 826250 624b41 8b6a54'],
  ['ed9cb5 f6b3c8 f8c4d3 ffd1dd e79ab2 ffdee6 ffdae2', 'd29aa8 d9a3b0 dcaab6 e1b2bc cd94a3 e4b8c0 e2b5be'],
  // Limestone, weathered timber and teal water.
  ['a4aa91 b9bba7 c9c9b8 969e86 d6d4bf d8d5c2', 'aaa999 b6b5a5 c0bfb0 a2a496 cac7b7 d0cbbb'],
  ['b9956c c4a67c d3b78d a8825c dec39c', 'a58565 b08f6c bd9e77 9d7d5e c4a783'],
  ['64b9b0 75c7be 8dcfc2 58aaa4 81c5b6', '508b88 589793 63a09b 4a8482 5d9690'],
  // Small accents: cream petals, ochre centres and clay pots.
  ['fff1cf fffcdf ecb0be f3c7d4 e9c66c dfbb56', 'eee2c4 f4ecd9 dba6b2 e5bec5 cbb16e c0a162'],
  ['b56f52 ce8766 9d5945 c58a69 5f4d35 5a8145', 'aa7561 bb8971 93604f b68b73 594a3d 58765a'],
  // Bridge, bench and workbench joinery.
  ['d0b38b b9986c b69772 e0c7a0', 'b89c79 a88c69 a3896c c9b18f'],
  ['987750 a27f57 c8ab7d bc9a6a', '8b7057 95775a b39a75 a78a65'],
  ['9f7a51 a48056 a7885f d0ad7b b89568 8a6b4c 664f39', '917357 96795d 9c8366 bba07b a68a69 816a55 635343'],
  // Copper letterbox, water lilies and warm porcelain lanterns.
  ['9c734f a95845 bd7457 c68260 8b493b d8b88a 855a42 da916a', '917259 a46e5b b78068 bd8c73 895746 c6ab84 7f614e c39577'],
  ['799d50 88ad5d f3b5c9 ffe3d5', '67865e 78956c e2b1bd f0d9cf'],
  ['6e6650 ffe2a4 797359', '515e54 ebd7ab 626e61'],
] as const;

type RGB = readonly [number, number, number];
const colourKey = (r: number, g: number, b: number) =>
  (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
const palette = new Map<number, RGB>();
for (const [originals, replacements] of swatches) {
  const targets = replacements.split(' ');
  originals.split(' ').forEach((hex, index) => {
    const source = new THREE.Color(`#${hex}`);
    const target = new THREE.Color(`#${targets[index]}`);
    // GLB colours are normalized linear RGB bytes; the morph has linear floats.
    // Using the same byte key gives both representations exactly the same paint.
    palette.set(colourKey(source.r, source.g, source.b), [target.r, target.g, target.b]);
  });
}

export function paintGardenColour(colour: THREE.Color) {
  const replacement = palette.get(colourKey(colour.r, colour.g, colour.b));
  if (replacement) colour.setRGB(...replacement, THREE.LinearSRGBColorSpace);
  return colour;
}

export function paintGardenGeometry(geometry: THREE.BufferGeometry) {
  const source = geometry.getAttribute('color');
  if (!source) return;
  // Keep float precision here instead of quantizing the quieter palette again.
  const painted = new THREE.Float32BufferAttribute(new Float32Array(source.count * source.itemSize), source.itemSize);
  const colour = new THREE.Color();
  for (let i = 0; i < source.count; i++) {
    paintGardenColour(colour.setRGB(source.getX(i), source.getY(i), source.getZ(i), THREE.LinearSRGBColorSpace));
    painted.setXYZ(i, colour.r, colour.g, colour.b);
    if (source.itemSize === 4) painted.setW(i, source.getW(i));
  }
  geometry.setAttribute('color', painted);
}
