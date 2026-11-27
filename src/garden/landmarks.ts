import type { SectionId } from './journey';
export type TimeOfDay = 'day' | 'dusk';
export const gardenPins: { id: SectionId; label: string; position: [number, number, number]; meshPrefixes: string[] }[] = [
  { id: 'about', label: 'My story', position: [.3, 4.5, -2.1], meshPrefixes: ['Story_cherry'] },
  { id: 'projects', label: 'Things I make', position: [-3.55, 1.4, -.1], meshPrefixes: ['Projects_', 'Workbench_plants'] },
  { id: 'memories', label: 'My photos', position: [3.95, 2.6, -.65], meshPrefixes: ['Small_cherry'] },
  { id: 'contact', label: 'Say hello', position: [3.8, 1.5, 2.3], meshPrefixes: ['Contact_mailbox'] },
];
