declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

type TrackQuality = 'high' | 'medium' | 'low';

const bucketName = Deno.env.get('TRACK_AUDIO_BUCKET') || 'licensed-audio';
const qualityObjectPaths: Record<TrackQuality, string> = {
  high: Deno.env.get('TRACK_AUDIO_HIGH_PATH') || 'so-easy-320.mp3',
  medium: Deno.env.get('TRACK_AUDIO_MEDIUM_PATH') || 'so-easy-160.mp3',
  low: Deno.env.get('TRACK_AUDIO_LOW_PATH') || 'so-easy-96.mp3',
};

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
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

function jsonResponse(body: unknown, status = 200, origin = '*') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

function isTrackQuality(value: string | null): value is TrackQuality {
  return value === 'high' || value === 'medium' || value === 'low';
}

Deno.serve(async (req) => {
  const corsOrigin = resolveCorsOrigin(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(corsOrigin) });
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return jsonResponse({ error: 'method_not_allowed' }, 405, corsOrigin);
  }

  const quality = new URL(req.url).searchParams.get('quality');
  if (!isTrackQuality(quality)) {
    return jsonResponse({ error: 'invalid_quality' }, 400, corsOrigin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'audio_not_configured' }, 503, corsOrigin);
  }

  const objectPath = qualityObjectPaths[quality];
  const storageUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/authenticated/${bucketName}/${objectPath}`;
  const storageHeaders = new Headers({
    Authorization: `Bearer ${serviceRoleKey}`,
    apikey: serviceRoleKey,
  });
  const range = req.headers.get('range');
  if (range) storageHeaders.set('Range', range);

  const storageResponse = await fetch(storageUrl, {
    method: req.method,
    headers: storageHeaders,
  });

  if (!storageResponse.ok) {
    return jsonResponse({ error: 'audio_not_found' }, 404, corsOrigin);
  }

  const responseHeaders = new Headers(corsHeaders(corsOrigin));
  responseHeaders.set('Content-Type', 'audio/mpeg');
  responseHeaders.set('Content-Disposition', 'inline');
  responseHeaders.set('Cache-Control', 'private, max-age=0, no-store');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');

  for (const headerName of ['accept-ranges', 'content-length', 'content-range', 'etag', 'last-modified']) {
    const headerValue = storageResponse.headers.get(headerName);
    if (headerValue) responseHeaders.set(headerName, headerValue);
  }

  return new Response(req.method === 'HEAD' ? null : storageResponse.body, {
    status: storageResponse.status,
    headers: responseHeaders,
  });
});
