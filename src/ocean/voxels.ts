import type { Fish } from './catalog';
export type FishVoxel = { x: number; y: number; z: number; w: number; h: number; d: number; color: string; tail?: boolean };
export const rainbowColors = ['#ff5e89', '#ffb34c', '#ffec6b', '#58f0b3', '#52d8ff', '#a082ff', '#f27ad9'];
export function fishVoxels(fish: Fish): FishVoxel[] {
  const [body, mark, fin] = fish.colors;
  const blocks: FishVoxel[] = [];
  const add = (x: number, y: number, z: number, w: number, h: number, d: number, color: string, tail = false) => blocks.push({ x, y, z, w, h, d, color, tail });
  const ray = fish.shape === 'ray', dragon = fish.shape === 'dragon', shark = fish.shape === 'shark', long = fish.shape === 'long';
  const leviathan = fish.shape === 'leviathan', kraken = fish.shape === 'kraken', whale = fish.shape === 'whale', seahorse = fish.shape === 'seahorse', jelly = fish.shape === 'jellyfish';
  if (kraken) {
    add(0, .24, 0, .65, .6, .65, body);
    add(-.05, .56, 0, .48, .24, .48, body);
    add(.28, .2, 0, .2, .35, .5, mark);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      for (let segment = 0; segment < 3; segment++) {
        const distance = .43 + segment * .29, curl = angle + segment * .2;
        add(Math.cos(curl) * distance, -.07 - segment * .07, Math.sin(curl) * distance,
          .32 - segment * .035, .15 - segment * .025, .25 - segment * .025, segment === 2 ? fin : body, true);
      }
      add(Math.cos(angle) * .7, -.19, Math.sin(angle) * .7, .09, .04, .09, mark, true);
    }
    for (const side of [-1, 1]) {
      add(-.12, .78, side * .2, .11, .32, .1, fin);
      add(.14, .7, side * .22, .09, .2, .09, mark);
    }
  } else if (leviathan) {
    for (let i = 0; i < 11; i++) {
      const x = .85 - i * .25, y = Math.sin(i * .7) * .1, width = .46 - i * .023;
      add(x, y, 0, .33, width * .78, width, i % 3 === 0 ? mark : body, i > 5);
      if (i < 9) add(x, y + width * .5 + .09, 0, .13, .27 - i * .013, .09, fin, i > 5);
    }
    add(1.12, .025, 0, .5, .33, .48, body);
    add(1.41, -.045, 0, .27, .2, .31, mark);
    for (const side of [-1, 1]) {
      add(1.01, .32, side * .2, .12, .37, .11, mark);
      add(.9, .54, side * .23, .23, .11, .1, fin);
      add(.45, -.02, side * .38, .65, .07, .42, fin);
      add(-.55, -.02, side * .28, .43, .06, .3, mark, true);
      add(-1.8, -.09, side * .15, .35, .07, .2, fin, true);
    }
  } else if (whale) {
    add(-.1, 0, 0, 1.25, .58, .63, body);
    add(.62, -.02, 0, .56, .49, .57, body);
    add(-.82, 0, 0, .38, .35, .39, body);
    add(.1, -.2, 0, 1.35, .16, .64, mark);
    add(-1.12, .025, 0, .35, .14, .19, fin, true);
    for (const side of [-1, 1]) {
      add(-1.32, .025, side * .24, .38, .09, .47, fin, true);
      add(.04, -.16, side * .48, .55, .09, .46, fin);
      if (fish.id === 'orca') add(.51, .06, side * .29, .2, .12, .025, mark);
    }
    add(-.22, .47, 0, .29, fish.id === 'orca' ? .52 : .25, .1, fin);
    if (fish.id !== 'orca') for (let i = 0; i < 6; i++) {
      add((i % 3 - 1) * .28, .3, (Math.floor(i / 3) - .5) * .35, .065, .035, .065, mark);
    }
  } else if (seahorse) {
    add(-.02, .08, 0, .28, .54, .25, body);
    add(.04, .38, 0, .23, .28, .22, body);
    add(.2, .55, 0, .37, .25, .24, body);
    add(.46, .5, 0, .25, .09, .11, mark);
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 2 + i * .75;
      add(-.1 + Math.cos(angle) * .2, -.33 + Math.sin(angle) * .16, 0, .12, .11, .13, i % 2 ? mark : body, true);
    }
    add(-.2, .06, 0, .13, .32, .28, fin);
    for (let i = 0; i < 3; i++) add(.14 + i * .085, .75 + (i === 1 ? .06 : 0), 0, .06, .16, .065, mark);
  } else if (jelly) {
    add(0, .22, 0, .65, .23, .6, body);
    add(0, .42, 0, .48, .2, .46, body);
    add(0, .55, 0, .28, .09, .29, mark);
    add(0, .09, 0, .69, .06, .64, fin);
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3;
      for (let segment = 0; segment < 3; segment++) {
        add(Math.cos(angle) * (.2 + segment * .045), -.07 - segment * .18, Math.sin(angle) * (.2 + segment * .045), .07, .23, .07, segment % 2 ? mark : fin, true);
      }
    }
  } else if (ray) {
    add(0, 0, 0, .75, .15, .5, body);
    add(.35, 0, 0, .3, .12, .35, body);
    for (const side of [-1, 1]) {
      add(-.1, 0, side * .35, .8, .1, .3, body);
      add(-.2, .01, side * .6, .6, .07, .25, fin);
      add(-.3, .02, side * .8, .35, .05, .18, mark);
    }
    add(-.75, 0, 0, .9, .06, .07, fin, true);
    add(-1.25, .015, 0, .35, .05, .05, mark, true);
  } else if (dragon) {
    for (let i = 0; i < 7; i++) {
      const x = .45 - i * .22, height = .28 - i * .022;
      add(x, Math.sin(i * .9) * .09, 0, .28, height, height, i % 3 === 0 ? mark : body, i > 3);
      if (i < 5) add(x, height * .6 + .06, 0, .12, .18, .08, fin, i > 3);
    }
    add(.55, .18, -.12, .12, .22, .07, mark);
    add(.55, .18, .12, .12, .22, .07, mark);
    add(.65, -.01, 0, .25, .18, .23, body);
    for (const side of [-1, 1]) { add(.1, -.03, side * .3, .4, .06, .35, fin); add(-.3, -.03, side * .22, .3, .06, .25, mark); }
    add(-1.05, -.04, 0, .35, .34, .08, mark, true);
  } else {
    const puffer = fish.shape === 'puffer';
    const meg = fish.id === 'megalodon', sunfish = fish.id === 'sunfish';
    const length = meg ? 1.8 : shark ? 1.3 : long ? 1.15 : sunfish ? .72 : .85;
    const height = meg ? .46 : sunfish ? .9 : puffer ? .65 : long || shark ? .28 : .5;
    const width = meg ? .65 : sunfish ? .21 : puffer ? .55 : shark ? .36 : .3;
    add(0, 0, 0, length * .6, height, width, body);
    add(length * .35, -.015, 0, length * .25, height * .75, width * .85, body);
    add(-length * .35, 0, 0, length * .25, height * .7, width * .75, body);
    add(0, -height * .3, 0, length * .65, height * .35, width * 1.015, mark);
    add(-length * .52, 0, 0, .18, height * .3, width * .35, fin, true);
    add(-length * .69, 0, 0, .22, height * .95, .09, fin, true);
    add(-.1, height * .6, 0, shark ? .32 : .28, shark ? .28 : .14, .075, fin);
    for (const side of [-1, 1]) add(.1, -height * .25, side * width * .65, .28, .055, width * .65, fin);
    if (fish.id === 'clownfish' || fish.id === 'mandarin') {
      add(.16, .015, 0, .09, height * 1.015, width * 1.03, mark);
      add(-.22, 0, 0, .09, height * .95, width * 1.03, mark);
    }
    if (puffer || fish.id === 'whale-shark') {
      for (let i = 0; i < 6; i++) add((i % 3 - 1) * .17, height / 2 + .015, (Math.floor(i / 3) - .5) * width * .65, .06, .025, .06, mark);
    }
    if (fish.id === 'hammerhead') add(.48, .025, 0, .27, .22, 1.03, body);
    if (meg) {
      add(.65, -.14, 0, .48, .13, .57, '#183640');
      for (const side of [-1, 1]) {
        for (const row of [-1, 1]) for (let tooth = 0; tooth < 3; tooth++) add(.52 + tooth * .13, -.14 + row * .055, side * .285, .06, .07, .03, '#fff1da');
        for (let gill = 0; gill < 3; gill++) add(.02 - gill * .1, .02, side * .325, .035, .22, .02, fin);
      }
    }
    if (fish.id === 'lionfish' || fish.id === 'prism-lionfish') {
      for (const side of [-1, 1]) for (let i = 0; i < 4; i++) add(.24 - i * .18, .03 + i * .035, side * (.28 + i * .035), .065, .57 - i * .04, .11, i % 2 ? mark : fin);
      for (let i = 0; i < 3; i++) add(.2 - i * .2, 0, 0, .07, .51, .315, mark);
    }
    if (fish.id === 'sailfish') {
      add(.7, -.01, 0, .62, .05, .055, mark);
      for (let i = 0; i < 4; i++) add(.26 - i * .2, .32 - i * .025, 0, .21, .4 - i * .06, .045, i % 2 ? body : fin);
    }
    if (sunfish) { add(-.18, .66, 0, .22, .44, .085, fin); add(-.2, -.59, 0, .24, .35, .08, fin); }
    if (fish.id === 'ember-koi') for (const side of [-1, 1]) add(-.25, -.07, side * .28, .8, .07, .4, fin, true);
  }
  const eyeX = kraken ? .3 : leviathan ? 1.24 : whale ? .65 : seahorse ? .27 : jelly ? .29 : ray ? .4 : dragon ? .59 : fish.id === 'megalodon' ? .68 : shark ? .48 : long ? .39 : .31;
  const eyeY = kraken ? .35 : seahorse ? .58 : jelly ? .25 : .055;
  const eyeZ = kraken ? .275 : leviathan ? .245 : whale ? .285 : seahorse ? .125 : jelly ? .24 : fish.id === 'hammerhead' ? .5 : fish.id === 'megalodon' ? .29 : fish.id === 'sunfish' ? .1 : ray ? .17 : dragon ? .145 : fish.shape === 'puffer' ? .255 : shark ? .145 : .13;
  for (const side of [-1, 1]) {
    add(eyeX, eyeY, eyeZ * side, .07, .07, .035, '#182e3b');
    add(eyeX + .012, eyeY + .015, (eyeZ + .018) * side, .025, .025, .012, '#fff4de');
  }
  return blocks;
}
