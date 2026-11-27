export const sectionIds = ['opening', 'about', 'projects', 'school', 'music', 'memories', 'contact'] as const;
export type SectionId = typeof sectionIds[number];
export const LAST_STAGE = sectionIds.length - 1;

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function smoothstep(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

/** No time or scroll direction enters this calculation: reversal is exact. */
export function journeyFrame(progress: number, reducedMotion = false) {
  const position = clamp(progress) * LAST_STAGE;
  const from = Math.min(LAST_STAGE, Math.floor(position + 1e-7));
  const to = Math.min(LAST_STAGE, from + 1);
  const local = clamp(position - from);
  const mix = reducedMotion ? 0 : smoothstep((local - 2 / 3) * 3);
  return { from, to, local, mix, position, section: sectionIds[from] };
}

/** Map measured anchors, including a reachable final anchor, into the timeline. */
export function progressAtScroll(scrollY: number, anchors: readonly number[]) {
  if (anchors.length < 2 || scrollY <= anchors[0]) return 0;
  const last = anchors.length - 1;
  // ScrollTo rounds fractional CSS coordinates to device pixels.
  if (scrollY >= anchors[last] - .75) return 1;
  for (let i = last - 1; i >= 0; i--) {
    if (Math.abs(scrollY - anchors[i]) < .75) return i / last;
    if (scrollY >= anchors[i]) {
      return (i + clamp((scrollY - anchors[i]) / Math.max(1, anchors[i + 1] - anchors[i]))) / last;
    }
  }
  return 0;
}

export function sectionFromHash(hash: string): SectionId {
  const id = hash.replace(/^#/, '');
  if (id === 'story' || id === 'leadership') return 'about';
  if (id === 'joys' || id === 'moments') return 'memories';
  return sectionIds.includes(id as SectionId) ? id as SectionId : 'opening';
}

export function sectionUrl(id: SectionId) {
  return `${window.location.pathname}${window.location.search}${id === 'opening' ? '' : `#${id}`}`;
}
