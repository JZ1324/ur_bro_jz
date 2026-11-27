export const rarities = [
  { id: 'common', name: 'Common', chance: 47.9, color: '#aec4c9' },
  { id: 'uncommon', name: 'Uncommon', chance: 28, color: '#88d5ad' },
  { id: 'rare', name: 'Rare', chance: 15, color: '#80bbff' },
  { id: 'epic', name: 'Epic', chance: 6.5, color: '#c1a0ff' },
  { id: 'legendary', name: 'Legendary', chance: 2, color: '#f3ce80' },
  { id: 'mythic', name: 'Mythic', chance: .5, color: '#ff9ec4' },
  { id: 'ultra', name: 'Ultra', chance: .1, color: '#cef4ff' },
] as const;
export type Rarity = typeof rarities[number]['id'];
export type Habitat = 'reef' | 'kelp' | 'abyss';
export type FishShape = 'fish' | 'long' | 'puffer' | 'ray' | 'shark' | 'dragon' | 'whale' | 'seahorse' | 'leviathan' | 'kraken' | 'jellyfish';
export type Fish = { id: string; name: string; rarity: Rarity; habitat: Habitat; shape: FishShape; colors: [string, string, string]; size: number; note: string; finish?: 'rainbow-glow' };

export const cases: { id: Habitat; name: string; subtitle: string; color: string }[] = [
  { id: 'reef', name: 'Coral case', subtitle: 'Little wonders of the shallows', color: '#f4ad8b' },
  { id: 'kelp', name: 'Kelp case', subtitle: 'Treasures between the fronds', color: '#8bd6b6' },
  { id: 'abyss', name: 'Abyss case', subtitle: 'Something glows in the deep', color: '#aaa9f2' },
];

export const fishCatalog: Fish[] = [
  { id: 'clownfish', name: 'Little clownfish', rarity: 'common', habitat: 'reef', shape: 'fish', colors: ['#f59b52', '#fff0d1', '#e76b45'], size: .7, note: 'A small splash of sunshine. Never far from the coral.' },
  { id: 'sardine', name: 'Silver sardine', rarity: 'common', habitat: 'kelp', shape: 'long', colors: ['#a5d3db', '#e0f3ef', '#608eac'], size: .65, note: 'Finds a little friend in every current.' },
  { id: 'lanternfish', name: 'Lantern fish', rarity: 'common', habitat: 'abyss', shape: 'fish', colors: ['#718bab', '#b4ebd9', '#405777'], size: .65, note: 'Carries a tiny light into the quiet blue.' },
  { id: 'blue-tang', name: 'Blue daydream', rarity: 'uncommon', habitat: 'reef', shape: 'fish', colors: ['#568ae8', '#f5d276', '#2d589e'], size: .85, note: 'A blue daydream with a butter-yellow tail.' },
  { id: 'puffer', name: 'Mossy puffer', rarity: 'uncommon', habitat: 'kelp', shape: 'puffer', colors: ['#9abd88', '#e4e5b9', '#547a67'], size: .8, note: 'Round, unhurried, and entirely pleased to be here.' },
  { id: 'inkfin', name: 'Violet inkfin', rarity: 'uncommon', habitat: 'abyss', shape: 'long', colors: ['#9485bb', '#c5b4e5', '#595681'], size: .85, note: 'Paints violet ribbons through the darker water.' },
  { id: 'mandarin', name: 'Mandarin muse', rarity: 'rare', habitat: 'reef', shape: 'fish', colors: ['#65cbb9', '#f5a25d', '#397abe'], size: .85, note: 'All the colours of a reef, in one little wanderer.' },
  { id: 'ribbon-eel', name: 'Ribbon eel', rarity: 'rare', habitat: 'kelp', shape: 'dragon', colors: ['#6ab3cc', '#edda83', '#357591'], size: .9, note: 'A ribbon that learned to follow the tide.' },
  { id: 'star-puffer', name: 'Starlight puffer', rarity: 'rare', habitat: 'abyss', shape: 'puffer', colors: ['#87b0d6', '#d5f5e8', '#577da6'], size: .9, note: 'Its little freckles look like a map of the stars.' },
  { id: 'sunset-ray', name: 'Sunset ray', rarity: 'epic', habitat: 'reef', shape: 'ray', colors: ['#dc91a4', '#ffc6a1', '#b06997'], size: 1.15, note: 'Keeps the last colours of the evening under its wings.' },
  { id: 'jade-shark', name: 'Jade reef shark', rarity: 'epic', habitat: 'kelp', shape: 'shark', colors: ['#6db3a5', '#d5e5c7', '#3a807b'], size: 1.3, note: 'A gentle shadow slipping through a forest of green.' },
  { id: 'moon-ray', name: 'Moonveil ray', rarity: 'epic', habitat: 'abyss', shape: 'ray', colors: ['#a79ce1', '#ebe2ff', '#756cba'], size: 1.15, note: 'Moves as softly as moonlight over sleeping water.' },
  { id: 'golden-koi', name: 'Sovereign koi', rarity: 'legendary', habitat: 'reef', shape: 'long', colors: ['#f4c56b', '#fff1c4', '#ca8c45'], size: 1.15, note: 'A golden visitor. The reef seems a little warmer when it passes.' },
  { id: 'whale-shark', name: 'Pearl whale shark', rarity: 'legendary', habitat: 'kelp', shape: 'shark', colors: ['#8fb3c5', '#fff3d4', '#4e778e'], size: 1.6, note: 'An entire constellation, wearing the shape of a fish.' },
  { id: 'aurora-ray', name: 'Aurora manta', rarity: 'legendary', habitat: 'abyss', shape: 'ray', colors: ['#79d7c5', '#e9b5ea', '#528cab'], size: 1.45, note: 'A rare little aurora, below the waves.' },
  { id: 'coral-dragon', name: 'Bloomtide dragon', rarity: 'mythic', habitat: 'reef', shape: 'dragon', colors: ['#ed9bb8', '#ffe4ad', '#b975bc'], size: 1.5, note: 'They say the garden blooms twice when this one arrives.' },
  { id: 'sun-serpent', name: 'Solstice serpent', rarity: 'mythic', habitat: 'kelp', shape: 'dragon', colors: ['#edcb80', '#f7edc6', '#84c8b3'], size: 1.65, note: 'A strand of summer, caught in a never-ending tide.' },
  { id: 'abyss-dragon', name: 'Celestial leviathan', rarity: 'mythic', habitat: 'abyss', shape: 'dragon', colors: ['#b3a1ef', '#9deee0', '#edacd3'], size: 1.7, note: 'A story from the deepest blue. Somehow, it found you.' },
  { id: 'jellyfish', name: 'Blue jellyfish', rarity: 'uncommon', habitat: 'abyss', shape: 'jellyfish', colors: ['#90c7f4', '#d7fcff', '#b09cdb'], size: .9, note: 'A glowing bell trailing six ribbons through the dark.' },
  { id: 'lionfish', name: 'Coral lionfish', rarity: 'rare', habitat: 'reef', shape: 'fish', colors: ['#e98362', '#fff0cc', '#a44c62'], size: 1.05, note: 'Striped fins spread into a crown of coral spines.' },
  { id: 'hammerhead', name: 'Hammerhead', rarity: 'rare', habitat: 'kelp', shape: 'shark', colors: ['#7fa5b8', '#d2edf0', '#44667e'], size: 1.4, note: 'That unmistakable wide head, cutting a path through the kelp.' },
  { id: 'electric-eel', name: 'Volt eel', rarity: 'rare', habitat: 'abyss', shape: 'dragon', colors: ['#4978c5', '#e8ef7e', '#b1eeff'], size: 1.1, note: 'Electric-yellow bands flash along a blue ribbon of a body.' },
  { id: 'sunfish', name: 'Ocean sunfish', rarity: 'epic', habitat: 'reef', shape: 'puffer', colors: ['#99b4c6', '#e1e9da', '#647f9d'], size: 1.35, note: 'A huge, flat silver face with fins like sails.' },
  { id: 'sailfish', name: 'Azure sailfish', rarity: 'epic', habitat: 'kelp', shape: 'long', colors: ['#4ca6c7', '#bde8e5', '#2f5bb3'], size: 1.45, note: 'A long silver bill and a blue sail that catches every current.' },
  { id: 'orca', name: 'Orca', rarity: 'epic', habitat: 'abyss', shape: 'whale', colors: ['#24394b', '#f1f2e4', '#526679'], size: 1.7, note: 'Black and white, with a tall fin and a powerful crescent tail.' },
  { id: 'megalodon', name: 'Megalodon', rarity: 'epic', habitat: 'abyss', shape: 'shark', colors: ['#527b89', '#cfdfd8', '#284f63'], size: 2.05, note: 'An ancient giant with a broad jaw, rows of teeth, and no intention of staying small.' },
  { id: 'golden-seahorse', name: 'Golden seahorse', rarity: 'legendary', habitat: 'reef', shape: 'seahorse', colors: ['#edb75d', '#fff0ad', '#b77952'], size: 1.2, note: 'A curled golden tail and a crown of tiny spines.' },
  { id: 'prism-lionfish', name: 'Prismatic lionfish', rarity: 'legendary', habitat: 'kelp', shape: 'fish', colors: ['#a48fe5', '#95edd6', '#eeadc9'], size: 1.2, note: 'Amethyst stripes and sea-glass fins, spread like a fan.' },
  { id: 'astral-whale', name: 'Astral whale', rarity: 'legendary', habitat: 'abyss', shape: 'whale', colors: ['#777dbb', '#e3d6ff', '#addcf1'], size: 1.95, note: 'A cosmic whale with constellations scattered across its back.' },
  { id: 'ember-koi', name: 'Ember koi', rarity: 'mythic', habitat: 'reef', shape: 'long', colors: ['#ed8656', '#ffe4a2', '#d84b71'], size: 1.5, note: 'Its long fins carry the colours of a fire that never reaches the water.' },
  { id: 'glacier-leviathan', name: 'Glacier leviathan', rarity: 'mythic', habitat: 'kelp', shape: 'leviathan', colors: ['#79b9d9', '#e1fbff', '#aa92dd'], size: 1.85, note: 'An armoured ice serpent with crystal horns and a ridgeline of frozen fins.' },
  { id: 'kraken', name: 'Kraken', rarity: 'mythic', habitat: 'abyss', shape: 'kraken', colors: ['#9965b6', '#efaccd', '#563d8a'], size: 1.85, note: 'Eight curling arms, a crown of spines, and a gaze from the deepest water.' },
  { id: 'abyssal-leviathan', name: 'Abyssal leviathan', rarity: 'mythic', habitat: 'abyss', shape: 'leviathan', colors: ['#487a94', '#9beadf', '#b07ee1'], size: 2.05, note: 'A colossal sea serpent with twin horns, luminous armour, and a forked tail.' },
  { id: 'prism-titan', name: 'Prism titan', rarity: 'ultra', habitat: 'reef', shape: 'whale', colors: ['#7caec0', '#dcebe9', '#557b9b'], size: 2.15, finish: 'rainbow-glow', note: 'A crystal-finned whale surrounded by a soft rainbow glow.' },
  { id: 'nebula-kraken', name: 'Nebula kraken', rarity: 'ultra', habitat: 'kelp', shape: 'kraken', colors: ['#6e679b', '#c2b8df', '#4c416f'], size: 2.05, finish: 'rainbow-glow', note: 'Eight arms and a star-bright crown, with a rainbow aura spilling into the water.' },
  { id: 'leviathan-prime', name: 'Leviathan Prime', rarity: 'ultra', habitat: 'abyss', shape: 'leviathan', colors: ['#587f96', '#c1dee5', '#365770'], size: 2.2, finish: 'rainbow-glow', note: 'The apex of the deep. Crystal armour, sweeping horns, and a rainbow glow along its silhouette.' },
];

const fishById = new Map(fishCatalog.map(fish => [fish.id, fish]));
export const getFish = (id: string) => fishById.get(id);
export const rarityInfo = (rarity: Rarity) => rarities.find(item => item.id === rarity)!;
export const rarityRank = (rarity: Rarity) => rarities.findIndex(item => item.id === rarity);
const rarityCounts = new Map(rarities.map(rarity => [rarity.id, fishCatalog.filter(fish => fish.rarity === rarity.id).length]));
export const shopWeight = (fish: Fish) => rarityInfo(fish.rarity).chance / rarityCounts.get(fish.rarity)!;
export const caseChance = (fish: Fish) => rarityInfo(fish.rarity).chance / fishCatalog.filter(item => item.habitat === fish.habitat && item.rarity === fish.rarity).length;
const sample = (rng: () => number) => Math.min(1 - Number.EPSILON, Math.max(0, rng()));
export function random() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] / 4294967296;
}
export function rollFish(habitat?: Habitat, rng: () => number = random): Fish {
  const roll = sample(rng) * 100;
  let boundary = 0;
  const rarity = rarities.find(item => { boundary += item.chance; return roll < boundary; }) ?? rarities[0];
  const pool = fishCatalog.filter(fish => fish.rarity === rarity.id && (!habitat || fish.habitat === habitat));
  return pool[Math.floor(sample(rng) * pool.length)];
}

export const TIDE_LENGTH = 90_000;
export const tideAt = (now: number) => Math.floor(now / TIDE_LENGTH);
export function seededRandom(seed: number) {
  let value = seed | 0;
  return () => {
    value += 0x6d2b79f5;
    let next = Math.imul(value ^ value >>> 15, 1 | value);
    next ^= next + Math.imul(next ^ next >>> 7, 61 | next);
    return ((next ^ next >>> 14) >>> 0) / 4294967296;
  };
}
export type ShopOffer = { id: string; fish: Fish; tide: number; index: number };
export function shopAt(now: number): ShopOffer[] {
  const tide = tideAt(now), rng = seededRandom(tide ^ 0x4f434541);
  const remaining = [...fishCatalog];
  return Array.from({ length: 4 }, (_, index) => {
    // Weighted sampling without replacement gives the shop four different visitors.
    const total = remaining.reduce((sum, fish) => sum + shopWeight(fish), 0);
    const roll = sample(rng) * total;
    let boundary = 0;
    const selected = remaining.findIndex(fish => { boundary += shopWeight(fish); return roll < boundary; });
    const [fish] = remaining.splice(selected < 0 ? remaining.length - 1 : selected, 1);
    return { id: `${tide}:${index}`, fish, tide, index };
  });
}
