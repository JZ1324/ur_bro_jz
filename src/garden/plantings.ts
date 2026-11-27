import { readSaved, save } from './storage.ts';
import { copyFlowerDesign, defaultFlowerDesign, isFlowerDesign, type FlowerDesign } from './flowerDesign.ts';

// The small journey island displays a recent patch; the shared garden has no cap.
export const MAX_PLANTS = 24;
export const NOTE_LIMIT = 160;
export const NAME_LIMIT = 32;
export type PlantKind = 'custom-flower' | 'daisy' | 'tulip' | 'sunflower' | 'rose' | 'lavender' | 'bluebell'
  | 'lotus' | 'orchid' | 'hydrangea' | 'poppy' | 'iris' | 'lily' | 'peony' | 'hibiscus' | 'daffodil' | 'cosmos'
  | 'fern' | 'cactus' | 'sprout' | 'monstera' | 'succulent' | 'mushroom'
  | 'bonsai' | 'bamboo' | 'palm' | 'aloe' | 'ivy' | 'eucalyptus' | 'rosemary' | 'clover' | 'snakeplant' | 'pine'
  | 'strawberry' | 'lemon' | 'pumpkin' | 'apple' | 'pear' | 'peach' | 'cherry' | 'orange' | 'watermelon' | 'blueberry' | 'pineapple' | 'grapes'
  | 'banana' | 'mango' | 'dragonfruit' | 'raspberry';
export type PlantCategory = 'flowers' | 'plants' | 'fruit';
export type PlantColors = { main: string; leaves: string };
export type PaletteId = 'natural' | 'blush' | 'lilac' | 'sea' | 'sunset' | 'custom';
export type PlantDraft = { kind: PlantKind; palette: PaletteId; colors: PlantColors; note: string; author: string; design?: FlowerDesign };
export type GardenPlant = PlantDraft & { id: string; createdAt: number; shared?: boolean; accountLinked?: boolean };
export type CommunityPlant = GardenPlant & { canEdit: boolean };

export const plantCatalog: { kind: PlantKind; category: PlantCategory; name: string; detail: string; colors: PlantColors }[] = [
  { kind: 'custom-flower', category: 'flowers', name: 'Your own flower', detail: 'A little bloom, designed by you.', colors: { main: '#dfa6b8', leaves: '#81996b' } },
  { kind: 'daisy', category: 'flowers', name: 'Daisy', detail: 'A little everyday joy.', colors: { main: '#f7eee0', leaves: '#81996b' } },
  { kind: 'tulip', category: 'flowers', name: 'Tulip', detail: 'Something sweet, in bloom.', colors: { main: '#df9bab', leaves: '#779566' } },
  { kind: 'sunflower', category: 'flowers', name: 'Sunflower', detail: 'A small pocket of sunshine.', colors: { main: '#edc35f', leaves: '#819655' } },
  { kind: 'rose', category: 'flowers', name: 'Rose', detail: 'A little love, petal by petal.', colors: { main: '#d58e9f', leaves: '#718d62' } },
  { kind: 'lavender', category: 'flowers', name: 'Lavender', detail: 'For a lovely, slower day.', colors: { main: '#aa99c6', leaves: '#8a9a79' } },
  { kind: 'bluebell', category: 'flowers', name: 'Bluebell', detail: 'A tiny woodland hello.', colors: { main: '#91a7cf', leaves: '#7e996f' } },
  { kind: 'lotus', category: 'flowers', name: 'Lotus', detail: 'A quiet moment on the water.', colors: { main: '#e5b0c1', leaves: '#8da681' } },
  { kind: 'orchid', category: 'flowers', name: 'Orchid', detail: 'A little wonder, in bloom.', colors: { main: '#c6a0cf', leaves: '#74916e' } },
  { kind: 'hydrangea', category: 'flowers', name: 'Hydrangea', detail: 'A cloud of tiny blossoms.', colors: { main: '#a7b8d6', leaves: '#789568' } },
  { kind: 'poppy', category: 'flowers', name: 'Poppy', detail: 'A bright little daydream.', colors: { main: '#df8b7d', leaves: '#85946a' } },
  { kind: 'iris', category: 'flowers', name: 'Iris', detail: 'A little piece of the rainbow.', colors: { main: '#a392c5', leaves: '#769276' } },
  { kind: 'lily', category: 'flowers', name: 'Lily', detail: 'A gentle wish, unfolding.', colors: { main: '#f0e6d4', leaves: '#80986a' } },
  { kind: 'peony', category: 'flowers', name: 'Peony', detail: 'Petals full of possibility.', colors: { main: '#e1a6b6', leaves: '#7f9669' } },
  { kind: 'hibiscus', category: 'flowers', name: 'Hibiscus', detail: 'A little tropical sunshine.', colors: { main: '#de969f', leaves: '#789362' } },
  { kind: 'daffodil', category: 'flowers', name: 'Daffodil', detail: 'The first hello of spring.', colors: { main: '#ecd17d', leaves: '#8b9f6f' } },
  { kind: 'cosmos', category: 'flowers', name: 'Cosmos', detail: 'A wildflower kind of joy.', colors: { main: '#dba8c2', leaves: '#859f74' } },
  { kind: 'fern', category: 'plants', name: 'Fern', detail: 'A softer kind of green.', colors: { main: '#96ac7b', leaves: '#637f57' } },
  { kind: 'cactus', category: 'plants', name: 'Cactus', detail: 'A little wild at heart.', colors: { main: '#8ca783', leaves: '#5f815c' } },
  { kind: 'sprout', category: 'plants', name: 'Sprout', detail: 'For all the things to come.', colors: { main: '#acc384', leaves: '#719455' } },
  { kind: 'monstera', category: 'plants', name: 'Monstera', detail: 'Big leaves, little jungle.', colors: { main: '#829e70', leaves: '#557950' } },
  { kind: 'succulent', category: 'plants', name: 'Succulent', detail: 'A soft little rosette.', colors: { main: '#a7bca1', leaves: '#7e9b84' } },
  { kind: 'mushroom', category: 'plants', name: 'Mushrooms', detail: 'Two tiny forest friends.', colors: { main: '#dba291', leaves: '#8b9b70' } },
  { kind: 'bonsai', category: 'plants', name: 'Bonsai', detail: 'A little world, growing slowly.', colors: { main: '#8ba479', leaves: '#627e58' } },
  { kind: 'bamboo', category: 'plants', name: 'Bamboo', detail: 'Room to grow, a little taller.', colors: { main: '#a6b886', leaves: '#748f60' } },
  { kind: 'palm', category: 'plants', name: 'Palm tree', detail: 'A tiny island escape.', colors: { main: '#97b17c', leaves: '#6b8d63' } },
  { kind: 'aloe', category: 'plants', name: 'Aloe', detail: 'A little comfort in green.', colors: { main: '#9db49a', leaves: '#6e927a' } },
  { kind: 'ivy', category: 'plants', name: 'Ivy', detail: 'Finding a way to keep growing.', colors: { main: '#9bb583', leaves: '#688c64' } },
  { kind: 'eucalyptus', category: 'plants', name: 'Eucalyptus', detail: 'A little breath of fresh air.', colors: { main: '#a5bcb2', leaves: '#779889' } },
  { kind: 'rosemary', category: 'plants', name: 'Rosemary', detail: 'Something lovely to remember.', colors: { main: '#8fa58a', leaves: '#688566' } },
  { kind: 'clover', category: 'plants', name: 'Lucky clover', detail: 'A little luck, just for you.', colors: { main: '#a6be84', leaves: '#77955f' } },
  { kind: 'snakeplant', category: 'plants', name: 'Snake plant', detail: 'Standing tall, taking it easy.', colors: { main: '#a8b785', leaves: '#6b8865' } },
  { kind: 'pine', category: 'plants', name: 'Pine tree', detail: 'A tiny evergreen promise.', colors: { main: '#87a18d', leaves: '#577d6b' } },
  { kind: 'strawberry', category: 'fruit', name: 'Strawberry', detail: 'A little sweetness to keep.', colors: { main: '#d88088', leaves: '#78955d' } },
  { kind: 'lemon', category: 'fruit', name: 'Lemon tree', detail: 'A bright thought, growing.', colors: { main: '#ecc969', leaves: '#8ca26b' } },
  { kind: 'pumpkin', category: 'fruit', name: 'Pumpkin', detail: 'A warm, autumn sort of hello.', colors: { main: '#d69a65', leaves: '#819264' } },
  { kind: 'apple', category: 'fruit', name: 'Apple', detail: 'The apple of someone’s eye.', colors: { main: '#d98586', leaves: '#899e69' } },
  { kind: 'pear', category: 'fruit', name: 'Pear', detail: 'A perfectly sweet little pear.', colors: { main: '#bed08b', leaves: '#7e995e' } },
  { kind: 'peach', category: 'fruit', name: 'Peach', detail: 'You’re a peach. Really.', colors: { main: '#edb09c', leaves: '#90a372' } },
  { kind: 'cherry', category: 'fruit', name: 'Cherries', detail: 'Better together, always.', colors: { main: '#c9788c', leaves: '#849664' } },
  { kind: 'orange', category: 'fruit', name: 'Orange', detail: 'A little ball of sunshine.', colors: { main: '#e7b16a', leaves: '#809764' } },
  { kind: 'watermelon', category: 'fruit', name: 'Watermelon', detail: 'A slice of a happy summer.', colors: { main: '#e6a0a4', leaves: '#86a77c' } },
  { kind: 'blueberry', category: 'fruit', name: 'Blueberries', detail: 'Small, sweet, and a little blue.', colors: { main: '#969ec8', leaves: '#86a079' } },
  { kind: 'pineapple', category: 'fruit', name: 'Pineapple', detail: 'A tiny crown, just for you.', colors: { main: '#e3c17f', leaves: '#8caa7a' } },
  { kind: 'grapes', category: 'fruit', name: 'Grapes', detail: 'A whole bunch of kindness.', colors: { main: '#b39dc3', leaves: '#84996b' } },
  { kind: 'banana', category: 'fruit', name: 'Bananas', detail: 'A bunch of sunny little smiles.', colors: { main: '#ecd084', leaves: '#899b6b' } },
  { kind: 'mango', category: 'fruit', name: 'Mango', detail: 'A sweet little golden hour.', colors: { main: '#e7b77e', leaves: '#87a171' } },
  { kind: 'dragonfruit', category: 'fruit', name: 'Dragon fruit', detail: 'A little magic under a pink peel.', colors: { main: '#da94b5', leaves: '#8ea96e' } },
  { kind: 'raspberry', category: 'fruit', name: 'Raspberries', detail: 'Tiny berries, lovely together.', colors: { main: '#ce8f9f', leaves: '#819b70' } },
];
export const palettes: { id: Exclude<PaletteId, 'natural' | 'custom'>; name: string; colors: PlantColors }[] = [
  { id: 'blush', name: 'Blush', colors: { main: '#dfa6b8', leaves: '#91a57b' } },
  { id: 'lilac', name: 'Lilac', colors: { main: '#b9a5d2', leaves: '#829d8a' } },
  { id: 'sea', name: 'Sea glass', colors: { main: '#8fbcb7', leaves: '#718f7c' } },
  { id: 'sunset', name: 'Apricot', colors: { main: '#edb285', leaves: '#909c6e' } },
];
export function plantInfo(kind: PlantKind) { return plantCatalog.find(plant => plant.kind === kind)!; }
export function paletteColors(kind: PlantKind, palette: PaletteId): PlantColors {
  return { ...(palettes.find(item => item.id === palette)?.colors ?? plantInfo(kind).colors) };
}
export function emptyPlant(): PlantDraft {
  return { kind: 'daisy', palette: 'natural', colors: paletteColors('daisy', 'natural'), note: '', author: '' };
}
export function finishPlant(draft: PlantDraft, existing?: GardenPlant): GardenPlant {
  const { design, ...base } = draft;
  return { ...base, ...(draft.kind === 'custom-flower' ? { design: copyFlowerDesign(design ?? defaultFlowerDesign()) } : {}), colors: { ...draft.colors }, note: draft.note.trim().slice(0, NOTE_LIMIT), author: draft.author.trim().slice(0, NAME_LIMIT),
    id: existing?.id ?? crypto.randomUUID(), createdAt: existing?.createdAt ?? Date.now(), ...(existing?.shared ? { shared: true } : {}) };
}
const color = /^#[0-9a-f]{6}$/i;
export function isPlant(value: unknown): value is GardenPlant {
  if (!value || typeof value !== 'object') return false;
  const p = value as GardenPlant;
  return typeof p.id === 'string' && p.id.length > 0 && p.id.length <= 80 && Number.isFinite(p.createdAt) && p.createdAt >= 0
    && plantCatalog.some(item => item.kind === p.kind) && ['natural', 'blush', 'lilac', 'sea', 'sunset', 'custom'].includes(p.palette)
    && !!p.colors && typeof p.colors.main === 'string' && color.test(p.colors.main) && typeof p.colors.leaves === 'string' && color.test(p.colors.leaves)
    && (p.kind === 'custom-flower' ? isFlowerDesign(p.design) : p.design === undefined)
    && typeof p.note === 'string' && p.note.length <= NOTE_LIMIT && typeof p.author === 'string' && p.author.length <= NAME_LIMIT;
}
export function parsePlantings(value: unknown): GardenPlant[] {
  if (!value || typeof value !== 'object') return [];
  const stored = value as { version?: number; plants?: unknown[] };
  if (stored.version !== 1 || !Array.isArray(stored.plants)) return [];
  const seen = new Set<string>();
  return stored.plants.filter((p): p is GardenPlant => {
    if (!isPlant(p) || seen.has(p.id)) return false;
    seen.add(p.id); return true;
  }).map(p => ({ id: p.id, createdAt: p.createdAt, kind: p.kind, palette: p.palette, colors: { ...p.colors }, note: p.note, author: p.author, ...(p.kind === 'custom-flower' ? { design: copyFlowerDesign(p.design!) } : {}), ...(p.shared === true ? { shared: true } : {}) }));
}
export function readPlantings(): GardenPlant[] {
  const stored = readSaved<unknown>('plantings', null, (_value): _value is unknown => true);
  if (stored !== null) return parsePlantings(stored);
  // Keep every flower planted before the customisation studio was introduced.
  const count = readSaved('flowers', 0, (n): n is number => Number.isInteger(n) && Number(n) >= 0 && Number(n) <= MAX_PLANTS);
  return Array.from({ length: count }, (_, i) => ({ ...emptyPlant(), id: `original-flower-${i}`, createdAt: i,
    palette: 'blush', colors: paletteColors('daisy', 'blush') }));
}
export function savePlantings(plants: GardenPlant[]) { return save('plantings', { version: 1, plants }); }
export function upsertPlant(plants: GardenPlant[], plant: GardenPlant): GardenPlant[] {
  const index = plants.findIndex(item => item.id === plant.id);
  if (index >= 0) return plants.map((item, i) => i === index ? plant : item);
  return [...plants, plant];
}
