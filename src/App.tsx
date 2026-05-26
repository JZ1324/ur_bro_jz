/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Folder, GraduationCap, LayoutGrid, Lock, Menu, Music, Plus, Sparkles, User, Users, X } from 'lucide-react';
import { AnimatePresence, motion, useScroll } from 'motion/react';
import { ArchiveVault } from './components/ArchiveVault';
import { AboutOverlay } from './components/AboutOverlay';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './components/InputOTP';
import { JesusOverlay } from './components/JesusOverlay';
import { NowSection } from './components/NowSection';
import { ParallaxLayer } from './components/ParallaxLayer';
import { ProfileCard } from './components/ProfileCard';
import { ProjectOverlays } from './components/ProjectOverlays';
import { SecretPuzzleOverlay } from './components/SecretPuzzleOverlay';
import { StoryHighlights } from './components/StoryHighlights';
import { TextScramble } from './components/TextScramble';
import Stepper, { Step } from './components/ui/Stepper';
import { ThemeToggle, type Theme } from './components/ui/ThemeToggle';
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

type UnlockDestination = 'archive' | 'about';
type ArchiveMapStatus = 'locked' | 'public' | 'external' | 'hidden';

type ArchiveSignalOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenArchive: () => void;
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
                  The header now works like a small control shelf: signal, projects, and map.
                </p>
              </div>
              <div className="rounded-2xl border border-warm-accent/25 bg-warm-accent/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-accent">Current signal</p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
                  Tightening the public side so it feels calmer, cleaner, and less like a random link page.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => runAction(onOpenArchive)}
                className="rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-bg transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-accent-dark active:scale-[0.97]"
              >
                Open Archive
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.46, delay: 0.12, ease: [0.23, 1, 0.32, 1] }}
      className="relative mx-auto -mt-5 -mb-6 flex w-full max-w-4xl items-center gap-3 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted"
      aria-hidden="true"
    >
      <span className="h-px flex-1 bg-linear-to-r from-transparent via-border/65 to-border/20" />
      <span className="archive-rail-pill">JZ / Archive / 2026</span>
      <span className="archive-rail-dot" />
      <span className="hidden text-[#8E927F] sm:inline">public front / private notes</span>
      <span className="h-px flex-1 bg-linear-to-l from-transparent via-border/65 to-border/20" />
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

  const lockedItems: Array<{
    title: string;
    body: string;
    status: ArchiveMapStatus;
    icon: typeof Lock;
    action: () => void;
  }> = [
    { title: 'Locked About', body: 'Private context and longer notes.', status: 'locked', icon: User, action: onOpenAbout },
    { title: 'School', body: 'Coursework and study archive.', status: 'locked', icon: GraduationCap, action: () => onOpenArchiveSection('school') },
    { title: 'Music', body: 'Practice, references, and sounds.', status: 'locked', icon: Music, action: () => onOpenArchiveSection('music') },
    { title: 'Leadership', body: 'Roles, values, and lessons.', status: 'locked', icon: Users, action: () => onOpenArchiveSection('leadership') },
  ];

  const publicItems: Array<{
    title: string;
    body: string;
    status: ArchiveMapStatus;
    icon: typeof Lock;
    action?: () => void;
    href?: string;
  }> = [
    { title: 'Projects', body: 'Live builds and notes.', status: 'public', icon: Folder, action: onOpenProjects },
    { title: 'Jesus', body: 'Why I follow Him.', status: 'public', icon: Sparkles, action: onOpenJesus },
    { title: 'Instagram', body: 'Main contact path.', status: 'external', icon: ExternalLink, href: profileData.instagramUrl },
    { title: 'My Dumpy', body: 'Second profile link.', status: 'external', icon: ExternalLink, href: profileData.dumpsUrl },
  ];

  const handleAction = (action: () => void) => {
    onClose();
    action();
  };

  const renderItem = (item: (typeof lockedItems[number]) | (typeof publicItems[number])) => {
    const Icon = item.icon;
    const content = (
      <>
        <div className="flex items-start justify-between gap-3">
          <Icon size={22} className="mt-1 text-accent" />
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
            item.status === 'locked'
              ? 'border-warm-accent/35 bg-warm-accent/10 text-warm-accent'
              : item.status === 'external'
                ? 'border-border/50 bg-bg/45 text-muted'
                : 'border-accent/30 bg-accent/10 text-accent'
          }`}
          >
            {item.status}
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-bold text-text">{item.title}</h3>
          <p className="mt-1 text-sm font-medium leading-relaxed text-muted">{item.body}</p>
        </div>
      </>
    );

    if ('href' in item && item.href) {
      return (
        <a
          key={item.title}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="rounded-2xl border border-border/45 bg-bg/45 p-4 text-left transition-[transform,background-color,border-color] duration-180 ease-out hover:-translate-y-px hover:border-accent/35 hover:bg-accent-soft/45 active:scale-[0.99]"
        >
          {content}
        </a>
      );
    }

    return (
      <button
        key={item.title}
        type="button"
        onClick={() => item.action && handleAction(item.action)}
        className="rounded-2xl border border-border/45 bg-bg/45 p-4 text-left transition-[transform,background-color,border-color] duration-180 ease-out hover:-translate-y-px hover:border-accent/35 hover:bg-accent-soft/45 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {content}
      </button>
    );
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
            className="mx-auto w-full max-w-4xl rounded-3xl border border-border/60 bg-surface p-5 shadow-2xl shadow-black/35 sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-warm-accent">Archive Map</p>
                <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Where everything is</h2>
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-muted sm:text-base">
                  Public paths, locked sections, and the quiet external links in one place.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-accent-soft p-3 text-accent transition-[transform,background-color] duration-150 ease-out hover:bg-accent/15 active:scale-[0.96]"
                aria-label="Close archive map"
              >
                <X size={22} />
              </button>
            </div>

            <div className="mt-7 grid gap-5">
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8E927F]">Locked</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {lockedItems.map(renderItem)}
                </div>
              </section>
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8E927F]">Public / external</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {publicItems.map(renderItem)}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const homeRef = useRef<HTMLElement>(null);
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
  const [activeArchiveSectionId, setActiveArchiveSectionId] = useState<ArchiveSectionId | null>('school');
  const [pendingArchiveSectionId, setPendingArchiveSectionId] = useState<ArchiveSectionId | null>(null);
  const [pendingUnlockDestination, setPendingUnlockDestination] = useState<UnlockDestination>('archive');
  const [privateArchiveSections, setPrivateArchiveSections] = useState<Partial<Record<ArchiveSectionId, PrivateArchiveSection>>>({});
  const [archiveAccessKey, setArchiveAccessKey] = useState<string | null>(null);
  const [archiveErrorMessage, setArchiveErrorMessage] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { scrollYProgress: homeScrollProgress } = useScroll({
    target: homeRef,
    offset: ['start start', 'end start'],
  });

  useBodyScrollLock(showModal);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
    if (story.action === 'about') {
      openAbout();
      return;
    }
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
    <div className="min-h-screen pt-20 pb-10 flex flex-col items-center bg-bg selection:bg-accent-soft/40">
      <header className="fixed top-0 left-0 w-full z-40 bg-bg/85 backdrop-blur-md border-b border-border/50 flex justify-center px-4 py-3">
        <div className="w-full max-w-container-max flex justify-between items-center">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xl font-bold tracking-tight text-text"
            aria-label="Back to top"
          >
            <TextScramble text="jz.archive" className="scale-75 origin-left" />
          </button>
          <div className="flex items-center gap-2 text-accent">
            <ThemeToggle
              defaultTheme={isDarkMode ? 'dark' : 'light'}
              onThemeChange={handleThemeChange}
            />
            <button
              onClick={() => setShowArchiveSignal(true)}
              className="p-2 rounded-full text-accent transition-[transform,background-color] duration-150 ease-out hover:bg-accent-soft active:scale-[0.96]"
              title="Archive signal"
              aria-label="Open archive signal"
            >
              <Plus size={24} />
            </button>
            <button
              onClick={() => setShowBento(true)}
              className="p-2 rounded-full text-accent transition-[transform,background-color] duration-150 ease-out hover:bg-accent-soft active:scale-[0.96]"
              title="Project explorer"
              aria-label="Open project explorer"
            >
              <LayoutGrid size={24} />
            </button>
            <button
              onClick={() => setShowArchiveMap(true)}
              className="p-2 rounded-full text-accent transition-[transform,background-color] duration-150 ease-out hover:bg-accent-soft active:scale-[0.96]"
              title="Archive map"
              aria-label="Open archive map"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <main ref={homeRef} className="w-full max-w-container-max px-4 flex flex-col gap-12 flex-grow">
        <ProfileCard
          profile={profileData}
          faithHover={faithHover}
          onFaithClick={() => setShowJesus(true)}
        />
        <ArchiveRail />
        <ParallaxLayer
          progress={homeScrollProgress}
          inputRange={[0.12, 0.58]}
          y={[18, -26]}
          opacity={[1, 0.98]}
        >
          <StoryHighlights stories={storyItems} isUnlocked={isUnlocked} onStoryClick={handleStoryClick} />
        </ParallaxLayer>
        <ParallaxLayer
          progress={homeScrollProgress}
          inputRange={[0.2, 0.72]}
          y={[26, -30]}
          scale={[0.99, 1.01]}
          opacity={[0.96, 1]}
        >
          <NowSection items={nowItems} onSecretClick={() => setShowSecretPuzzle(true)} />
        </ParallaxLayer>

        <motion.hr
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="border-t border-border/30 w-full"
        />

        <footer className="w-full overflow-hidden rounded-3xl border border-border/45 bg-surface p-5 shadow-2xl shadow-black/20 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={showArchive}
              className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-bg transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-accent-dark active:scale-[0.97]"
            >
              Open Archive
            </button>
            <button
              onClick={openAbout}
              className="rounded-full border border-accent/30 bg-accent-soft px-6 py-3 text-sm font-bold text-text transition-[transform,background-color,border-color] duration-150 ease-out hover:bg-[#2A3125] active:scale-[0.97]"
            >
              Read About
            </button>
            <a
              href={profileData.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border/60 px-6 py-3 text-center text-sm font-bold text-muted transition-[transform,color,border-color] duration-150 ease-out hover:border-accent/40 hover:text-accent active:scale-[0.97]"
            >
              Instagram
            </a>
          </div>
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-border/35 pt-5">
            <span className="font-bold tracking-wide text-accent">
              <TextScramble text="jz.archive" className="scale-90" />
            </span>
            <span className="text-right text-[10px] font-bold uppercase tracking-widest text-[#8E927F]">
              © {new Date().getFullYear()} joshua.archive
            </span>
          </div>
        </footer>
      </main>

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
                        {accessStatus === 'approved' ? 'Access approved' : accessStatus === 'denied' ? 'Access declined' : 'Checking access'}
                      </p>
                      <h3 className="text-2xl font-bold text-text">
                        {accessStatus === 'approved' ? 'Ready to unlock' : accessStatus === 'denied' ? 'Key did not open it' : 'Checking key'}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted">
                        {accessStatus === 'approved'
                          ? 'The section is already verified. Unlock will open it instantly.'
                          : accessStatus === 'denied'
                            ? 'Try the key again. Nothing private was loaded.'
                            : 'The key is being checked before private archive content loads.'}
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
