import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { TextScramble } from './TextScramble';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import type { AboutSection, JournalEntry, ProfileData, ProfileStat, ToolItem } from '../data/site';

type AboutOverlayProps = {
  isOpen: boolean;
  profile: ProfileData;
  sections: AboutSection[];
  facts: Array<{ title: string; value: string }>;
  focusItems: string[];
  archiveStyleItems: string[];
  journalEntries: JournalEntry[];
  toolItems: ToolItem[];
  onClose: () => void;
};

function AboutStatCard({ stat }: { stat: ProfileStat }) {
  return (
    <div className="rounded-lg border border-border/40 bg-surface p-4 text-center shadow-sm">
      <div className="text-2xl font-bold text-accent">{stat.value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted">{stat.label}</div>
    </div>
  );
}

export function AboutOverlay({
  isOpen,
  profile,
  sections,
  facts,
  focusItems,
  archiveStyleItems,
  journalEntries,
  toolItems,
  onClose,
}: AboutOverlayProps) {
  useBodyScrollLock(isOpen);

  const intro = sections.find((section) => section.id === 'about-intro');
  const bio = sections.find((section) => section.id === 'about-bio');
  const focus = sections.find((section) => section.id === 'about-focus');
  const nestedFocus = sections.filter((section) => ['about-faith', 'about-friends', 'about-projects', 'about-hyperframes'].includes(section.id));
  const archive = sections.find((section) => section.id === 'about-archive');
  const now = sections.find((section) => section.id === 'about-now');
  const links = sections.find((section) => section.id === 'about-links');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-2xl"
        >
          <article id="about-panel" className="h-screen overflow-y-auto overscroll-contain px-5 pb-8 sm:px-8">
            <div className="sticky top-0 z-[60] -mx-5 border-b border-border/35 bg-bg/88 px-5 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8">
              <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-warm-accent">About</p>
                  <p className="text-sm font-bold text-text">{profile.displayName}</p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full border border-border/45 bg-surface/90 p-2.5 text-accent shadow-lg shadow-black/20 transition-[transform,background-color,border-color] duration-150 ease-out hover:bg-accent/15 active:scale-[0.96]"
                  aria-label="Close about"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="mx-auto flex max-w-4xl flex-col gap-10 pb-20 pt-8">
                <header className="flex items-start justify-between border-b border-border/30 pb-7">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">About</p>
                    <h2 className="text-2xl font-bold text-text">{profile.displayName}</h2>
                  </div>
                </header>

                <section className="grid gap-8 pt-2 md:grid-cols-[200px_1fr] md:items-start">
                  <div className="flex flex-col items-center gap-4 md:sticky md:top-24">
                    <img
                      src={profile.imageSrc}
                      alt={`${profile.displayName} Instagram profile`}
                      className="h-40 w-40 rounded-full border-4 border-accent object-cover shadow-xl shadow-accent/10"
                    />
                    <a
                      href={profile.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-bg transition-[transform,background-color] duration-150 ease-out hover:bg-accent-dark active:scale-[0.97]"
                    >
                      {profile.handle}
                    </a>
                  </div>

                  <div className="flex flex-col gap-9">
                    {intro && (
                      <section className="flex flex-col gap-4">
                        <h2 data-toc id={intro.id} className="text-3xl font-bold leading-tight text-text md:text-5xl">
                          {intro.title}
                        </h2>
                        {intro.body.map((paragraph) => (
                          <p key={paragraph} className="text-lg leading-relaxed text-muted">
                            {paragraph}
                          </p>
                        ))}
                      </section>
                    )}

                    <section className="grid grid-cols-2 gap-3">
                      {profile.stats.map((stat) => (
                        <span key={stat.label}>
                          <AboutStatCard stat={stat} />
                        </span>
                      ))}
                    </section>

                    {bio && (
                      <section className="flex flex-col gap-3">
                        <h3 data-toc id={bio.id} className="text-2xl font-bold text-text">{bio.title}</h3>
                        <p className="rounded-lg border border-border/40 bg-surface p-5 text-lg font-semibold text-text shadow-sm">
                          {bio.body[0]}
                        </p>
                        {bio.body.slice(1).map((paragraph) => (
                          <p key={paragraph} className="leading-relaxed text-muted">
                            {paragraph}
                          </p>
                        ))}
                        <div className="grid gap-3 sm:grid-cols-2">
                          {facts.map((item) => (
                            <div key={item.title} className="rounded-lg border border-border/40 bg-surface p-4 shadow-sm">
                              <div className="text-[10px] font-bold uppercase tracking-widest text-muted">{item.title}</div>
                              <div className="mt-2 text-sm font-semibold text-text">{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {focus && (
                      <section className="flex flex-col gap-3">
                        <h3 data-toc id={focus.id} className="text-2xl font-bold text-text">{focus.title}</h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {focusItems.map((item) => (
                            <div key={item} className="rounded-lg border border-border/40 bg-surface p-4 text-sm font-semibold text-text shadow-sm">
                              {item}
                            </div>
                          ))}
                        </div>
                        {nestedFocus.map((section) => (
                          <div key={section.id} className="flex flex-col gap-4 rounded-lg border border-border/40 bg-surface p-5 shadow-sm">
                            <h4 data-toc data-toc-depth="4" id={section.id} className="text-lg font-bold text-text">{section.title}</h4>
                            {section.body.map((paragraph) => (
                              <p key={paragraph} className="leading-relaxed text-muted">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        ))}
                      </section>
                    )}

                    <section className="relative overflow-hidden rounded-3xl border border-warm-accent/20 bg-[linear-gradient(135deg,rgba(228,154,120,0.08),transparent_28%),radial-gradient(circle_at_85%_12%,rgba(201,211,176,0.1),transparent_22rem),var(--color-surface)] p-5 shadow-xl shadow-black/10 sm:p-6">
                      <span className="pointer-events-none absolute right-8 top-8 hidden h-3 w-3 rotate-45 rounded-[2px] border border-warm-accent/45 sm:block" />
                      <span className="pointer-events-none absolute bottom-10 left-8 hidden h-px w-16 rotate-[-8deg] bg-warm-accent/35 sm:block" />
                      <span className="pointer-events-none absolute right-10 bottom-12 hidden text-xs font-black text-warm-accent/35 sm:block">+</span>

                      <div className="relative z-[1] flex flex-col gap-5">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-warm-accent">
                              <TextScramble text="journal layer" />
                            </div>
                            <h3 data-toc id="about-journal" className="mt-3 text-2xl font-bold text-text">
                              Archive journal
                            </h3>
                          </div>
                          <span className="rounded-full border border-border/45 bg-bg/45 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                            locked note
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {journalEntries.map((entry) => (
                            <article key={entry.label} className="rounded-2xl border border-border/40 bg-bg/45 p-4 shadow-sm">
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-accent">{entry.label}</p>
                              <h4 className="mt-3 text-base font-bold text-text">{entry.title}</h4>
                              <p className="mt-2 text-sm font-medium leading-relaxed text-muted">{entry.body}</p>
                            </article>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-border/35 bg-bg/35 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E927F]">Tools I keep reaching for</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {toolItems.map((tool) => (
                              <span
                                key={tool.label}
                                className="rounded-full border border-border/45 bg-surface/65 px-3 py-1.5 text-xs font-bold text-text"
                              >
                                {tool.label}
                                <span className="ml-1 font-semibold text-muted">/ {tool.note}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>

                    {archive && (
                      <section className="flex flex-col gap-3">
                        <h3 data-toc id={archive.id} className="text-2xl font-bold text-text">{archive.title}</h3>
                        {archive.body.map((paragraph) => (
                          <p key={paragraph} className="leading-relaxed text-muted">
                            {paragraph}
                          </p>
                        ))}
                        <div className="grid gap-3">
                          {archiveStyleItems.map((item) => (
                            <div key={item} className="rounded-lg border border-border/40 bg-surface p-4 text-sm leading-relaxed text-muted shadow-sm">
                              {item}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {now && (
                      <section className="flex flex-col gap-3">
                        <h3 data-toc id={now.id} className="text-2xl font-bold text-text">{now.title}</h3>
                        {now.body.map((paragraph) => (
                          <p key={paragraph} className="leading-relaxed text-muted">
                            {paragraph}
                          </p>
                        ))}
                      </section>
                    )}

                    {links && (
                      <section className="flex flex-col gap-3">
                        <h3 data-toc id={links.id} className="text-2xl font-bold text-text">{links.title}</h3>
                        {links.body.map((paragraph) => (
                          <p key={paragraph} className="leading-relaxed text-muted">
                            {paragraph}
                          </p>
                        ))}
                        <a
                          href={profile.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-fit rounded-full bg-accent px-6 py-3 text-sm font-bold text-bg transition-[transform,background-color] duration-150 ease-out hover:bg-accent-dark active:scale-[0.97]"
                        >
                          Open Instagram
                        </a>
                      </section>
                    )}
                  </div>
                </section>
            </div>
          </article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
