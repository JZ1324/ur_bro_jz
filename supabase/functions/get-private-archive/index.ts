import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

type ArchiveSectionId = 'school' | 'music' | 'leadership';

type PrivateArchiveManifest = {
  id: ArchiveSectionId;
  title: string;
  subtitle: string;
  summary: string;
  items: string[];
  photos?: Array<{
    id: string;
    alt: string;
    caption: string;
    path: string;
  }>;
};

const allowedSectionIds = new Set(['school', 'music', 'leadership']);
const bucketName = Deno.env.get('ARCHIVE_BUCKET') || 'private-archive';
const signedUrlTtlSeconds = Number(Deno.env.get('SIGNED_URL_TTL_SECONDS') || 600);

function jsonResponse(body: unknown, status = 200, origin = '*') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function resolveCorsOrigin(req: Request) {
  const requestOrigin = req.headers.get('origin') || '*';
  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (allowedOrigins.length === 0 || allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return allowedOrigins[0] || '*';
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string) {
  const maxLength = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;

  for (let index = 0; index < maxLength; index += 1) {
    diff |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }

  return diff === 0;
}

function isManifest(value: unknown): value is PrivateArchiveManifest {
  if (!value || typeof value !== 'object') return false;

  const manifest = value as PrivateArchiveManifest;
  return (
    allowedSectionIds.has(manifest.id)
    && typeof manifest.title === 'string'
    && typeof manifest.subtitle === 'string'
    && typeof manifest.summary === 'string'
    && Array.isArray(manifest.items)
    && manifest.items.every((item) => typeof item === 'string')
    && (!manifest.photos || manifest.photos.every((photo) => (
      typeof photo.id === 'string'
      && typeof photo.alt === 'string'
      && typeof photo.caption === 'string'
      && typeof photo.path === 'string'
      && !photo.path.startsWith('/')
      && !photo.path.includes('..')
      && !photo.path.startsWith('metadata/')
    )))
  );
}

Deno.serve(async (req) => {
  const corsOrigin = resolveCorsOrigin(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(corsOrigin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405, corsOrigin);
  }

  const expectedHash = Deno.env.get('ARCHIVE_ACCESS_KEY_HASH');
  if (!expectedHash) {
    return jsonResponse({ error: 'archive_not_configured' }, 503, corsOrigin);
  }

  let body: { sectionId?: unknown; accessKey?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_request' }, 400, corsOrigin);
  }

  if (typeof body.sectionId !== 'string' || !allowedSectionIds.has(body.sectionId)) {
    return jsonResponse({ error: 'invalid_section' }, 400, corsOrigin);
  }

  if (typeof body.accessKey !== 'string' || body.accessKey.length === 0) {
    return jsonResponse({ error: 'invalid_access_key' }, 401, corsOrigin);
  }

  const submittedHash = await sha256Hex(body.accessKey);
  if (!timingSafeEqual(submittedHash, expectedHash)) {
    return jsonResponse({ error: 'invalid_access_key' }, 401, corsOrigin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'archive_not_configured' }, 503, corsOrigin);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const manifestPath = `metadata/${body.sectionId}.json`;
  const { data: manifestBlob, error: manifestError } = await supabase.storage
    .from(bucketName)
    .download(manifestPath);

  if (manifestError || !manifestBlob) {
    return jsonResponse({ error: 'archive_not_found' }, 404, corsOrigin);
  }

  let manifest: unknown;
  try {
    manifest = JSON.parse(await manifestBlob.text());
  } catch {
    return jsonResponse({ error: 'invalid_manifest' }, 500, corsOrigin);
  }

  if (!isManifest(manifest) || manifest.id !== body.sectionId) {
    return jsonResponse({ error: 'invalid_manifest' }, 500, corsOrigin);
  }

  const expiresAt = new Date(Date.now() + signedUrlTtlSeconds * 1000).toISOString();
  let photos;

  try {
    photos = await Promise.all((manifest.photos || []).map(async (photo) => {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(photo.path, signedUrlTtlSeconds);

      if (error || !data?.signedUrl) {
        throw new Error(`Could not sign private photo ${photo.id}`);
      }

      return {
        id: photo.id,
        alt: photo.alt,
        caption: photo.caption,
        signedUrl: data.signedUrl,
        expiresAt,
      };
    }));
  } catch {
    return jsonResponse({ error: 'photo_signing_failed' }, 500, corsOrigin);
  }

  return jsonResponse({
    sectionId: manifest.id,
    title: manifest.title,
    subtitle: manifest.subtitle,
    summary: manifest.summary,
    items: manifest.items,
    photos,
  }, 200, corsOrigin);
});
