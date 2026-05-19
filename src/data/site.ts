export type ProfileStat = {
  label: 'Posts' | 'Following';
  value: number;
};

export type ProfileData = {
  displayName: string;
  handle: string;
  bio: string;
  imageSrc: string;
  instagramUrl: string;
  dumpsUrl: string;
  stats: ProfileStat[];
  track?: ProfileTrack;
};

export type ProfileTrackSource = {
  src: string;
  type: 'audio/mpeg';
  quality: 'high' | 'medium' | 'low';
  bitrateKbps: number;
};

export type ProfileTrack = {
  title: string;
  artist: string;
  note: string;
  provider: string;
  artworkSrc: string;
  sources: ProfileTrackSource[];
  lyrics?: string;
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

export type FaithHover = {
  title: string;
  description: string;
  previewVideoSrc: string;
  points: string[];
  closing: string;
};

export type FaithSection = {
  id: string;
  title: string;
  body: string[];
  verses?: {
    reference: string;
    text: string;
  }[];
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

const supabaseStorageUrl = `${(import.meta.env.VITE_SUPABASE_URL || 'https://uajpewjagduzdpwlynrv.supabase.co').replace(
  /\/$/,
  '',
)}/storage/v1/object/public/licensed-audio`;
const supabasePublicVideoUrl = `${(import.meta.env.VITE_SUPABASE_URL || 'https://uajpewjagduzdpwlynrv.supabase.co').replace(
  /\/$/,
  '',
)}/storage/v1/object/public/public-video-previews`;

export const profileData: ProfileData = {
  displayName: 'ur_bro_jz',
  handle: '@ur_bro_jz',
  bio: 'Romans 12:16-21',
  imageSrc: `${import.meta.env.BASE_URL}instagram-profile.jpg`,
  instagramUrl: 'https://www.instagram.com/ur_bro_jz/',
  dumpsUrl: 'https://www.instagram.com/ur_bro._.jz',
  stats: [
    { label: 'Posts', value: 1 },
    { label: 'Following', value: 1 },
  ],
  track: {
    title: 'So Easy',
    artist: 'Olivia Dean',
    note: 'licensed Supabase stream',
    provider: 'Supabase',
    artworkSrc: `${import.meta.env.BASE_URL}olivia-dean-art-of-loving-cover.jpg`,
    sources: [
      {
        src: `${supabaseStorageUrl}/so-easy-320.mp3`,
        type: 'audio/mpeg',
        quality: 'high',
        bitrateKbps: 320,
      },
      {
        src: `${supabaseStorageUrl}/so-easy-160.mp3`,
        type: 'audio/mpeg',
        quality: 'medium',
        bitrateKbps: 160,
      },
      {
        src: `${supabaseStorageUrl}/so-easy-96.mp3`,
        type: 'audio/mpeg',
        quality: 'low',
        bitrateKbps: 96,
      },
    ],
    // local TTML lyrics file (dev)
    lyrics: new URL('../../local-audio/So Easy (To Fall In Love) - Olivia Dean.ttml', import.meta.url).href,
  },
};

export const faithHover: FaithHover = {
  title: 'Why I follow Jesus',
  description: 'Because Jesus is my Lord and Saviour: He died for my sins, rose again, and gives forgiveness, hope, and new life.',
  previewVideoSrc: `${supabasePublicVideoUrl}/jesus-christ-holy-light-moewalls-com.mp4`,
  points: [
    'The Gospel is that Jesus lived without sin, died on the cross for our sins, and rose again.',
    'Salvation is a gift of grace: we turn from sin, trust in Him, and receive forgiveness and new life.',
    'Following Him means humility, peace, patience, mercy, and overcoming evil with good.',
  ],
  closing: 'Romans 12:16-21 is the verse behind the bio and the way this page points back to Him.',
};

export const faithSections: FaithSection[] = [
  {
    id: 'jesus',
    title: 'Who Jesus Is',
    body: [
      'Jesus Christ is the Son of God: fully God and fully man. He came into the world not just as a teacher or example, but as the Saviour promised by God.',
      'He showed the heart of God with perfect truth, mercy, holiness, and love. In Him, we see God coming near to rescue people who could not rescue themselves.',
    ],
    verses: [
      { reference: 'John 1:14', text: 'The Word was made flesh, and dwelt among us.' },
      { reference: 'Colossians 1:15', text: 'The image of the invisible God.' },
      { reference: 'John 14:6', text: 'The way, the truth, and the life.' },
    ],
  },
  {
    id: 'gospel',
    title: 'What the Gospel Is',
    body: [
      'The Gospel is the good news that Jesus lived without sin, died on the cross for our sins, and rose again in victory over sin and death.',
      'Because of Him, forgiveness is not earned by trying to be good enough. It is received by grace through faith: turning from sin, trusting Jesus, and receiving new life from God.',
    ],
    verses: [
      { reference: 'Romans 5:8', text: 'While we were yet sinners, Christ died for us.' },
      { reference: '1 Corinthians 15:3-4', text: 'Christ died for our sins, was buried, and rose again.' },
      { reference: 'Ephesians 2:8-9', text: 'By grace are ye saved through faith.' },
    ],
  },
  {
    id: 'following',
    title: 'What Following Him Means',
    body: [
      'Following Jesus means belonging to Him, learning His ways, and letting His love shape how we live. It is not just a label; it changes what we value and how we treat people.',
      'Romans 12:16-21 points toward humility, peace, patience, mercy, and overcoming evil with good. That is the direction behind the bio and the reason the Following count is one.',
    ],
    verses: [
      { reference: 'Luke 9:23', text: 'Take up his cross daily, and follow me.' },
      { reference: 'Romans 12:18', text: 'Live peaceably with all men.' },
      { reference: 'Romans 12:21', text: 'Overcome evil with good.' },
    ],
  },
  {
    id: 'hope',
    title: 'The Hope',
    body: [
      'The hope of the Gospel is not just self-improvement. It is reconciliation with God, a clean heart, and eternal life through Jesus Christ.',
      'This page is still an about-me archive, but the center is meant to point higher: to the Lord and Saviour Jesus Christ.',
    ],
    verses: [
      { reference: 'John 3:16', text: 'God so loved the world.' },
      { reference: '2 Corinthians 5:17', text: 'If any man be in Christ, he is a new creature.' },
      { reference: 'John 20:31', text: 'That believing ye might have life through his name.' },
    ],
  },
  {
    id: 'historical-reasons',
    title: 'Historical Reasons',
    body: [
      'One reason I take the Bible seriously is how it came together across history. It is not one short book written in one sitting. It is a library of 66 books, written over roughly 1,500 years, by about 40 human authors from different times, places, and backgrounds.',
      'That means the Bible includes law, poetry, prophecy, history, wisdom, letters, and eyewitness testimony. Yet the story keeps moving in one direction: creation, rebellion, promise, rescue, and restoration.',
      'Christians believe that unified story points to one person: Jesus Christ. The Old Testament builds the promise and pattern, and the New Testament announces that Jesus is the fulfilment: the King, the Saviour, the crucified and risen Lord.',
      'That unity across centuries is not the only reason to believe, but it is one of the reasons I find the Bible historically and spiritually weighty.',
    ],
    verses: [
      { reference: 'Luke 24:27', text: 'Moses and all the prophets point toward Christ.' },
      { reference: 'Hebrews 1:1-2', text: 'God hath spoken unto us by his Son.' },
      { reference: '2 Timothy 3:16', text: 'All scripture is given by inspiration of God.' },
    ],
  },
];

export const storyItems: StoryItem[] = [
  { id: 'projects', label: 'Projects', icon: 'folder', locked: false, action: 'projects' },
  { id: 'about', label: 'About', icon: 'user', locked: true, action: 'about' },
  { id: 'school', label: 'School', icon: 'graduationCap', locked: true, action: 'lockedArchive' },
  { id: 'music', label: 'Music', icon: 'music', locked: true, action: 'lockedArchive' },
  { id: 'leadership', label: 'Leadership', icon: 'users', locked: true, action: 'lockedArchive' },
];

export const nowItems: NowItem[] = [
  {
    label: 'Site',
    title: 'ur_bro_jz',
    body: 'This is the main place for my projects, profile, and the private archive sections.',
  },
  {
    label: 'School',
    title: 'Locked notes',
    body: 'School stuff stays private unless you have the access key.',
  },
  {
    label: 'Music',
    title: 'Classified track',
    body: 'This song is staying here for a reason. Maybe it is about someone.',
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
      'The site borrows from Instagram stories, private collections, and portfolio grids. Locked highlights create a sense of discovery, while the project grid gives the page a more interactive layer.',
    ],
  },
  {
    id: 'about-now',
    title: 'Now',
    level: 3,
    body: [
      'Right now the page is focused on turning a simple profile into a fuller digital identity. The foundation is already here: a profile, an archive, project cards, and a few interactions that make the site feel custom.',
      'The private archive keeps sensitive notes and photos out of the public source bundle, with access reserved for people who get the password directly from @ur_bro_jz.',
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

const liveScreenshot = (url: string) => {
  const params = new URLSearchParams({
    url,
    screenshot: 'true',
    meta: 'false',
    embed: 'screenshot.url',
    colorScheme: 'dark',
    'viewport.isMobile': 'false',
    'viewport.deviceScaleFactor': '1',
    'viewport.width': '1440',
    'viewport.height': '900',
  });

  return `https://api.microlink.io/?${params.toString()}`;
};

export const projects: Project[] = [
  {
    id: 'ur-bro-jz',
    title: 'ur_bro_jz',
    description: 'This dark private archive site, built around the @ur_bro_jz profile, locked stories, and project grid.',
    longDescription: 'The current About Me archive site. It combines an Instagram-inspired profile, animated handle, locked story sections, Supabase-backed private archive flow, and a cinematic project grid.',
    what: 'A Vite + React personal archive for @ur_bro_jz with public profile content and private sections kept behind an access-key flow.',
    why: 'A normal link page felt too plain, so this repo turns the profile into a more personal archive with stronger visual identity.',
    status: 'Live on GitHub Pages and actively being polished.',
    image: liveScreenshot('https://jz1324.github.io/ur_bro_jz/'),
    tags: ['Live', 'Archive', 'React'],
    tech: ['Vite', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase'],
    link: 'https://jz1324.github.io/ur_bro_jz/',
  },
  {
    id: 'about-me',
    title: 'about-me',
    description: 'A newer TypeScript about-me experiment with a live GitHub Pages deployment.',
    longDescription: 'A recent TypeScript personal site repo. It works as another about-me direction and shows the path that led into the more cinematic ur_bro_jz archive.',
    what: 'A TypeScript personal website experiment deployed as a static GitHub Pages site.',
    why: 'It is a quick place to test layout ideas, profile copy, and how a personal homepage should feel before moving the best parts into the main archive.',
    status: 'Live on GitHub Pages. Still has some starter-project traces, but it is useful as a design checkpoint.',
    image: liveScreenshot('https://jz1324.github.io/about-me/'),
    tags: ['Live', 'About', 'TypeScript'],
    tech: ['TypeScript', 'Next.js', 'React', 'GitHub Pages'],
    link: 'https://jz1324.github.io/about-me/',
  },
  {
    id: 'pro-timetable',
    title: 'Pro Timetable',
    description: 'A standalone premium timetable app with its own live Vercel deployment.',
    longDescription: 'A dedicated timetable project focused on making school schedule planning feel cleaner and more premium. The repo description marks it as a standalone copy of Premium Timetable.',
    what: 'A live web timetable app for viewing and managing schedule information in a cleaner interface.',
    why: 'Timetables are usually ugly or hard to scan, so this project turns the schedule into something faster and nicer to use.',
    status: 'Live on Vercel. Last pushed April 2026.',
    image: `${import.meta.env.BASE_URL}project-pro-timetable.png`,
    tags: ['Live', 'Timetable', 'Web App'],
    tech: ['JavaScript', 'Vercel', 'Frontend UI', 'Deployment'],
    link: 'https://pro-timetable.vercel.app',
  },
  {
    id: 'premium-timetable',
    title: 'Premium Timetable',
    description: 'The original timetable project behind the newer Pro Timetable version.',
    longDescription: 'The earlier timetable build and documentation base. Its README includes docs for parser work, deployment, setup, features, and fixes, which makes it the foundation for the later standalone Pro Timetable app.',
    what: 'A timetable web project and documentation base for schedule features, deployment, and parser improvements.',
    why: 'It captures the original timetable idea and the rougher build process before the standalone version was split out.',
    status: 'Live on GitHub Pages as an older build.',
    image: liveScreenshot('https://jz1324.github.io/Premium-Timetable/'),
    tags: ['Live', 'Timetable', 'Docs'],
    tech: ['JavaScript', 'GitHub Pages', 'Documentation', 'Frontend'],
    link: 'https://jz1324.github.io/Premium-Timetable/',
  },
  {
    id: 'imessaging',
    title: 'iMessage Stats',
    description: 'A local iMessage analytics project that turns chat.db into readable stats and reports.',
    longDescription: 'A Swift and local-report project for generating iMessage stats without AI analysis. The README describes totals, sent and received counts, response-time stats, left-on-read counts, per-chat breakdowns, and standalone HTML reports.',
    what: 'A local macOS/iMessage stats tool with a product page and report-generation workflow.',
    why: 'Messages data is interesting when it is visual and private, so this keeps analysis local while still producing useful summaries.',
    status: 'Live product page on GitHub Pages. The repo includes Swift/macOS app direction and local report tooling.',
    image: liveScreenshot('https://jz1324.github.io/Imessaging/'),
    tags: ['Live', 'macOS', 'Stats'],
    tech: ['Swift', 'SwiftUI', 'Python', 'HTML Reports', 'GitHub Pages'],
    link: 'https://jz1324.github.io/Imessaging/',
  },
  {
    id: 'clipboard-manager',
    title: 'Clipboard Manager',
    description: 'A macOS clipboard manager concept with history, passcode protection, search, and themes.',
    longDescription: 'A macOS clipboard manager project focused on making clipboard history easier to search, protect, and reuse. The README lists passcode protection, full history, custom themes, dark mode, smart search, and rich content support.',
    what: 'A clipboard management app concept with a public GitHub Pages project page.',
    why: 'Clipboard history is useful but usually hidden. This project makes it feel more controlled, searchable, and personal.',
    status: 'Live on GitHub Pages as a project page. Repo last pushed January 2026.',
    image: liveScreenshot('https://jz1324.github.io/ClipBoard-Manager/'),
    tags: ['Live', 'macOS', 'Utility'],
    tech: ['CSS', 'macOS UI', 'GitHub Pages', 'Frontend'],
    link: 'https://jz1324.github.io/ClipBoard-Manager/',
  },
];

export const placeholders: Record<string, PlaceholderContent> = {
  create: {
    eyebrow: 'Archive Tool',
    title: 'Capture an entry',
    description: 'A quiet sketch of the archive publishing flow: decide what the entry is, where it belongs, and whether it should stay private.',
    items: ['Draft title and short note', 'Choose section: School, Music, Leadership, or Projects', 'Attach image, link, or private reference'],
  },
  grid: {
    eyebrow: 'View Control',
    title: 'Display modes',
    description: 'The public archive is currently tuned for the clean project grid. These modes describe how the same entries can be scanned later.',
    items: ['Project grid: active', 'Compact cards: saved as a future view', 'Timeline list: reserved for dated entries'],
  },
  menu: {
    eyebrow: 'Quick Menu',
    title: 'Archive controls',
    description: 'A compact place for settings and quick links without crowding the profile card.',
    items: ['Theme toggle lives in the header', 'Archive access uses the story lock', 'Instagram remains the public contact link'],
  },
  resume: {
    eyebrow: 'Resume',
    title: 'Resume by request',
    description: 'The public page keeps personal details light. For now, the clean contact path is Instagram, and a resume can be shared directly when needed.',
    items: ['Keep public details minimal', 'Share the current version directly', 'Avoid storing extra personal information on the static page'],
    actionLabel: 'Message on Instagram',
    actionHref: 'https://www.instagram.com/ur_bro_jz/',
  },
};
