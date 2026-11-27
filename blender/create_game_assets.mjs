// Deterministic voxel prefabs, authored directly as glTF with the existing tools.
// Run npm run build:game-assets; no Blender installation is required.
import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, weld } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { BoxGeometry, Color, Euler, Matrix4, Quaternion, Vector3 } from 'three';

const document = new Document();
const buffer = document.createBuffer();
const scene = document.createScene('Hidden garden prefabs');
const material = document.createMaterial('Matte painted voxels').setRoughnessFactor(.92).setMetallicFactor(0);
let seed = 93;
function random() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
const pick = values => values[Math.floor(random() * values.length)];
const pinks = ['#edafc4', '#f3bfd0', '#f8ceda', '#dfa0b8', '#ffe1e6'];
const greens = ['#8da573', '#9fb985', '#adc292', '#799768'];
const bark = ['#806148', '#957457', '#a88768'];

function prefab(name, build) {
  const positions = [], normals = [], colors = [], indices = [];
  function box(x, y, z, w, h, d, color, rz = 0, ry = 0) {
    const geometry = new BoxGeometry(w, h, d);
    geometry.applyMatrix4(new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(0, ry, rz)), new Vector3(1, 1, 1)));
    const offset = positions.length / 3;
    positions.push(...geometry.attributes.position.array);
    normals.push(...geometry.attributes.normal.array);
    const rgb = new Color(color);
    for (let i = 0; i < geometry.attributes.position.count; i++) colors.push(rgb.r, rgb.g, rgb.b);
    indices.push(...Array.from(geometry.index.array, index => index + offset));
    geometry.dispose();
  }
  build(box);
  const accessor = (name, type, array) => document.createAccessor(name).setType(type).setArray(array).setBuffer(buffer);
  const primitive = document.createPrimitive()
    .setAttribute('POSITION', accessor(`${name} positions`, 'VEC3', new Float32Array(positions)))
    .setAttribute('NORMAL', accessor(`${name} normals`, 'VEC3', new Float32Array(normals)))
    .setAttribute('COLOR_0', accessor(`${name} colours`, 'VEC3', new Float32Array(colors)))
    .setIndices(accessor(`${name} indices`, 'SCALAR', new Uint32Array(indices))).setMaterial(material);
  scene.addChild(document.createNode(name).setMesh(document.createMesh(name).addPrimitive(primitive)));
}

prefab('sprout', box => {
  box(-.17, .1, .04, .22, .18, .32, '#94694c');
  box(.17, .1, .04, .22, .18, .32, '#94694c');
  box(0, .42, 0, .48, .48, .38, '#8ea775');
  box(0, .74, 0, .58, .4, .46, '#fbebca');
  box(-.16, .77, .239, .067, .082, .025, '#374132');
  box(.16, .77, .239, .067, .082, .025, '#374132');
  box(-.225, .66, .239, .09, .047, .028, '#e9adad');
  box(.225, .66, .239, .09, .047, .028, '#e9adad');
  box(0, .65, .241, .055, .025, .027, '#957d61');
  box(-.32, .43, 0, .14, .29, .19, '#fbebca', -.14);
  box(.32, .43, 0, .14, .29, .19, '#fbebca', .14);
  box(0, 1.04, 0, .065, .26, .07, '#617d50', -.08);
  box(-.16, 1.13, 0, .34, .12, .19, '#9bb57b', -.35);
  box(.16, 1.19, 0, .34, .12, .19, '#799a60', .4);
  // The chase camera sees the travel pack and scarf as the sprout walks away.
  box(0, .555, 0, .51, .08, .405, '#c36548');
  box(-.19, .46, -.215, .10, .20, .045, '#d08256', -.16);
  box(.145, .50, -.205, .065, .14, .043, '#845638', -.24);
  box(.035, .39, -.21, .32, .23, .095, '#955d41');
  box(.035, .465, -.23, .33, .10, .10, '#cb9061');
  box(.035, .415, -.286, .065, .075, .025, '#f4d99a');
  box(-.215, 1.148, -.015, .18, .042, .201, '#b4ca82', -.35);
  box(.214, 1.212, -.015, .18, .042, .201, '#9eb977', .4);
  box(0, .49, .207, .1, .1, .04, '#ead39a');
});

prefab('mushroom', box => {
  box(0, .2, 0, .22, .4, .24, '#f6e6c9');
  box(0, .42, 0, .7, .16, .64, '#c4899d');
  box(0, .54, 0, .56, .13, .51, '#dfabb7');
  box(0, .63, 0, .34, .08, .3, '#edc0c8');
  box(-.17, .611, .08, .13, .023, .11, '#fff2d5');
  box(.16, .611, -.13, .10, .023, .11, '#fff2d5');
  box(.07, .676, .06, .09, .017, .08, '#fff2d5');
});

prefab('blossom', box => {
  // A stepped petal with an ivory lip stays legible as the pickup turns.
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5;
    const x = Math.sin(angle), z = Math.cos(angle);
    box(x * .16, .015, z * .16, .16, .095, .19, '#d47699', 0, angle);
    box(x * .226, .073, z * .226, .19, .095, .13, '#f5afc5', 0, angle);
    box(x * .25, .119, z * .25, .14, .036, .091, '#ffdfde', 0, angle);
  }
  box(0, .085, 0, .16, .12, .16, '#e5a450');
  box(0, .151, 0, .10, .035, .10, '#fff1b0');
  box(0, -.10, 0, .07, .23, .07, '#708755');
});

prefab('cherry', box => {
  for (let i = 0; i < 8; i++) box(Math.sin(i * .4) * .11, i * .29 + .15, 0, .34 - i * .018, .32, .33, pick(bark));
  box(-.5, 1.68, 0, 1.2, .2, .2, '#8e6d51', -.4);
  box(.46, 1.85, .12, .95, .18, .19, '#957457', .5);
  for (let x = -5; x <= 5; x++) for (let y = -2; y <= 3; y++) for (let z = -4; z <= 4; z++) {
    const length = x * x / 26 + y * y / 10 + z * z / 19;
    if (length < 1 && (length > .5 || random() < .06)) {
      box(x * .29, 2.25 + y * .25, z * .29, .31, .29, .31, pick(pinks));
    }
  }
});

prefab('shrub', box => {
  for (let i = 0; i < 18; i++) {
    const x = (random() - .5) * .8, z = (random() - .5) * .8;
    box(x, .15 + random() * .32, z, .3, .3, .3, pick(greens));
  }
  box(.14, .65, .03, .16, .08, .16, '#f4c3d0');
});

prefab('lantern', box => {
  box(0, .1, 0, .5, .2, .5, '#a18a65');
  box(0, .64, 0, .11, 1.05, .11, '#987554');
  box(0, 1.05, 0, .45, .08, .42, '#7d694f');
  box(0, 1.27, 0, .32, .36, .32, '#f4daa0');
  box(0, 1.48, 0, .49, .1, .46, '#8da170');
  box(0, 1.56, 0, .32, .08, .3, '#9eb482');
});

prefab('treehouse', box => {
  box(0, .20, 0, 3.8, .4, 3, '#ad8963');
  for (let x = -1.8; x <= 1.8; x += .3) box(x, .43, 0, .27, .1, 3.1, '#c7a982');
  for (const x of [-1.35, 1.35]) for (const z of [-.9, .9]) box(x, 1.45, z, .22, 2.1, .22, '#987253');
  for (let y = .65; y < 2.4; y += .23) {
    box(0, y, -.94, 2.9, .21, .17, y % .46 < .23 ? '#cfb38c' : '#c4a67d');
    box(-1.44, y, 0, .18, .21, 1.9, '#c9ad83');
    box(1.44, y, 0, .18, .21, 1.9, '#c9ad83');
    box(-1.0, y, .96, .85, .21, .16, '#d2b893');
    box(1.0, y, .96, .85, .21, .16, '#d2b893');
  }
  box(0, 2.38, .96, 2.9, .25, .18, '#aa835f');
  const roofBands = ['#627858', '#7f9869', '#8faa79', '#a0b78a', '#abbf93'];
  for (const [i, color] of roofBands.entries()) {
    box(0, 2.64 + i * .19, 0, 3.5 - i * .55, .21, 2.65, color);
  }
  // Gable crest repeats the blossom shape above the approach-side doorway.
  box(0, 2.85, 1.334, .42, .42, .06, '#8a684f', Math.PI / 4);
  box(0, 2.85, 1.375, .25, .105, .043, '#ffe2cc');
  box(0, 2.85, 1.375, .105, .25, .043, '#ffe2cc');
  box(0, 2.85, 1.402, .085, .085, .03, '#e6ac5e');
  for (const x of [-.96, .96]) {
    box(x, 1.5, 1.056, .56, .68, .09, '#8a674e');
    box(x, 1.5, 1.113, .44, .55, .045, '#ffdc91');
    box(x, 1.5, 1.147, .047, .55, .035, '#b08559');
    box(x, 1.47, 1.147, .44, .045, .035, '#b08559');
    box(x, 1.15, 1.095, .66, .09, .18, '#a7825b');
  }
  for (const x of [-.55, .55]) box(x, 1.36, 1.035, .105, 1.78, .15, '#9e7650');
  box(0, 2.21, 1.035, 1.20, .16, .16, '#b68a5c');
  box(0, 1.55, -.82, 1.02, 1.89, .12, '#c38c56');
  box(0, 1.77, -.736, .64, .72, .06, '#ffdb94');
  box(0, 1.77, -.696, .065, .72, .035, '#a97750');
  box(0, .58, 1.64, 1.05, .16, .45, '#d8bd97');
  box(0, .24, 1.99, 1.22, .26, .45, '#c9ab80');
});

await MeshoptEncoder.ready;
await document.transform(dedup(), weld(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'high' }));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
await io.write('public/models/hidden-garden.glb', document);
console.log('Exported seven voxel prefabs to public/models/hidden-garden.glb');
