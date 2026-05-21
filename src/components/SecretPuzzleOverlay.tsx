import { AnimatePresence, motion } from 'motion/react';
import { Check, Loader2, Lock, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { checkSecretName } from '../lib/secretName';

type SecretPuzzleOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SecretPuzzleOverlay({ isOpen, onClose }: SecretPuzzleOverlayProps) {
  const [secretName, setSecretName] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'matched' | 'missed' | 'error'>('idle');

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    // prevent layout shift by compensating for scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setSecretName('');
    setStatus('idle');
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = secretName.trim();
    if (!trimmedName || status === 'checking') return;

    setStatus('checking');
    try {
      const matched = await checkSecretName(trimmedName);
      setStatus(matched ? 'matched' : 'missed');
    } catch {
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] flex items-center justify-center overflow-y-auto bg-bg/90 p-4 backdrop-blur-2xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-border/55 bg-surface shadow-2xl shadow-black/30"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(228,154,120,0.09),transparent_42%),radial-gradient(circle_at_18%_82%,rgba(201,211,176,0.08),transparent_36%)]" />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
              className="absolute right-5 top-5 z-20 rounded-full bg-accent-soft p-3 text-accent transition-colors hover:bg-accent/15 sm:right-6 sm:top-6"
              aria-label="Close puzzle"
            >
              <X size={22} />
            </button>

            <div className="relative grid min-h-[32rem] gap-8 p-6 pt-20 sm:p-10 sm:pt-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:p-14">
              <div className="text-center lg:text-left">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-warm-accent/25 bg-warm-accent/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-warm-accent lg:mx-0">
                  <Lock size={13} />
                  Sealed note
                </div>
                <p className="mt-7 text-balance text-3xl font-semibold leading-tight text-text sm:text-5xl sm:leading-[1.08]">
                  Some things stay locked until the right name opens them.
                </p>
                <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-7 text-muted lg:mx-0">
                  There is one name this opens for. The answer is checked away from the page.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="rounded-3xl border border-border/60 bg-bg/45 p-5 shadow-2xl shadow-black/20 ring-1 ring-white/[0.03] backdrop-blur-xl sm:p-6"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-accent">Private line</p>
                <label htmlFor="secret-name" className="mt-4 block text-2xl font-bold text-text">
                  Put the name here.
                </label>
                <div className="mt-5 rounded-2xl border border-border/70 bg-surface/70 px-4 py-3 transition-colors focus-within:border-accent/70">
                  <input
                    id="secret-name"
                    type="password"
                    value={secretName}
                    onChange={(event) => {
                      setSecretName(event.target.value);
                      if (status !== 'idle' && status !== 'checking') setStatus('idle');
                    }}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder=""
                    className="w-full bg-transparent text-2xl font-bold tracking-wide text-text outline-none placeholder:text-muted/35"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!secretName.trim() || status === 'checking'}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-4 text-base font-bold text-bg transition-all hover:bg-accent-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'checking' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Checking
                    </>
                  ) : status === 'matched' ? (
                    <>
                      <Check size={18} />
                      Opened
                    </>
                  ) : (
                    'Open'
                  )}
                </button>
                <AnimatePresence mode="wait">
                  {status === 'matched' && (
                    <motion.p
                      key="matched"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent"
                    >
                      Opened.
                    </motion.p>
                  )}
                  {status === 'missed' && (
                    <motion.p
                      key="missed"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-4 rounded-2xl border border-warm-accent/30 bg-warm-accent/10 px-4 py-3 text-sm font-semibold text-warm-accent"
                    >
                      Not it.
                    </motion.p>
                  )}
                  {status === 'error' && (
                    <motion.p
                      key="error"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="mt-4 rounded-2xl border border-border bg-surface/70 px-4 py-3 text-sm font-semibold text-muted"
                    >
                      This sealed entry is not connected right now.
                    </motion.p>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
