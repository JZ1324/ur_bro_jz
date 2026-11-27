import type { SectionId } from '../garden/journey';

/** Public content from https://ur-bro-jz.vercel.app/, reviewed 14 September 2026.
 * Private About, School, Music, and Leadership notes stay behind the existing access gate.
 * Edit these records to update the garden without changing its components.
 */
const base = import.meta.env.BASE_URL;

export const profile = {
  name: 'JZ',
  handle: '@ur_bro_jz',
  portrait: `${base}instagram-profile.jpg`,
  intro: 'I build study tools and macOS apps. This is where I keep my projects, photos and a bit about my faith.',
  faith: {
    verse: 'Romans 12:16–21',
    quote: 'Overcome evil with good.',
    description: 'This is the verse in my bio. It reminds me to stay humble, make peace where I can and be kind even when it’s hard.',
    paragraphs: [
      'I follow Jesus. I believe He died for our sins and rose again so we could be forgiven and have new life.',
      'I believe salvation is a gift from God, received through faith. I’m learning to follow Him in how I live and treat people.',
    ],
  },
  music: {
    title: 'So Easy',
    artist: 'Olivia Dean',
    cover: `${base}olivia-dean-art-of-loving-cover.jpg`,
    note: 'This song is staying here for a reason.',
  },
  contact: {
    links: [
      { label: 'Instagram', detail: '@ur_bro_jz', url: 'https://www.instagram.com/ur_bro_jz/' },
      { label: 'My Dumpy', detail: '@ur_bro._.jz', url: 'https://www.instagram.com/ur_bro._.jz' },
    ],
  },
};

export const memories = [
  { image: `${base}photo-gallery/photo-01.jpg`, alt: 'Rocky coastline beside a bright blue ocean', caption: 'bike ride to the beach', stamps: ['stamp-01.png'] },
  { image: `${base}photo-gallery/photo-02.jpg`, alt: 'Yellow tent surrounded by misty mountains', caption: 'camp in the fog', stamps: ['stamp-02.png'] },
  { image: `${base}photo-gallery/photo-03.jpg`, alt: 'Small alpine village beneath the mountains', caption: 'the village below the mountains', stamps: ['stamp-03.png', 'stamp-06.png'] },
  { image: `${base}photo-gallery/photo-04.jpg`, alt: 'Silhouette sitting at a train platform during sunset', caption: 'photo shoot', stamps: ['stamp-04.png'] },
  { image: `${base}photo-gallery/photo-05.jpg`, alt: 'Bicycle resting beneath a cloudy blue sky', caption: 'bike ride', stamps: ['stamp-05.png'] },
];

type SectionContent = { label: string; body: string; object: string };

export const sectionContent: Record<SectionId, SectionContent> = {
  opening: { label: 'Garden', body: profile.intro, object: 'A tiny voxel garden with cherry blossoms, swimming koi in the pond, and a wooden bridge.' },
  about: { label: 'About', body: 'I like making things I’d use myself, usually something for school or my Mac. I follow Jesus, and my faith matters to me.', object: 'The cherry tree, lifted out of the garden, with pale pink voxel blossoms.' },
  projects: { label: 'Projects', body: '', object: 'An ivory and sage voxel chess set on a stepped wooden board, with all 32 pieces in their starting positions.' },
  school: { label: 'School', body: 'A few of my projects started with things I needed for class, especially VCE revision and planning my week.', object: 'Three voxel books in sage, dusty pink, and warm yellow, with a pencil on top.' },
  music: { label: 'Music', body: '', object: 'A pair of sage green voxel headphones with soft ivory padding.' },
  memories: { label: 'Memories', body: 'Photos from bike rides, camp and a photo shoot.', object: 'A vintage sage green voxel camera with an ivory top and a round glass lens.' },
  contact: { label: 'Contact', body: 'Instagram is the easiest way to reach me. Feel free to send me a message.', object: 'A copper voxel mailbox with an ivory envelope, surrounded by the flowers you plant.' },
};
