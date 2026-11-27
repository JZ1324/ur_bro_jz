export const PAGE_SIZE = 24;
export const PUBLISH_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
export class GardenError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
