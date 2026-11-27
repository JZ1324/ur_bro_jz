import type { IncomingMessage, ServerResponse } from 'node:http';
import { createConfiguredGardenApi } from '../../server/configuredApi.ts';

// The shared handler accepts Vercel-parsed bodies and ordinary Node streams.
let api: ReturnType<typeof createConfiguredGardenApi> | undefined;
export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (!process.env.GARDEN_DATABASE_URL || !process.env.GARDEN_PUBLIC_URL) {
    response.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify({ error: 'The hosted garden is being connected. Your saved device collection is safe.' }));
    return;
  }
  api ??= createConfiguredGardenApi();
  await api.handle(request, response, () => { response.writeHead(404); response.end(); });
}
