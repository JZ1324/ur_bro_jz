import type { PlantColors, PlantKind } from './plantings.ts';
import { defaultFlowerDesign, type FlowerDesign } from './flowerDesign.ts';

export type PlantVoxel = { x: number; y: number; z: number; w: number; h: number; d: number; color: string };

// The studio, thumbnail illustrations, and garden all use these same original
// block shapes and colours. Plants grow upward from y = 0; nothing is a sprite.
export function plantVoxels(kind: PlantKind, colors: PlantColors, design?: FlowerDesign): PlantVoxel[] {
  const voxels: PlantVoxel[] = [];
  const main = colors.main, green = colors.leaves, stem = '#6d8255', pollen = '#d5b46c';
  const box = (x: number, y: number, z: number, w: number, h: number, d: number, color: string) => voxels.push({ x, y, z, w, h, d, color });
  const leaf = (x: number, y: number, z = 0, color = green) => {
    box(x, y, z, .27, .09, .16, color); box(x * 1.5, y + .05, z, .15, .08, .12, color);
  };
  const face = (x: number, y: number, z: number, scale = 1) => {
    for (const side of [-1, 1]) {
      box(x + side * .12 * scale, y, z, .044 * scale, .064 * scale, .026 * scale, '#4d4944');
      box(x + side * .19 * scale, y - .05 * scale, z, .078 * scale, .035 * scale, .02 * scale, '#e9abb0');
    }
    box(x, y - .065 * scale, z, .044 * scale, .025 * scale, .025 * scale, '#835f5a');
  };
  const round = (x: number, y: number, z: number, w: number, h: number, d: number, color = main) => {
    box(x, y, z, w, h * .62, d * .72, color);
    box(x, y, z, w * .72, h * .62, d, color);
    box(x, y, z, w * .72, h, d * .72, color);
  };
  const flowerStem = (top: number, x = 0, z = 0) => {
    box(x, top / 2, z, .06, top, .06, stem);
    leaf(x - .16, top * .35, z); leaf(x + .16, top * .53, z);
  };
  const petalRing = (x: number, y: number, z: number, count: number, radius: number, width: number, height: number, depth: number, color = main) => {
    for (let i = 0; i < count; i++) {
      const angle = i * Math.PI * 2 / count;
      box(x + Math.cos(angle) * radius, y, z + Math.sin(angle) * radius, width, height, depth, color);
    }
  };
  if (kind === 'custom-flower') {
    const flower = design ?? defaultFlowerDesign(), top = flower.stemHeight, scale = flower.size;
    box(0, top / 2, 0, .075, top, .075, green);
    for (let i = 0; i < flower.leafPairs; i++) {
      const y = top * (.27 + i * .18);
      leaf(-.16, y); leaf(.16, y + .035);
    }
    box(0, top + .04, 0, .32 * scale, .12 * scale, .32 * scale, main);
    for (let i = 0; i < flower.petals; i++) {
      const angle = i * Math.PI * 2 / flower.petals, x = Math.cos(angle), z = Math.sin(angle);
      if (flower.shape === 'round') {
        round(x * .24 * scale, top + .05, z * .24 * scale, .26 * scale, .13 * scale, .26 * scale);
      } else if (flower.shape === 'star') {
        box(x * .19 * scale, top + .05, z * .19 * scale, .23 * scale, .12 * scale, .23 * scale, main);
        box(x * .33 * scale, top + .05, z * .33 * scale, .12 * scale, .10 * scale, .12 * scale, main);
        box(x * .42 * scale, top + .05, z * .42 * scale, .07 * scale, .07 * scale, .07 * scale, main);
      } else {
        box(x * .21 * scale, top + .06 * scale, z * .21 * scale, .23 * scale, .16 * scale, .23 * scale, main);
        box(x * .26 * scale, top + .19 * scale, z * .26 * scale, .18 * scale, .21 * scale, .18 * scale, main);
      }
    }
    box(0, top + .12 * scale, 0, .18 * scale, .09 * scale, .18 * scale, flower.center);
  } else if (['daisy', 'tulip', 'sunflower', 'rose'].includes(kind)) {
    const top = kind === 'sunflower' ? 1.15 : .9;
    box(0, top / 2, 0, .075, top, .075, stem);
    leaf(-.15, top * .38); leaf(.15, top * .56);
    if (kind === 'rose') {
      box(0, .98, 0, .48, .22, .40, main);
      box(0, 1.1, 0, .36, .13, .36, main);
      box(-.15, 1.13, .16, .21, .16, .10, main); box(.15, 1.13, -.16, .21, .16, .10, main);
      box(-.16, 1.18, -.07, .08, .09, .22, main); box(.12, 1.20, .05, .09, .13, .17, main);
      box(0, 1.23, -.04, .15, .08, .11, main);
      box(0, .86, 0, .29, .10, .29, green);
    } else if (kind === 'tulip') {
      box(0, .98, 0, .36, .26, .34, main);
      box(-.14, 1.13, 0, .12, .23, .30, main); box(.14, 1.13, 0, .12, .23, .30, main);
      box(0, 1.14, -.12, .20, .21, .12, main); box(0, 1.09, .12, .20, .16, .12, main);
      box(0, 1.12, 0, .11, .045, .11, pollen);
    } else if (kind === 'sunflower') {
      for (const [x, y] of [[-.27, 0], [.27, 0], [0, .27], [0, -.27], [-.20, -.20], [.20, -.20], [-.20, .20], [.20, .20]]) box(x, top + y, 0, .23, .23, .12, main);
      box(0, top, .02, .32, .32, .20, '#816442');
      for (const x of [-.075, .075]) for (const y of [-.075, .075]) box(x, top + y, .13, .045, .045, .025, pollen);
    } else {
      for (const [x, z] of [[-.26, 0], [.26, 0], [0, -.26], [0, .26], [-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]]) box(x, .94, z, .22, .105, .22, main);
      box(0, .98, 0, .23, .16, .23, pollen);
    }
  } else if (kind === 'lavender' || kind === 'bluebell') {
    for (const [x, top, z] of [[-.23, .85, .02], [0, 1.19, -.05], [.24, 1.02, .08]]) {
      box(x, top / 2, z, .045, top, .045, green);
      if (kind === 'lavender') {
        for (let i = 0; i < 4; i++) box(x, top - .22 + i * .10, z, .18 - i * .025, .10, .17 - i * .02, main);
      } else {
        box(x + .065, top, z, .17, .045, .045, green);
        box(x + .14, top - .12, z, .17, .22, .18, main);
        box(x + .14, top - .23, z, .26, .07, .25, main);
        box(x + .14, top - .27, z, .07, .06, .07, pollen);
      }
    }
    leaf(-.20, .24); leaf(.18, .34);
  } else if (kind === 'lotus') {
    box(0, .04, 0, .86, .08, .65, green); box(0, .04, 0, .65, .08, .86, green);
    box(0, .18, 0, .30, .22, .30, green);
    petalRing(0, .19, 0, 8, .31, .24, .14, .24);
    petalRing(0, .35, 0, 6, .18, .17, .22, .17);
    box(0, .42, 0, .18, .15, .18, pollen);
  } else if (kind === 'orchid') {
    box(-.13, .36, 0, .06, .72, .06, stem);
    box(-.03, .73, 0, .24, .07, .06, stem); box(.06, 1.01, 0, .06, .55, .06, stem);
    leaf(-.22, .12, .05); leaf(.22, .18, -.05); leaf(.15, .29, .10);
    box(-.01, .18, 0, .32, .065, .13, green); box(0, .29, .05, .34, .065, .16, green);
    for (const [x, y, z] of [[-.21, .78, .03], [.21, 1.02, .04], [.02, 1.27, -.03]]) {
      box(x, y + .10, z, .14, .20, .09, main);
      for (const side of [-1, 1]) {
        box(x + side * .12, y, z, .18, .13, .10, main);
        box(x + side * .07, y - .12, z, .12, .15, .10, main);
      }
      box(x, y - .04, z + .06, .10, .08, .08, pollen);
    }
  } else if (kind === 'hydrangea') {
    for (const [x, top, z] of [[-.23, .87, .02], [.20, 1.09, -.09], [.12, .59, .24]]) {
      flowerStem(top, x, z);
      box(x, top + .05, z, .23, .22, .23, main);
      for (const [dx, dy, dz] of [[0, .14, 0], [-.14, 0, .03], [.14, 0, .03], [0, -.06, .15], [0, .03, -.14]]) {
        box(x + dx, top + dy, z + dz, .24, .08, .10, main);
        box(x + dx, top + dy, z + dz, .10, .08, .24, main);
        box(x + dx, top + dy + .05, z + dz, .045, .035, .045, '#f4e7d5');
      }
    }
  } else if (kind === 'poppy') {
    flowerStem(.87);
    box(0, .90, 0, .24, .12, .24, green);
    petalRing(0, .93, 0, 4, .20, .32, .13, .32);
    petalRing(0, 1.02, 0, 4, .25, .20, .12, .20);
    box(0, .99, 0, .19, .14, .19, '#665b53');
    for (const side of [-1, 1]) box(side * .08, 1.08, 0, .04, .06, .04, pollen);
  } else if (kind === 'iris') {
    flowerStem(.89);
    box(0, .89, 0, .36, .11, .36, green);
    for (let i = 0; i < 3; i++) {
      const angle = i * Math.PI * 2 / 3, x = Math.cos(angle), z = Math.sin(angle);
      box(x * .12, 1.07, z * .12, .15, .34, .15, main);
      box(x * .27, .89, z * .27, .24, .10, .24, main);
      box(x * .31, .79, z * .31, .14, .16, .14, main);
      box(x * .19, .95, z * .19, .09, .06, .09, pollen);
    }
    box(-.10, .29, -.06, .10, .58, .07, green); box(.11, .38, .05, .08, .76, .08, green);
  } else if (kind === 'lily') {
    flowerStem(.88);
    box(0, .93, 0, .34, .14, .34, main);
    petalRing(0, .93, 0, 6, .22, .24, .12, .24);
    petalRing(0, 1.02, 0, 6, .37, .15, .12, .15);
    for (const [x, z] of [[-.07, .04], [.07, .04], [0, -.08]]) {
      box(x, 1.04, z, .025, .20, .025, green); box(x, 1.15, z, .07, .045, .07, pollen);
    }
  } else if (kind === 'peony') {
    flowerStem(.74);
    box(0, .76, 0, .37, .12, .37, green);
    petalRing(0, .82, 0, 8, .27, .23, .20, .23);
    petalRing(0, .98, 0, 8, .19, .19, .19, .19);
    petalRing(0, 1.10, 0, 5, .10, .14, .14, .14);
    box(0, 1.15, 0, .13, .09, .13, main);
  } else if (kind === 'hibiscus') {
    flowerStem(.84);
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      box(Math.cos(angle) * .24, .94 + Math.sin(angle) * .24, 0, .30, .27, .12, main);
      box(Math.cos(angle) * .12, .94 + Math.sin(angle) * .12, .07, .16, .15, .06, main);
    }
    box(0, .95, .17, .045, .045, .28, pollen);
    for (const side of [-1, 1]) box(side * .04, .98, .32, .045, .065, .045, pollen);
  } else if (kind === 'daffodil') {
    flowerStem(.83);
    box(0, .94, 0, .30, .30, .09, main);
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      box(Math.cos(angle) * .22, .94 + Math.sin(angle) * .22, 0, .19, .19, .09, main);
    }
    box(0, .94, .10, .22, .22, .20, '#dfb45c');
    for (const side of [-1, 1]) {
      box(side * .12, .94, .23, .06, .28, .08, main);
      box(0, .94 + side * .12, .23, .22, .06, .08, main);
    }
    box(0, .94, .26, .09, .09, .025, pollen);
    box(0, .94, .20, .10, .10, .14, '#dfb45c');
    box(-.12, .29, -.08, .09, .58, .07, green);
  } else if (kind === 'cosmos') {
    for (const [x, top, z] of [[-.24, .74, .08], [.16, 1.08, -.05]]) {
      flowerStem(top, x, z);
      box(x, top, z, .29, .09, .29, main);
      petalRing(x, top, z, 8, .20, .15, .07, .15);
      box(x, top + .035, z, .13, .09, .13, pollen);
      for (const side of [-1, 1]) box(x + side * .10, top * .43, z, .24, .025, .045, green);
    }
  } else if (kind === 'fern') {
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
      box(side * i * .125, .18 + i * .18, 0, .06, .23, .07, green);
      for (const direction of [-1, 1]) box(side * (i * .13 + .08), .23 + i * .18, direction * .13, .20, .075, .27 - i * .035, i % 2 ? green : main);
    }
    box(0, .48, -.10, .07, .96, .07, green);
    for (let i = 0; i < 4; i++) for (const side of [-1, 1]) box(side * (.15 - i * .025), .32 + i * .20, -.10, .28 - i * .035, .09, .13, main);
  } else if (kind === 'cactus') {
    box(0, .52, 0, .29, 1.04, .28, main); box(0, 1.07, 0, .19, .10, .20, main);
    box(-.29, .53, 0, .33, .16, .22, main); box(-.39, .73, 0, .17, .40, .21, main);
    box(.29, .39, 0, .30, .17, .21, main); box(.38, .59, 0, .17, .40, .21, main);
    box(-.055, .52, .148, .045, .9, .018, green);
    for (let i = 0; i < 5; i++) box(.065, .17 + i * .18, .15, .028, .032, .025, '#f2e6c9');
    box(0, 1.17, 0, .22, .10, .19, '#d99cac'); box(0, 1.23, 0, .09, .065, .09, pollen);
  } else if (kind === 'sprout') {
    box(0, .37, 0, .085, .74, .085, green);
    box(-.22, .75, 0, .40, .16, .23, main); box(-.41, .81, 0, .17, .13, .17, main);
    box(.20, .88, 0, .38, .17, .24, main); box(.38, .94, 0, .17, .13, .17, main);
    leaf(.13, .32, 0, green);
  } else if (kind === 'monstera') {
    for (const [x, top, z] of [[-.24, .77, .04], [.19, 1.04, -.05], [0, .5, .25]]) {
      box(x / 2, top / 2, z, .055, top, .055, green);
      box(x, top, z, .10, .41, .13, green);
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
        box(x + side * (.09 + i * .025), top + .13 - i * .12, z, .18 + i * .03, .08, .13, main);
      }
      box(x, top + .25, z, .17, .12, .13, main);
    }
  } else if (kind === 'succulent') {
    for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4 + layer * .35, radius = .38 - layer * .12;
      box(Math.cos(angle) * radius, .13 + layer * .16, Math.sin(angle) * radius, .22 - layer * .035, .16 + layer * .025, .22 - layer * .035, layer % 2 ? green : main);
    }
    box(0, .59, 0, .14, .19, .14, main);
  } else if (kind === 'mushroom') {
    for (const [x, height, z, scale] of [[-.18, .85, -.04, 1], [.31, .50, .12, .65]]) {
      box(x, height * .36, z, .17 * scale, height * .72, .17 * scale, '#eee4cf');
      box(x, height * .76, z, .70 * scale, .17 * scale, .55 * scale, main);
      box(x, height * .88, z, .51 * scale, .18 * scale, .40 * scale, main);
      box(x, height, z, .27 * scale, .08 * scale, .24 * scale, main);
      for (const side of [-1, 1]) box(x + side * .18 * scale, height * .87, z + .205 * scale, .11 * scale, .08 * scale, .02, '#fff0d8');
      face(x, height * .44, z + .09 * scale, .36 * scale);
    }
    leaf(-.30, .08, .15);
  } else if (kind === 'bonsai') {
    box(0, .17, 0, .18, .34, .17, '#a38760'); box(.08, .42, 0, .15, .26, .14, '#a38760');
    box(-.04, .61, 0, .30, .13, .13, '#a38760'); box(-.14, .77, 0, .13, .30, .13, '#a38760');
    box(.22, .52, 0, .26, .09, .09, '#a38760'); box(-.29, .73, 0, .25, .08, .09, '#a38760');
    round(-.30, .87, 0, .52, .25, .42, green);
    round(.27, .65, .04, .48, .23, .39, main);
    round(-.10, 1.08, -.04, .64, .30, .47, main);
    box(-.12, .06, .08, .36, .09, .21, '#a38760');
  } else if (kind === 'bamboo') {
    for (const [x, top, z] of [[-.26, .94, .03], [0, 1.31, -.05], [.25, 1.08, .05]]) {
      box(x, top / 2, z, .09, top, .09, main);
      for (let i = 1; i <= 4; i++) box(x, top * i / 5, z, .12, .035, .12, green);
      leaf(x + .13, top * .75, z); leaf(x - .13, top * .91, z);
    }
  } else if (kind === 'palm') {
    for (let i = 0; i < 4; i++) box(i * .025, .14 + i * .25, 0, .14, .28, .14, '#b29972');
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3, x = Math.cos(angle), z = Math.sin(angle);
      box(.07 + x * .20, 1.12, z * .20, .25, .09, .25, main);
      box(.07 + x * .40, 1.07, z * .40, .23, .10, .23, green);
      box(.07 + x * .55, .98, z * .55, .17, .13, .17, main);
    }
    round(.02, .95, .12, .17, .17, .17, '#b39b76');
  } else if (kind === 'aloe') {
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3, x = Math.cos(angle), z = Math.sin(angle);
      for (let step = 0; step < 3; step++) {
        const radius = .10 + step * .13;
        box(x * radius, .12 + step * .19, z * radius, .17 - step * .035, .22, .17 - step * .035, step % 2 ? green : main);
      }
      box(x * .40, .66, z * .40, .06, .16, .06, main);
    }
    box(0, .38, 0, .13, .76, .13, main); box(0, .40, .07, .04, .58, .02, green);
  } else if (kind === 'ivy') {
    for (const side of [-1, 1]) box(side * .25, .62, -.10, .055, 1.24, .055, '#b69d79');
    for (const y of [.26, .59, .92, 1.20]) box(0, y, -.10, .61, .04, .05, '#b69d79');
    for (let i = 0; i < 6; i++) {
      const x = Math.sin(i * 1.3) * .20, y = .13 + i * .19;
      box(x, y, -.05, .055, .24, .055, green);
      const side = i % 2 ? 1 : -1;
      box(x + side * .10, y + .03, .01, .22, .10, .18, main);
      box(x + side * .15, y + .03, .05, .13, .10, .21, main);
    }
  } else if (kind === 'eucalyptus') {
    for (const [x, top, z] of [[-.20, .96, .04], [.02, 1.28, -.06], [.22, 1.08, .06]]) {
      box(x, top / 2, z, .045, top, .045, '#a58c6e');
      for (let i = 0; i < 4; i++) {
        const y = .25 + i * (top - .25) / 4, radius = .14 - i * .015;
        for (const side of [-1, 1]) round(x + side * .10, y, z, radius * 1.5, .075, radius * 1.5, i % 2 ? green : main);
      }
      box(x, top, z, .10, .13, .10, main);
    }
  } else if (kind === 'rosemary') {
    for (const [x, top, z] of [[-.23, .83, .04], [0, 1.10, -.04], [.23, .94, .02]]) {
      box(x, top / 2, z, .045, top, .045, '#9c8c65');
      for (let i = 0; i < 5; i++) for (const side of [-1, 1]) {
        box(x + side * .075, .18 + i * .15, z, .16, .04, .055, i % 2 ? green : main);
        box(x + side * .13, .22 + i * .15, z, .07, .07, .045, main);
      }
      box(x, top, z, .09, .08, .09, '#b3a6c6');
    }
  } else if (kind === 'clover') {
    for (const [x, top, z] of [[-.23, .47, .10], [.12, .80, -.04], [.25, .38, .25]]) {
      box(x, top / 2, z, .045, top, .045, green);
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2, dx = Math.cos(angle), dz = Math.sin(angle);
        box(x + dx * .12, top, z + dz * .12, .20, .065, .20, main);
        box(x + dx * .20, top, z + dz * .20, .15, .065, .15, main);
      }
      box(x, top + .025, z, .055, .04, .055, green);
    }
  } else if (kind === 'snakeplant') {
    for (const [x, top, z] of [[-.29, .67, .05], [-.14, 1.06, -.06], [.04, 1.31, 0], [.22, .96, .06], [.34, .55, -.04]]) {
      box(x, (top - .12) / 2, z, .14, top - .12, .11, green);
      box(x, top - .09, z, .09, .18, .085, main);
      box(x - .055, top * .47, z + .06, .035, top * .76, .015, main);
      for (let i = 1; i < 4; i++) box(x, top * i / 5, z + .06, .10, .035, .015, main);
    }
  } else if (kind === 'pine') {
    box(0, .30, 0, .16, .60, .16, '#9e8666');
    for (let layer = 0; layer < 5; layer++) {
      const width = .92 - layer * .16, y = .43 + layer * .18;
      box(0, y, 0, width, .14, width * .67, layer % 2 ? green : main);
      box(0, y + .045, 0, width * .67, .18, width, layer % 2 ? green : main);
    }
    box(0, 1.32, 0, .12, .17, .12, main);
  } else if (kind === 'strawberry') {
    for (const side of [-1, 1]) { leaf(side * .20, .15); leaf(side * .15, .23, -.16); }
    box(0, .39, 0, .07, .77, .07, green);
    for (const [x, y, z, scale] of [[-.20, .55, .06, 1], [.25, .35, .12, .8]]) {
      box(x, y, z, .33 * scale, .30 * scale, .28 * scale, main);
      box(x, y - .20 * scale, z, .22 * scale, .13 * scale, .21 * scale, main);
      box(x, y - .29 * scale, z, .11 * scale, .07 * scale, .11 * scale, main);
      box(x, y + .18 * scale, z, .37 * scale, .065, .11, green);
      box(x, y + .18 * scale, z, .11, .065, .32 * scale, green);
      for (const dx of [-.11, .11]) box(x + dx * scale, y + .09 * scale, z + .147 * scale, .022, .035, .017, '#ffe3a3');
      face(x, y - .025 * scale, z + .15 * scale, .48 * scale);
    }
  } else if (kind === 'lemon') {
    box(0, .49, 0, .13, .98, .13, '#a38760');
    box(0, 1.05, 0, .63, .45, .52, green); box(-.30, .96, .04, .33, .32, .38, green);
    box(.30, 1.06, -.06, .34, .36, .39, green); box(0, 1.33, 0, .35, .16, .33, green);
    for (const [x, y, z] of [[-.30, 1, .25], [.22, .85, .22], [.16, 1.23, .24], [.35, 1.10, -.26]]) {
      box(x, y, z, .21, .26, .19, main); box(x, y - .15, z, .10, .06, .10, main); box(x, y + .15, z, .10, .06, .10, main);
      if (z > 0) face(x, y, z + .102, .31);
    }
  } else if (kind === 'pumpkin') {
    box(0, .32, 0, .65, .56, .61, main); box(0, .32, 0, .85, .39, .43, main);
    box(0, .32, 0, .43, .39, .82, main); box(0, .64, 0, .12, .19, .12, '#8c8158');
    box(.07, .74, 0, .21, .08, .09, '#8c8158'); leaf(.28, .16, -.20);
    for (const x of [-.20, .20]) box(x, .32, .316, .025, .44, .02, '#bc825a');
    face(0, .34, .42, .82);
  } else if (['apple', 'peach', 'orange', 'pear'].includes(kind)) {
    const pear = kind === 'pear';
    round(0, .37, 0, .70, .62, .62);
    if (pear) round(0, .72, 0, .39, .35, .38);
    if (kind === 'apple') { box(-.15, .69, 0, .21, .09, .27, main); box(.15, .69, 0, .21, .09, .27, main); }
    if (kind === 'orange') for (const x of [-.20, .20]) box(x, .53, .32, .025, .025, .015, '#f4ca83');
    if (kind === 'peach') {
      box(-.17, .66, 0, .25, .08, .30, main); box(.17, .66, 0, .25, .08, .30, main);
      box(0, .50, .314, .018, .30, .01, '#d69287');
    }
    box(0, pear ? .98 : .77, 0, .065, .21, .065, '#937456');
    leaf(.19, pear ? .99 : .78);
    face(0, .40, .32, .88);
  } else if (kind === 'cherry') {
    for (const side of [-1, 1]) {
      round(side * .23, .29, 0, .43, .43, .40);
      box(side * .22, .63, 0, .046, .32, .046, green);
      box(side * .13, .82, 0, .20, .05, .045, green);
      face(side * .23, .29, .208, .48);
    }
    box(0, .88, 0, .055, .14, .055, green); leaf(.16, .96);
  } else if (kind === 'watermelon') {
    for (const [y, w] of [[.10, .84], [.27, .68], [.44, .51], [.60, .34], [.73, .17]]) box(0, y, 0, w, .18, .25, main);
    box(0, .07, 0, .90, .13, .32, green); box(0, .17, .135, .83, .045, .02, '#e1e7ba');
    for (const [x, y] of [[-.18, .38], [.18, .38], [0, .58]]) box(x, y, .136, .028, .045, .015, '#6b5853');
    face(0, .29, .145, .7);
  } else if (kind === 'pineapple') {
    round(0, .43, 0, .58, .73, .53);
    for (const x of [-.15, 0, .15]) for (let i = 0; i < 3; i++) box(x, .19 + i * .17, .273, .046, .045, .015, '#c2a064');
    for (const [x, y, z] of [[0, 1.02, 0], [-.16, .91, 0], [.16, .91, 0], [0, .93, -.16]]) box(x, y, z, .13, .41 - Math.abs(x), .12, green);
    face(0, .49, .28, .74);
  } else if (kind === 'blueberry') {
    for (const [x, y, z] of [[-.22, .26, .06], [.21, .27, .11], [0, .59, -.06]]) {
      round(x, y, z, .40, .36, .36);
      box(x, y + .19, z, .16, .035, .07, '#6e789b'); box(x, y + .19, z, .07, .035, .16, '#6e789b');
      face(x, y, z + .186, .46);
    }
    leaf(.20, .81, -.07);
  } else if (kind === 'grapes') {
    for (const [x, y, z] of [[-.19, .73, 0], [.19, .73, 0], [0, .73, -.22], [-.16, .45, .05], [.16, .45, .05], [0, .19, .05]]) {
      round(x, y, z, .33, .33, .30);
    }
    box(0, 1.0, 0, .06, .24, .06, '#8c7e55'); leaf(.17, 1.09);
    face(0, .49, .21, .80);
  } else if (kind === 'banana') {
    for (const [x, z, height] of [[-.25, .03, .04], [0, -.04, .13], [.25, .03, 0]]) {
      box(x, .23 + height, z, .15, .37, .16, main);
      box(x + .07, .46 + height, z, .17, .20, .16, main);
      box(x + .15, .61 + height, z, .14, .15, .14, main);
      box(x + .21, .73 + height, z, .07, .13, .07, '#a18b62');
    }
    box(.20, .83, 0, .49, .08, .12, green); leaf(.28, .95, -.03);
    face(0, .37, .15, .55);
  } else if (kind === 'mango') {
    round(-.05, .41, 0, .59, .69, .53);
    round(.12, .24, .03, .45, .31, .43);
    box(-.05, .83, 0, .065, .18, .065, '#9b7f58');
    leaf(.15, .85, -.03); leaf(-.22, .10, -.13);
    box(-.15, .57, .27, .10, .16, .015, '#edc58e');
    face(0, .43, .28, .75);
  } else if (kind === 'dragonfruit') {
    round(0, .44, 0, .59, .76, .55);
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      for (const y of [.27, .56]) {
        box(Math.cos(angle) * .28, y, Math.sin(angle) * .27, .11, .17, .11, green);
        box(Math.cos(angle) * .32, y + .12, Math.sin(angle) * .31, .065, .10, .065, green);
      }
    }
    box(0, .88, 0, .13, .20, .13, green); leaf(.13, .90);
    face(0, .42, .30, .68);
  } else if (kind === 'raspberry') {
    for (const [x, y, z, scale] of [[-.20, .34, .04, 1], [.23, .27, .10, .8]]) {
      for (let row = 0; row < 3; row++) {
        const count = row === 2 ? 4 : 6, radius = (.14 - row * .025) * scale;
        for (let i = 0; i < count; i++) {
          const angle = i * Math.PI * 2 / count;
          box(x + Math.cos(angle) * radius, y + (1 - row) * .12 * scale, z + Math.sin(angle) * radius, .13 * scale, .13 * scale, .13 * scale, main);
        }
      }
      box(x, y + .20 * scale, z, .23 * scale, .045, .09, green);
      box(x, y + .20 * scale, z, .09, .045, .23 * scale, green);
      face(x, y, z + .21 * scale, .42 * scale);
    }
    leaf(-.04, .66, -.05);
  }
  return voxels;
}
