export type ProfileStat = {
  label: 'Posts' | 'Relationship';
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
const supabaseFunctionsUrl = `${(import.meta.env.VITE_SUPABASE_URL || 'https://uajpewjagduzdpwlynrv.supabase.co').replace(
  /\/$/,
  '',
)}/functions/v1`;

export const profileData: ProfileData = {
  displayName: 'ur_bro_jz',
  handle: '@ur_bro_jz',
  bio: 'Romans 12:16-21',
  imageSrc: `${import.meta.env.BASE_URL}instagram-profile.jpg`,
  instagramUrl: 'https://www.instagram.com/ur_bro_jz/',
  dumpsUrl: 'https://www.instagram.com/ur_bro._.jz',
  stats: [
    { label: 'Posts', value: 1 },
    { label: 'Relationship', value: 1 },
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
    lyrics: `${supabaseFunctionsUrl}/get-track-lyrics`,
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
    id: 'why-saving',
    title: 'Why We Need Saving',
    body: [
      'A lot of people think Christianity is mainly about being a good person. But the Bible goes deeper than comparing ourselves to other people. It says the real problem is sin: our hearts, motives, pride, selfishness, and the ways we fall short of God.',
      'That is why we need saving. Not because every person is as bad as possible, but because even our best efforts cannot make us clean before a holy God. We do not just need advice; we need forgiveness, a new heart, and peace with God.',
    ],
    verses: [
      { reference: 'Romans 3:23', text: 'All have sinned, and come short of the glory of God.' },
      { reference: 'Isaiah 64:6', text: 'All our righteousnesses are as filthy rags.' },
      { reference: 'Romans 6:23', text: 'The gift of God is eternal life through Jesus Christ.' },
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
    id: 'not-good-enough',
    title: 'Not Just Good Enough',
    body: [
      'Being kind, respectful, generous, or religious is good, but it cannot erase sin. If salvation depended on being good enough, nobody could know where the line is, and nobody could honestly say they have never failed.',
      'The Gospel is different. Jesus does not save people because they proved themselves worthy. He saves by grace. He takes the guilt, gives forgiveness, and changes people from the inside out.',
    ],
    verses: [
      { reference: 'Titus 3:5', text: 'Not by works of righteousness which we have done.' },
      { reference: '2 Corinthians 5:21', text: 'That we might be made the righteousness of God in him.' },
      { reference: 'John 6:37', text: 'Him that cometh to me I will in no wise cast out.' },
    ],
  },
  {
    id: 'following',
    title: 'What Following Him Means',
    body: [
      'Following Jesus means belonging to Him, learning His ways, and letting His love shape how we live. It is not just a label; it changes what we value and how we treat people.',
      'Romans 12:16-21 points toward humility, peace, patience, mercy, and overcoming evil with good. That is the direction behind the bio and the reason the relationship count is one.',
    ],
    verses: [
      { reference: 'Luke 9:23', text: 'Take up his cross daily, and follow me.' },
      { reference: 'Romans 12:18', text: 'Live peaceably with all men.' },
      { reference: 'Romans 12:21', text: 'Overcome evil with good.' },
    ],
  },
  {
    id: 'response',
    title: 'How We Respond',
    body: [
      'The response is not to pretend we are already fine. It is to come honestly to God: repent, trust Jesus, and receive the mercy He offers.',
      'Faith is not just knowing facts about Jesus. It is trusting Him as Lord and Saviour, and letting that trust shape the way we live.',
    ],
    verses: [
      { reference: 'Mark 1:15', text: 'Repent ye, and believe the gospel.' },
      { reference: 'Romans 10:9', text: 'Confess the Lord Jesus, and believe.' },
      { reference: 'Acts 16:31', text: 'Believe on the Lord Jesus Christ.' },
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
    label: 'Building',
    title: 'Portfolio archive',
    body: 'A dark profile site for projects, notes, music, and the pieces that need more room than a normal bio.',
  },
  {
    label: 'Projects',
    title: 'Pinned builds',
    body: 'Live pages and small tools with enough context to show what each one does and why it exists.',
  },
  {
    label: 'Music',
    title: 'Classified track',
    body: 'This song is staying here for a reason. Maybe it is about a crush.',
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
    title: 'The longer version.',
    level: 2,
    body: [
      'This is the part of the site that explains me a bit more than the front page does.',
      'I still keep it locked because I do not want every detail about me sitting out in public. The outside page can stay simple. This page can have a little more context.',
    ],
  },
  {
    id: 'about-bio',
    title: 'Bio',
    level: 3,
    body: [
      'I build small websites, app ideas, and random UI experiments.',
      'Most of my projects start because I see something that could look or feel better, then I mess with it until it feels right.',
      'I like things that are clean, a bit cinematic, and not too loud. That is why this site feels more like a private archive than a normal portfolio.',
    ],
  },
  {
    id: 'about-focus',
    title: 'Focus',
    level: 3,
    body: ['Right now I am mostly focused on web projects, better layouts, smoother motion, music details, and keeping private stuff actually private.'],
  },
  {
    id: 'about-faith',
    title: 'Faith',
    level: 4,
    body: [
      'My faith matters to me, but I gave it its own page so it does not feel randomly shoved into every section.',
    ],
  },
  {
    id: 'about-friends',
    title: 'Friends',
    level: 4,
    body: [
      'The profile photo is not a solo photo, and I like that. It makes the page feel less like I am trying to sell myself.',
    ],
  },
  {
    id: 'about-projects',
    title: 'Creative Projects',
    level: 4,
    body: [
      'The projects are mostly things I built while learning, testing ideas, or trying to make a better version of something I wanted to use.',
    ],
  },
  {
    id: 'about-hyperframes',
    title: 'Website Videos',
    level: 4,
    body: [
      'I am also interested in turning websites into short cinematic videos: quick demos, project reels, and archive-style clips that show the work better than a static screenshot.',
    ],
  },
  {
    id: 'about-archive',
    title: 'Archive Style',
    level: 3,
    body: [
      'I wanted the site to feel private without looking unfinished. Dark panels, rounded sections, soft motion, and locked areas just fit that better than a plain white portfolio.',
    ],
  },
  {
    id: 'about-now',
    title: 'Now',
    level: 3,
    body: [
      'Right now I am still cleaning the site up: making the music player smoother, making projects clearer, and removing anything that feels like filler.',
      'Private notes and photos stay out of the public code. If someone needs access, they can ask me.',
    ],
  },
  {
    id: 'about-links',
    title: 'Links',
    level: 3,
    body: [
      'Instagram is still the easiest way to reach me. The project section is here so the site is not just another bio link.',
    ],
  },
];

export const focusItems = ['Web projects', 'Better UI', 'Private stuff', 'Music'];

export const profileFacts = [
  { title: 'Public name', value: 'JZ' },
  { title: 'Handle', value: '@ur_bro_jz' },
  { title: 'Profile state', value: 'Locked down' },
  { title: 'Current bio', value: 'Projects, music, and private notes' },
];

export const archiveStyleItems = [
  'The front page stays simple so it does not explain too much at once.',
  'Projects can be public. Personal notes and photos do not need to be.',
  'Motion should make the site feel alive, not annoying.',
  'The whole thing should feel like me, not a template.',
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
    id: 'pro-timetable',
    title: 'Pro Timetable',
    description: 'A cleaner school timetable app with a live Vercel deployment and a more focused schedule UI.',
    longDescription: 'A standalone timetable build focused on making school schedule planning easier to scan. It is one of the more complete public projects because it has a real live deployment and a clear use case.',
    what: 'A web timetable app for viewing and managing class schedule information in a cleaner interface.',
    why: 'School schedules are easy to make cluttered. This project tests how far a timetable can feel polished while still being practical.',
    status: 'Live on Vercel and treated as one of the main pinned builds.',
    image: `${import.meta.env.BASE_URL}project-pro-timetable.png`,
    tags: ['Live', 'Timetable', 'Web App'],
    tech: ['JavaScript', 'Vercel', 'Frontend UI', 'Deployment'],
    link: 'https://pro-timetable.vercel.app',
  },
  {
    id: 'imessaging',
    title: 'iMessage Stats',
    description: 'A local analytics project that turns iMessage data into readable stats and private reports.',
    longDescription: 'A local-report project for generating iMessage stats without sending message data to an external AI service. It focuses on counts, response timing, per-chat breakdowns, and standalone HTML reports.',
    what: 'A local stats tool and product page for turning chat data into readable summaries.',
    why: 'Message data is personal, so the interesting part is making the report useful while keeping the workflow local and controlled.',
    status: 'Live product page on GitHub Pages, with local reporting work behind it.',
    image: liveScreenshot('https://jz1324.github.io/Imessaging/'),
    tags: ['Live', 'macOS', 'Stats'],
    tech: ['Swift', 'SwiftUI', 'Python', 'HTML Reports', 'GitHub Pages'],
    link: 'https://jz1324.github.io/Imessaging/',
  },
  {
    id: 'clipboard-manager',
    title: 'Clipboard Manager',
    description: 'A macOS clipboard manager concept for history, search, passcode protection, and themes.',
    longDescription: 'A macOS clipboard manager concept focused on making copied content easier to find, protect, and reuse. The public page explains the product idea and the feature direction.',
    what: 'A clipboard history utility concept with a public project page and macOS-focused interaction ideas.',
    why: 'Clipboard history is useful but usually hidden. This project explores a more controlled and searchable version of it.',
    status: 'Live on GitHub Pages as a project page and useful as a product-direction prototype.',
    image: liveScreenshot('https://jz1324.github.io/ClipBoard-Manager/'),
    tags: ['Live', 'macOS', 'Utility'],
    tech: ['CSS', 'macOS UI', 'GitHub Pages', 'Frontend'],
    link: 'https://jz1324.github.io/ClipBoard-Manager/',
  },
  {
    id: 'ur-bro-jz',
    title: 'ur_bro_jz',
    description: 'This site: a dark profile archive with projects, music, locked sections, and private Supabase-backed access.',
    longDescription: 'The current portfolio archive. It combines an Instagram-inspired profile, project cards, a music player, locked story sections, and Supabase-backed private archive access.',
    what: 'A Vite + React personal archive with public profile/project content and private sections kept outside the static bundle.',
    why: 'A normal bio link felt too flat. This turns the profile into a more memorable archive while keeping private content separated.',
    status: 'Live and actively being polished as the main personal site.',
    image: liveScreenshot('https://jz1324.github.io/ur_bro_jz/'),
    tags: ['Live', 'Archive', 'React'],
    tech: ['Vite', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase'],
    link: 'https://jz1324.github.io/ur_bro_jz/',
  },
  {
    id: 'premium-timetable',
    title: 'Premium Timetable',
    description: 'The original timetable build that led into the newer Pro Timetable direction.',
    longDescription: 'The earlier timetable project and documentation base. It captures setup, deployment notes, parser work, and the first version of the schedule interface.',
    what: 'An older timetable web project with docs and feature experiments that became the base for later timetable work.',
    why: 'It shows the rougher first pass and the iteration path before the cleaner standalone version.',
    status: 'Live on GitHub Pages as an older but useful checkpoint.',
    image: liveScreenshot('https://jz1324.github.io/Premium-Timetable/'),
    tags: ['Live', 'Timetable', 'Docs'],
    tech: ['JavaScript', 'GitHub Pages', 'Documentation', 'Frontend'],
    link: 'https://jz1324.github.io/Premium-Timetable/',
  },
  {
    id: 'about-me',
    title: 'about-me',
    description: 'A TypeScript personal-site experiment used to test earlier about-me layout ideas.',
    longDescription: 'A smaller TypeScript personal site that works as an earlier design checkpoint. It helped test profile copy, layout structure, and what a personal homepage should feel like.',
    what: 'A static personal website experiment deployed on GitHub Pages.',
    why: 'It gave a quick place to test the about-me direction before moving the stronger ideas into this archive.',
    status: 'Live on GitHub Pages as a design checkpoint.',
    image: liveScreenshot('https://jz1324.github.io/about-me/'),
    tags: ['Live', 'About', 'TypeScript'],
    tech: ['TypeScript', 'Next.js', 'React', 'GitHub Pages'],
    link: 'https://jz1324.github.io/about-me/',
  },
];

export const placeholders: Record<string, PlaceholderContent> = {
  create: {
    eyebrow: 'Archive Tool',
    title: 'New entry',
    description: 'A small sketch of how new archive entries could be saved later without making the page feel crowded.',
    items: ['Write a short note', 'Pick where it belongs', 'Keep private things private'],
  },
  grid: {
    eyebrow: 'View Control',
    title: 'Archive views',
    description: 'The clean grid is the main view for now. Other views can come later if the archive grows enough to need them.',
    items: ['Project grid: active', 'Compact view: saved for later', 'Timeline: only if dated entries matter'],
  },
  menu: {
    eyebrow: 'Quick Menu',
    title: 'Archive controls',
    description: 'A quiet place for controls that should not compete with the profile card.',
    items: ['Theme toggle stays in the header', 'Locked sections open from stories', 'Instagram is the public contact link'],
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
