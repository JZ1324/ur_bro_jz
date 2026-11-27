import { emptyCollection, validCollection, type OceanCollection } from '../ocean/collection';
import { isPlant, type GardenPlant } from '../garden/plantings';

export type GuestImport = { id: string; ocean: OceanCollection; plants: GardenPlant[] };
export function validGuestImport(value: unknown): value is GuestImport {
  if (!value || typeof value !== 'object') return false;
  const data = value as GuestImport;
  return typeof data.id === 'string' && /^[a-zA-Z0-9_-]{8,80}$/.test(data.id) && validCollection(data.ocean)
    && Array.isArray(data.plants) && data.plants.length <= 1000 && data.plants.every(isPlant);
}
export function remainingGuestCollection(batch: GuestImport, ocean: OceanCollection, plants: GardenPlant[]) {
  const remaining = { ...ocean, fish: { ...ocean.fish }, opened: Math.max(0, ocean.opened - batch.ocean.opened) };
  for (const [id, count] of Object.entries(batch.ocean.fish)) {
    const amount = (remaining.fish[id] ?? 0) - count;
    if (amount > 0) remaining.fish[id] = amount; else delete remaining.fish[id];
  }
  if (remaining.lastCatch && !remaining.fish[remaining.lastCatch]) remaining.lastCatch = Object.keys(remaining.fish)[0] ?? null;
  return {
    ocean: Object.keys(remaining.fish).length ? remaining : emptyCollection(),
    // Keep a guest draft edited in another tab while sign-in was in progress.
    plants: plants.filter(plant => !batch.plants.some(item => item.id === plant.id && JSON.stringify(item) === JSON.stringify(plant))),
  };
}
