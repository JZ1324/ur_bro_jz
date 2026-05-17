import { AnimatePresence, motion } from 'motion/react';
import { GraduationCap, Lock, Music, ShieldAlert, Users } from 'lucide-react';
import { TextScramble } from './TextScramble';
import type { ArchiveSection, ArchiveSectionId, PrivateArchiveSection } from '../data/site';

const icons = {
  graduationCap: GraduationCap,
  music: Music,
  users: Users,
};

type ArchiveVaultProps = {
  isUnlocked: boolean;
  isLoading: boolean;
  sections: ArchiveSection[];
  activeSectionId: ArchiveSectionId | null;
  activeSection: PrivateArchiveSection | null;
  errorMessage: string | null;
  onSelectSection: (id: ArchiveSectionId) => void;
  onLock: () => void;
};

export function ArchiveVault({
  isUnlocked,
  isLoading,
  sections,
  activeSectionId,
  activeSection,
  errorMessage,
  onSelectSection,
  onLock,
}: ArchiveVaultProps) {
  const activeNavigationSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];

  return (
    <AnimatePresence>
      {isUnlocked && (
        <motion.section
          id="archive-section"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex w-full flex-col gap-8 overflow-hidden"
        >
          <div className="flex flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-text">{activeNavigationSection?.title ?? 'The Vault'}</h2>
              <div className="text-sm font-medium text-muted">
                <TextScramble text="Secure private collection" />
              </div>
              <p className="max-w-md text-xs leading-relaxed text-[#8E927F]">
                Private content loads from Supabase only after the access key is verified server-side.
              </p>
            </div>
            <button
              onClick={onLock}
              className="group flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-bold text-accent transition-all hover:bg-accent/20"
            >
              <Lock size={14} className="transition-transform group-hover:scale-110" />
              Lock Archive
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 px-4">
            {sections.map((section) => {
              const Icon = icons[section.icon];
              const isActive = section.id === activeSectionId;

              return (
                <button
                  key={section.id}
                  onClick={() => onSelectSection(section.id)}
                  className={`rounded-2xl border px-3 py-4 text-left transition-all active:scale-[0.98] ${
                    isActive
                      ? 'border-accent/50 bg-accent-soft text-text shadow-lg shadow-black/10'
                      : 'border-border/45 bg-surface/75 text-muted hover:border-accent/25 hover:text-text'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-accent' : 'text-muted'} />
                  <div className="mt-3 text-sm font-bold">{section.title.replace(' Archive', '')}</div>
                  <div className="mt-1 hidden text-[10px] font-semibold uppercase tracking-wider text-[#8E927F] sm:block">
                    Server-checked
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pb-12">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-4 rounded-xl border border-border/20 bg-surface p-6 shadow-sm animate-pulse-soft"
                  >
                    <div className="h-5 w-1/2 rounded bg-bg" />
                    <div className="h-4 w-full rounded bg-bg" />
                    <div className="h-4 w-5/6 rounded bg-bg" />
                  </div>
                ))}
              </div>
            ) : errorMessage ? (
              <div className="rounded-3xl border border-warm-accent/30 bg-surface p-6 shadow-2xl shadow-black/20">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-warm-accent/10 p-3 text-warm-accent">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text">Private archive unavailable</h3>
                    <p className="mt-2 leading-relaxed text-muted">{errorMessage}</p>
                    <p className="mt-4 text-xs leading-relaxed text-[#8E927F]">
                      This is intentional: the site will not fall back to bundled private data or public image files.
                    </p>
                  </div>
                </div>
              </div>
            ) : activeSection ? (
              <motion.article
                key={activeSection.sectionId}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="overflow-hidden rounded-3xl border border-border/55 bg-surface shadow-2xl shadow-black/20"
              >
                <div className="border-b border-border/35 bg-accent-soft/55 p-6 sm:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-accent">Private section</p>
                  <h3 className="mt-3 text-3xl font-bold tracking-tight text-text">{activeSection.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-accent">{activeSection.subtitle}</p>
                  <p className="mt-5 max-w-2xl leading-relaxed text-muted">{activeSection.summary}</p>
                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
                  {activeSection.items.map((item, index) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-border/45 bg-bg/65 p-4 shadow-lg shadow-black/10"
                    >
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8E927F]">
                        Note {String(index + 1).padStart(2, '0')}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-text">{item}</p>
                    </div>
                  ))}
                </div>

                {activeSection.photos.length > 0 && (
                  <div className="border-t border-border/35 p-4 sm:p-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-accent">
                      Signed photos
                    </h4>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {activeSection.photos.map((photo) => (
                        <figure
                          key={photo.id}
                          className="overflow-hidden rounded-2xl border border-border/45 bg-bg/70 shadow-lg shadow-black/10"
                        >
                          <img
                            src={photo.signedUrl}
                            alt={photo.alt}
                            referrerPolicy="no-referrer"
                            className="aspect-[4/3] w-full object-cover"
                          />
                          <figcaption className="p-4">
                            <p className="text-sm font-semibold text-text">{photo.caption}</p>
                            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#8E927F]">
                              Temporary URL expires {new Date(photo.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                )}
              </motion.article>
            ) : (
              <div className="rounded-2xl border border-border/45 bg-surface p-6 text-muted">
                Enter the access key to load this private archive section.
              </div>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
