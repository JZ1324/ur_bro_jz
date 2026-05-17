export type ProfileStat = {
  label: 'Posts' | 'Followers' | 'Following';
  value: number;
};

export type ProfileData = {
  displayName: string;
  handle: string;
  bio: string;
  imageSrc: string;
  instagramUrl: string;
  stats: ProfileStat[];
};

export type StoryItem = {
  id: 'projects' | 'about' | 'school' | 'music' | 'leadership';
  label: string;
  icon: 'folder' | 'user' | 'graduationCap' | 'music' | 'users';
  locked: boolean;
  action: 'projects' | 'about' | 'lockedArchive';
};

export type ArchiveSectionId = 'school' | 'music' | 'leadership';

export type ArchiveSection = {
  id: ArchiveSectionId;
  title: string;
  subtitle: string;
  icon: 'graduationCap' | 'music' | 'users';
  locked: boolean;
};

export type PrivateArchivePhoto = {
  id: string;
  alt: string;
  caption: string;
  signedUrl: string;
  expiresAt: string;
};

export type PrivateArchiveSection = {
  sectionId: ArchiveSectionId;
  title: string;
  subtitle: string;
  summary: string;
  items: string[];
  photos: PrivateArchivePhoto[];
};

export type NowItem = {
  label: string;
  title: string;
  body: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  what: string;
  why: string;
  status: string;
  image: string;
  tags: string[];
  tech: string[];
  link: string;
};

export type AboutSection = {
  id: string;
  title: string;
  level: 2 | 3 | 4;
  body: string[];
};

export type PlaceholderContent = {
  eyebrow?: string;
  title: string;
  description: string;
  items: string[];
  actionLabel?: string;
  actionHref?: string;
};

export const profileData: ProfileData = {
  displayName: 'ur_bro_jz',
  handle: '@ur_bro_jz',
  bio: 'Romans 12:16-21',
  imageSrc: '/instagram-profile.jpg',
  instagramUrl: 'https://www.instagram.com/ur_bro_jz/',
  stats: [
    { label: 'Posts', value: 1 },
    { label: 'Followers', value: 89 },
    { label: 'Following', value: 91 },
  ],
};

export const storyItems: StoryItem[] = [
  { id: 'projects', label: 'Projects', icon: 'folder', locked: false, action: 'projects' },
  { id: 'about', label: 'About', icon: 'user', locked: false, action: 'about' },
  { id: 'school', label: 'School', icon: 'graduationCap', locked: true, action: 'lockedArchive' },
  { id: 'music', label: 'Music', icon: 'music', locked: true, action: 'lockedArchive' },
  { id: 'leadership', label: 'Leadership', icon: 'users', locked: true, action: 'lockedArchive' },
];

export const nowItems: NowItem[] = [
  {
    label: 'Building',
    title: 'Private archive profile',
    body: 'Turning a simple Instagram handle into a darker, more personal web space with stories, locked sections, and project notes.',
  },
  {
    label: 'Learning',
    title: 'Interfaces with restraint',
    body: 'Practicing layouts that feel polished without getting loud: better spacing, readable type, smoother motion, and cleaner content.',
  },
  {
    label: 'Listening / Practicing',
    title: 'Quiet reps',
    body: 'Keeping room for music, reflection, and small creative experiments that do not need to be posted everywhere.',
  },
];

export const archiveSections: ArchiveSection[] = [
  {
    id: 'school',
    title: 'School Archive',
    subtitle: 'Coursework, learning goals, and study notes',
    icon: 'graduationCap',
    locked: true,
  },
  {
    id: 'music',
    title: 'Music Archive',
    subtitle: 'Practice, references, and sounds worth keeping',
    icon: 'music',
    locked: true,
  },
  {
    id: 'leadership',
    title: 'Leadership Archive',
    subtitle: 'Roles, service, values, and lessons learned',
    icon: 'users',
    locked: true,
  },
];

export const aboutSections: AboutSection[] = [
  {
    id: 'about-intro',
    title: 'JZ archive, built from the feed up.',
    level: 2,
    body: [
      'This space mirrors the public Instagram profile: a small archive around identity, faith, creative work, and the projects that are still taking shape.',
      'The goal is to feel like a profile that has room to breathe: part portfolio, part private archive, part place to collect the details that do not fit cleanly inside a single post.',
    ],
  },
  {
    id: 'about-bio',
    title: 'Bio',
    level: 3,
    body: [
      'Romans 12:16-21',
      'The profile is private, so the site keeps the public-facing details tight and intentional instead of pretending to show content that is not publicly visible.',
      'Romans 12:16-21 points the page toward humility, peace, patience, and doing good even when the internet rewards the opposite. That makes the About page quieter on purpose: less performance, more signal.',
    ],
  },
  {
    id: 'about-focus',
    title: 'Focus',
    level: 3,
    body: ['Faith, friends, creative projects, and design experiments are the core threads that shape this archive.'],
  },
  {
    id: 'about-faith',
    title: 'Faith',
    level: 4,
    body: [
      'Faith is the anchor for the page. It shows up in the bio, but it also shapes the restraint of the design: simple copy, warm colors, and room for reflection.',
    ],
  },
  {
    id: 'about-friends',
    title: 'Friends',
    level: 4,
    body: [
      'The profile picture centers a shared moment instead of a solo portrait. The site keeps that same feeling by making the archive personal without turning it into a loud showcase.',
    ],
  },
  {
    id: 'about-projects',
    title: 'Creative Projects',
    level: 4,
    body: [
      'The archive is built for experiments: interface ideas, small tools, design systems, music notes, and unfinished concepts that are still worth saving.',
    ],
  },
  {
    id: 'about-archive',
    title: 'Archive Style',
    level: 3,
    body: [
      'The site borrows from Instagram stories, private collections, and portfolio grids. Locked highlights create a sense of discovery, while the project matrix gives the page a more interactive layer.',
    ],
  },
  {
    id: 'about-now',
    title: 'Now',
    level: 3,
    body: [
      'Right now the page is focused on turning a simple profile into a fuller digital identity. The foundation is already here: a profile, an archive, project cards, and a few interactions that make the site feel custom.',
      'The private archive is designed to load sensitive notes and photos from Supabase only after the access key is checked server-side, keeping private media out of the public source bundle.',
    ],
  },
  {
    id: 'about-links',
    title: 'Links',
    level: 3,
    body: [
      'Instagram is the source profile for this page. The site keeps a local copy of the profile image and uses only the public profile details that were visible without logging in.',
    ],
  },
];

export const focusItems = ['Faith', 'Friends', 'Creative projects', 'Design experiments'];

export const profileFacts = [
  { title: 'Public name', value: 'JZ' },
  { title: 'Handle', value: '@ur_bro_jz' },
  { title: 'Profile state', value: 'Private' },
  { title: 'Current bio', value: 'Romans 12:16-21' },
];

export const archiveStyleItems = [
  'Profile-first layout with an Instagram-style stat row.',
  'Server-checked vault behavior for sections that should stay out of the public bundle.',
  'Animated text moments that make the archive feel alive.',
  'Local profile image storage so the page does not depend on expiring social CDN links.',
];

export const projects: Project[] = [
  {
    id: 'ds-builder',
    title: 'Archive Interface System',
    description: 'The visual language behind this private profile: dark panels, story buttons, motion, and readable archive cards.',
    longDescription: 'A reusable set of interface patterns for making the site feel like one complete archive instead of separate effects. It covers color, spacing, locked states, modals, and profile-first layout decisions.',
    what: 'A small design system for the archive: profile cards, locked highlights, modals, project surfaces, and motion rules.',
    why: 'The site needs to feel private and cinematic without becoming hard to read or looking unfinished.',
    status: 'Active. The core style is in place, with content sections being filled in.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKu4za2uG_gLwPIOf1prITYHvEZVm1rfskvSD7BbuqEAo_eJJPPxywM0HhckI9xGfF3aSdZ07gMCMHvzNiq0FpoiGGQzP2FOE0_NkCW25dP1fCj0d7avfBcy0AoGfkYbacLRJYzlW3VpmvpGfc_o8UzBhnaxrn82NxIMNUynR_phpKJKfzMa2DnixhIftzEHkj5uqe8mxFHoUAIDJb45p6_3JXljIkIf2pi224wkYSMp7GlxLXvzlarPke2Eu_lKi0_KinHZBB0w4',
    tags: ['UI', 'Archive', 'Design'],
    tech: ['Vite', 'Tailwind CSS', 'TypeScript', 'Framer Motion'],
    link: 'https://github.com/jz-archive/ds-builder',
  },
  {
    id: 'portfolio-code',
    title: 'ur_bro_jz Web Archive',
    description: 'The actual static site that turns @ur_bro_jz into a profile, archive, and locked collection.',
    longDescription: 'The main codebase for this page. It uses local data, reusable React components, animated text, and static front-end interactions to create a personal archive without adding a backend.',
    what: 'A Vite + React personal archive site built around one Instagram profile and a locked-story concept.',
    why: 'A normal link page would feel too generic. This gives the handle a clearer identity and a more memorable first impression.',
    status: 'In progress. The structure is working; the next step is replacing remaining sample content with personal details.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuANRJKzGBk9wDa_GkbBdZvfWo6pqpTVSm4SnRBstrM6aCoAZP6CRSwRVsBha6j_wbbezQMuOve9x7pNefAi4rkGmayRVLJ3i4X5z5zvuyWr4fwW4T-vgeOTJnmpVvht2Q8PxAzCXitqhTBQG_QhhCrNCO5s163UgLJDbeROrYOLpc36RWVsFh7KVsJRQ62to1lH-I9AOJ1cMKULo5LGpEvZ-mhZ8v274tGnZfgSvPfuOMniNOxgansAESEOBhtVYlPcnlCw36DZVCU',
    tags: ['Web', 'React', 'Static'],
    tech: ['React', 'TypeScript', 'Tailwind CSS', 'Motion'],
    link: 'https://github.com/jz-archive/portfolio',
  },
  {
    id: 'api-engine',
    title: 'Private Vault Flow',
    description: 'A server-checked access-key flow for opening private archive sections without bundling private photos into the site.',
    longDescription: 'A Supabase-backed vault pattern that keeps School, Music, and Leadership media out of src, public, and the production bundle. The frontend sends the key to an Edge Function, then renders short-lived signed URLs only when access is accepted.',
    what: 'A private archive flow connected to Supabase private Storage, Edge Functions, and temporary signed photo URLs.',
    why: 'The locked story buttons should feel cinematic, but private photos need real server-side gating instead of a static frontend password.',
    status: 'Ready for Supabase setup. The frontend fails closed until the private bucket, function secrets, and environment URL are configured.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVaZzTzJDG_a2HrH3Q_vZeAyKV4NHXx4BKD0-gIKKRyPWnfK2xjKA3Z-Uqkw8epeO_ypkHr6U_UjbKktZolKhQQJ7Mojz_EGEtRt4sQz1sjMpn0Urw9t3h8p2ZRUePtbffPS5wVIaEWLb8UAU9O2j5pXDK1mhhCBwjtlbB3tGboSlrB14SNpoq9ToJSI119EjihO4e7gD5UAiPv9uf1SCVYWpy5_L4OCX68oWK_-O4ea7pR_ib8SCev0wx9q_2PkVd2mDMjNqfJlc',
    tags: ['Vault', 'UX', 'Logic'],
    tech: ['React State', 'Motion', 'Input OTP', 'Static Data'],
    link: 'https://github.com/jz-archive/api-engine',
  },
  {
    id: 'wireframe-kit',
    title: 'Story Section Map',
    description: 'A content structure for turning Projects, About, School, Music, and Leadership into real destinations.',
    longDescription: 'A planning layer for the archive content. It defines what each story should contain, how much copy belongs in each section, and where placeholder content should become real.',
    what: 'A content map for the story highlights and the sections they open.',
    why: 'The site feels finished only when every visible control has a reason to exist.',
    status: 'Drafted. Ready to keep expanding as more real school, music, and leadership details are added.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAKmK3vz2fdlq04L-C6RuoU9ZaW0g7Jgp0XFLQslqFY5mKip7uDcSpzAJKTdbAa_vcsZrbQ0VjVHmgtCslQZ8uGJJ8qh_ycxq5DV9s6naI14guY2tEbNFoN64a8WFaG6gaLoH7ltouAojhLFeiaE0HgSOnn03mcz1I_sYklbI084STfNb73zf4106WVxGJd5ISpNKsHOB7W2aOUr8t2TNQmCwauTZ5lpYdNpTg-E5BYVyc6gozUKsPJG-xtjLumUwTGanzCqbrsTUE',
    tags: ['UX', 'Content', 'Stories'],
    tech: ['Information Architecture', 'React Data', 'Responsive UI', 'Copywriting'],
    link: 'https://figma.com/community/file/jz-wireframes',
  },
];

export const placeholders: Record<string, PlaceholderContent> = {
  create: {
    eyebrow: 'Archive Tool',
    title: 'New entry queue',
    description: 'This control is reserved for adding new archive entries. For now it shows what the publishing flow would collect before anything becomes public.',
    items: ['Draft title and short note', 'Choose section: School, Music, Leadership, or Projects', 'Attach image, link, or private reference'],
  },
  grid: {
    eyebrow: 'View Control',
    title: 'Archive display modes',
    description: 'The grid control is staged for future view switching. The current site keeps the cinematic matrix as the main public view.',
    items: ['Matrix view: active', 'Compact cards: planned', 'Timeline list: planned'],
  },
  menu: {
    eyebrow: 'Quick Menu',
    title: 'Archive controls',
    description: 'A compact place for settings and quick links without crowding the profile card.',
    items: ['Theme toggle lives in the header', 'Archive access uses the story lock', 'Instagram remains the public contact link'],
  },
  resume: {
    eyebrow: 'Resume',
    title: 'Resume not public yet',
    description: 'The resume action is intentionally staged. The site can link a PDF later, but for now contact should go through Instagram.',
    items: ['Add a resume PDF to public files', 'Link the current version from this button', 'Keep personal details off the static page until ready'],
    actionLabel: 'Message on Instagram',
    actionHref: 'https://www.instagram.com/ur_bro_jz/',
  },
};
