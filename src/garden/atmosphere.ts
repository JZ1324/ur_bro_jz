import { journeyFrame, sectionIds, type SectionId } from './journey.ts';
import type { Theme } from '../themePreference';

type Atmosphere = { paper: string; accent: string; wash: string; sun: string; sky: string; fill: string };

/** The page, graphic backdrop, and 3D lights share one palette per chapter. */
export const chapterAtmospheres: Record<SectionId, Atmosphere> = {
  opening: { paper: '#f6f5ed', accent: '#5e704a', wash: '#e3e7d1', sun: '#fff1d5', sky: '#fff5e2', fill: '#d6e5ee' },
  about: { paper: '#f3e7e5', accent: '#8d5664', wash: '#dcb5bf', sun: '#ffe4d9', sky: '#f7dfe8', fill: '#ead1df' },
  projects: { paper: '#e4eeea', accent: '#426757', wash: '#a6c9be', sun: '#edf8ea', sky: '#dfefe9', fill: '#b7dce1' },
  school: { paper: '#f1e8d6', accent: '#806039', wash: '#ddc799', sun: '#ffe9bf', sky: '#f9edd4', fill: '#e6d6b9' },
  music: { paper: '#e9e3f1', accent: '#74538d', wash: '#c2aedc', sun: '#eee3ff', sky: '#e5def5', fill: '#c6b3e8' },
  memories: { paper: '#e2ebef', accent: '#466478', wash: '#aac8d8', sun: '#e8f0fa', sky: '#dfebf5', fill: '#b2c9e1' },
  contact: { paper: '#f2e2d8', accent: '#8a553d', wash: '#d9b49a', sun: '#ffe4c3', sky: '#f8e8d9', fill: '#e8c7b2' },
};

// Night chapters share a forest floor; only the soft wash and accent vary.
export const nightAtmospheres: Record<SectionId, Pick<Atmosphere, 'paper' | 'accent' | 'wash'>> = {
  opening: { paper: '#0d1714', accent: '#b5c9a6', wash: '#1c3226' },
  about: { paper: '#101816', accent: '#d7acb4', wash: '#30252b' },
  projects: { paper: '#0d1815', accent: '#a9c9b7', wash: '#19372d' },
  school: { paper: '#131914', accent: '#d1c199', wash: '#302e1e' },
  music: { paper: '#111716', accent: '#c6b7ce', wash: '#282637' },
  memories: { paper: '#0e1818', accent: '#adc6cf', wash: '#1b3037' },
  contact: { paper: '#141916', accent: '#d9b6a0', wash: '#342b22' },
};

function mixColor(a: string, b: string, amount: number) {
  const channels = [1, 3, 5].map(offset => {
    const start = parseInt(a.slice(offset, offset + 2), 16);
    return Math.round(start + (parseInt(b.slice(offset, offset + 2), 16) - start) * amount);
  });
  return `rgb(${channels.join(' ')})`;
}

export function sampleAtmosphere(progress: number, reducedMotion = false, theme: Theme = 'light') {
  const frame = journeyFrame(progress, reducedMotion);
  const palette = theme === 'dark' ? nightAtmospheres : chapterAtmospheres;
  const a = palette[sectionIds[frame.from]], b = palette[sectionIds[frame.to]];
  return {
    ...frame,
    paper: mixColor(a.paper, b.paper, frame.mix),
    accent: mixColor(a.accent, b.accent, frame.mix),
    wash: mixColor(a.wash, b.wash, frame.mix),
  };
}
