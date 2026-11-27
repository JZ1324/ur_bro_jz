import { randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import { GardenError, openGardenStore } from './gardenStore.ts';
import { digest, openAccountStore } from './accountStore.ts';
import { sendGardenCode, verifyGardenCode, validEmail, type GardenAccount } from './gardenAuth.ts';
type AsyncStore<T> = {
    [K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => R | Promise<R> : T[K];
};
type Options = { limiter?: (key: string, limit: number) => Promise<void>;
    stores?: {
        store: AsyncStore<ReturnType<typeof openGardenStore>>;
        accounts: AsyncStore<ReturnType<typeof openAccountStore>>;
    };
    auth?: {
        sendCode: typeof sendGardenCode;
        verifyCode: typeof verifyGardenCode;
    };
    publicUrl?: string;
};
export function createGardenApi(databasePath = process.env.GARDEN_DATABASE ?? resolve('.garden-data/plantings.sqlite'), options: Options = {}) {
    const { store, accounts } = options.stores ?? { store: openGardenStore(databasePath), accounts: openAccountStore(databasePath) };
    const auth = options.auth ?? { sendCode: sendGardenCode, verifyCode: verifyGardenCode };
    const publicUrl = options.publicUrl ?? process.env.GARDEN_PUBLIC_URL;
    const attempts = new Map<string, {
        count: number;
        until: number;
    }>();
    async function rateLimit(request: IncomingMessage, group: string, limit: number) {
        const ip = process.env.VERCEL === '1' ? String(request.headers['x-forwarded-for'] ?? request.socket.remoteAddress ?? 'local').split(',')[0].trim() : request.socket.remoteAddress ?? 'local';
        const now = Date.now(), address = digest(`${group}:${ip}`);
        if (options.limiter) { await options.limiter(address, limit); return; }
        for (const [key, entry] of attempts)
            if (entry.until <= now)
                attempts.delete(key);
        if (attempts.size > 10000)
            throw new GardenError(503, 'The garden is busy. Please try again soon.');
        const rate = attempts.get(address) ?? { count: 0, until: now + 3600000 };
        attempts.set(address, rate);
        if (++rate.count > limit)
            throw new GardenError(429, 'The garden is taking a little breather. Please try again later.');
    }
    function send(response: ServerResponse, status: number, body: unknown) {
        response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
        response.end(JSON.stringify(body));
    }
    async function json(request: IncomingMessage, max = 8192): Promise<any> {
        if (!request.headers['content-type']?.startsWith('application/json'))
            throw new GardenError(415, 'Please send a garden request.');
        if (Number(request.headers['content-length']) > max)
            throw new GardenError(413, 'That garden request is too large.');
        // Vercel may supply an already-parsed body; local Node streams are read below.
        let parsedBody: unknown;
        try { parsedBody = (request as IncomingMessage & { body?: unknown }).body; }
        catch { throw new GardenError(400, 'That garden request could not be read.'); }
        if (parsedBody !== undefined) {
            const raw = typeof parsedBody === 'string' ? parsedBody : Buffer.isBuffer(parsedBody) ? parsedBody.toString('utf8') : JSON.stringify(parsedBody);
            if (Buffer.byteLength(raw) > max) throw new GardenError(413, 'That garden request is too large.');
            try { return JSON.parse(raw); } catch { throw new GardenError(400, 'That garden request could not be read.'); }
        }
        const chunks: Buffer[] = [];
        let length = 0;
        for await (const chunk of request) {
            length += chunk.length;
            if (length > max)
                throw new GardenError(413, 'That garden request is too large.');
            chunks.push(chunk);
        }
        try {
            return JSON.parse(Buffer.concat(chunks).toString('utf8'));
        }
        catch {
            throw new GardenError(400, 'That garden request could not be read.');
        }
    }
    return {
        close() { accounts.close(); store.close(); },
        async handle(request: IncomingMessage, response: ServerResponse, next: () => void) {
            const url = new URL(request.url ?? '/', 'http://garden.local');
            if (!url.pathname.startsWith('/api/garden')) {
                next();
                return;
            }
            try {
                const method = request.method ?? 'GET', path = url.pathname.slice('/api/garden'.length);
                const secure = !!('encrypted' in request.socket && request.socket.encrypted) || publicUrl?.startsWith('https:');
                const cookie = (name: string) => request.headers.cookie?.match(new RegExp(`(?:^|;\\s*)${name}=([a-f0-9]{64})(?:;|$)`))?.[1];
                const setCookie = (name: string, value: string, age: number) => {
                    const previous = response.getHeader('Set-Cookie');
                    response.setHeader('Set-Cookie', [...(Array.isArray(previous) ? previous : previous ? [String(previous)] : []), `${name}=${value}; HttpOnly; SameSite=${name === 'garden_keeper' ? 'Strict' : 'Lax'}; Path=/api/garden; Max-Age=${age}${secure ? '; Secure' : ''}`]);
                };
                if (method !== 'GET') {
                    const origin = request.headers.origin;
                    const expected = publicUrl ? new URL(publicUrl).origin : `${secure ? 'https' : 'http'}://${request.headers.host}`;
                    if (request.headers['sec-fetch-site'] === 'cross-site' || (origin && origin !== expected))
                        throw new GardenError(403, 'Please use this garden’s own page.');
                }
                let keeper = cookie('garden_keeper');
                if (!keeper) {
                    keeper = randomBytes(32).toString('hex');
                    setCookie('garden_keeper', keeper, 31536000);
                }
                const guestOwner = digest(keeper);
                const session = cookie('garden_account');
                const user = session ? await accounts.session(session) : null;
                const owner = user ? `account:${user.id}` : guestOwner;
                const requireAccount = () => { if (!user)
                    throw new GardenError(401, 'Please sign in to save to your account.'); return user; };
                const snapshot = async (account: GardenAccount | null) => {
                    const plants = await store.owned(account ? `account:${account.id}` : guestOwner);
                    return { user: account, plants: account ? [...(await accounts.keepsakes(account.id)).filter(p => !plants.some(shared => shared.id === p.id)), ...plants] : plants, ocean: account ? await accounts.ocean(account.id) : null };
                };
                if (method === 'POST' && path === '/auth/start') {
                    await rateLimit(request, 'sign-in', 60);
                    const body = await json(request);
                    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
                    if (!validEmail(email) || (body.name !== undefined && (typeof body.name !== 'string' || body.name.length > 32)))
                        throw new GardenError(400, 'Enter a valid email address and a name of up to 32 characters.');
                    await rateLimit(request, `email:${digest(email)}`, 5);
                    await auth.sendCode(email, body.name ?? '');
                    const state = randomBytes(32).toString('hex'), nonce = randomBytes(32).toString('hex');
                    const destination = typeof body?.destination === 'string' && /^#[a-z-]{1,40}$/.test(body.destination) ? body.destination : '#ocean';
                    await accounts.start(state, nonce, destination, email);
                    setCookie('garden_sign_in', nonce, 600);
                    send(response, 200, { state, email, expiresAt: Date.now() + 600000 });
                    return;
                }
                if (method === 'POST' && path === '/auth/complete') {
                    await rateLimit(request, 'sign-in', 60);
                    const body = await json(request), nonce = cookie('garden_sign_in');
                    if (!nonce || typeof body?.state !== 'string' || !/^[a-f0-9]{64}$/.test(body.state) || typeof body.code !== 'string' || !/^\d{6,10}$/.test(body.code))
                        throw new GardenError(401, 'Enter the sign-in code from your email.');
                    const challenge = await accounts.pending(body.state, nonce);
                    const verified = await auth.verifyCode(challenge.email, body.code);
                    const destination = await accounts.consume(body.state, nonce);
                    const token = randomBytes(32).toString('hex');
                    await store.claimGuest(guestOwner, `account:${verified.id}`, verified.name);
                    await accounts.createSession(token, verified);
                    if (session)
                        await accounts.logout(session);
                    setCookie('garden_account', token, 30 * 86400);
                    setCookie('garden_sign_in', '', 0);
                    send(response, 200, { ...await snapshot(verified), destination });
                    return;
                }
                if (method === 'POST' && path === '/auth/logout') {
                    if (session)
                        await accounts.logout(session);
                    setCookie('garden_account', '', 0);
                    send(response, 200, { signedOut: true });
                    return;
                }
                // An expired account must never silently create guest-owned work.
                if (session && !user)
                    throw new GardenError(401, 'Your garden sign-in has expired. Sign in again, or choose to continue as a guest.');
                const expectedAccount = request.headers['x-garden-account'];
                if (method !== 'GET' && expectedAccount && expectedAccount !== (user?.id ?? 'guest'))
                    throw new GardenError(409, 'Your account changed in another tab. Refresh the garden before saving.');
                if (method === 'GET' && path === '/account') {
                    send(response, 200, await snapshot(user));
                    return;
                }
                if (method === 'POST' && path === '/account/import') {
                    const account = requireAccount();
                    await accounts.importGuest(account.id, await json(request, 512000));
                    await store.claimGuest(guestOwner, `account:${account.id}`, account.name);
                    send(response, 200, await snapshot(account));
                    return;
                }
                if (method === 'POST' && path === '/account/catch') {
                    const account = requireAccount();
                    await rateLimit(request, 'catch', 1200);
                    send(response, 200, await accounts.catchFish(account.id, await json(request)));
                    return;
                }
                const keepsake = path.match(/^\/account\/keepsakes\/([a-zA-Z0-9_-]{1,80})$/)?.[1];
                if (method === 'POST' && path === '/account/keepsakes') {
                    send(response, 200, { plant: await accounts.putKeepsake(requireAccount().id, await json(request)) });
                    return;
                }
                if (method === 'DELETE' && keepsake) {
                    await accounts.removeKeepsake(requireAccount().id, keepsake);
                    send(response, 200, { removed: true });
                    return;
                }
                const collection = path === '/plants';
                const item = path.match(/^\/plants\/([a-zA-Z0-9_-]{1,80})$/)?.[1];
                if (!collection && !item)
                    throw new GardenError(404, 'Garden path not found.');
                if (method === 'GET' && collection) {
                    send(response, 200, await store.list(owner, url.searchParams.get('category') ?? 'all', Number(url.searchParams.get('page') ?? '1')));
                    return;
                }
                if ((method === 'POST' && collection) || (method === 'PUT' && item)) {
                    let value = await json(request);
                    if (item && value?.id !== item)
                        throw new GardenError(400, 'The planting does not match.');
                    if (method === 'POST')
                        await rateLimit(request, 'plant', 120);
                    if (user && value && typeof value === 'object')
                        value = { ...value, author: user.name };
                    const plant = await store.put(value, owner, method === 'PUT');
                    if (user)
                        await accounts.removeKeepsake(user.id, plant.id);
                    send(response, method === 'POST' ? 201 : 200, { plant });
                    return;
                }
                if (method === 'DELETE' && item) {
                    await store.remove(item, owner);
                    send(response, 200, { removed: true });
                    return;
                }
                throw new GardenError(405, 'That garden action is not supported.');
            }
            catch (error) {
                if (error instanceof GardenError)
                    send(response, error.status, { error: error.message });
                else {
                    console.error('Garden API could not complete a request:', error instanceof Error ? error.message : 'Unknown error');
                    send(response, 500, { error: 'The garden couldn’t save just now. Please try again.' });
                }
            }
        },
    };
}
