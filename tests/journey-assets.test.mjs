import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { OrthographicCamera, Vector3 } from 'three';
import { LAST_STAGE } from '../src/garden/journey.ts';
import { sampleJourneyCamera } from '../src/garden/camera.ts';
import { sampleAtmosphere } from '../src/garden/atmosphere.ts';

const bytes = readFileSync(new URL('../public/models/journey-voxels.bin', import.meta.url));
const data = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));

test('authoring validates the complete chess position and reproduces the exported buffer', () => {
  const result = execFileSync('python3', ['-c', `
import sys, struct
from pathlib import Path
sys.path.insert(0, 'blender')
from journey_voxels import create_layouts
from validate_journey import validate_layouts
layouts = create_layouts()
validate_layouts(layouts)
values = [v for layout in layouts for voxel in layout for v in voxel]
assert struct.pack(f'<{len(values)}f', *values) == Path('public/models/journey-voxels.bin').read_bytes()
print('valid')
`], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  assert.equal(result.trim(), 'valid');
  const garden = readFileSync(new URL('../public/models/garden.glb', import.meta.url));
  assert.equal(createHash('sha256').update(garden).digest('hex'), '37de30e86c3c2a96f8d03965c92285d2b8e5925a3734af2adc49c9f89063b570');
});

test('every chess voxel fits the camera on desktop, phone and narrow short screens', () => {
  for (const [width, height] of [[934, 738], [1051, 738], [390, 354], [320, 136], [844, 320]]) {
    const aspect = width / height;
    const pose = sampleJourneyCamera(2 / LAST_STAGE, aspect, width <= 760);
    const camera = new OrthographicCamera(-pose.vertical*aspect/2, pose.vertical*aspect/2, pose.vertical/2, -pose.vertical/2, .1, 120);
    const target = new Vector3().fromArray(pose.target);
    camera.position.fromArray(pose.offset).add(target);
    camera.lookAt(target); camera.updateMatrixWorld();
    const point = new Vector3();
    for (let i = 2*3877*12; i < 3*3877*12; i += 12) {
      for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
        point.set(data[i]+x*data[i+3]/2, data[i+1]+y*data[i+4]/2, data[i+2]+z*data[i+5]/2).project(camera);
        assert.ok(Math.abs(point.x) < .96 && Math.abs(point.y) < .96, `Board clipped at ${width}×${height}`);
      }
    }
  }
});

test('camera holds, blends and reverses on the same timeline as the voxel morph', () => {
  for (let chapter = 0; chapter < LAST_STAGE; chapter++) {
    const start = sampleJourneyCamera(chapter / LAST_STAGE, 1.3);
    assert.deepEqual(sampleJourneyCamera((chapter+.6) / LAST_STAGE, 1.3), start);
    const progress = (chapter+5/6) / LAST_STAGE;
    const mid = sampleJourneyCamera(progress, 1.3);
    const end = sampleJourneyCamera((chapter+1) / LAST_STAGE, 1.3);
    for (let i=0; i<3; i++) assert.ok(Math.abs(mid.target[i]-(start.target[i]+end.target[i])/2) < 1e-10);
    assert.deepEqual(sampleJourneyCamera(progress, 1.3), mid);
    assert.deepEqual(sampleJourneyCamera(progress, 1.3, false, true), start);
  }
  const chess = sampleJourneyCamera(2/ LAST_STAGE, 1.3);
  assert.ok(chess.offset[1] / Math.hypot(chess.offset[0], chess.offset[2]) > 1, 'Rear ranks need a high three-quarter view');
});

function luminance(color) {
  const channels = color.startsWith('#') ? [1,3,5].map(i=>parseInt(color.slice(i,i+2),16)) : color.match(/[\d.]+/g).map(Number);
  return channels.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
}
const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
test('chapter text and accents stay readable throughout both atmosphere timelines', () => {
  for (const theme of ['light','dark']) {
    for (let i=0; i<=140; i++) {
      const palette = sampleAtmosphere(i/140, false, theme);
      for (const text of theme === 'dark' ? ['#f0ecdc','#b6c2b2','#d5a8ae',palette.accent] : ['#263e33','#586457','#95503e',palette.accent]) {
        assert.ok(contrast(text,palette.paper)>=4.5, `${theme} text at ${i/140}: ${contrast(text,palette.paper)}`);
      }
      if (theme==='dark') assert.ok(luminance(palette.paper) < .012, 'Night chapters must remain near black');
    }
  }
  for (const text of ['#f0ecdc','#b6c2b2','#d5a8ae','#c2d0ad']) {
    for (const surface of ['#17251e','#22362b','#263a2e']) assert.ok(contrast(text,surface)>=4.5);
  }
  assert.ok(contrast('#e8dfc8','#203127')>=4.5, 'Postcard notes remain readable at night');
});
