import test from 'node:test';
import assert from 'node:assert/strict';
import { caseChance, cases, fishCatalog, getFish, rarities, rollFish, shopAt, shopWeight, tideAt, TIDE_LENGTH } from './catalog';
import { addFish, claimOffer, emptyCollection, offerClaimed, validCollection } from './collection';
import { fishVoxels } from './voxels';

test('every case contains every rarity, and the displayed chances total 100%', () => {
  assert.equal(rarities.reduce((sum, rarity) => sum + rarity.chance, 0), 100);
  assert.equal(new Set(fishCatalog.map(fish => fish.id)).size, fishCatalog.length);
  for (const habitat of cases) for (const rarity of rarities) {
    assert.ok(fishCatalog.some(fish => fish.habitat === habitat.id && fish.rarity === rarity.id));
  }
});
test('case rolls respect all seven probability boundaries and the selected habitat', () => {
  let lower = 0;
  for (const rarity of rarities) {
    for (const habitat of cases) {
      assert.equal(rollFish(habitat.id, () => (lower + rarity.chance / 2) / 100).rarity, rarity.id);
      assert.equal(rollFish(habitat.id, () => lower / 100).habitat, habitat.id);
    }
    lower += rarity.chance;
  }
  assert.equal(rollFish('abyss', () => 1).id, 'leviathan-prime');
  assert.equal(rollFish('reef', () => 0).id, 'clownfish');
});
test('every species can be caught in its case, including the new creatures and Ultra finishes', () => {
  let lower = 0;
  for (const rarity of rarities) {
    for (const habitat of cases) {
      const pool = fishCatalog.filter(fish => fish.rarity === rarity.id && fish.habitat === habitat.id);
      pool.forEach((fish, index) => {
        const samples = [(lower + rarity.chance / 2) / 100, (index + .5) / pool.length];
        assert.equal(rollFish(habitat.id, () => samples.shift()!).id, fish.id);
        assert.equal(caseChance(fish), rarity.chance / pool.length);
      });
    }
    lower += rarity.chance;
  }
  assert.equal(caseChance(getFish('leviathan-prime')!), .1);
});
test('expanding a rarity pool does not inflate its weight in the live shop', () => {
  for (const rarity of rarities) {
    const weight = fishCatalog.filter(fish => fish.rarity === rarity.id).reduce((sum, fish) => sum + shopWeight(fish), 0);
    assert.ok(Math.abs(weight - rarity.chance) < 1e-9);
  }
});
test('live stock is stable through a reload and changes on the next tide', () => {
  const now = 1_790_000_010_000;
  assert.deepEqual(shopAt(now), shopAt(tideAt(now) * TIDE_LENGTH + 1));
  assert.notDeepEqual(shopAt(now).map(offer => offer.id), shopAt(now + TIDE_LENGTH).map(offer => offer.id));
  for (const offer of shopAt(now)) assert.ok(fishCatalog.includes(offer.fish));
});
test('every tide has four different visitors, including after many rotations', () => {
  for (let tide = 1_000; tide < 1_200; tide++) {
    const stock = shopAt(tide * TIDE_LENGTH);
    assert.equal(stock.length, 4);
    assert.equal(new Set(stock.map(offer => offer.fish.id)).size, 4);
  }
});
test('a free shop offer can be collected once, including after saving and reloading', () => {
  const now = 1_790_000_010_000, offer = shopAt(now)[0];
  const next = claimOffer(emptyCollection(), offer, now)!;
  assert.equal(next.fish[offer.fish.id], 1);
  assert.equal(next.opened, 0);
  const restored = JSON.parse(JSON.stringify(next));
  assert.equal(validCollection(restored), true);
  assert.equal(offerClaimed(restored, offer), true);
  assert.equal(claimOffer(restored, offer, now), null);
  assert.equal(claimOffer(restored, offer, now + TIDE_LENGTH), null);
  const newOffer = shopAt(now + TIDE_LENGTH)[0];
  assert.ok(claimOffer(restored, newOffer, now + TIDE_LENGTH));
});
test('stale or altered shop offers cannot grant a fish', () => {
  const now = 1_790_000_010_000, offer = shopAt(now)[0];
  assert.equal(claimOffer(emptyCollection(), { ...offer, fish: fishCatalog.find(fish => fish.id !== offer.fish.id)! }, now), null);
  assert.equal(claimOffer(emptyCollection(), { ...offer, index: 9 }, now), null);
});
test('repeat catches increase quantity and case rewards survive leaving the reveal', () => {
  const fish = fishCatalog[0];
  const result = addFish(addFish(emptyCollection(), fish, 'case'), fish, 'case');
  assert.equal(result.fish[fish.id], 2);
  assert.equal(result.opened, 2);
  assert.equal(result.lastCatch, fish.id);
  assert.equal(validCollection(JSON.parse(JSON.stringify(result))), true);
});
test('original collections stay valid when a new mythical creature is added', () => {
  const originalIds = ['clownfish', 'sardine', 'lanternfish', 'blue-tang', 'puffer', 'inkfin', 'mandarin', 'ribbon-eel', 'star-puffer', 'sunset-ray', 'jade-shark', 'moon-ray', 'golden-koi', 'whale-shark', 'aurora-ray', 'coral-dragon', 'sun-serpent', 'abyss-dragon'];
  const fish = Object.fromEntries(originalIds.map((id, index) => [id, index + 1]));
  const saved = { ...emptyCollection(), fish, opened: 18, lastCatch: 'abyss-dragon' };
  assert.equal(validCollection(saved), true);
  const expanded = addFish(saved, getFish('leviathan-prime')!, 'case');
  assert.deepEqual(expanded.fish, { ...fish, 'leviathan-prime': 1 });
  assert.equal(validCollection(JSON.parse(JSON.stringify(expanded))), true);
});
test('invalid saves are rejected without trusting unknown species or counts', () => {
  assert.equal(validCollection(emptyCollection()), true);
  for (const fish of [{ fake: 1 }, { clownfish: -1 }, { clownfish: 1.5 }, { clownfish: Infinity }]) {
    assert.equal(validCollection({ ...emptyCollection(), fish }), false);
  }
  assert.equal(validCollection({ ...emptyCollection(), claimed: [0, 0] }), false);
  assert.equal(validCollection({ ...emptyCollection(), claimed: [5] }), false);
  assert.equal(validCollection({ ...emptyCollection(), lastCatch: 'missing' }), false);
});
test('each fish has finite, bounded geometry for the SVG and 3D views', () => {
  for (const fish of fishCatalog) {
    const voxels = fishVoxels(fish);
    assert.ok(voxels.length >= 10 && voxels.length < 50);
    for (const voxel of voxels) {
      assert.ok([voxel.x, voxel.y, voxel.z, voxel.w, voxel.h, voxel.d].every(Number.isFinite));
      assert.ok(voxel.w > 0 && voxel.h > 0 && voxel.d > 0);
    }
  }
});
test('the Ultra aura preserves body colours and the sea monsters have distinct silhouettes', () => {
  for (const fish of fishCatalog.filter(fish => fish.rarity === 'ultra')) {
    assert.equal(fish.finish, 'rainbow-glow');
    assert.deepEqual(fishVoxels(fish), fishVoxels({ ...fish, finish: undefined }));
    const colors = new Set(fishVoxels(fish).map(part => part.color));
    for (const color of colors) assert.ok([...fish.colors, '#182e3b', '#fff4de'].includes(color), `${fish.name} should keep its own palette`);
  }
  const monsters = ['megalodon', 'kraken', 'abyssal-leviathan'].map(id => fishVoxels(getFish(id)!).map(({ color: _color, ...geometry }) => geometry));
  assert.notDeepEqual(monsters[0], monsters[1]);
  assert.notDeepEqual(monsters[1], monsters[2]);
});
