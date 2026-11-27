/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './components/InputOTP';
import { GardenHome } from './components/GardenHome';
import Stepper, { Step } from './components/ui/Stepper';
import { readStoredTheme, storeTheme } from './themePreference';
import { useBodyScrollLock } from './hooks/useBodyScrollLock';
import { useOverlayFocus } from './hooks/useOverlayFocus';
import {
  aboutSections,
  archiveSections,
  archiveStyleItems,
  faithSections,
  focusItems,
  journalEntries,
  profileData,
  profileFacts,
  projects,
  toolItems,
  type ArchiveSectionId,
  type PrivateArchiveSection,
} from './data/site';
import { fetchPrivateArchiveSection, PrivateArchiveError } from './lib/privateArchive';

const ArchiveVault = lazy(() => import('./components/ArchiveVault').then(module => ({ default: module.ArchiveVault })));
const AboutOverlay = lazy(() => import('./components/AboutOverlay').then(module => ({ default: module.AboutOverlay })));
const JesusOverlay = lazy(() => import('./components/JesusOverlay').then(module => ({ default: module.JesusOverlay })));
const ProjectOverlays = lazy(() => import('./components/EditorialProjects').then(module => ({ default: module.EditorialProjects })));
const ArchiveMapOverlay = lazy(() => import('./components/ArchiveMapOverlay').then(module => ({ default: module.ArchiveMapOverlay })));
const SecretPuzzleOverlay = lazy(() => import('./components/SecretPuzzleOverlay').then(module => ({ default: module.SecretPuzzleOverlay })));

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

type UnlockDestination = 'archive' | 'about';

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
  const [showArchiveMap, setShowArchiveMap] = useState(false);
  const [showArchiveOverlay, setShowArchiveOverlay] = useState(false);
  const [activeArchiveSectionId, setActiveArchiveSectionId] = useState<ArchiveSectionId | null>('school');
  const [pendingArchiveSectionId, setPendingArchiveSectionId] = useState<ArchiveSectionId | null>(null);
  const [pendingUnlockDestination, setPendingUnlockDestination] = useState<UnlockDestination>('archive');
  const [privateArchiveSections, setPrivateArchiveSections] = useState<Partial<Record<ArchiveSectionId, PrivateArchiveSection>>>({});
  const [archiveAccessKey, setArchiveAccessKey] = useState<string | null>(null);
  const [archiveErrorMessage, setArchiveErrorMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState(readStoredTheme);
  const currentAccessStatusCopy = accessStatus === 'approved'
    ? accessStatusCopy.approved
    : accessStatus === 'denied'
      ? accessStatusCopy.denied
      : accessStatusCopy.checking;

  useBodyScrollLock(showModal);
  const unlockRef = useOverlayFocus(showModal, () => setShowModal(false));

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.dataset.theme = theme;
    storeTheme(theme);
  }, [theme]);

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

  return (
    <div data-living-archive>
      <GardenHome
        theme={theme}
        paused={showModal || showBento || showAbout || showJesus || showSecretPuzzle || showArchiveMap || showArchiveOverlay || expandedProjectId !== null}
        onThemeChange={setTheme}
        onArchiveMap={() => setShowArchiveMap(true)}
        onProjects={() => setShowBento(true)}
        onProject={toggleProjectExpansion}
        onFaith={() => setShowJesus(true)}
        onSecret={() => setShowSecretPuzzle(true)}
      />

      <AnimatePresence>
        {showModal && (
          <motion.div ref={unlockRef} role="dialog" aria-modal="true" aria-label="Unlock private archive" tabIndex={-1}
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
                      <p className="text-xs leading-relaxed text-subtle">
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

      <Suspense fallback={<div className="overlay-loading" role="status">Opening…</div>}>
      {(showAbout) && (<AboutOverlay
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
      )}

      {(showJesus) && (<JesusOverlay
        isOpen={showJesus}
        sections={faithSections}
        onClose={() => setShowJesus(false)}
      />
      )}

      {(showSecretPuzzle) && (<SecretPuzzleOverlay
        isOpen={showSecretPuzzle}
        onClose={() => setShowSecretPuzzle(false)}
      />
      )}

      {(showArchiveMap) && (<ArchiveMapOverlay
        isOpen={showArchiveMap}
        onClose={() => setShowArchiveMap(false)}
        onOpenAbout={openAbout}
        onOpenProjects={() => setShowBento(true)}
        onOpenJesus={() => setShowJesus(true)}
        onOpenArchiveSection={openArchiveSection}
      />
      )}

      {(showBento || expandedProjectId) && (<ProjectOverlays
        projects={projects}
        toolItems={toolItems}
        showBento={showBento}
        expandedProjectId={expandedProjectId}
        onCloseBento={() => setShowBento(false)}
        onCardClick={toggleProjectExpansion}
        onCloseProject={() => setExpandedProjectId(null)}
      />
      )}

      {(showArchiveOverlay) && (<ArchiveVault
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
      )}

      </Suspense>

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
