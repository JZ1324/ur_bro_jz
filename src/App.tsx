/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { LayoutGrid, Lock, Menu, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ArchiveVault } from './components/ArchiveVault';
import { AboutOverlay } from './components/AboutOverlay';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './components/InputOTP';
import { JesusOverlay } from './components/JesusOverlay';
import { NowSection } from './components/NowSection';
import { PlaceholderModal } from './components/PlaceholderModal';
import { ProfileCard } from './components/ProfileCard';
import { ProjectOverlays } from './components/ProjectOverlays';
import { SecretPuzzleOverlay } from './components/SecretPuzzleOverlay';
import { StoryHighlights } from './components/StoryHighlights';
import { TextScramble } from './components/TextScramble';
import Stepper, { Step } from './components/ui/Stepper';
import { ThemeToggle, type Theme } from './components/ui/ThemeToggle';
import {
  aboutSections,
  archiveSections,
  archiveStyleItems,
  faithHover,
  faithSections,
  focusItems,
  nowItems,
  placeholders,
  profileData,
  profileFacts,
  projects,
  storyItems,
  type ArchiveSectionId,
  type ArchiveSection,
  type PlaceholderContent,
  type PrivateArchiveSection,
  type StoryItem,
} from './data/site';
import { fetchPrivateArchiveSection, PrivateArchiveError } from './lib/privateArchive';

export default function App() {
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
  const [showArchiveOverlay, setShowArchiveOverlay] = useState(false);
  const [pendingUnlockDestination, setPendingUnlockDestination] = useState<'archive' | 'about'>('archive');
  const [activeArchiveSectionId, setActiveArchiveSectionId] = useState<ArchiveSectionId | null>('school');
  const [pendingArchiveSectionId, setPendingArchiveSectionId] = useState<ArchiveSectionId | null>(null);
  const [privateArchiveSections, setPrivateArchiveSections] = useState<Partial<Record<ArchiveSectionId, PrivateArchiveSection>>>({});
  const [archiveAccessKey, setArchiveAccessKey] = useState<string | null>(null);
  const [archiveErrorMessage, setArchiveErrorMessage] = useState<string | null>(null);
  const [placeholderContent, setPlaceholderContent] = useState<PlaceholderContent | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

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
    setActiveArchiveSectionId((current) => current ?? 'school');
    if (isUnlocked && archiveAccessKey) {
      setShowArchiveOverlay(true);
    } else {
      setPendingUnlockDestination('archive');
      setPendingArchiveSectionId(activeArchiveSectionId ?? 'school');
      setArchiveErrorMessage(null);
      setShowModal(true);
    }
  };

  const showAboutLocked = () => {
    if (isUnlocked && archiveAccessKey) {
      setShowAbout(true);
      return;
    }

    setPendingUnlockDestination('about');
    setPendingArchiveSectionId(activeArchiveSectionId ?? 'school');
    setArchiveErrorMessage(null);
    setShowModal(true);
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
      setShowAbout(true);
      setShowArchiveOverlay(false);
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
      showAboutLocked();
      return;
    }
    const sectionId = story.id as ArchiveSectionId;
    setActiveArchiveSectionId(sectionId);
    if (isUnlocked && archiveAccessKey) {
      if (!privateArchiveSections[sectionId]) {
        void loadArchiveSection(sectionId, archiveAccessKey);
      }
      setShowArchiveOverlay(true);
      return;
    }
    setPendingArchiveSectionId(sectionId);
    setPendingUnlockDestination('archive');
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
              onClick={() => setPlaceholderContent(placeholders.create)}
              className="p-2 rounded-full text-accent hover:bg-accent-soft transition-all active:scale-90"
              title="Capture archive entry"
            >
              <Plus size={24} />
            </button>
            <button
              onClick={() => setPlaceholderContent(placeholders.grid)}
              className="p-2 rounded-full text-accent hover:bg-accent-soft transition-all active:scale-90"
              title="View archive modes"
            >
              <LayoutGrid size={24} />
            </button>
            <button
              onClick={() => setPlaceholderContent(placeholders.menu)}
              className="p-2 rounded-full text-accent hover:bg-accent-soft transition-all active:scale-90"
              title="Archive controls"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-container-max px-4 flex flex-col gap-12 flex-grow">
        <ProfileCard
          profile={profileData}
          faithHover={faithHover}
          onFaithClick={() => setShowJesus(true)}
        />
        <StoryHighlights stories={storyItems} isUnlocked={isUnlocked} onStoryClick={handleStoryClick} />
        <NowSection items={nowItems} onSecretClick={() => setShowSecretPuzzle(true)} />

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
              className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-bg transition-all hover:bg-accent-dark active:scale-95"
            >
              Open Archive
            </button>
            <button
              onClick={showAboutLocked}
              className="rounded-full border border-accent/30 bg-accent-soft px-6 py-3 text-sm font-bold text-text transition-all hover:bg-[#2A3125] active:scale-95"
            >
              Read About
            </button>
            <a
              href={profileData.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border/60 px-6 py-3 text-center text-sm font-bold text-muted transition-all hover:border-accent/40 hover:text-accent active:scale-95"
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
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
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
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-warm-accent ring-1 ring-border/80">
                      <Lock size={32} fill="currentColor" />
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
                        <Lock size={30} fill="currentColor" className="text-warm-accent" />
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
        faithHover={faithHover}
        onFaithClick={() => setShowJesus(true)}
        onClose={() => setShowAbout(false)}
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

      <ProjectOverlays
        projects={projects}
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

      <PlaceholderModal content={placeholderContent} onClose={() => setPlaceholderContent(null)} />

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
