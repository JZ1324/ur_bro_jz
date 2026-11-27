import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createLandmarkInteraction } from '../src/garden/createLandmarkInteraction.ts';

class Surface extends EventTarget {
  dataset = {};
  style = {};
  focusVisible = false;
  clicks = 0;
  getBoundingClientRect() { return { left: 0, top: 0, width: 400, height: 300 }; }
  contains(target) { return target === this; }
  matches() { return this.focusVisible; }
  click() { this.clicks++; }
}

function send(surface, type, overrides = {}) {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, {
    clientX: 125, clientY: 150, pointerId: 1, pointerType: 'mouse',
    isPrimary: true, button: 0, detail: 1, ...overrides,
  });
  surface.dispatchEvent(event);
  return event;
}

function fixture(t) {
  const original = Object.fromEntries(['Element', 'document', 'window'].map(key => [key, globalThis[key]]));
  globalThis.Element = Surface;
  globalThis.document = new EventTarget();
  globalThis.window = new EventTarget();
  const canvas = new Surface();
  const pins = new Map([['about', new Surface()], ['projects', new Surface()]]);
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1);
  const material = new THREE.MeshBasicMaterial();
  const meshes = [-1.5, 1.5].map(x => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = x;
    mesh.updateMatrixWorld(true);
    return mesh;
  });
  const targets = new Map([[meshes[0], 'about'], [meshes[1], 'projects']]);
  const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, .1, 100);
  camera.position.z = 10;
  camera.updateMatrixWorld(true);
  let interactive = true;
  const highlighted = [];
  const interaction = createLandmarkInteraction({
    canvas, camera, pins, meshes, targets,
    isActive: () => interactive,
    onHighlight: id => highlighted.push(id),
  });
  t.after(() => {
    interaction.dispose();
    geometry.dispose(); material.dispose();
    Object.entries(original).forEach(([key, value]) => {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    });
  });
  return { canvas, pins, meshes, geometry, material, highlighted, interaction, disable: () => { interactive = false; } };
}

test('pointing at actual object surfaces reveals one label and blank garden clears it', t => {
  const { canvas, pins, highlighted } = fixture(t);
  send(canvas, 'pointermove');
  assert.equal(pins.get('about').dataset.active, 'true');
  assert.equal(pins.get('projects').dataset.active, 'false');
  send(canvas, 'pointermove', { clientX: 275 });
  assert.equal(pins.get('about').dataset.active, 'false');
  assert.equal(pins.get('projects').dataset.active, 'true');
  send(canvas, 'pointermove', { clientY: 275 });
  assert.deepEqual(highlighted, ['about', 'projects', null]);
});

test('foreground scenery prevents pointing through it at a linked object', t => {
  const { canvas, meshes, geometry, material, highlighted } = fixture(t);
  const obstacle = new THREE.Mesh(geometry, material);
  obstacle.position.set(-1.5, 0, 2);
  obstacle.updateMatrixWorld(true);
  meshes.push(obstacle);
  send(canvas, 'pointermove');
  assert.deepEqual(highlighted, []);
});

test('mouse clicks follow the object link, while touch reveals before navigating', t => {
  const { canvas, pins } = fixture(t);
  const about = pins.get('about');
  send(canvas, 'pointerdown'); send(canvas, 'pointerup');
  assert.equal(about.clicks, 1);
  const touch = { pointerType: 'touch', clientX: 275 };
  send(canvas, 'pointerdown', touch); send(canvas, 'pointerup', touch);
  assert.equal(pins.get('projects').dataset.active, 'true');
  assert.equal(pins.get('projects').clicks, 0);
  send(canvas, 'pointerdown', touch); send(canvas, 'pointerup', touch);
  assert.equal(pins.get('projects').clicks, 1);
});

test('scroll gestures, cancelled pointers and a second finger never follow a link', t => {
  const { canvas, pins } = fixture(t);
  const touch = { pointerType: 'touch' };
  send(canvas, 'pointerdown', touch);
  send(canvas, 'pointermove', { ...touch, clientY: 180 });
  send(canvas, 'pointerup', touch);
  send(canvas, 'pointerdown', touch); send(canvas, 'pointercancel', touch); send(canvas, 'pointerup', touch);
  send(canvas, 'pointerdown', touch);
  send(canvas, 'pointerdown', { ...touch, pointerId: 2, isPrimary: false });
  send(canvas, 'pointerup', touch);
  assert.equal(pins.get('about').clicks, 0);
  assert.equal(pins.get('about').dataset.active, 'false');
});

test('the accessible touch target also uses a first tap to reveal and keeps keyboard activation', t => {
  const { pins } = fixture(t);
  const pin = pins.get('about');
  send(pin, 'pointerdown', { pointerType: 'touch' });
  assert.equal(send(pin, 'click').defaultPrevented, true);
  assert.equal(pin.dataset.active, 'true');
  send(pin, 'pointerdown', { pointerType: 'touch' });
  assert.equal(send(pin, 'click').defaultPrevented, false);
  assert.equal(send(pin, 'click', { detail: 0 }).defaultPrevented, false);
});

test('keyboard focus reveals a label, Escape dismisses it and scrolling clears it', t => {
  const { pins } = fixture(t);
  const pin = pins.get('about');
  pin.focusVisible = true;
  send(pin, 'focus');
  assert.equal(pin.dataset.active, 'true');
  send(pin, 'keydown', { key: 'Escape' });
  assert.equal(pin.dataset.active, 'false');
  send(pin, 'focus');
  window.dispatchEvent(new Event('scroll'));
  assert.equal(pin.dataset.active, 'false');
});

test('suspending or disposing the scene clears labels and prevents further navigation', t => {
  const { canvas, pins, disable, interaction } = fixture(t);
  send(canvas, 'pointermove');
  disable(); interaction.clear();
  send(canvas, 'pointerdown'); send(canvas, 'pointerup');
  assert.equal(pins.get('about').dataset.active, 'false');
  assert.equal(pins.get('about').clicks, 0);
  interaction.dispose();
  send(pins.get('projects'), 'pointerenter');
  assert.equal(pins.get('projects').dataset.active, 'false');
});
