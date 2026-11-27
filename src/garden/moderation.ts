export type ModerationField = 'author' | 'note' | 'combined';
export type ModerationResult = { ok: true } | { ok: false; field: ModerationField; message: string };

export const MODERATION_MESSAGES = {
  author: 'Use English letters, numbers, spaces, and simple punctuation for your name.',
  note: 'Write your note in English using simple punctuation.',
  unsafe: 'That name or note contains words or a combination that cannot be shared here.',
} as const;

// The public form deliberately stays ASCII-only. This keeps scripts, lookalike characters,
// and pasted control characters out of the shared garden before they reach the server.
const authorCharacters = /^[\x20-\x7e]+$/;
const noteCharacters = /^[\x20-\x7e\r\n\t]*$/;
const urlOrMarkup = /(?:https?:\/\/|www\.|<\/?[a-z][^>]*>|\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b)/i;
const basicBlockedWords = [
  'fuck', 'shit', 'bitch', 'bastard', 'cunt', 'dick', 'pussy', 'whore', 'slut', 'porn',
  'rape', 'nazi', 'nigger', 'chink', 'kike', 'fag', 'retard', 'asshole', 'motherfucker',
] as const;
const unsafeCombinations = [
  /\b(?:go\s+)?die\b/,
  /\b(?:kill|hurt|harm)\s+(?:yourself|someone|somebody|him|her|them)\b/,
  /\b(?:send|show)\s+(?:me\s+)?(?:nudes?|naked|explicit)\b/,
  /\b(?:sexual|racial)\s+(?:abuse|assault|harassment)\b/,
] as const;
const nonEnglishHints = new Set([
  'hola', 'bonjour', 'ciao', 'gracias', 'merci', 'guten', 'danke', 'hallo',
  'esta', 'esto', 'es', 'una', 'para', 'jardin', 'flores', 'el', 'los',
  'ceci', 'une', 'petite', 'pour', 'les', 'avec', 'mais', 'le',
  'ich', 'und', 'der', 'die', 'das', 'nicht', 'bitte', 'che', 'questo', 'per', 'il',
]);

export function normalizeForModeration(value: string): string {
  return value.normalize('NFKD').toLowerCase()
    .replace(/[013456789@$]/g, character => ({ '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's' })[character] ?? character)
    .replace(/[^a-z]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactVariants(value: string): string[] {
  const compact = normalizeForModeration(value).replace(/ /g, '');
  return [compact, compact.replace(/(.)\1+/g, '$1')];
}

export function containsUnsafePlantText(author: string, note: string): boolean {
  const combined = `${author} ${note}`;
  const normalized = normalizeForModeration(combined);
  const words: string[] = normalized.match(/[a-z]+/g) ?? [];
  const compact = compactVariants(combined);
  return urlOrMarkup.test(combined)
    || unsafeCombinations.some(pattern => pattern.test(normalized))
    || basicBlockedWords.some(word => words.includes(word) || compact.some(value => word.length >= 4 && value.includes(word)));
}

export function validatePlantText(author: string, note: string): ModerationResult {
  if (!author.trim()) return { ok: false, field: 'author', message: 'Add your name or a nickname so we know who planted it.' };
  if (!authorCharacters.test(author)) return { ok: false, field: 'author', message: MODERATION_MESSAGES.author };
  if (!/[a-z]/i.test(author)) return { ok: false, field: 'author', message: MODERATION_MESSAGES.author };
  if (!noteCharacters.test(note)) return { ok: false, field: 'note', message: MODERATION_MESSAGES.note };
  if (note.trim() && !/[a-z]/i.test(note)) return { ok: false, field: 'note', message: MODERATION_MESSAGES.note };
  const noteWords = normalizeForModeration(note).match(/[a-z]+/g) ?? [];
  const foreignHits = noteWords.filter(word => nonEnglishHints.has(word));
  if (foreignHits.some(word => ['hola', 'bonjour', 'ciao', 'gracias', 'merci', 'guten', 'danke', 'hallo'].includes(word)) || foreignHits.length >= 2) {
    return { ok: false, field: 'note', message: MODERATION_MESSAGES.note };
  }
  if (containsUnsafePlantText(author, note)) return { ok: false, field: 'combined', message: MODERATION_MESSAGES.unsafe };
  return { ok: true };
}
