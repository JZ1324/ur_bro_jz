export type ProfileStat = {
  label: 'Posts' | 'Relationship';
  value: number;
};

export type ProfileData = {
  displayName: string;
  handle: string;
  bio: string;
  bibleVersePreview?: BibleVersePreview;
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
  externalUrl?: string;
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
  image?: string;
  tags: string[];
  tech: string[];
  link?: string;
  aiAssisted?: boolean;
  featured?: boolean;
};

export type FaithHover = {
  title: string;
  description: string;
  previewVideoSrc: string;
  points: string[];
  closing: string;
};

export type BibleVersePreview = {
  reference: string;
  translation: string;
  summary: string;
  verses: {
    verse: string;
    text: string;
  }[];
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

const viteEnv = (import.meta.env ?? {}) as Partial<ImportMetaEnv>;
const baseUrl = viteEnv.BASE_URL ?? '/';

const supabasePublicVideoUrl = `${(viteEnv.VITE_SUPABASE_URL || 'https://uajpewjagduzdpwlynrv.supabase.co').replace(
  /\/$/,
  '',
)}/storage/v1/object/public/public-video-previews`;
const supabaseFunctionsUrl = `${(viteEnv.VITE_SUPABASE_URL || 'https://uajpewjagduzdpwlynrv.supabase.co').replace(
  /\/$/,
  '',
)}/functions/v1`;

export const profileData: ProfileData = {
  displayName: 'ur_bro_jz',
  handle: '@ur_bro_jz',
  bio: 'Romans 12:16-21',
  bibleVersePreview: {
    reference: 'Romans 12:16-21',
    translation: 'KJV',
    summary: 'Stay humble, live at peace with others and overcome evil with good.',
    verses: [
      {
        verse: '16',
        text: 'Be of the same mind one toward another. Mind not high things, but condescend to men of low estate. Be not wise in your own conceits.',
      },
      {
        verse: '17',
        text: 'Recompense to no man evil for evil. Provide things honest in the sight of all men.',
      },
      {
        verse: '18',
        text: 'If it be possible, as much as lieth in you, live peaceably with all men.',
      },
      {
        verse: '19',
        text: 'Dearly beloved, avenge not yourselves, but rather give place unto wrath: for it is written, Vengeance is mine; I will repay, saith the Lord.',
      },
      {
        verse: '20',
        text: 'Therefore if thine enemy hunger, feed him; if he thirst, give him drink: for in so doing thou shalt heap coals of fire on his head.',
      },
      {
        verse: '21',
        text: 'Be not overcome of evil, but overcome evil with good.',
      },
    ],
  },
  imageSrc: `${baseUrl}instagram-profile.jpg`,
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
    artworkSrc: `${baseUrl}olivia-dean-art-of-loving-cover.jpg`,
    externalUrl: 'https://music.apple.com/au/album/the-art-of-loving/1817609404',
    sources: [
      {
        src: `${supabaseFunctionsUrl}/get-track-audio?quality=high`,
        type: 'audio/mpeg',
        quality: 'high',
        bitrateKbps: 320,
      },
      {
        src: `${supabaseFunctionsUrl}/get-track-audio?quality=medium`,
        type: 'audio/mpeg',
        quality: 'medium',
        bitrateKbps: 160,
      },
      {
        src: `${supabaseFunctionsUrl}/get-track-audio?quality=low`,
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
  description: 'Jesus is my Lord and Saviour. I believe He died for my sins and rose again so I could be forgiven.',
  previewVideoSrc: `${supabasePublicVideoUrl}/jesus-christ-holy-light-moewalls-com.mp4`,
  points: [
    'Jesus lived without sin, died for our sins and rose again.',
    'I believe salvation is a gift of grace, received by turning from sin and trusting Him.',
    'I’m learning to follow Him in how I live and treat people.',
  ],
  closing: 'That’s why Romans 12:16-21 is in my bio.',
};

export const faithSections: FaithSection[] = [
  {
    id: 'jesus',
    title: 'Who Jesus is',
    body: [
      'I believe Jesus Christ is the Son of God, fully God and fully man. He is the Saviour God promised.',
      'Through His life, we see what God is like. He came to save people who couldn’t save themselves.',
    ],
    verses: [
      { reference: 'John 1:14', text: 'The Word was made flesh, and dwelt among us.' },
      { reference: 'Colossians 1:15', text: 'The image of the invisible God.' },
      { reference: 'John 14:6', text: 'The way, the truth, and the life.' },
    ],
  },
  {
    id: 'why-saving',
    title: 'Why we need saving',
    body: [
      'The Bible says we’ve all sinned. That includes the things we do and what goes on in our hearts, like pride and selfishness.',
      'I need forgiveness too. Being better than someone else or trying harder doesn’t put things right with God. That’s why I believe we need Jesus.',
    ],
    verses: [
      { reference: 'Romans 3:23', text: 'All have sinned, and come short of the glory of God.' },
      { reference: 'Isaiah 64:6', text: 'All our righteousnesses are as filthy rags.' },
      { reference: 'Romans 6:23', text: 'The gift of God is eternal life through Jesus Christ.' },
    ],
  },
  {
    id: 'gospel',
    title: 'The Gospel',
    body: [
      'The Gospel means good news. Jesus lived without sin, died on the cross for our sins and rose again, defeating sin and death.',
      'Forgiveness is a gift of God’s grace. We receive it through faith in Jesus, turning from sin and trusting Him for new life.',
    ],
    verses: [
      { reference: 'Romans 5:8', text: 'While we were yet sinners, Christ died for us.' },
      { reference: '1 Corinthians 15:3-4', text: 'Christ died for our sins, was buried, and rose again.' },
      { reference: 'Ephesians 2:8-9', text: 'By grace are ye saved through faith.' },
    ],
  },
  {
    id: 'not-good-enough',
    title: 'Can I be good enough?',
    body: [
      'Being kind and generous matters. It still can’t undo the wrong we’ve done, and none of us has lived without sin.',
      'I trust Jesus to forgive me because of His grace. I don’t have to prove I deserve it before I come to Him.',
    ],
    verses: [
      { reference: 'Titus 3:5', text: 'Not by works of righteousness which we have done.' },
      { reference: '2 Corinthians 5:21', text: 'That we might be made the righteousness of God in him.' },
      { reference: 'John 6:37', text: 'Him that cometh to me I will in no wise cast out.' },
    ],
  },
  {
    id: 'following',
    title: 'Following Him',
    body: [
      'Following Jesus means learning from Him and trying to live the way He teaches. That affects how I treat people and what I put first.',
      'Romans 12:16-21 reminds me to stay humble, be patient and make peace where I can. My relationship count is one because I belong to Him.',
    ],
    verses: [
      { reference: 'Luke 9:23', text: 'Take up his cross daily, and follow me.' },
      { reference: 'Romans 12:18', text: 'Live peaceably with all men.' },
      { reference: 'Romans 12:21', text: 'Overcome evil with good.' },
    ],
  },
  {
    id: 'response',
    title: 'How we respond',
    body: [
      'We can come to God honestly about our sin, repent and trust Jesus to forgive us.',
      'Having faith in Him means trusting Him as Lord and Saviour and following Him in everyday life.',
    ],
    verses: [
      { reference: 'Mark 1:15', text: 'Repent ye, and believe the gospel.' },
      { reference: 'Romans 10:9', text: 'Confess the Lord Jesus, and believe.' },
      { reference: 'Acts 16:31', text: 'Believe on the Lord Jesus Christ.' },
    ],
  },
  {
    id: 'hope',
    title: 'The hope I have',
    body: [
      'Because of Jesus, I believe we can be forgiven, made right with God and have eternal life with Him.',
      'My faith matters to me, so I wanted to explain it here.',
    ],
    verses: [
      { reference: 'John 3:16', text: 'God so loved the world.' },
      { reference: '2 Corinthians 5:17', text: 'If any man be in Christ, he is a new creature.' },
      { reference: 'John 20:31', text: 'That believing ye might have life through his name.' },
    ],
  },
  {
    id: 'historical-reasons',
    title: 'Why I take the Bible seriously',
    body: [
      'One thing that interests me is how the Bible came together. Its 66 books were written over roughly 1,500 years by about 40 authors from different backgrounds.',
      'It includes history, poetry, law and letters. Across those different books, Christians see a story of God creating us, our rebellion and His plan to save us.',
      'I believe that story points to Jesus. The Old Testament promises a Saviour, and the New Testament tells us about His life, death and resurrection.',
      'That connection across the books is one reason I take the Bible seriously.',
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
    title: 'VCE Vault',
    body: 'VCE practice questions and worked answers, organised by subject. It uses Studyflow for sign-in.',
  },
  {
    label: 'Projects',
    title: 'GptDoc 4 + Studyflow',
    body: 'Working on the document editor and my school planner.',
  },
  {
    label: 'Music',
    title: "It's So Easy to?",
    body: 'There’s a reason this song is here. Maybe it’s about someone.',
  },
];

export const archiveSections: ArchiveSection[] = [
  {
    id: 'school',
    title: 'School Archive',
    subtitle: 'My coursework and study notes',
    icon: 'graduationCap',
    locked: true,
  },
  {
    id: 'music',
    title: 'Music Archive',
    subtitle: 'Music practice and things I’m listening to',
    icon: 'music',
    locked: true,
  },
  {
    id: 'leadership',
    title: 'Leadership Archive',
    subtitle: 'Roles I’ve taken on and what I’ve learned',
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
      'There’s a bit more about me here than on the front page.',
      'I keep this part locked because I’d rather choose who sees my personal stuff.',
    ],
  },
  {
    id: 'about-bio',
    title: 'Bio',
    level: 3,
    body: [
      'I make websites, Mac apps and the occasional UI experiment.',
      'Usually I see something I’d like to change and start messing with it. A lot of my projects begin that way.',
      'I like simple layouts and spending time on how things move. This site has my projects and some personal stuff I wanted to keep together.',
    ],
  },
  {
    id: 'about-focus',
    title: 'Focus',
    level: 3,
    body: ['Mostly web projects at the moment. I’m working on layouts and animations, and tweaking the music player.'],
  },
  {
    id: 'about-faith',
    title: 'Faith',
    level: 4,
    body: [
      'I follow Jesus. There’s a separate page where I explain what I believe and why.',
    ],
  },
  {
    id: 'about-friends',
    title: 'Friends',
    level: 4,
    body: [
      'That’s me with my friends in the profile photo. I like having them in it.',
    ],
  },
  {
    id: 'about-projects',
    title: 'Creative Projects',
    level: 4,
    body: [
      'Most of these started while I was learning or trying to make something I’d use myself.',
      'VCE Vault, GptDoc and Studyflow are the main ones I’m working on now.',
    ],
  },
  {
    id: 'about-hyperframes',
    title: 'Website Videos',
    level: 4,
    body: [
      'I’m also interested in making short videos of my websites. A demo can show how a page works better than a screenshot.',
    ],
  },
  {
    id: 'about-archive',
    title: 'About the site',
    level: 3,
    body: [
      'I wanted somewhere to keep my projects, photos and music together. Some of it is public, and the personal notes stay behind a key.',
    ],
  },
  {
    id: 'about-now',
    title: 'Now',
    level: 3,
    body: [
      'At the moment I’m adding to VCE Vault, working on GptDoc 4 and improving Studyflow.',
      'If you want access to the private notes and photos, ask me.',
    ],
  },
  {
    id: 'about-links',
    title: 'Links',
    level: 3,
    body: [
      'Instagram is the easiest way to reach me. You can open my projects from the project section.',
    ],
  },
];

export const focusItems = ['Web projects', 'Better UI', 'Private stuff', 'Music'];

export const profileFacts = [
  { title: 'Public name', value: 'JZ' },
  { title: 'Handle', value: '@ur_bro_jz' },
  { title: 'Personal notes', value: 'Ask me for access' },
  { title: 'Current bio', value: 'Romans 12:16-21' },
];

export const archiveStyleItems = [
  'The front page covers the basics.',
  'My projects are public; some personal notes and photos need a key.',
  'I like animation when it helps you follow what’s happening.',
  'I keep taking things out when the page gets too busy.',
];

export const journalEntries: JournalEntry[] = [
  {
    label: 'what i build',
    title: 'Things I’d use myself',
    body: 'Usually school tools or something for my Mac. Sometimes it’s just an idea I want to try.',
  },
  {
    label: 'what i am learning',
    title: 'Getting the details right',
    body: 'Spacing, animation, mobile layouts and sign-in. There’s usually something I notice once I start using a project.',
  },
  {
    label: 'how i use ai',
    title: 'Help with drafts',
    body: 'I use AI to get started quicker, then edit the wording, layout and interactions myself.',
  },
  {
    label: 'things i keep private',
    title: 'Personal notes and photos',
    body: 'Some photos and school notes need a key. Ask me if you’d like access.',
  },
];

export const toolItems: ToolItem[] = [
  { label: 'React', note: 'interfaces' },
  { label: 'TypeScript', note: 'structure' },
  { label: 'Next.js', note: 'full-stack web apps' },
  { label: 'Supabase', note: 'private access' },
  { label: 'Vercel', note: 'deploys' },
  { label: 'Swift', note: 'native macOS tools' },
  { label: 'Chrome', note: 'browser extensions' },
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

const projectSiteUrl = (slug: string) => `https://ur-bro-jz.vercel.app/projects/${slug}/`;

export const projects: Project[] = [
  {
    id: 'vce-vault',
    title: 'VCE Vault',
    description: 'VCE practice questions, worked answers and test building. Sign in through Studyflow.',
    longDescription: 'A private VCE study app with questions sorted by subject, unit, Area of Study and topic. It has original questions alongside attributed VCAA past-paper material. You can build tests, read worked solutions and go back over your answers. Sign-in is handled through Studyflow.',
    what: 'Find VCE questions by topic, put together a test and check your work against the answers.',
    why: 'My revision resources were spread across PDFs, folders and question sites. I wanted them organised around the subjects I study.',
    learned: 'Sorting by Area of Study and topic lets me practise one part of the course without digging through a whole exam. I keep the sources with the questions so I can trace them back later.',
    status: 'Active on Vercel with access managed through Studyflow.',
    image: `${baseUrl}projects/previews/vce-vault.png`,
    tags: ['Live', 'Web App', 'Education'],
    tech: ['React', 'Vite', 'Supabase', 'Vercel'],
    link: 'https://vce-vault.vercel.app/',
    aiAssisted: true,
    featured: true,
  },
  {
    id: 'gptdoc',
    title: 'GptDoc',
    description: 'A Chrome extension for editing ChatGPT and Claude conversations as documents.',
    longDescription: 'GptDoc adds a document interface to ChatGPT and Claude. Version 4 has account access, modes based on Docs, Word and Notion, plus local version history, exports and attachments. You can download the extension from the project site.',
    what: 'Read and work on AI conversations in a document view, with saved versions and export options.',
    why: 'Long AI chats get hard to work through. I wanted to use them more like documents.',
    learned: 'I had to fit a document editor into two existing chat interfaces and keep both usable. Version history lives locally, so you can go back to an earlier draft from the editor.',
    status: 'Live on Vercel with GptDoc 4 extension builds.',
    image: `${baseUrl}projects/previews/gptdoc.png`,
    tags: ['Live', 'Chrome Extension', 'Web App'],
    tech: ['React', 'Vite', 'Chrome Extension', 'Supabase'],
    link: 'https://gptdoc.vercel.app/',
    featured: true,
  },
  {
    id: 'studyflow',
    title: 'Studyflow',
    description: 'A school planner with a timetable, tasks, Kanban boards and calendar sync.',
    longDescription: 'A student planner I’m working on, currently in private beta. It brings a timetable, daily checklist, Kanban board and courses together. It also connects to iCloud, Google Calendar and Microsoft Outlook.',
    what: 'Plan your classes and tasks, then sync them with your calendar.',
    why: 'I wanted my weekly timetable and day-to-day school tasks in the same place.',
    learned: 'The timetable answers what class is next. The daily checklist answers what I need to do. I keep the Kanban board separate for when I want to plan further ahead.',
    status: 'Live on Vercel as a private beta.',
    image: `${baseUrl}projects/previews/studyflow.png`,
    tags: ['Live', 'Study Tool', 'Web App'],
    tech: ['Next.js', 'Supabase', 'SwiftUI', 'Vercel'],
    link: 'https://studyflow-dusky-beta.vercel.app/',
    featured: true,
  },
  {
    id: 'dripwriter',
    title: 'Dripwriter',
    description: 'A Mac app that types saved snippets into a browser tab you choose.',
    longDescription: 'Dripwriter sends saved text and a set sequence of steps to one paired Arc, Chrome, Edge or Brave tab. The tab can stay in the background while it runs.',
    what: 'Save encrypted text snippets and send them to a paired browser tab using hotkeys and a companion extension.',
    why: 'I wanted to spend less time typing the same things in my browser, with a clear view of what the automation was doing.',
    learned: 'Pairing it with one tab and giving each workflow an end made it easier to control.',
    status: 'Dedicated project site on the personal archive.',
    image: liveScreenshot(projectSiteUrl('dripwriter')),
    tags: ['Live', 'macOS', 'Writing Tool'],
    tech: ['Swift', 'AppKit', 'Chromium Extension', 'Keychain'],
    link: projectSiteUrl('dripwriter'),
  },
  {
    id: 'meta6',
    title: 'Meta6',
    description: 'My fan-made Bloons TD 6 guide, with strategies, rankings and tower notes.',
    longDescription: 'A BTD6 reference site with strategies for different patches, hero and paragon rankings, map guides and tower notes. It’s a fan project.',
    what: 'Search for CHIMPS and boss strategies, compare heroes and look up maps or towers.',
    why: 'BTD6 guides are spread across a lot of places. I wanted to compare strategies before starting a run.',
    learned: 'The categories and cards had to be easy to scan once there were this many notes.',
    status: 'Live on Vercel as a fan-made strategy resource.',
    image: liveScreenshot('https://meta6-btd6-guide.vercel.app/'),
    tags: ['Live', 'BTD6', 'Strategy Guide'],
    tech: ['React', 'TypeScript', 'Vite', 'Vercel'],
    link: 'https://meta6-btd6-guide.vercel.app/',
  },
  {
    id: 'studyflow-capture',
    title: 'StudyFlow Capture prototype',
    description: 'An earlier StudyFlow prototype that turns school screenshots into editable tasks.',
    longDescription: 'This version pairs a React school planner with a Mac capture app built using ScreenCaptureKit. Firebase handles the captured screenshots.',
    what: 'Capture a school timetable and turn the screenshot into tasks you can edit.',
    why: 'A timetable screenshot isn’t much help when I need to change or plan around it. I wanted to turn it into something editable.',
    learned: 'Pairing the devices, limiting uploads to the right account and letting you review a capture all needed attention.',
    status: 'Live prototype with a macOS capture companion.',
    image: liveScreenshot('https://studyflow-jz1324.vercel.app/'),
    tags: ['Live', 'Study Tool', 'macOS'],
    tech: ['React', 'Vite', 'Firebase', 'SwiftUI', 'ScreenCaptureKit'],
    link: 'https://studyflow-jz1324.vercel.app/',
  },
  {
    id: 'stuable',
    title: 'Stuable',
    description: 'A timetable project rebuilt around a simple daily schedule.',
    longDescription: 'I kept the timetable backend and sign-in, then replaced the older screens with a simpler day view. It uses Firebase authentication, Firestore rules and timetable parsing services.',
    what: 'A timetable foundation with sign-in, schedule parsing and a day view.',
    why: 'I wanted to cut the timetable back to what I’d use every day.',
    learned: 'Removing the older screens made it much easier to see what still needed work.',
    status: 'Dedicated project site on the personal archive.',
    image: liveScreenshot(projectSiteUrl('stuable')),
    tags: ['Live', 'Timetable', 'Web App'],
    tech: ['React', 'Firebase', 'Webpack', 'JavaScript'],
    link: projectSiteUrl('stuable'),
  },
  {
    id: 'decibal',
    title: 'Decibal',
    description: 'A Mac menu bar app for checking audio levels and room sound.',
    longDescription: 'Decibal monitors your Mac’s output loudness and the sound around you. It keeps a short history and shows listening exposure guidance in the menu bar.',
    what: 'Check audio levels, calibrate room measurements and set warning thresholds.',
    why: 'I wanted a quick way to check sound levels before the audio already felt too loud.',
    learned: 'The measurements need careful calibration and a plain explanation of what they mean.',
    status: 'Dedicated project site on the personal archive.',
    image: liveScreenshot(projectSiteUrl('decibal')),
    tags: ['Live', 'macOS', 'Audio'],
    tech: ['Swift', 'SwiftUI', 'Core Audio', 'AppKit'],
    link: projectSiteUrl('decibal'),
  },
  {
    id: 'touchytap',
    title: 'TouchyTap',
    description: 'A Mac auto-clicker with hotkeys, click limits and session stats.',
    longDescription: 'A SwiftUI auto-clicker with simple and advanced modes. It supports global hotkeys, clicking at a fixed position and conditions that stop a session. Stats stay on your Mac.',
    what: 'Set the click rate, choose where to click and control it from the menu bar.',
    why: 'I wanted an auto-clicker where I could easily see the settings and how to stop it.',
    learned: 'It needs to be obvious when it’s running, how to stop it and which permissions it needs.',
    status: 'Dedicated project site on the personal archive.',
    image: liveScreenshot(projectSiteUrl('touchytap')),
    tags: ['Live', 'macOS', 'Automation'],
    tech: ['Swift', 'SwiftUI', 'AppKit', 'CoreGraphics'],
    link: projectSiteUrl('touchytap'),
  },
  {
    id: 'deepworkclock',
    title: 'DeepWorkClock',
    description: 'A Mac focus timer you set by dragging the clock hand.',
    longDescription: 'A menu bar timer prototype. Drag the clock hand to set a focus session and watch its progress. Blocking and sync are still early work.',
    what: 'Drag to choose how long you want to focus, then follow the timer in the menu bar.',
    why: 'I liked the idea of setting a timer with a clock hand. It felt quicker than entering a number.',
    learned: 'The drag gesture gave the app a clear starting point. The other controls could stay simple.',
    status: 'Dedicated project site on the personal archive.',
    image: liveScreenshot(projectSiteUrl('deepworkclock')),
    tags: ['Live', 'macOS', 'Focus'],
    tech: ['Swift', 'SwiftUI', 'AppKit', 'Keychain'],
    link: projectSiteUrl('deepworkclock'),
  },
  {
    id: 'hidevault',
    title: 'HideVault',
    description: 'An early Mac app for keeping private files and notes in an encrypted vault.',
    longDescription: 'A SwiftUI code skeleton for a vault stored on your Mac. It includes AES-GCM encryption, locking, notes, search and a menu bar helper. It’s still an early foundation.',
    what: 'An encrypted local vault with a searchable sidebar for private items.',
    why: 'I wanted somewhere to keep private files and notes together on my Mac.',
    learned: 'How the vault protects data and how you use it day to day need to be worked out together.',
    status: 'Dedicated project site on the personal archive.',
    image: liveScreenshot(projectSiteUrl('hidevault')),
    tags: ['Live', 'macOS', 'Privacy'],
    tech: ['Swift', 'SwiftUI', 'CryptoKit', 'AES-GCM'],
    link: projectSiteUrl('hidevault'),
  },
  {
    id: 'spoof',
    title: 'Spoof',
    description: 'A Mac utility for checking network interfaces and MAC addresses.',
    longDescription: 'Spoof shows your network interfaces, connection state and hardware and current MAC addresses. It also shows private Wi-Fi addressing and lets you copy the raw interface output.',
    what: 'Look up an interface’s connection state, addresses and system details in one window.',
    why: 'I wanted the network details I needed in one window, without a full diagnostics app.',
    learned: 'Deciding which details to show first matters when the whole app fits in a small window.',
    status: 'Dedicated project site on the personal archive.',
    image: liveScreenshot(projectSiteUrl('spoof')),
    tags: ['Live', 'macOS', 'Networking'],
    tech: ['Swift', 'SwiftUI', 'AppKit', 'ifconfig'],
    link: projectSiteUrl('spoof'),
  },
  {
    id: 'pro-timetable',
    title: 'Pro Timetable',
    description: 'A school timetable for checking what class is next.',
    longDescription: 'A standalone school timetable with a schedule you can scan quickly. The live version is available to try.',
    what: 'Check your classes, times and schedule details in your browser.',
    why: 'I wanted a timetable I could open and read quickly during the school day.',
    learned: 'Small changes to spacing and controls add up on a screen you check every day.',
    status: 'Live on Vercel and pinned as a main build.',
    image: `${baseUrl}project-pro-timetable.png`,
    tags: ['Live', 'Timetable', 'Web App'],
    tech: ['JavaScript', 'Vercel', 'Frontend UI', 'Deployment'],
    link: 'https://pro-timetable.vercel.app',
    aiAssisted: true,
  },
  {
    id: 'imessaging',
    title: 'iMessage Stats',
    description: 'iMessage stats and HTML reports that stay on your computer.',
    longDescription: 'A local tool for looking through iMessage stats, including message counts, response times and chat breakdowns. It produces standalone HTML reports.',
    what: 'Turn your iMessage data into reports you can open locally.',
    why: 'I wanted to look at message stats without uploading private conversations.',
    learned: 'The reports had to be readable while keeping the processing and data on your computer.',
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
    description: 'A Mac clipboard manager concept with searchable history and themes.',
    longDescription: 'An interface concept for finding and reusing things you’ve copied, with protection controls and themes. The public page shows the idea; this isn’t a finished app.',
    what: 'A prototype for searching and managing clipboard history on a Mac.',
    why: 'I wanted copied items to be easier to find, with control over what stays in the history.',
    learned: 'Quick access and clear privacy controls mattered more than adding features.',
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
    description: 'A Mac app for spotting audio files labelled as lossless that aren’t.',
    longDescription: 'Flaccer looks at the audio’s spectral content to check for fake lossless files. A filename or bitrate alone doesn’t tell you that. The project page has a preview build to download.',
    what: 'Scan audio files, playlists and Rekordbox XML locally. It supports FLAC, WAV, AIFF, ALAC, MP3 and AAC.',
    why: 'A file ending in .flac can still come from a lossy source. I wanted to catch those before adding them to a music library.',
    learned: 'Getting a preview build ready also meant working on downloads, update notes and the project page.',
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
    description: 'My personal site, with projects, music and some private sections.',
    longDescription: 'The site you’re on. It has my projects, a music player and sections that need a key. It uses React and Vite, with Supabase handling access to the private content.',
    what: 'A place for my projects and personal stuff. Private notes are loaded separately after access is checked.',
    why: 'I wanted more room for my projects and photos than a link in my bio gave me.',
    learned: 'I’ve spent a lot of time on scrolling, overlays, music sync and how private sections open.',
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
    description: 'My earlier timetable project, before Pro Timetable.',
    longDescription: 'The first version of the timetable idea. It has the older schedule interface, parser experiments and notes on setup and deployment.',
    what: 'An older timetable build with experiments and documentation.',
    why: 'This was the first pass at the idea that became Pro Timetable.',
    learned: 'It helped me work out which parts to keep for the next version.',
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
    description: 'An earlier version of my personal site, built with TypeScript.',
    longDescription: 'A smaller site where I tried out layouts and wording before building this one. It’s still on GitHub Pages.',
    what: 'A static about-me site I used to try out ideas.',
    why: 'I needed somewhere to test layouts and work out what I wanted on a personal site.',
    learned: 'It helped me figure out what I wanted this version to feel like.',
    status: 'Live on GitHub Pages as a design checkpoint.',
    image: liveScreenshot('https://jz1324.github.io/about-me/'),
    tags: ['Live', 'About', 'TypeScript'],
    tech: ['TypeScript', 'Next.js', 'React', 'GitHub Pages'],
    link: 'https://jz1324.github.io/about-me/',
    aiAssisted: true,
  },
];
