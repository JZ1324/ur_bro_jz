import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import type { AboutSection, ProfileData } from '../data/site';

type AboutOverlayProps = {
  isOpen: boolean;
  profile: ProfileData;
  sections: AboutSection[];
  facts: Array<{ title: string; value: string }>;
  focusItems: string[];
  archiveStyleItems: string[];
  onClose: () => void;
};

export function AboutOverlay({
  isOpen,
  profile,
  sections,
  facts,
  focusItems,
  archiveStyleItems,
  onClose,
}: AboutOverlayProps) {
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
          <article id="about-panel" className="h-screen overflow-y-auto px-5 py-8 sm:px-8">
            <div className="mx-auto flex max-w-3xl flex-col gap-12 pb-20">
                <header className="sticky top-0 z-[10000] -mx-5 flex items-center justify-between border-b border-border/30 bg-bg/90 px-5 py-4 backdrop-blur-md sm:-mx-8 sm:px-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">About</p>
                    <h2 className="text-2xl font-bold text-text">{profile.displayName}</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="relative z-[10000] rounded-full bg-accent/10 p-3 text-accent transition-all hover:bg-accent/20 active:scale-95"
                    aria-label="Close about"
                  >
                    <X size={22} />
                  </button>
                </header>

                <section className="grid gap-8 pt-4 md:grid-cols-[220px_1fr] md:items-start">
                  <div className="flex flex-col items-center gap-4 md:sticky md:top-24">
                    <img
                      src={profile.imageSrc}
                      alt={`${profile.displayName} Instagram profile`}
                      className="h-44 w-44 rounded-full border-4 border-accent object-cover shadow-xl shadow-accent/10"
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

                  <div className="flex flex-col gap-10">
                    {intro && (
                      <section className="flex flex-col gap-4">
                        <h2 data-toc id={intro.id} className="text-4xl font-bold leading-tight text-text md:text-5xl">
                          {intro.title}
                        </h2>
                        {intro.body.map((paragraph) => (
                          <p key={paragraph} className="text-lg leading-relaxed text-muted">
                            {paragraph}
                          </p>
                        ))}
                      </section>
                    )}

                    <section className="grid grid-cols-3 gap-3">
                      {profile.stats.map((stat) => (
                        <div key={stat.label} className="rounded-lg border border-border/40 bg-surface p-4 text-center shadow-sm">
                          <div className="text-2xl font-bold text-accent">{stat.value}</div>
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted">{stat.label}</div>
                        </div>
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
