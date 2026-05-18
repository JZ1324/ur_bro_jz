import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { DynamicIslandTOC } from './DynamicIslandTOC';
import type { FaithSection } from '../data/site';

type JesusOverlayProps = {
  isOpen: boolean;
  sections: FaithSection[];
  onClose: () => void;
};

export function JesusOverlay({ isOpen, sections, onClose }: JesusOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-bg/96 backdrop-blur-2xl"
        >
          <article id="jesus-panel" className="h-screen overflow-y-auto px-5 py-8 sm:px-8">
            <button
              onClick={onClose}
              className="fixed right-5 top-5 z-[80] rounded-full border border-border/45 bg-surface/90 p-3 text-accent shadow-xl shadow-black/25 transition-all hover:bg-accent/15 active:scale-95 sm:right-8 sm:top-8"
              aria-label="Close Gospel summary"
            >
              <X size={22} />
            </button>

            <DynamicIslandTOC selector="#jesus-panel [data-toc]" scrollContainerSelector="#jesus-panel">
              <div className="mx-auto flex max-w-3xl flex-col gap-12 pb-32 pt-2">
                <header className="border-b border-border/30 pb-8 pr-16 sm:pr-20">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-warm-accent">Following</p>
                  <h1 data-toc id="jesus" className="mt-3 text-4xl font-bold leading-tight text-text sm:text-6xl">
                    Jesus
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
                    A simple summary of who Jesus is, what the Gospel is, and why Romans 12:16-21 sits in the bio.
                  </p>
                </header>

                <section className="rounded-3xl border border-border/50 bg-surface p-6 shadow-2xl shadow-black/20 sm:p-8">
                  <p className="text-xl font-semibold leading-relaxed text-text">
                    The Gospel is good news: Jesus came to save sinners, died for our sins, rose again, and gives forgiveness and new life to everyone who trusts in Him.
                  </p>
                </section>

                <div className="flex flex-col gap-10">
                  {sections.map((section, index) => (
                    <section key={section.id} className="flex flex-col gap-4">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">0{index + 1}</p>
                      <h2 data-toc id={section.id} className="text-3xl font-bold text-text">
                        {section.title}
                      </h2>
                      {section.body.map((paragraph) => (
                        <p key={paragraph} className="text-lg leading-relaxed text-muted">
                          {paragraph}
                        </p>
                      ))}
                      {section.verses && (
                        <div className="mt-2 grid gap-3 sm:grid-cols-3">
                          {section.verses.map((verse) => (
                            <div key={verse.reference} className="rounded-2xl border border-border/45 bg-surface px-4 py-3">
                              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-accent">
                                {verse.reference}
                              </p>
                              <p className="mt-2 text-sm font-semibold leading-relaxed text-text">{verse.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              </div>
            </DynamicIslandTOC>
          </article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
