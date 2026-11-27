import { readSaved, save } from '../garden/storage';

export type GameRecord = { completed: boolean; best: number };
export function readGameRecord(): GameRecord {
  return readSaved('hidden-garden', { completed: false, best: 0 }, (value): value is GameRecord => {
    if (!value || typeof value !== 'object') return false;
    const record = value as GameRecord;
    return typeof record.completed === 'boolean' && Number.isInteger(record.best) && record.best >= 0 && record.best <= 12;
  });
}
export function recordCompletion(count: number) {
  const record = { completed: true, best: Math.max(readGameRecord().best, Math.min(12, Math.max(0, Math.floor(count)))) };
  save('hidden-garden', record);
  return record;
}
