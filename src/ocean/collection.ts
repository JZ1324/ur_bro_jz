import { readSaved, save } from '../garden/storage.ts';
import { getFish, shopAt, tideAt, type Fish, type ShopOffer } from './catalog.ts';

export const OCEAN_STORAGE_KEY = 'ocean:v1';
export type OceanCollection = { version: 1; fish: Record<string, number>; claimedTide: number; claimed: number[]; opened: number; lastCatch: string | null };
export const emptyCollection = (): OceanCollection => ({ version: 1, fish: {}, claimedTide: -1, claimed: [], opened: 0, lastCatch: null });
const count = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= 1_000_000;
export function validCollection(value: unknown): value is OceanCollection {
  if (!value || typeof value !== 'object') return false;
  const data = value as OceanCollection;
  return data.version === 1 && !!data.fish && typeof data.fish === 'object' && !Array.isArray(data.fish)
    && Object.entries(data.fish).every(([id, quantity]) => !!getFish(id) && count(quantity) && quantity > 0)
    && Number.isSafeInteger(data.claimedTide) && data.claimedTide >= -1
    && Array.isArray(data.claimed) && data.claimed.length <= 4 && new Set(data.claimed).size === data.claimed.length
    && data.claimed.every(index => Number.isInteger(index) && index >= 0 && index < 4)
    && count(data.opened) && (data.lastCatch === null || typeof data.lastCatch === 'string' && !!getFish(data.lastCatch));
}
export const readCollection = () => readSaved(OCEAN_STORAGE_KEY, emptyCollection(), validCollection);
export const saveCollection = (collection: OceanCollection) => save(OCEAN_STORAGE_KEY, collection);
export function addFish(collection: OceanCollection, fish: Fish, source: 'case' | 'shop'): OceanCollection {
  return { ...collection, fish: { ...collection.fish, [fish.id]: Math.min(1_000_000, (collection.fish[fish.id] ?? 0) + 1) },
    opened: Math.min(1_000_000, collection.opened + (source === 'case' ? 1 : 0)), lastCatch: fish.id };
}
export function offerClaimed(collection: OceanCollection, offer: ShopOffer) {
  return collection.claimedTide === offer.tide && collection.claimed.includes(offer.index);
}
export function claimOffer(collection: OceanCollection, offer: ShopOffer, now: number): OceanCollection | null {
  if (offer.tide !== tideAt(now) || offerClaimed(collection, offer)) return null;
  // Resolve stock again from the tide, so a stale offer cannot claim a different fish.
  const actual = shopAt(now)[offer.index];
  if (!actual || actual.id !== offer.id || actual.fish.id !== offer.fish.id) return null;
  const next = addFish(collection, actual.fish, 'shop');
  return { ...next, claimedTide: offer.tide, claimed: [...(collection.claimedTide === offer.tide ? collection.claimed : []), offer.index] };
}
