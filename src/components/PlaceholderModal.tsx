import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import type { PlaceholderContent } from '../data/site';

type PlaceholderModalProps = {
  content: PlaceholderContent | null;
  onClose: () => void;
};

export function PlaceholderModal({ content, onClose }: PlaceholderModalProps) {
  return (
    <AnimatePresence>
      {content && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-bg/80 p-4 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 16 }}
            className="w-full max-w-sm rounded-2xl border border-border/40 bg-surface p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-accent">
                  {content.eyebrow ?? 'Archive Note'}
                </p>
                <h2 className="text-2xl font-bold text-text">{content.title}</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-accent/10 p-2 text-accent transition-all hover:bg-accent/20 active:scale-95"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-4 leading-relaxed text-muted">{content.description}</p>

            <div className="mt-6 flex flex-col gap-2">
              {content.items.map((item) => (
                <div key={item} className="rounded-lg border border-border/40 bg-bg px-4 py-3 text-sm font-semibold text-text">
                  {item}
                </div>
              ))}
            </div>

            {content.actionHref && content.actionLabel && (
              <a
                href={content.actionHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full justify-center rounded-full bg-accent px-5 py-3 text-sm font-bold text-bg transition-all hover:bg-accent-dark active:scale-95"
              >
                {content.actionLabel}
              </a>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
