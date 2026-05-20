declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

const bucketName = Deno.env.get('TRACK_LYRICS_BUCKET') || 'metadata';
const objectPath = Deno.env.get('TRACK_LYRICS_PATH') || 'lyrics/so-easy.ttml';

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

Deno.serve(async (req) => {
  const corsOrigin = resolveCorsOrigin(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(corsOrigin) });
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'method_not_allowed' }, 405, corsOrigin);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'lyrics_not_configured' }, 503, corsOrigin);
  }

  const storageUrl = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/${bucketName}/${objectPath}`;
  const storageResponse = await fetch(storageUrl, {
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    },
  });

  if (!storageResponse.ok) {
    return jsonResponse({ error: 'lyrics_not_found' }, 404, corsOrigin);
  }

  return new Response(await storageResponse.text(), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      ...corsHeaders(corsOrigin),
    },
  });
});
