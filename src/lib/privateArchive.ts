import type { ArchiveSectionId, PrivateArchiveSection } from '../data/site';

type PrivateArchiveErrorCode =
  | 'not_configured'
  | 'archive_not_configured'
  | 'archive_not_found'
  | 'invalid_access_key'
  | 'request_failed'
  | 'invalid_response';

export class PrivateArchiveError extends Error {
  code: PrivateArchiveErrorCode;

  constructor(code: PrivateArchiveErrorCode, message: string) {
    super(message);
    this.name = 'PrivateArchiveError';
    this.code = code;
  }
}

function getFunctionUrl() {
  const explicitUrl = import.meta.env.VITE_SUPABASE_FUNCTION_URL;
  if (explicitUrl) return explicitUrl;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/get-private-archive`;
  }

  return null;
}

function isPrivateArchiveSection(value: unknown): value is PrivateArchiveSection {
  if (!value || typeof value !== 'object') return false;
  const section = value as PrivateArchiveSection;

  return (
    ['school', 'music', 'leadership'].includes(section.sectionId)
    && typeof section.title === 'string'
    && typeof section.subtitle === 'string'
    && typeof section.summary === 'string'
    && Array.isArray(section.items)
    && Array.isArray(section.photos)
    && section.photos.every((photo) => (
      typeof photo.id === 'string'
      && typeof photo.alt === 'string'
      && typeof photo.caption === 'string'
      && typeof photo.signedUrl === 'string'
      && typeof photo.expiresAt === 'string'
    ))
  );
}

export async function fetchPrivateArchiveSection(
  sectionId: ArchiveSectionId,
  accessKey: string,
): Promise<PrivateArchiveSection> {
  const functionUrl = getFunctionUrl();
  if (!functionUrl) {
    throw new PrivateArchiveError(
      'not_configured',
      'Private archive storage is not configured yet. Add Supabase function settings before uploading private photos.',
    );
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sectionId, accessKey }),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new PrivateArchiveError('invalid_response', 'The private archive returned an unreadable response.');
  }

  if (!response.ok) {
    const errorCode = typeof payload === 'object' && payload && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : 'request_failed';

    if (errorCode === 'invalid_access_key') {
      throw new PrivateArchiveError('invalid_access_key', 'That access key did not open the archive.');
    }

    if (errorCode === 'archive_not_configured') {
      throw new PrivateArchiveError(
        'archive_not_configured',
        'The private archive function is deployed, but its required secrets are not configured yet.',
      );
    }

    if (errorCode === 'archive_not_found') {
      throw new PrivateArchiveError(
        'archive_not_found',
        'This archive section has no private manifest yet. Upload the section metadata and photos to Supabase Storage first.',
      );
    }

    throw new PrivateArchiveError('request_failed', 'The private archive could not be opened right now.');
  }

  if (!isPrivateArchiveSection(payload)) {
    throw new PrivateArchiveError('invalid_response', 'The private archive response was missing required fields.');
  }

  return payload;
}
