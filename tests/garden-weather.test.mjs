import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { createGardenWeather } from '../src/garden/createGardenWeather.ts';
import { isPondPoint, WATER_LEVEL } from '../src/garden/koi.ts';

const rotation = new Quaternion();
const snapshot = weather => weather.group.children.map(mesh => [...mesh.instanceMatrix.array]);
function dispose(weather) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  for (const group of [weather.group, weather.pond]) group.traverse(mesh => {
    if (!mesh.isInstancedMesh) return;
    mesh.dispose(); geometries.add(mesh.geometry); materials.add(mesh.material);
    if (mesh.material.map) textures.add(mesh.material.map);
  });
  for (const resource of [...geometries, ...materials, ...textures]) resource.dispose();
}

test('all three moods transition to a finite, bounded scene and mobile reduces particle work', () => {
  const desktop = createGardenWeather(false), mobile = createGardenWeather(true);
  try {
    for (const name of ['Blossom_petals', 'Passing_rain', 'Fireflies', 'Wish_lights']) {
      assert.ok(mobile.group.getObjectByName(name).count < desktop.group.getObjectByName(name).count);
    }
    for (const [mood, name] of [['rain', 'Passing_rain'], ['fireflies', 'Fireflies'], ['breeze', 'Blossom_petals']]) {
      desktop.setMood(mood);
      for (let i = 0; i < 180; i++) desktop.update(1 / 60, false, 1, 1, rotation, 0);
      const visible = desktop.group.children.filter(mesh => mesh.visible);
      assert.deepEqual(visible.map(mesh => mesh.name), [name]);
      for (const matrix of snapshot(desktop)) assert.ok(matrix.every(Number.isFinite));
    }
  } finally { dispose(desktop); dispose(mobile); }
});

test('reduced motion freezes particles, switches moods immediately, and omits the wish animation', () => {
  const weather = createGardenWeather(false);
  try {
    for (const mood of ['breeze', 'rain', 'fireflies']) {
      weather.setMood(mood);
      weather.update(1 / 60, true, 1, 1, rotation, 1);
      const before = snapshot(weather);
      weather.makeWish();
      for (let i = 0; i < 60; i++) weather.update(1 / 60, true, 1, 1, rotation, 1);
      assert.deepEqual(snapshot(weather), before);
      assert.equal(weather.group.getObjectByName('Wish_lights').visible, false);
    }
  } finally { dispose(weather); }
});

test('rain rings land on the water and stay inside the stepped shoreline', () => {
  const weather = createGardenWeather(false);
  try {
    weather.setMood('rain');
    const rings = weather.pond.getObjectByName('Rain_ripples');
    const vertices = rings.geometry.getAttribute('position');
    const matrix = new Matrix4(), point = new Vector3();
    for (let step = 0; step < 150; step++) {
      weather.update(1 / 60, false, 1, 1, rotation, 0);
      for (let i = 0; i < rings.count; i++) {
        rings.getMatrixAt(i, matrix);
        for (let vertex = 0; vertex < vertices.count; vertex++) {
          point.fromBufferAttribute(vertices, vertex).applyMatrix4(matrix);
          assert.ok(isPondPoint(point.x, point.z));
          assert.ok(Math.abs(point.y - (WATER_LEVEL + .008)) < .001);
        }
      }
    }
  } finally { dispose(weather); }
});

test('a wish rises, expires, and cannot leak into later chapters', () => {
  const weather = createGardenWeather(false);
  try {
    const wish = weather.group.getObjectByName('Wish_lights');
    weather.makeWish(); weather.update(1 / 60, false, 1, 1, rotation, 1);
    assert.equal(wish.visible, true);
    const before = [...wish.instanceMatrix.array];
    for (let i = 0; i < 90; i++) weather.update(1 / 60, false, 1, 1, rotation, 1);
    assert.notDeepEqual([...wish.instanceMatrix.array], before);
    for (let i = 0; i < 230; i++) weather.update(1 / 60, false, 1, 1, rotation, 1);
    assert.equal(wish.visible, false);
    weather.makeWish(); weather.update(1 / 60, false, 0, 0, rotation, 1);
    assert.equal(weather.group.visible, false);
    assert.equal(weather.pond.visible, false);
    weather.update(1 / 60, false, 1, 1, rotation, 1);
    assert.equal(wish.visible, false);
  } finally { dispose(weather); }
});
