import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OrthographicCamera, Scene, Vector3 } from 'three';
import { createMorph } from '../src/garden/createMorph.ts';
import { createChessInteraction } from '../src/garden/createChessInteraction.ts';
import { createChessLayout, initialPieces, squareAt, squarePosition, chessIsInteractive } from '../src/garden/chess.ts';
import { LAST_STAGE } from '../src/garden/journey.ts';
import { sampleJourneyCamera } from '../src/garden/camera.ts';

const manifest = JSON.parse(readFileSync(new URL('../public/models/journey-voxels.json', import.meta.url), 'utf8'));
const buffer = readFileSync(new URL('../public/models/journey-voxels.bin', import.meta.url));
const bytes = () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
const chessProgress = 2 / LAST_STAGE;

function setup(initialFen) {
  class Host extends EventTarget {
    dataset = {}; style = {}; captures = new Set();
    hasPointerCapture(id) { return this.captures.has(id); }
    setPointerCapture(id) { this.captures.add(id); }
    releasePointerCapture(id) { this.captures.delete(id); }
    getBoundingClientRect() { return { left: 0, top: 0, width: 960, height: 740 }; }
  }
  const host = new Host();
  const pose = sampleJourneyCamera(chessProgress, 960 / 740);
  const camera = new OrthographicCamera(-pose.vertical * 960 / 740 / 2, pose.vertical * 960 / 740 / 2, pose.vertical / 2, -pose.vertical / 2, .1, 120);
  const target = new Vector3().fromArray(pose.target);
  camera.position.fromArray(pose.offset).add(target); camera.lookAt(target); camera.updateMatrixWorld();
  const morph = createMorph(manifest, bytes());
  const baseline = morph.getLayout('projects');
  let snapshot;
  const interaction = createChessInteraction({ host, camera, scene: new Scene(), morph, squares: new Map(), invalidate() {}, onChange(value) { snapshot = value; }, initialFen });
  interaction.update(chessProgress, false);
  function point(square, height = .83) {
    const { x, z } = squarePosition(square);
    const p = new Vector3(x, height, z).project(camera);
    return [(p.x * .5 + .5) * 960, (-p.y * .5 + .5) * 740];
  }
  function pointer(type, at, pointerType = 'mouse') {
    const event = new Event(type);
    Object.assign(event, { clientX: at[0], clientY: at[1], pointerType, pointerId: 1, isPrimary: true, button: 0 });
    host.dispatchEvent(event);
  }
  return { host, morph, baseline, interaction, point, pointer, snapshot: () => snapshot, close: () => interaction.dispose() };
}

function move(game, from, to) {
  const selected = game.snapshot().pieces.find(piece => piece.id === game.snapshot().selected);
  if (selected?.square !== from) game.interaction.selectSquare(from);
  game.interaction.selectSquare(to);
  return game.snapshot();
}

test('the opening position has 64 safe squares, 32 pieces, and Ivory moves first', () => {
  const pieces = initialPieces();
  assert.equal(pieces.length, 32);
  for (const piece of pieces) assert.equal(squareAt(...Object.values(squarePosition(piece.square))), piece.square);
  for (const [x, z] of [[2.57, 0], [-2.57, 0], [0, 2.57], [0, -2.57]]) assert.equal(squareAt(x, z), null);
  const game = setup();
  assert.equal(game.snapshot().turn, 'ivory');
  assert.equal(game.snapshot().pieces.filter(piece => piece.square).length, 32);
  game.close();
});

test('only legal moves by the side to move are accepted, and check cannot be ignored', () => {
  const game = setup();
  game.interaction.selectSquare('e7');
  assert.equal(game.snapshot().selected, null);
  assert.match(game.snapshot().message, /Ivory's turn/);
  game.interaction.selectSquare('e2');
  assert.ok(game.snapshot().legalSquares.includes('e3'));
  assert.ok(game.snapshot().legalSquares.includes('e4'));
  assert.ok(!game.snapshot().legalSquares.includes('e5'));
  game.interaction.selectSquare('e5');
  assert.equal(game.snapshot().moves, 0);
  assert.equal(game.snapshot().selected, 'ivory-e2');
  assert.equal(game.snapshot().pieces.find(piece => piece.id === 'ivory-e2').square, 'e2');
  assert.match(game.snapshot().message, /not legal/);
  move(game, 'e2', 'e4');
  assert.equal(game.snapshot().turn, 'sage');
  assert.equal(game.snapshot().pieces.find(piece => piece.id === 'ivory-e2').square, 'e4');
  game.close();

  const pinned = setup('4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1');
  pinned.interaction.selectSquare('e2');
  assert.ok(!pinned.snapshot().legalSquares.includes('d2'));
  pinned.interaction.selectSquare('d2');
  assert.equal(pinned.snapshot().moves, 0);
  assert.equal(pinned.snapshot().pieces.find(piece => piece.square === 'e2').kind, 'rook');
  assert.match(pinned.snapshot().message, /not legal/);
  pinned.close();
});

test('legal piece movement updates its voxels, leaves the board fixed, and reverses with scroll', () => {
  const game = setup();
  move(game, 'e2', 'e4');
  const authoring = createChessLayout(game.baseline);
  const moved = authoring.build(game.snapshot().pieces, null);
  const index = initialPieces().findIndex(piece => piece.id === 'ivory-e2');
  for (let i = 0; i < manifest.count; i++) {
    const offset = i * 12;
    if (authoring.owner[i] === index) {
      assert.ok(Math.abs(moved[offset + 2] - game.baseline[offset + 2] + 1.28) < 1e-6);
      assert.equal(moved[offset], game.baseline[offset]);
    } else assert.deepEqual(moved.slice(offset, offset + 12), game.baseline.slice(offset, offset + 12));
  }
  const otherLayouts = manifest.layouts.filter(id => id !== 'projects').map(id => [id, game.morph.getLayout(id)]);
  game.morph.setLayout('projects', moved);
  game.morph.update(1.9 / LAST_STAGE, false);
  const transition = game.morph.mesh.instanceMatrix.array.slice();
  game.morph.update(2.9 / LAST_STAGE, false); game.morph.update(4 / LAST_STAGE, false); game.morph.update(1.9 / LAST_STAGE, false);
  assert.deepEqual(game.morph.mesh.instanceMatrix.array, transition);
  for (const [id, original] of otherLayouts) assert.deepEqual(game.morph.getLayout(id), original);
  game.interaction.reset();
  assert.deepEqual(game.morph.getLayout('projects'), game.baseline);
  game.close();
});

test('mouse drag accepts legal moves and returns illegal or cancelled moves to their squares', () => {
  const game = setup();
  game.pointer('pointerdown', game.point('e2', 1.2)); game.pointer('pointermove', game.point('e5')); game.pointer('pointerup', game.point('e5'));
  assert.equal(game.snapshot().moves, 0);
  assert.equal(game.snapshot().pieces.find(piece => piece.id === 'ivory-e2').square, 'e2');
  game.pointer('pointerdown', game.point('e7', 1.2)); game.pointer('pointermove', game.point('e5')); game.pointer('pointerup', game.point('e5'));
  assert.match(game.snapshot().message, /Ivory's turn/);
  assert.equal(game.snapshot().moves, 0);
  game.pointer('pointerdown', game.point('e2', 1.2)); game.pointer('pointermove', game.point('e4')); game.pointer('pointerup', game.point('e4'));
  assert.equal(game.snapshot().turn, 'sage');
  assert.equal(game.snapshot().pieces.find(piece => piece.id === 'ivory-e2').square, 'e4');
  game.pointer('pointerdown', game.point('e7', 1.2)); game.pointer('pointermove', game.point('e5')); game.pointer('pointercancel', game.point('e5'));
  assert.equal(game.snapshot().pieces.find(piece => piece.id === 'sage-e7').square, 'e7');
  assert.equal(game.snapshot().moves, 1);
  game.close();
});

test('touch taps select and move only to legal squares while swipes remain page scrolls', () => {
  const game = setup();
  game.pointer('pointerdown', game.point('e2', 1.2), 'touch'); game.pointer('pointerup', game.point('e2', 1.2), 'touch');
  assert.equal(game.snapshot().selected, 'ivory-e2');
  game.pointer('pointerdown', game.point('e4'), 'touch'); game.pointer('pointermove', game.point('e5'), 'touch'); game.pointer('pointerup', game.point('e5'), 'touch');
  assert.equal(game.snapshot().moves, 0);
  game.pointer('pointerdown', game.point('e4'), 'touch'); game.pointer('pointerup', game.point('e4'), 'touch');
  assert.equal(game.snapshot().moves, 1);
  assert.equal(game.snapshot().turn, 'sage');
  game.close();
});

test('castling moves the rook, undo restores rights, and either wing can castle', () => {
  const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
  const game = setup(fen);
  move(game, 'e1', 'g1');
  assert.equal(game.snapshot().pieces.find(piece => piece.id === 'ivory-e1').square, 'g1');
  assert.equal(game.snapshot().pieces.find(piece => piece.id === 'ivory-h1').square, 'f1');
  game.interaction.undo();
  assert.equal(game.snapshot().pieces.find(piece => piece.id === 'ivory-e1').square, 'e1');
  move(game, 'e1', 'c1');
  assert.equal(game.snapshot().pieces.find(piece => piece.id === 'ivory-a1').square, 'd1');
  move(game, 'e8', 'g8');
  assert.equal(game.snapshot().pieces.find(piece => piece.id === 'sage-h8').square, 'f8');
  game.close();
});

test('en passant captures the pawn beside the landing square and undo restores it', () => {
  const game = setup('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
  game.interaction.selectSquare('e5');
  assert.ok(game.snapshot().legalSquares.includes('d6'));
  game.interaction.selectSquare('d6');
  assert.equal(game.snapshot().pieces.find(piece => piece.square === 'd6').color, 'ivory');
  assert.equal(game.snapshot().pieces.filter(piece => piece.color === 'sage' && piece.kind === 'pawn' && piece.square).length, 0);
  game.interaction.undo();
  assert.equal(game.snapshot().pieces.find(piece => piece.square === 'd5').color, 'sage');
  assert.equal(game.snapshot().turn, 'ivory');
  game.close();
});

test('en passant is rejected when it would uncover check on the moving king', () => {
  const game = setup('7k/8/8/r4PpK/8/8/8/8 w - g6 0 1');
  game.interaction.selectSquare('f5');
  assert.ok(!game.snapshot().legalSquares.includes('g6'));
  game.interaction.selectSquare('g6');
  assert.equal(game.snapshot().moves, 0);
  assert.equal(game.snapshot().pieces.find(piece => piece.square === 'f5').kind, 'pawn');
  game.close();
});

test('promotion pauses the turn for a choice and changes both the piece and its voxel silhouette', () => {
  const fen = '7k/P7/8/8/8/8/8/7K w - - 0 1';
  const rendered = [];
  for (const kind of ['queen', 'rook', 'bishop', 'knight']) {
    const game = setup(fen);
    move(game, 'a7', 'a8');
    assert.equal(game.snapshot().pendingPromotion.to, 'a8');
    assert.equal(game.snapshot().moves, 0);
    assert.equal(game.snapshot().turn, 'ivory');
    assert.equal(game.snapshot().pieces.find(piece => piece.square === 'a7').kind, 'pawn');
    game.interaction.choosePromotion(kind);
    assert.equal(game.snapshot().pieces.find(piece => piece.square === 'a8').kind, kind);
    assert.equal(game.snapshot().turn, 'sage');
    const layout = createChessLayout(game.baseline);
    rendered.push(layout.build(game.snapshot().pieces, null));
    game.interaction.undo();
    assert.equal(game.snapshot().pieces.find(piece => piece.square === 'a7').kind, 'pawn');
    assert.equal(game.snapshot().turn, 'ivory');
    game.close();
  }
  assert.notDeepEqual(rendered[0], rendered[1]);
  assert.notDeepEqual(rendered[1], rendered[2]);
  assert.notDeepEqual(rendered[2], rendered[3]);

  const canceled = setup(fen);
  move(canceled, 'a7', 'a8');
  canceled.interaction.cancelPromotion();
  assert.equal(canceled.snapshot().pendingPromotion, null);
  assert.equal(canceled.snapshot().pieces.find(piece => piece.square === 'a7').kind, 'pawn');
  assert.equal(canceled.snapshot().turn, 'ivory');
  canceled.close();
});

test('checkmate, stalemate, repetition and the fifty-move rule end the game', () => {
  const mate = setup('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1');
  assert.equal(mate.snapshot().gameOver, true);
  assert.match(mate.snapshot().message, /Checkmate/);
  mate.close();
  const stale = setup('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  assert.equal(stale.snapshot().gameOver, true);
  assert.match(stale.snapshot().message, /stalemate/i);
  stale.close();

  const repetition = setup();
  for (let cycle = 0; cycle < 2; cycle++) {
    move(repetition, 'g1', 'f3'); move(repetition, 'g8', 'f6');
    move(repetition, 'f3', 'g1'); move(repetition, 'f6', 'g8');
  }
  assert.equal(repetition.snapshot().gameOver, true);
  assert.match(repetition.snapshot().message, /threefold/i);
  repetition.close();

  const fifty = setup('7k/8/8/8/8/8/8/R2BK3 w - - 99 50');
  move(fifty, 'a1', 'a2');
  assert.equal(fifty.snapshot().gameOver, true);
  assert.match(fifty.snapshot().message, /fifty-move/i);
  fifty.close();
});

test('scrolling away saves the game, disables hidden input and retains the last move', () => {
  const game = setup();
  move(game, 'e2', 'e4');
  const committed = game.morph.getLayout('projects');
  game.interaction.selectSquare('e7');
  game.interaction.update(2.8 / LAST_STAGE, false);
  assert.equal(game.snapshot().active, false);
  assert.equal(game.snapshot().selected, null);
  assert.deepEqual(game.morph.getLayout('projects'), committed);
  game.interaction.selectSquare('d4'); game.interaction.reset();
  assert.equal(game.snapshot().moves, 1);
  game.interaction.update(chessProgress, false);
  assert.equal(game.snapshot().pieces.find(piece => piece.id === 'ivory-e2').square, 'e4');
  assert.ok(chessIsInteractive(2.9 / LAST_STAGE, true));
  assert.equal(chessIsInteractive(3 / LAST_STAGE, true), false);
  game.close();
});
