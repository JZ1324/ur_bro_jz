import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { FaithHoverCard } from './ui/faith-hover-card';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import type { AboutSection, FaithHover, ProfileData, ProfileStat } from '../data/site';

type AboutOverlayProps = {
  isOpen: boolean;
  profile: ProfileData;
  sections: AboutSection[];
  facts: Array<{ title: string; value: string }>;
  focusItems: string[];
  archiveStyleItems: string[];
  faithHover: FaithHover;
  onFaithClick: () => void;
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
  faithHover,
  onFaithClick,
  onClose,
}: AboutOverlayProps) {
  useBodyScrollLock(isOpen);

  const intro = sections.find((section) => section.id === 'about-intro');
  const bio = sections.find((section) => section.id === 'about-bio');
  const focus = sections.find((section) => section.id === 'about-focus');
  const nestedFocus = sections.filter((section) => ['about-faith', 'about-friends', 'about-projects'].includes(section.id));
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
                  className="rounded-full border border-border/45 bg-surface/90 p-2.5 text-accent shadow-lg shadow-black/20 transition-all hover:bg-accent/15 active:scale-95"
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
                      className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-bg transition-all hover:bg-accent-dark active:scale-95"
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
                      {profile.stats.map((stat) => stat.label === 'Relationship' ? (
                        <span key={stat.label}>
                          <FaithHoverCard
                            faith={faithHover}
                            onOpenPage={onFaithClick}
                            className="block rounded-lg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            <AboutStatCard stat={stat} />
                          </FaithHoverCard>
                        </span>
                      ) : (
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
                          className="inline-flex w-fit rounded-full bg-accent px-6 py-3 text-sm font-bold text-bg transition-all hover:bg-accent-dark active:scale-95"
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
