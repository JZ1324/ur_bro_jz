/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Folder, GraduationCap, Lock, Map, Music, Sparkles, User, Users, X } from 'lucide-react';
import { AnimatePresence, motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { ArchiveVault } from './components/ArchiveVault';
import { AboutOverlay } from './components/AboutOverlay';
import { GardenScrollScene } from './components/GardenScrollScene';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './components/InputOTP';
import { JesusOverlay } from './components/JesusOverlay';
import { NowSection } from './components/NowSection';
import { ParallaxLayer } from './components/ParallaxLayer';
import { PhotoOrbitTransition } from './components/PhotoOrbitTransition';
import { PixelArchiveMap, type PixelArchiveMapLocation } from './components/PixelArchiveMap';
import { PixelMeadow } from './components/PixelMeadow';
import { ProfileCard } from './components/ProfileCard';
import { ProjectOverlays } from './components/ProjectOverlays';
import { SecretPuzzleOverlay } from './components/SecretPuzzleOverlay';
import { ScrollChapter } from './components/ScrollChapter';
import { StoryHighlights } from './components/StoryHighlights';
import { TextScramble } from './components/TextScramble';
import Stepper, { Step } from './components/ui/Stepper';
import { ThemeToggle, type Theme } from './components/ui/ThemeToggle';
import { readStoredTheme, storeTheme } from './themePreference';
import { useBodyScrollLock } from './hooks/useBodyScrollLock';
import {
  aboutSections,
  archiveSections,
  archiveStyleItems,
  faithHover,
  faithSections,
  focusItems,
  journalEntries,
  nowItems,
  profileData,
  profileFacts,
  projects,
  storyItems,
  toolItems,
  type ArchiveSectionId,
  type ArchiveSection,
  type PrivateArchiveSection,
  type StoryItem,
} from './data/site';
import { fetchPrivateArchiveSection, PrivateArchiveError } from './lib/privateArchive';

const accessStatusCopy = {
  checking: {
    label: 'checking key...',
    title: 'reading archive index...',
    body: 'waiting for private drawer...',
  },
  approved: {
    label: 'key matched',
    title: 'archive ready',
    body: 'Unlock will open the private drawer now.',
  },
  denied: {
    label: 'key rejected',
    title: 'nothing private was opened',
    body: 'Try the key again. The archive stayed closed.',
  },
};

function ScrollEntryCue({ progress, reducedMotion }: { progress: MotionValue<number>; reducedMotion: boolean }) {
  const opacity = useTransform(progress, [0, 0.035, 0.12], reducedMotion ? [0, 0, 0] : [1, 1, 0]);
  const y = useTransform(progress, [0, 0.12], reducedMotion ? [0, 0] : [0, 18]);
  const scaleY = useTransform(progress, [0, 0.1], reducedMotion ? [1, 1] : [0.25, 1]);

  if (reducedMotion) return null;
  return (
    <motion.div
      className="pointer-events-none absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2"
      style={{ opacity, y }}
      aria-hidden="true"
      data-scroll-entry-cue
    >
      <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-muted">Scroll to enter</span>
      <motion.span
        className="h-9 w-[3px] origin-top bg-[linear-gradient(to_bottom,var(--garden-vine-bright),var(--garden-vine))] shadow-[1px_0_0_var(--garden-pixel-shadow)]"
        style={{ scaleY }}
      />
      <span className="h-2 w-2 rotate-45 border border-warm-accent/60 bg-bg" />
    </motion.div>
  );
}

type UnlockDestination = 'archive' | 'about';

type ArchiveSignalOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenArchive: () => void;
  onOpenProjects: () => void;
  onOpenMusic: () => void;
};

type ArchiveMapOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenAbout: () => void;
  onOpenProjects: () => void;
  onOpenJesus: () => void;
  onOpenArchiveSection: (sectionId: ArchiveSectionId) => void;
};

function ArchiveSignalOverlay({
  isOpen,
  onClose,
  onOpenArchive,
  onOpenProjects,
  onOpenMusic,
}: ArchiveSignalOverlayProps) {
  useBodyScrollLock(isOpen);

  const runAction = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg/82 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="archive-corner-panel w-full max-w-xl rounded-3xl border border-border/60 bg-surface p-6 shadow-2xl shadow-black/35 sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-warm-accent">Archive Signal</p>
                <h2 className="text-3xl font-bold tracking-tight text-text">Latest trace</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-accent-soft p-3 text-accent transition-[transform,background-color] duration-150 ease-out hover:bg-accent/15 active:scale-[0.96]"
                aria-label="Close archive signal"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-border/45 bg-bg/50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E927F]">Updated</p>
                <p className="mt-2 text-base font-semibold leading-relaxed text-text">
                  The public side is cleaner now: profile first, projects next, private sections tucked behind the archive.
                </p>
              </div>
              <div className="rounded-2xl border border-warm-accent/25 bg-warm-accent/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-accent">Current signal</p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
                  Best route for a visitor: scan the profile, open the projects, then use Instagram if they need to reach me.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => runAction(onOpenProjects)}
                className="rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-bg transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-accent-dark active:scale-[0.97]"
              >
                Projects
              </button>
              <button
                onClick={() => runAction(onOpenArchive)}
                className="rounded-2xl border border-border/55 bg-bg/45 px-4 py-3 text-sm font-bold text-text transition-[transform,border-color,background-color] duration-150 ease-out hover:border-accent/40 active:scale-[0.97]"
              >
                Archive
              </button>
              <button
                onClick={() => runAction(onOpenMusic)}
                className="rounded-2xl border border-border/55 bg-bg/45 px-4 py-3 text-sm font-bold text-text transition-[transform,border-color,background-color] duration-150 ease-out hover:border-accent/40 active:scale-[0.97]"
              >
                Music
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ArchiveRail() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.32, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
      className="relative mx-auto -mt-5 -mb-7 grid w-full max-w-xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-6 text-[9px] font-bold uppercase tracking-[0.2em] text-[#8E927F] max-[360px]:hidden sm:max-w-2xl sm:px-10"
      aria-hidden="true"
    >
      <span className="h-px bg-linear-to-r from-transparent via-border/35 to-border/10" />
      <span className="flex items-center gap-2 rounded-full border border-border/35 bg-surface/45 px-3 py-1">
        <span className="h-1 w-1 rounded-full bg-warm-accent/70" />
        LIVE PROFILE
      </span>
      <span className="h-px bg-linear-to-l from-transparent via-border/35 to-border/10" />
    </motion.div>
  );
}

function ArchiveMapOverlay({
  isOpen,
  onClose,
  onOpenAbout,
  onOpenProjects,
  onOpenJesus,
  onOpenArchiveSection,
}: ArchiveMapOverlayProps) {
  useBodyScrollLock(isOpen);

  const mapLocations: PixelArchiveMapLocation[] = [
    {
      title: 'Locked About',
      body: 'Private context and longer notes.',
      status: 'locked',
      place: 'Private Keep',
      icon: User,
      position: {
        desktop: { x: 20, y: 23 },
        mobile: { x: 21, y: 22 },
      },
      action: onOpenAbout,
    },
    {
      title: 'School',
      body: 'Coursework and study archive.',
      status: 'locked',
      place: 'Study Hills',
      icon: GraduationCap,
      position: {
        desktop: { x: 66, y: 25 },
        mobile: { x: 66, y: 25 },
      },
      action: () => onOpenArchiveSection('school'),
    },
    {
      title: 'Music',
      body: 'Practice, references, and sounds.',
      status: 'locked',
      place: 'Sound Grove',
      icon: Music,
      position: {
        desktop: { x: 14, y: 55 },
        mobile: { x: 23, y: 55 },
      },
      action: () => onOpenArchiveSection('music'),
    },
    {
      title: 'Leadership',
      body: 'Roles, values, and lessons.',
      status: 'locked',
      place: 'Council Peak',
      icon: Users,
      position: {
        desktop: { x: 42, y: 37 },
        mobile: { x: 42, y: 37 },
      },
      action: () => onOpenArchiveSection('leadership'),
    },
    {
      title: 'Projects',
      body: 'Live builds and notes.',
      status: 'public',
      place: 'Build Town',
      icon: Folder,
      position: {
        desktop: { x: 38, y: 76 },
        mobile: { x: 38, y: 76 },
      },
      action: onOpenProjects,
    },
    {
      title: 'Jesus',
      body: 'Why I follow Him.',
      status: 'public',
      place: 'Chapel Garden',
      icon: Sparkles,
      position: {
        desktop: { x: 70, y: 70 },
        mobile: { x: 70, y: 70 },
      },
      action: onOpenJesus,
    },
    {
      title: 'Instagram',
      body: 'Main contact path.',
      status: 'external',
      place: 'North Dock',
      icon: ExternalLink,
      position: {
        desktop: { x: 87, y: 22 },
        mobile: { x: 78, y: 22 },
      },
      href: profileData.instagramUrl,
    },
    {
      title: 'My Dumpy',
      body: 'Second profile link.',
      status: 'external',
      place: 'South Pier',
      icon: ExternalLink,
      position: {
        desktop: { x: 87, y: 81 },
        mobile: { x: 78, y: 81 },
      },
      href: profileData.dumpsUrl,
    },
  ];

  const handleAction = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-bg/92 px-4 py-8 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto w-full max-w-5xl rounded-3xl border border-border/60 bg-surface p-4 shadow-2xl shadow-black/35 sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-warm-accent">Archive Map</p>
                <h2 className="text-3xl font-bold tracking-tight text-text sm:text-[2.35rem]">Archive Atlas</h2>
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-muted">
                  Public paths, locked landmarks, and quiet external docks in one small world.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-accent-soft p-3 text-accent transition-[transform,background-color] duration-150 ease-out hover:bg-accent/15 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                aria-label="Close archive map"
              >
                <X size={22} />
              </button>
            </div>

            <PixelArchiveMap
              locations={mapLocations}
              onRunAction={handleAction}
              onExternalClick={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const homeRef = useRef<HTMLElement>(null);
  const meadowRef = useRef<HTMLElement>(null);
  const headerTrackRef = useRef<HTMLDivElement>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState(false);
  const [accessStep, setAccessStep] = useState(1);
  const [verifiedAccessKey, setVerifiedAccessKey] = useState<string | null>(null);
  const [accessStatus, setAccessStatus] = useState<'idle' | 'checking' | 'approved' | 'denied'>('idle');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [accessInputResetKey, setAccessInputResetKey] = useState(0);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [showBento, setShowBento] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showJesus, setShowJesus] = useState(false);
  const [showSecretPuzzle, setShowSecretPuzzle] = useState(false);
  const [showArchiveSignal, setShowArchiveSignal] = useState(false);
  const [showArchiveMap, setShowArchiveMap] = useState(false);
  const [showArchiveOverlay, setShowArchiveOverlay] = useState(false);
  const [lockedStoryPulseId, setLockedStoryPulseId] = useState<string | null>(null);
  const [activeArchiveSectionId, setActiveArchiveSectionId] = useState<ArchiveSectionId | null>('school');
  const [pendingArchiveSectionId, setPendingArchiveSectionId] = useState<ArchiveSectionId | null>(null);
  const [pendingUnlockDestination, setPendingUnlockDestination] = useState<UnlockDestination>('archive');
  const [privateArchiveSections, setPrivateArchiveSections] = useState<Partial<Record<ArchiveSectionId, PrivateArchiveSection>>>({});
  const [archiveAccessKey, setArchiveAccessKey] = useState<string | null>(null);
  const [archiveErrorMessage, setArchiveErrorMessage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => readStoredTheme() === 'dark');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(() => (
    typeof window !== 'undefined' && window.scrollY > 96
  ));
  const [expandedHeaderWidth, setExpandedHeaderWidth] = useState(() => (
    typeof window !== 'undefined' ? Math.min(640, window.innerWidth - 32) : 640
  ));
  const { scrollYProgress: pageScrollProgress } = useScroll();
  const { scrollYProgress: homeScrollProgress } = useScroll({
    target: homeRef,
    offset: ['start start', 'end start'],
  });
  const currentAccessStatusCopy = accessStatus === 'approved'
    ? accessStatusCopy.approved
    : accessStatus === 'denied'
      ? accessStatusCopy.denied
      : accessStatusCopy.checking;

  useBodyScrollLock(showModal);

  useEffect(() => {
    let frame: number | null = null;
    const updateHeaderState = () => {
      frame = null;
      setIsHeaderCollapsed((collapsed) => (
        collapsed ? window.scrollY > 24 : window.scrollY > 96
      ));
    };
    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(updateHeaderState);
    };

    updateHeaderState();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const track = headerTrackRef.current;
    if (!track) return;
    const updateWidth = () => setExpandedHeaderWidth(track.getBoundingClientRect().width);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
    storeTheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    if (!showModal) {
      setAccessStep(1);
      setPasswordInput('');
      setVerifiedAccessKey(null);
      setAccessStatus('idle');
      setArchiveErrorMessage(null);
      setError(false);
      setAccessInputResetKey(0);
      setPendingUnlockDestination('archive');
    }
  }, [showModal]);

  const showArchive = () => {
    setPendingUnlockDestination('archive');
    setActiveArchiveSectionId((current) => current ?? 'school');
    if (isUnlocked && archiveAccessKey) {
      setShowArchiveOverlay(true);
    } else {
      setPendingArchiveSectionId(activeArchiveSectionId ?? 'school');
      setArchiveErrorMessage(null);
      setShowModal(true);
    }
  };

  const openAbout = () => {
    if (isUnlocked && archiveAccessKey) {
      setShowAbout(true);
      return;
    }

    setPendingUnlockDestination('about');
    setPendingArchiveSectionId(activeArchiveSectionId ?? 'school');
    setArchiveErrorMessage(null);
    setShowModal(true);
  };

  const revealAbout = () => {
    setShowAbout(true);
  };

  const loadArchiveSection = async (sectionId: ArchiveSectionId, accessKey: string) => {
    setIsArchiveLoading(true);
    setArchiveErrorMessage(null);

    try {
      const privateSection = await fetchPrivateArchiveSection(sectionId, accessKey);
      setPrivateArchiveSections((current) => ({
        ...current,
        [sectionId]: privateSection,
      }));
      setActiveArchiveSectionId(sectionId);
      return true;
    } catch (caughtError) {
      const message = caughtError instanceof PrivateArchiveError
        ? caughtError.message
        : 'The private archive could not be opened right now.';

      setArchiveErrorMessage(message);
      return false;
    } finally {
      setIsArchiveLoading(false);
    }
  };

  const verifyAccessKey = async (accessKey: string) => {
    const sectionToOpen = pendingArchiveSectionId ?? activeArchiveSectionId ?? 'school';
    setAccessStep(3);
    setAccessStatus('checking');
    const didOpen = await loadArchiveSection(sectionToOpen, accessKey);

    if (didOpen) {
      setVerifiedAccessKey(accessKey);
      setAccessStatus('approved');
      setError(false);
    } else {
      setVerifiedAccessKey(null);
      setAccessStatus('denied');
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  const handleUnlock = () => {
    if (accessStatus !== 'approved' || !verifiedAccessKey) return;

    setIsUnlocked(true);
    setArchiveAccessKey(verifiedAccessKey);
    setShowModal(false);
    if (pendingUnlockDestination === 'about') {
      setShowArchiveOverlay(false);
      revealAbout();
    } else {
      setShowArchiveOverlay(true);
    }
    setPasswordInput('');
    setError(false);
    setPendingArchiveSectionId(null);
  };

  const retryAccessKey = () => {
    setPasswordInput('');
    setVerifiedAccessKey(null);
    setAccessStatus('idle');
    setArchiveErrorMessage(null);
    setAccessInputResetKey((current) => current + 1);
    setAccessStep(2);
  };

  const handleStoryClick = (story: StoryItem) => {
    if (story.action === 'projects') {
      setShowBento(true);
      return;
    }
    const runLockedStoryAction = (action: () => void) => {
      if (story.locked && !isUnlocked) {
        setLockedStoryPulseId(story.id);
        window.setTimeout(() => setLockedStoryPulseId(null), 420);
        window.setTimeout(action, 160);
        return;
      }
      action();
    };

    if (story.action === 'about') {
      runLockedStoryAction(openAbout);
      return;
    }
    runLockedStoryAction(() => {
      const sectionId = story.id as ArchiveSectionId;
      setPendingUnlockDestination('archive');
      setActiveArchiveSectionId(sectionId);
      if (isUnlocked && archiveAccessKey) {
        if (!privateArchiveSections[sectionId]) {
          void loadArchiveSection(sectionId, archiveAccessKey);
        }
        setShowArchiveOverlay(true);
        return;
      }
      setPendingArchiveSectionId(sectionId);
      setArchiveErrorMessage(null);
      setShowModal(true);
    });
  };

  const openArchiveSection = (sectionId: ArchiveSectionId) => {
    setPendingUnlockDestination('archive');
    setActiveArchiveSectionId(sectionId);
    if (isUnlocked && archiveAccessKey) {
      if (!privateArchiveSections[sectionId]) {
        void loadArchiveSection(sectionId, archiveAccessKey);
      }
      setShowArchiveOverlay(true);
      return;
    }
    setPendingArchiveSectionId(sectionId);
    setArchiveErrorMessage(null);
    setShowModal(true);
  };

  const lockArchive = () => {
    setIsUnlocked(false);
    setArchiveAccessKey(null);
    setPrivateArchiveSections({});
    setArchiveErrorMessage(null);
    setPasswordInput('');
    setShowArchiveOverlay(false);
  };

  const closeAbout = () => {
    setShowAbout(false);
    lockArchive();
  };

  const handleArchiveSectionSelect = (sectionId: ArchiveSectionId) => {
    setActiveArchiveSectionId(sectionId);
    if (archiveAccessKey && !privateArchiveSections[sectionId]) {
      void loadArchiveSection(sectionId, archiveAccessKey);
    }
  };

  const toggleProjectExpansion = (id: string) => {
    if (expandedProjectId === id) {
      setExpandedProjectId(null);
      return;
    }

    setExpandedProjectId(id);
  };

  const handleThemeChange = (theme: Theme) => {
    setIsDarkMode(theme === 'dark');
  };

  return (
    <div className="relative isolate flex min-h-screen flex-col items-center bg-bg selection:bg-accent-soft/40" data-living-archive>
      <GardenScrollScene progress={pageScrollProgress} theme={isDarkMode ? 'evening' : 'day'} />
      <motion.header
        className="pointer-events-none fixed left-0 top-0 z-40 flex w-full justify-center px-4 py-3"
        data-header-collapsed={isHeaderCollapsed ? 'true' : 'false'}
      >
        <div ref={headerTrackRef} className="relative h-[60px] w-full max-w-container-max" data-header-glass-track>
          <motion.div
            className="pointer-events-none absolute overflow-hidden border border-border/50 bg-bg/78 backdrop-blur-2xl"
            style={{ left: '50%', top: '50%', x: '-50%', y: '-50%' }}
            initial={false}
            animate={{
              width: isHeaderCollapsed ? Math.min(158, expandedHeaderWidth) : expandedHeaderWidth,
              height: isHeaderCollapsed ? 52 : 60,
              borderRadius: isHeaderCollapsed ? 999 : 21.6,
              boxShadow: isHeaderCollapsed
                ? '0 14px 34px rgba(0,0,0,0.17), inset 0 1px 0 rgba(255,255,255,0.14)'
                : '0 9px 24px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.11)',
            }}
            transition={{ type: 'spring', stiffness: 215, damping: 29, mass: 0.78 }}
            data-header-glass-shell
          >
            <div className="absolute inset-px rounded-[inherit] bg-linear-to-b from-white/14 via-transparent to-black/5" />
            <motion.div
              className="absolute -top-8 h-14 w-28 rounded-full bg-white/12 blur-xl"
              animate={{ left: isHeaderCollapsed ? '34%' : '8%', opacity: isHeaderCollapsed ? 0.3 : 0.5 }}
              transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>

          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={isHeaderCollapsed ? 'compact-header-content' : 'expanded-header-content'}
              initial={{ opacity: 0, y: isHeaderCollapsed ? -4 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isHeaderCollapsed ? 4 : -4 }}
              transition={{ duration: 0.26, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto absolute inset-0 flex items-center ${
                isHeaderCollapsed ? 'justify-center gap-2 px-2' : 'justify-between px-4 sm:px-5'
              }`}
            >
              <button
                type="button"
                onClick={() => window.scrollTo({
                  top: 0,
                  behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                })}
                className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full font-bold tracking-tight text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${isHeaderCollapsed ? 'px-1.5 text-sm' : 'h-10 text-[15px] leading-none'}`}
                aria-label="Back to top"
              >
                {isHeaderCollapsed ? (
                  <span className="px-1 font-mono text-[12px] font-black uppercase tracking-[0.18em]">JZ</span>
                ) : (
                  <TextScramble text="About.JZ" className="archive-brand-signal translate-y-[2px]" />
                )}
              </button>
              <div className="flex items-center gap-1.5 text-accent sm:gap-2">
                <ThemeToggle
                  defaultTheme={isDarkMode ? 'dark' : 'light'}
                  onThemeChange={handleThemeChange}
                />
                <button
                  type="button"
                  onClick={() => setShowArchiveMap(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-2.5 text-accent transition-[transform,background-color] duration-150 ease-out hover:bg-accent-soft active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:px-3"
                  title="Archive map"
                  aria-label="Open archive map"
                >
                  <Map size={18} aria-hidden="true" />
                  {!isHeaderCollapsed && (
                    <span className="hidden whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.16em] sm:inline">
                      Map
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.header>

      <main ref={homeRef} className="relative z-20 flex w-full max-w-container-max flex-grow flex-col gap-10 px-4 sm:gap-[clamp(2.75rem,6vh,4.25rem)]">
        <ScrollChapter
          id="profile"
          desktopVh={200}
          mobileVh={150}
          stickyClassName="flex items-center justify-center pt-16 pb-10 sm:pt-20 sm:pb-12"
          ariaLabel="Profile opening scroll scene"
          className="-mx-1"
        >
          {(scrollMotion) => (
            <>
              <div className="relative w-full" data-vine-anchor="profile">
                <ProfileCard
                  profile={profileData}
                  faithHover={faithHover}
                  onFaithClick={() => setShowJesus(true)}
                  scrollMotion={scrollMotion}
                />
              </div>
              <ScrollEntryCue progress={scrollMotion.progress} reducedMotion={scrollMotion.reducedMotion} />
            </>
          )}
        </ScrollChapter>
        <ArchiveRail />
        <ParallaxLayer
          progress={homeScrollProgress}
          inputRange={[0.12, 0.58]}
          x={[-18, 16]}
          y={[24, -34]}
          opacity={[1, 0.98]}
          rotate={[-0.7, 0.55]}
          blur={[0, 0.6]}
          className="relative"
        >
          <div data-vine-anchor="stories">
            <StoryHighlights
              stories={storyItems}
              isUnlocked={isUnlocked}
              lockedPulseId={lockedStoryPulseId}
              onStoryClick={handleStoryClick}
            />
          </div>
        </ParallaxLayer>
        <ParallaxLayer
          progress={homeScrollProgress}
          inputRange={[0.2, 0.72]}
          x={[20, -20]}
          y={[34, -38]}
          scale={[0.99, 1.01]}
          rotate={[0.65, -0.55]}
          blur={[0.5, 0]}
        >
          <div data-vine-anchor="now">
            <NowSection items={nowItems} onSecretClick={() => setShowSecretPuzzle(true)} />
          </div>
        </ParallaxLayer>
        <ScrollChapter
          id="photos"
          desktopVh={220}
          mobileVh={160}
          stickyClassName="flex items-center justify-center pt-14"
          ariaLabel="Photographic memories scroll scene"
          className="scroll-chapter--viewport"
        >
          {(photoMotion) => (
            <div className="h-[calc(100svh-4.5rem)] w-full" data-vine-anchor="photos">
              <PhotoOrbitTransition
                progress={photoMotion.progress}
                pointerX={photoMotion.pointerX}
                pointerY={photoMotion.pointerY}
                reducedMotion={photoMotion.reducedMotion}
                theme={isDarkMode ? 'evening' : 'day'}
              />
            </div>
          )}
        </ScrollChapter>

        <motion.hr
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="border-t border-border/30 w-full"
        />

        <footer className="relative isolate w-full overflow-hidden rounded-[1.35rem] border border-border/45 bg-surface p-4 shadow-xl shadow-black/15 backdrop-blur-sm sm:p-[1.125rem]">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-warm-accent">Contact path</p>
              <h2 className="mt-1.5 text-lg font-bold tracking-tight text-text sm:text-xl">Instagram first. Archive stays locked.</h2>
              <p className="mt-1.5 max-w-md text-xs font-medium leading-5 text-muted sm:text-[13px]">
                Public builds are open. Private notes need the key.
              </p>
            </div>
            <div className="grid gap-2 min-[420px]:grid-cols-2 sm:min-w-[20rem]">
              <a
                href={profileData.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center justify-center rounded-full bg-accent px-4 py-2 text-center text-xs font-bold text-bg shadow-md shadow-accent/10 transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-accent-dark active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Instagram
              </a>
              <a
                href={profileData.dumpsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-warm-accent/42 bg-warm-accent/10 px-4 py-2 text-center text-xs font-bold text-text transition-[transform,background-color,border-color] duration-150 ease-out hover:bg-warm-accent/15 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                My Dumpy
              </a>
              <button
                type="button"
                onClick={showArchive}
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-border/55 bg-bg/40 px-4 py-2 text-xs font-bold text-text transition-[transform,border-color,background-color] duration-150 ease-out hover:border-accent/40 hover:bg-accent-soft/45 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Archive
              </button>
              <button
                type="button"
                onClick={openAbout}
                className="inline-flex min-h-9 items-center justify-center rounded-full border border-border/55 bg-bg/40 px-4 py-2 text-xs font-bold text-text transition-[transform,border-color,background-color] duration-150 ease-out hover:border-accent/40 hover:bg-accent-soft/45 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Locked About
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-border/30 pt-3.5">
            <span className="font-bold tracking-wide text-accent">
              <TextScramble text="About.JZ" className="scale-90" />
            </span>
            <span className="text-right text-[10px] font-bold uppercase tracking-widest text-[#8E927F]">
              © {new Date().getFullYear()} About.JZ
            </span>
          </div>
        </footer>
      </main>

      <ScrollChapter
        id="meadow"
        desktopVh={185}
        mobileVh={145}
        stickyClassName="flex items-end justify-center"
        ariaLabel="Pixel meadow finale scroll scene"
        className="mt-[clamp(3rem,8vh,5rem)] w-full"
      >
        {(meadowMotion) => (
          <div className="h-[100svh] w-full" data-vine-anchor="meadow">
            <PixelMeadow
              progress={meadowMotion.progress}
              pageProgress={pageScrollProgress}
              sectionRef={meadowRef}
              theme={isDarkMode ? 'evening' : 'day'}
              pointerX={meadowMotion.pointerX}
              pointerY={meadowMotion.pointerY}
            />
          </div>
        )}
      </ScrollChapter>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/82 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className={`w-full max-w-md ${error ? 'animate-shake' : ''}`}
            >
              <Stepper
                currentStep={accessStep}
                onStepChange={(step) => setAccessStep(step)}
                disableStepIndicators
                backButtonText="Back"
                nextButtonText="Continue"
                finalButtonText={accessStatus === 'approved' ? 'Unlock' : 'Try again'}
                nextButtonProps={accessStep === 3 ? {
                  onClick: accessStatus === 'approved' ? handleUnlock : retryAccessKey,
                  disabled: accessStatus === 'checking',
                } : {}}
              >
                <Step>
                  <div className="flex flex-col items-center gap-5 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent ring-1 ring-border/80">
                      <Lock size={34} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-warm-accent">Private archive</p>
                      <h3 className="text-2xl font-bold text-text uppercase tracking-tight">Locked</h3>
                      <p className="text-sm font-medium leading-relaxed text-muted">
                        Enter the access key to continue.
                      </p>
                      <p className="text-xs leading-relaxed text-[#8E927F]">
                        DM @ur_bro_jz for the password before opening private notes or photos.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-text"
                    >
                      Cancel
                    </button>
                  </div>
                </Step>

                <Step>
                  <div className="flex flex-col items-center gap-5 text-center">
                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-warm-accent">Access key</p>
                      <h3 className="text-2xl font-bold text-text">Type the key</h3>
                      <p className="text-sm leading-relaxed text-muted">
                        It checks automatically once all characters are filled.
                      </p>
                    </div>

                    <div className="flex w-full justify-center py-3">
                      <InputOTP
                        key={accessInputResetKey}
                        autoFocus
                        maxLength={7}
                        value={passwordInput}
                        onChange={(value) => {
                          setPasswordInput(value);
                          if (archiveErrorMessage) setArchiveErrorMessage(null);
                        }}
                        onComplete={(value) => {
                          void verifyAccessKey(value);
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 7 }).map((_, i) => (
                            <InputOTPSlot key={i} index={i} masked />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <button
                      onClick={() => setShowModal(false)}
                      className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-text"
                    >
                      Cancel
                    </button>
                  </div>
                </Step>

                <Step>
                  <div className="flex flex-col items-center gap-5 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent ring-1 ring-border/80">
                      {accessStatus === 'checking' ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="h-7 w-7 rounded-full border-2 border-accent/25 border-t-accent"
                        />
                      ) : accessStatus === 'approved' ? (
                        <span className="text-3xl font-black">✓</span>
                      ) : (
                        <Lock size={30} strokeWidth={2.5} className="text-warm-accent" />
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-warm-accent">
                        {currentAccessStatusCopy.label}
                      </p>
                      <h3 className="text-2xl font-bold text-text">
                        {currentAccessStatusCopy.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted">
                        {currentAccessStatusCopy.body}
                      </p>
                    </div>

                    {archiveErrorMessage && accessStatus === 'denied' && (
                      <p className="rounded-xl border border-warm-accent/25 bg-warm-accent/10 px-4 py-3 text-xs font-semibold leading-relaxed text-warm-accent">
                        {archiveErrorMessage}
                      </p>
                    )}

                    <button
                      onClick={() => setShowModal(false)}
                      className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-accent-soft hover:text-text"
                    >
                      Cancel
                    </button>
                  </div>
                </Step>
              </Stepper>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AboutOverlay
        isOpen={showAbout}
        profile={profileData}
        sections={aboutSections}
        facts={profileFacts}
        focusItems={focusItems}
        archiveStyleItems={archiveStyleItems}
        journalEntries={journalEntries}
        toolItems={toolItems}
        onClose={closeAbout}
      />

      <JesusOverlay
        isOpen={showJesus}
        sections={faithSections}
        onClose={() => setShowJesus(false)}
      />

      <SecretPuzzleOverlay
        isOpen={showSecretPuzzle}
        onClose={() => setShowSecretPuzzle(false)}
      />

      <ArchiveSignalOverlay
        isOpen={showArchiveSignal}
        onClose={() => setShowArchiveSignal(false)}
        onOpenArchive={showArchive}
        onOpenProjects={() => setShowBento(true)}
        onOpenMusic={() => openArchiveSection('music')}
      />

      <ArchiveMapOverlay
        isOpen={showArchiveMap}
        onClose={() => setShowArchiveMap(false)}
        onOpenAbout={openAbout}
        onOpenProjects={() => setShowBento(true)}
        onOpenJesus={() => setShowJesus(true)}
        onOpenArchiveSection={openArchiveSection}
      />

      <ProjectOverlays
        projects={projects}
        toolItems={toolItems}
        showBento={showBento}
        expandedProjectId={expandedProjectId}
        onCloseBento={() => setShowBento(false)}
        onCardClick={toggleProjectExpansion}
        onCloseProject={() => setExpandedProjectId(null)}
      />

      <ArchiveVault
        isOpen={showArchiveOverlay}
        isUnlocked={isUnlocked}
        isLoading={isArchiveLoading}
        sections={archiveSections}
        activeSectionId={activeArchiveSectionId}
        activeSection={activeArchiveSectionId ? privateArchiveSections[activeArchiveSectionId] ?? null : null}
        errorMessage={archiveErrorMessage}
        onSelectSection={handleArchiveSectionSelect}
        onClose={lockArchive}
        onLock={lockArchive}
      />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
