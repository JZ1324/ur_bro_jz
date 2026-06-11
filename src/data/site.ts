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
  lyricLeadSeconds?: number;
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
  learned?: string;
  status: string;
  image: string;
  tags: string[];
  tech: string[];
  link: string;
  aiAssisted?: boolean;
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

export type JournalEntry = {
  label: string;
  title: string;
  body: string;
};

export type ToolItem = {
  label: string;
  note: string;
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
    lyricLeadSeconds: 0.2,
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
    title: 'This archive',
    body: 'A fun little page about me, made with AI help.',
  },
  {
    label: 'Projects',
    title: 'Pinned builds',
    body: 'These are some projects I have worked on before.',
  },
  {
    label: 'Music',
    title: "It's So Easy to?",
    body: 'Yeah, this is a good song.',
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
      'This is the part of the site with more context than the front page.',
      'I keep it locked because not every detail needs to sit in public. The outside can stay simple; this page can be a little more honest.',
    ],
  },
  {
    id: 'about-bio',
    title: 'Bio',
    level: 3,
    body: [
      'I build small websites, app ideas, and random UI experiments.',
      'Most projects start because I see something that could look or feel better, then I keep messing with it until it feels right.',
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
      'The projects are mostly things I built while learning, testing ideas, or making a cleaner version of something I wanted to use.',
      'Flaccer is the newest one: a macOS-style audio tool for checking whether lossless files are actually lossless.',
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
      'Right now I am cleaning the site up: smoother music, clearer projects, less filler.',
      'Private notes and photos stay out of the public code. If someone needs access, they can ask me.',
    ],
  },
  {
    id: 'about-links',
    title: 'Links',
    level: 3,
    body: [
      'Instagram is still the easiest way to reach me. The project section is here so the site shows the work too.',
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
  'The front page should give the shape, not every detail.',
  'Projects can be public. Personal notes and photos can stay locked.',
  'Motion should feel quiet and alive, not distracting.',
  'If something feels like filler, it should probably go.',
];

export const journalEntries: JournalEntry[] = [
  {
    label: 'what i build',
    title: 'Small things I would actually use',
    body: 'School tools, profile ideas, private archive pieces, and UI experiments that start from a real problem or a random idea I cannot leave alone.',
  },
  {
    label: 'what i am learning',
    title: 'Making things feel less rough',
    body: 'Cleaner spacing, smoother motion, better mobile layouts, Supabase flows, and how to make a page feel finished without adding too much.',
  },
  {
    label: 'how i use ai',
    title: 'Fast drafts, then cleanup by hand',
    body: 'AI helps me move quicker, but I still tune the layout, copy, private parts, and the weird details until it feels like mine.',
  },
  {
    label: 'things i keep private',
    title: 'Not everything needs to be public',
    body: 'Some photos, notes, school stuff, and personal context stay locked. The public page is meant to give the shape, not the whole archive.',
  },
];

export const toolItems: ToolItem[] = [
  { label: 'React', note: 'interfaces' },
  { label: 'TypeScript', note: 'structure' },
  { label: 'Vite', note: 'fast builds' },
  { label: 'Supabase', note: 'private access' },
  { label: 'Vercel', note: 'deploys' },
  { label: 'Swift', note: 'macOS ideas' },
  { label: 'AI tools', note: 'draft + iterate' },
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
    description: 'A cleaner school timetable app built around fast scanning and less clutter.',
    longDescription: 'A standalone timetable build for checking a school schedule without fighting the interface. This is one of the cleaner public builds because the use case is simple and the live version is easy to test.',
    what: 'A web timetable app for viewing class times, days, and schedule details in a calmer layout.',
    why: 'Timetables get messy quickly. I wanted this one to feel useful first, then polished around that.',
    learned: 'Spacing, hierarchy, and small controls matter a lot when the same screen gets checked every day.',
    status: 'Live on Vercel and pinned as a main build.',
    image: `${import.meta.env.BASE_URL}project-pro-timetable.png`,
    tags: ['Live', 'Timetable', 'Web App'],
    tech: ['JavaScript', 'Vercel', 'Frontend UI', 'Deployment'],
    link: 'https://pro-timetable.vercel.app',
    aiAssisted: true,
  },
  {
    id: 'imessaging',
    title: 'iMessage Stats',
    description: 'A local stats project for turning iMessage data into readable reports.',
    longDescription: 'A local-report project for iMessage stats: counts, response timing, chat breakdowns, and standalone HTML reports. The point was to make personal data readable without sending it away.',
    what: 'A local stats tool with a public page and generated report output.',
    why: 'Message data is personal, so the useful part is keeping the workflow local and controlled.',
    learned: 'It pushed privacy, local processing, and data presentation into the same problem.',
    status: 'Live product page on GitHub Pages.',
    image: liveScreenshot('https://jz1324.github.io/Imessaging/'),
    tags: ['Live', 'macOS', 'Stats'],
    tech: ['Swift', 'SwiftUI', 'Python', 'HTML Reports', 'GitHub Pages'],
    link: 'https://jz1324.github.io/Imessaging/',
    aiAssisted: true,
  },
  {
    id: 'clipboard-manager',
    title: 'Clipboard Manager',
    description: 'A macOS clipboard concept for history, search, protection, and themes.',
    longDescription: 'A macOS clipboard manager concept focused on finding, protecting, and reusing copied content. The public page is more product direction than finished app, but the interface idea is clear.',
    what: 'A clipboard history utility concept with macOS-style interaction ideas.',
    why: 'Clipboard history is useful but usually buried. I wanted to make it feel searchable and controlled.',
    learned: 'Utility design needs quick access, trust, and restraint more than extra features.',
    status: 'Live on GitHub Pages as a product-direction prototype.',
    image: liveScreenshot('https://jz1324.github.io/ClipBoard-Manager/'),
    tags: ['Live', 'macOS', 'Utility'],
    tech: ['CSS', 'macOS UI', 'GitHub Pages', 'Frontend'],
    link: 'https://jz1324.github.io/ClipBoard-Manager/',
    aiAssisted: true,
  },
  {
    id: 'flaccer',
    title: 'Flaccer',
    description: 'A macOS fake-lossless detector for checking what is really inside audio files.',
    longDescription: 'A macOS audio utility page and preview build for finding fake lossless files. It checks spectral content instead of trusting extensions, bitrate labels, or file size.',
    what: 'A local-first macOS tool for scanning FLAC, WAV, AIFF, ALAC, MP3, AAC, playlists, and Rekordbox XML.',
    why: 'A .flac file can still be fake. I wanted a cleaner way to catch upscaled audio before it ends up in a music library.',
    learned: 'This pushed the project direction closer to a real product: native macOS workflow, download builds, update notes, trust copy, and a sharper landing page.',
    status: 'Live on GitHub Pages with a preview DMG.',
    image: liveScreenshot('https://jz1324.github.io/Flaccer/'),
    tags: ['Live', 'macOS', 'Audio'],
    tech: ['HTML', 'CSS', 'JavaScript', 'GitHub Pages', 'macOS'],
    link: 'https://jz1324.github.io/Flaccer/',
    aiAssisted: true,
  },
  {
    id: 'ur-bro-jz',
    title: 'ur_bro_jz',
    description: 'This site: profile, projects, music, locked sections, and Supabase-backed access.',
    longDescription: 'The current archive site. It mixes a profile card, project case files, a synced music player, locked story sections, and Supabase functions for private access.',
    what: 'A Vite + React personal archive with public profile/project content and private sections kept outside the static bundle.',
    why: 'A normal bio link felt too flat. This makes the profile feel like a small archive instead.',
    learned: 'This is where I learned the most about polish: scroll locking, overlays, music sync, private functions, and making copy sound like me.',
    status: 'Live and actively polished as the main personal site.',
    image: liveScreenshot('https://jz1324.github.io/ur_bro_jz/'),
    tags: ['Live', 'Archive', 'React'],
    tech: ['Vite', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase'],
    link: 'https://jz1324.github.io/ur_bro_jz/',
    aiAssisted: true,
  },
  {
    id: 'premium-timetable',
    title: 'Premium Timetable',
    description: 'The earlier timetable build that shaped the newer Pro version.',
    longDescription: 'The first timetable direction: setup notes, parser work, deployment notes, and the rougher schedule interface before the cleaner Pro Timetable pass.',
    what: 'An older timetable project with docs and feature experiments.',
    why: 'It shows the first pass and why the idea needed a cleaner second version.',
    learned: 'It made the useful parts of the timetable idea easier to separate from the noise.',
    status: 'Live on GitHub Pages as an older checkpoint.',
    image: liveScreenshot('https://jz1324.github.io/Premium-Timetable/'),
    tags: ['Live', 'Timetable', 'Docs'],
    tech: ['JavaScript', 'GitHub Pages', 'Documentation', 'Frontend'],
    link: 'https://jz1324.github.io/Premium-Timetable/',
    aiAssisted: true,
  },
  {
    id: 'about-me',
    title: 'about-me',
    description: 'An earlier TypeScript personal-site experiment.',
    longDescription: 'A smaller personal site used to test layout, copy, and the basic about-me direction before this darker archive version became the main one.',
    what: 'A static personal website experiment deployed on GitHub Pages.',
    why: 'It gave me a quick place to test what felt too plain and what was worth keeping.',
    learned: 'It showed why the archive direction felt more personal than a normal template page.',
    status: 'Live on GitHub Pages as a design checkpoint.',
    image: liveScreenshot('https://jz1324.github.io/about-me/'),
    tags: ['Live', 'About', 'TypeScript'],
    tech: ['TypeScript', 'Next.js', 'React', 'GitHub Pages'],
    link: 'https://jz1324.github.io/about-me/',
    aiAssisted: true,
  },
];
