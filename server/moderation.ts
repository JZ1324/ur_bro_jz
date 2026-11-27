import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import { detect } from 'tinyld';
import { containsUnsafePlantText, normalizeForModeration, validatePlantText, type ModerationResult } from '../src/garden/moderation.ts';

const matcher = new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });
const englishHints = new Set([
  'a', 'about', 'after', 'all', 'and', 'are', 'be', 'beautiful', 'but', 'by', 'day', 'enjoy', 'everyone',
  'flower', 'flowers', 'for', 'friend', 'from', 'garden', 'good', 'growing', 'have', 'hello', 'here', 'hope',
  'i', 'in', 'is', 'it', 'joy', 'kind', 'little', 'love', 'lovely', 'my', 'note', 'of', 'on', 'our', 'please',
  'plant', 'planted', 'this', 'to', 'tiny', 'wishing', 'with', 'you', 'your',
]);

function likelyEnglish(note: string): boolean {
  const letters = (note.match(/[a-z]/gi) ?? []).length;
  if (letters < 20) return true;
  const words = normalizeForModeration(note).match(/[a-z]+/g) ?? [];
  const hints = words.filter(word => englishHints.has(word)).length;
  if (hints >= 2) return true;
  return detect(note) === 'en';
}

export function validateServerPlantText(author: string, note: string): ModerationResult {
  const shared = validatePlantText(author, note);
  if (!shared.ok) return shared;
  const combined = `${author} ${note}`;
  if (matcher.hasMatch(combined) || matcher.hasMatch(normalizeForModeration(combined).replace(/ /g, '')) || containsUnsafePlantText(author, note)) {
    return { ok: false, field: 'combined', message: 'That name or note contains words or a combination that cannot be shared here.' };
  }
  if (note.trim() && !likelyEnglish(note)) return { ok: false, field: 'note', message: 'Write your note in English using simple punctuation.' };
  return { ok: true };
}
