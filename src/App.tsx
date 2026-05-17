/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { LayoutGrid, Lock, Menu, Moon, Plus, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ArchiveVault } from './components/ArchiveVault';
import { AboutOverlay } from './components/AboutOverlay';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './components/InputOTP';
import { NowSection } from './components/NowSection';
import { PlaceholderModal } from './components/PlaceholderModal';
import { ProfileCard } from './components/ProfileCard';
import { ProjectOverlays } from './components/ProjectOverlays';
import { StoryHighlights } from './components/StoryHighlights';
import { TextScramble } from './components/TextScramble';
import {
  aboutSections,
  archiveSections,
  archiveStyleItems,
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
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [showBento, setShowBento] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [activeArchiveSectionId, setActiveArchiveSectionId] = useState<ArchiveSectionId | null>('school');
  const [pendingArchiveSectionId, setPendingArchiveSectionId] = useState<ArchiveSectionId | null>(null);
  const [privateArchiveSections, setPrivateArchiveSections] = useState<Partial<Record<ArchiveSectionId, PrivateArchiveSection>>>({});
  const [archiveAccessKey, setArchiveAccessKey] = useState<string | null>(null);
  const [archiveErrorMessage, setArchiveErrorMessage] = useState<string | null>(null);
  const [placeholderContent, setPlaceholderContent] = useState<PlaceholderContent | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedPreference = localStorage.getItem('darkMode');
      return savedPreference === null
        ? true
        : savedPreference === 'true' || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const showArchive = () => {
    setActiveArchiveSectionId((current) => current ?? 'school');
    if (isUnlocked && archiveAccessKey) {
      document.getElementById('archive-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setPendingArchiveSectionId(activeArchiveSectionId ?? 'school');
      setArchiveErrorMessage(null);
      setShowModal(true);
    }
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

  const handleUnlock = async () => {
    const sectionToOpen = pendingArchiveSectionId ?? activeArchiveSectionId ?? 'school';
    const didOpen = await loadArchiveSection(sectionToOpen, passwordInput);

    if (didOpen) {
      setIsUnlocked(true);
      setArchiveAccessKey(passwordInput);
      setShowModal(false);
      setPasswordInput('');
      setError(false);
      setPendingArchiveSectionId(null);
      setTimeout(() => {
        document.getElementById('archive-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  const handleStoryClick = (story: StoryItem) => {
    if (story.action === 'projects') {
      setShowBento(true);
      return;
    }
    if (story.action === 'about') {
      setShowAbout(true);
      return;
    }
    const sectionId = story.id as ArchiveSectionId;
    setActiveArchiveSectionId(sectionId);
    if (isUnlocked && archiveAccessKey) {
      if (!privateArchiveSections[sectionId]) {
        void loadArchiveSection(sectionId, archiveAccessKey);
      }
      setTimeout(() => {
        document.getElementById('archive-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    setLoadingProjectId(id);
    setTimeout(() => {
      setExpandedProjectId(id);
      setLoadingProjectId(null);
    }, 600);
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
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full text-accent hover:bg-accent-soft transition-all active:scale-90"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            <button
              onClick={() => setPlaceholderContent(placeholders.create)}
              className="p-2 rounded-full text-accent hover:bg-accent-soft transition-all active:scale-90"
              title="Create tools coming soon"
            >
              <Plus size={24} />
            </button>
            <button
              onClick={() => setPlaceholderContent(placeholders.grid)}
              className="p-2 rounded-full text-accent hover:bg-accent-soft transition-all active:scale-90"
              title="Grid controls coming soon"
            >
              <LayoutGrid size={24} />
            </button>
            <button
              onClick={() => setPlaceholderContent(placeholders.menu)}
              className="p-2 rounded-full text-accent hover:bg-accent-soft transition-all active:scale-90"
              title="Menu coming soon"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-container-max px-4 flex flex-col gap-12 flex-grow">
        <ProfileCard profile={profileData} onResumeClick={() => setPlaceholderContent(placeholders.resume)} />
        <StoryHighlights stories={storyItems} isUnlocked={isUnlocked} onStoryClick={handleStoryClick} />
        <NowSection items={nowItems} />

        <motion.hr
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="border-t border-border/30 w-full"
        />

        <ArchiveVault
          isUnlocked={isUnlocked}
          isLoading={isArchiveLoading}
          sections={archiveSections}
          activeSectionId={activeArchiveSectionId}
          activeSection={activeArchiveSectionId ? privateArchiveSections[activeArchiveSectionId] ?? null : null}
          errorMessage={archiveErrorMessage}
          onSelectSection={handleArchiveSectionSelect}
          onLock={lockArchive}
        />

        <footer className="w-full overflow-hidden rounded-3xl border border-border/45 bg-surface p-6 shadow-2xl shadow-black/20 sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-warm-accent">Romans 12:16-21</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight text-text sm:text-4xl">
            A quiet archive for the things worth keeping.
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-muted">
            Keep the page humble, private, and useful: live at peace, make room for what matters, and build with patience instead of noise.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={showArchive}
              className="rounded-full bg-accent px-6 py-3 text-sm font-bold text-bg transition-all hover:bg-accent-dark active:scale-95"
            >
              Open Archive
            </button>
            <button
              onClick={() => setShowAbout(true)}
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
          <div className="mt-10 flex items-center justify-between gap-4 border-t border-border/35 pt-5">
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
              className={`bg-surface rounded-2xl shadow-2xl shadow-black/40 border border-border/70 p-7 sm:p-8 w-full max-w-sm flex flex-col items-center text-center gap-6 ${error ? 'animate-shake' : ''}`}
            >
              <div className="w-16 h-16 bg-accent-soft rounded-full flex items-center justify-center text-warm-accent ring-1 ring-border/80">
                <Lock size={32} fill="currentColor" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold text-text uppercase tracking-tight">Locked</h3>
                <p className="text-muted text-sm font-medium">Enter the access key to continue.</p>
                <p className="text-[#8E927F] text-xs leading-relaxed">
                  The key is checked on the server before private photos or notes are loaded.
                </p>
              </div>

              <div className="w-full flex justify-center py-4">
                <InputOTP
                  autoFocus
                  maxLength={7}
                  value={passwordInput}
                  onChange={(value) => setPasswordInput(value)}
                  onComplete={handleUnlock}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 7 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {archiveErrorMessage && (
                <p className="rounded-xl border border-warm-accent/25 bg-warm-accent/10 px-4 py-3 text-xs font-semibold leading-relaxed text-warm-accent">
                  {archiveErrorMessage}
                </p>
              )}

              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={handleUnlock}
                  disabled={isArchiveLoading}
                  className="w-full py-4 bg-accent text-bg font-bold rounded-full hover:bg-accent-dark active:scale-95 premium-transition shadow-lg shadow-accent/10"
                >
                  {isArchiveLoading ? 'Checking...' : 'Unlock'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 bg-transparent text-muted font-semibold rounded-full hover:bg-accent-soft active:scale-95 premium-transition"
                >
                  Cancel
                </button>
              </div>
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
        onClose={() => setShowAbout(false)}
      />

      <ProjectOverlays
        projects={projects}
        showBento={showBento}
        expandedProjectId={expandedProjectId}
        onCloseBento={() => setShowBento(false)}
        onCardClick={toggleProjectExpansion}
        onCloseProject={() => setExpandedProjectId(null)}
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
