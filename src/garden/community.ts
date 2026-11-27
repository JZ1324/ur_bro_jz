import type { CommunityPlant, GardenPlant, PlantCategory } from './plantings';
import { accountHeaders } from '../account/api';

export type GardenPage = { plants: CommunityPlant[]; total: number; count: number; page: number; pages: number };
export type GardenFilter = PlantCategory | 'all';
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(`/api/garden/plants${path}`, { ...init, credentials: 'same-origin', signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000), headers: { 'Content-Type': 'application/json', ...accountHeaders(), ...init.headers } }); }
  catch (error) {
    if (init.signal?.aborted) throw error;
    throw new Error('The garden couldn’t be reached. Your draft is safe here; please try again.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error ?? 'The shared garden is unavailable just now. Please try again.');
  return data as T;
}
export function readCommunity(category: GardenFilter, page: number, signal?: AbortSignal) {
  return request<GardenPage>(`?category=${category}&page=${page}`, { signal });
}
export async function publishPlant(plant: GardenPlant) {
  const { plant: saved } = await request<{ plant: CommunityPlant }>(plant.shared ? `/${encodeURIComponent(plant.id)}` : '', { method: plant.shared ? 'PUT' : 'POST', body: JSON.stringify(plant) });
  return saved;
}
export async function deleteSharedPlant(plant: GardenPlant) { await request(`/${encodeURIComponent(plant.id)}`, { method: 'DELETE' }); }
