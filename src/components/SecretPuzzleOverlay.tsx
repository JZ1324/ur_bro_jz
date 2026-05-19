import { AnimatePresence, motion } from 'motion/react';
import { Lock, X } from 'lucide-react';

type SecretPuzzleOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SecretPuzzleOverlay({ isOpen, onClose }: SecretPuzzleOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] overflow-y-auto bg-bg/90 p-4 backdrop-blur-2xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto my-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-border/55 bg-surface shadow-2xl shadow-black/30"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border/35 p-5 sm:p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-warm-accent">Classified puzzle</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-text sm:text-4xl">Find the name</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  The answer stays private. It is not printed in the public page or bundled source.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-accent-soft p-3 text-accent transition-colors hover:bg-accent/15"
                aria-label="Close puzzle"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex flex-col items-center rounded-3xl border border-border/45 bg-bg/45 px-6 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border/60 bg-accent-soft text-accent">
                  <Lock size={28} strokeWidth={2.4} />
                </div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-warm-accent">
                  Private signal
                </p>
                <p className="mt-3 max-w-md text-base font-semibold leading-relaxed text-text">
                  No public guesses here. If you know, you know.
                </p>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                  The saved answer belongs in the private archive, not inside the visible UI.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
