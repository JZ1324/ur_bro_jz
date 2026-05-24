type SecretNameErrorCode =
  | 'not_configured'
  | 'invalid_response'
  | 'request_failed';

export type SecretPuzzleStage = 'fragment' | 'hex' | 'cipher';

type SecretPuzzleResponse = {
  matched: boolean;
  name?: string;
};

export class SecretNameError extends Error {
  code: SecretNameErrorCode;

  constructor(code: SecretNameErrorCode, message: string) {
    super(message);
    this.name = 'SecretNameError';
    this.code = code;
  }
}

function getSecretNameFunctionUrl() {
  const explicitUrl = import.meta.env.VITE_SECRET_NAME_FUNCTION_URL;
  if (explicitUrl) return explicitUrl;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/check-secret-name`;
  }

  return null;
}

function isSecretNameResponse(value: unknown): value is { matched: boolean } {
  return Boolean(
    value
    && typeof value === 'object'
    && 'matched' in value
    && typeof (value as { matched: unknown }).matched === 'boolean',
  );
}

function isSecretPuzzleResponse(value: unknown): value is SecretPuzzleResponse {
  return Boolean(
    value
    && typeof value === 'object'
    && 'matched' in value
    && typeof (value as { matched: unknown }).matched === 'boolean',
  );
}

export async function checkSecretName(name: string) {
  const functionUrl = getSecretNameFunctionUrl();
  if (!functionUrl) {
    throw new SecretNameError(
      'not_configured',
      'This sealed entry is not connected yet.',
    );
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new SecretNameError('invalid_response', 'The sealed entry returned an unreadable response.');
  }

  if (!response.ok || !isSecretNameResponse(payload)) {
    throw new SecretNameError('request_failed', 'The sealed entry could not be checked right now.');
  }

  return payload.matched;
}

export async function submitSecretPuzzleStep(stage: SecretPuzzleStage, answer: string) {
  const functionUrl = getSecretNameFunctionUrl();
  if (!functionUrl) {
    throw new SecretNameError(
      'not_configured',
      'This sealed entry is not connected yet.',
    );
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ puzzleStage: stage, puzzleAnswer: answer }),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new SecretNameError('invalid_response', 'The sealed entry returned an unreadable response.');
  }

  if (!response.ok || !isSecretPuzzleResponse(payload)) {
    throw new SecretNameError('request_failed', 'The puzzle step could not be checked right now.');
  }

  return payload;
}
