import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

type SecretPuzzleOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

const clues = [
  {
    label: '01 / known',
    value: 'The track is the entry point, but the title is not the answer.',
  },
  {
    label: '02 / filter',
    value: 'Ignore public stats. The signal sits in music, timing, and what gets hidden.',
  },
  {
    label: '03 / rule',
    value: 'Do not brute force. Think like a developer: remove noise, keep repeated patterns.',
  },
  {
    label: '04 / checksum',
    value: 'If the answer feels too obvious, it is probably a decoy.',
  },
];

export function SecretPuzzleOverlay({ isOpen, onClose }: SecretPuzzleOverlayProps) {
  const [guess, setGuess] = useState('');
  const normalizedGuess = guess.trim();

  const message = useMemo(() => {
    if (normalizedGuess.length === 0) return 'Enter a candidate when the pattern feels clear.';
    if (normalizedGuess.length < 4) return 'Too short. That is probably only noise.';
    return 'Possible signal. Not confirmed here.';
  }, [normalizedGuess]);

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
                  A private clue trail for the track. The answer is not printed in the source.
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

            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              {clues.map((clue) => (
                <div key={clue.label} className="rounded-2xl border border-border/45 bg-bg/45 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-accent">{clue.label}</p>
                  <p className="mt-3 text-sm font-semibold leading-relaxed text-text">{clue.value}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-border/35 p-5 sm:p-6">
              <label htmlFor="secret-name-guess" className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
                Candidate
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="secret-name-guess"
                  value={guess}
                  onChange={(event) => setGuess(event.target.value)}
                  placeholder="type a name..."
                  autoComplete="off"
                  className="min-h-12 flex-1 rounded-2xl border border-border/55 bg-bg px-4 text-base font-semibold text-text outline-none transition-colors placeholder:text-muted/55 focus:border-warm-accent"
                />
                <button
                  type="button"
                  onClick={() => setGuess('')}
                  className="rounded-2xl border border-border/55 px-5 py-3 text-sm font-bold text-muted transition-colors hover:border-accent/40 hover:text-text"
                >
                  Clear
                </button>
              </div>
              <p className="mt-3 rounded-2xl border border-warm-accent/25 bg-warm-accent/10 px-4 py-3 text-sm font-semibold leading-relaxed text-warm-accent">
                {message}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
