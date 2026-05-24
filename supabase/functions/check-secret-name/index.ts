declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve: (handler: (req: Request) => Promise<Response>) => void;
};

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

function phrase(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function hexPayload(value: string) {
  return value.toLowerCase().match(/[a-f0-9]{40,}/)?.[0] || '';
}

type PuzzleStage = 'fragment' | 'hex' | 'cipher';

function isPuzzleStage(value: unknown): value is PuzzleStage {
  return value === 'fragment' || value === 'hex' || value === 'cipher';
}

function normalizePuzzleAnswer(stage: PuzzleStage, value: string) {
  if (stage === 'fragment') return hexPayload(value);
  return phrase(value);
}

function getPuzzleAnswerHash(stage: PuzzleStage) {
  const secretName = {
    fragment: 'SECRET_PUZZLE_FRAGMENT_HASH',
    hex: 'SECRET_PUZZLE_HEX_HASH',
    cipher: 'SECRET_PUZZLE_CIPHER_HASH',
  }[stage];

  return Deno.env.get(secretName);
}

Deno.serve(async (req) => {
  const corsOrigin = resolveCorsOrigin(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(corsOrigin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405, corsOrigin);
  }

  const expectedHash = Deno.env.get('SECRET_NAME_HASH');
  if (!expectedHash) {
    return jsonResponse({ error: 'not_configured' }, 503, corsOrigin);
  }

  let body: { name?: unknown; puzzleStage?: unknown; puzzleAnswer?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_request' }, 400, corsOrigin);
  }

  if (isPuzzleStage(body.puzzleStage) && typeof body.puzzleAnswer === 'string') {
    const expectedPuzzleHash = getPuzzleAnswerHash(body.puzzleStage);
    if (!expectedPuzzleHash) {
      return jsonResponse({ error: 'puzzle_not_configured' }, 503, corsOrigin);
    }

    const normalizedAnswer = normalizePuzzleAnswer(body.puzzleStage, body.puzzleAnswer);
    if (!normalizedAnswer) {
      return jsonResponse({ matched: false }, 200, corsOrigin);
    }

    const submittedPuzzleHash = await sha256Hex(normalizedAnswer);
    const matched = timingSafeEqual(submittedPuzzleHash, expectedPuzzleHash);

    if (!matched) {
      return jsonResponse({ matched: false }, 200, corsOrigin);
    }

    if (body.puzzleStage === 'cipher') {
      const revealName = Deno.env.get('SECRET_NAME_REVEAL');
      if (!revealName) {
        return jsonResponse({ error: 'reveal_not_configured' }, 503, corsOrigin);
      }

      return jsonResponse({ matched: true, name: revealName }, 200, corsOrigin);
    }

    return jsonResponse({ matched: true }, 200, corsOrigin);
  }

  if (typeof body.name !== 'string') {
    return jsonResponse({ error: 'invalid_request' }, 400, corsOrigin);
  }

  const submittedName = body.name.trim();
  if (!submittedName) {
    return jsonResponse({ matched: false }, 200, corsOrigin);
  }

  const submittedHash = await sha256Hex(submittedName);

  return jsonResponse({
    matched: timingSafeEqual(submittedHash, expectedHash),
  }, 200, corsOrigin);
});
