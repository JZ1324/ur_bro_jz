import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Check, Download, Loader2, Lock, X } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { checkSecretName, submitSecretPuzzleStep } from '../lib/secretName';
import { ShinyText } from './ui/ShinyText';
import { DecodedText } from './ui/DecodedText';

type SecretPuzzleOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

type PuzzleStage = 'manual' | 'fragment' | 'hex' | 'cipher' | 'name';
type PuzzleStatus = 'idle' | 'checking' | 'wrong' | 'error';

const fragmentSrc = `${import.meta.env.BASE_URL}archive-fragment.png`;
const defaultSunlightImages = ['/sunshine.png'];
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';

const stageLabels: Record<PuzzleStage, string> = {
  manual: 'private line',
  fragment: '01 / fragment',
  hex: '02 / hex',
  cipher: '03 / cipher',
  name: '04 / reveal',
};

export function SecretPuzzleOverlay({ isOpen, onClose }: SecretPuzzleOverlayProps) {
  const [secretName, setSecretName] = useState('');
  const [revealedName, setRevealedName] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'matched' | 'missed' | 'error'>('idle');
  const [manualMissCount, setManualMissCount] = useState(0);
  const [stage, setStage] = useState<PuzzleStage>('manual');
  const [puzzleInput, setPuzzleInput] = useState('');
  const [puzzleStatus, setPuzzleStatus] = useState<PuzzleStatus>('idle');

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
    setRevealedName('');
    setStatus('idle');
    setManualMissCount(0);
    setStage('manual');
    setPuzzleInput('');
    setPuzzleStatus('idle');
  }, [isOpen]);

  const moveToStage = (nextStage: PuzzleStage) => {
    setStage(nextStage);
    setPuzzleInput('');
    setPuzzleStatus('idle');
  };

  const startPuzzle = () => {
    setSecretName('');
    setRevealedName('');
    setStatus('idle');
    setManualMissCount(0);
    moveToStage('fragment');
  };

  const handlePuzzleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = puzzleInput.trim();
    if (!value || stage === 'manual' || stage === 'name' || puzzleStatus === 'checking') return;

    setPuzzleStatus('checking');

    try {
      const result = await submitSecretPuzzleStep(stage, value);
      if (!result.matched) {
        setPuzzleStatus('wrong');
        return;
      }

      if (stage === 'fragment') {
        moveToStage('hex');
        return;
      }

      if (stage === 'hex') {
        moveToStage('cipher');
        return;
      }

      setRevealedName(result.name || '');
      setStatus(result.name ? 'matched' : 'error');
      setStage('name');
      setPuzzleInput('');
      setPuzzleStatus('idle');
    } catch {
      setPuzzleStatus('error');
    }
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = secretName.trim();
    if (!trimmedName || status === 'checking') return;

    setStatus('checking');
    try {
      const matched = await checkSecretName(trimmedName);
      setStatus(matched ? 'matched' : 'missed');
      if (matched) {
        setManualMissCount(0);
      } else {
        setManualMissCount((count) => count + 1);
      }
    } catch {
      setStatus('error');
    }
  };

  const puzzleStarted = stage !== 'manual';
  const showPuzzleHint = stage === 'manual' && status === 'missed' && manualMissCount >= 2;

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
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-border/55 bg-surface shadow-2xl shadow-black/30"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(228,154,120,0.09),transparent_42%),radial-gradient(circle_at_18%_82%,rgba(201,211,176,0.08),transparent_36%)]" />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClose();
              }}
              className="absolute right-5 top-5 z-20 rounded-full bg-accent-soft p-3 text-accent transition-[transform,background-color] duration-150 ease-out hover:bg-accent/15 active:scale-[0.96] sm:right-6 sm:top-6"
              aria-label="Close puzzle"
            >
              <X size={22} />
            </button>

            <div className="relative grid min-h-[32rem] gap-8 p-6 pt-20 sm:p-10 sm:pt-24 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:p-14">
              <div className="text-center lg:text-left">
                <div className="relative mx-auto inline-flex lg:mx-0">
                  <AnimatePresence>
                    {showPuzzleHint && (
                      <motion.div
                        key="sealed-note-arrow"
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{
                          opacity: 1,
                          y: [4, -2, 4],
                          scale: 1,
                        }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{
                          opacity: { duration: 0.18 },
                          scale: { duration: 0.18 },
                          y: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
                        }}
                        className="pointer-events-none absolute bottom-[calc(100%+0.85rem)] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-warm-accent sm:flex"
                        aria-hidden="true"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] drop-shadow-[0_8px_18px_rgba(0,0,0,0.35)]">
                          Here
                        </span>
                        <ArrowUpRight size={18} className="rotate-[135deg]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    type="button"
                    onClick={puzzleStarted ? () => moveToStage('manual') : startPuzzle}
                    className="mx-auto inline-flex items-center gap-2 rounded-full border border-warm-accent/25 bg-warm-accent/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-warm-accent transition-[transform,background-color,border-color] duration-150 ease-out hover:border-warm-accent/55 hover:bg-warm-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-accent/45 active:scale-[0.97] lg:mx-0"
                    aria-label={puzzleStarted ? 'Return to sealed note input' : 'Start sealed note puzzle'}
                  >
                    <Lock size={13} />
                    Sealed note
                  </button>
                </div>
                {puzzleStarted ? (
                  <>
                    <p className="mt-7 text-balance text-3xl font-semibold leading-tight text-text sm:text-5xl sm:leading-[1.08]">
                      Some things stay locked until the right name opens them.
                    </p>
                    <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-7 text-muted lg:mx-0">
                      The lock starts a small trail: image, hex, cipher, then the name. The answer is still checked away from the page.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.24em] text-warm-accent">
                      To the one I have a crush on:
                    </p>
                    <p className="mt-5 text-balance text-3xl font-semibold leading-[1.18] text-text sm:text-5xl sm:leading-[1.1]">
                      You make quiet moments feel alive,
                      <br />
                      like <SunlightSparkles /> finding a window at the right time.
                    </p>
                    <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-7 text-muted lg:mx-0">
                      There is one name this opens for. The answer is checked away from the page.
                    </p>
                  </>
                )}
              </div>

              <div className="rounded-3xl border border-border/60 bg-bg/45 p-5 shadow-2xl shadow-black/20 ring-1 ring-white/[0.03] backdrop-blur-xl sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-accent">
                    {stageLabels[stage]}
                  </p>
                  {stage !== 'manual' && (
                    <button
                      type="button"
                      onClick={() => moveToStage('manual')}
                      className="text-xs font-bold text-muted transition-colors hover:text-text"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {stage === 'manual' && (
                  <AnimatePresence mode="wait">
                    {status === 'matched' ? (
                      <CutesyOpenedNote key="opened-note" onLockAgain={() => {
                        setSecretName('');
                        setStatus('idle');
                        setManualMissCount(0);
                      }} />
                    ) : (
                      <motion.form
                        key="manual-form"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                        onSubmit={handleManualSubmit}
                      >
                        <label htmlFor="secret-name" className="block text-2xl font-bold text-text">
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
                            className="w-full bg-transparent text-2xl font-bold tracking-wide text-text outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!secretName.trim() || status === 'checking'}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-4 text-base font-bold text-bg transition-[transform,background-color,opacity] duration-150 ease-out hover:bg-accent-dark active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {status === 'checking' ? (
                            <>
                              <Loader2 size={18} className="animate-spin" />
                              Checking
                            </>
                          ) : (
                            'Open'
                          )}
                        </button>
                        <AnimatePresence mode="wait">
                          {status === 'missed' && (
                            <motion.p
                              key="missed"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              className="mt-4 rounded-2xl border border-warm-accent/30 bg-warm-accent/10 px-4 py-3 text-sm font-semibold text-warm-accent"
                            >
                              {manualMissCount >= 2
                                ? 'Hint: press the Sealed Note lock chip first. It starts the trail.'
                                : 'Not it.'}
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
                      </motion.form>
                    )}
                  </AnimatePresence>
                )}

                {stage === 'fragment' && (
                  <form onSubmit={handlePuzzleSubmit}>
                    <h3 className="text-2xl font-bold text-text">Download the fragment.</h3>
                    <p className="mt-3 text-sm font-medium leading-7 text-muted">
                      The picture still works as a picture. The clue lives after the image ends.
                    </p>
                    <img
                      src={fragmentSrc}
                      alt="Archive fragment preview"
                      className="mt-4 aspect-[16/9] w-full rounded-2xl border border-border/45 object-cover opacity-80"
                    />
                    <a
                      href={fragmentSrc}
                      download="archive-fragment.png"
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-surface/80 px-5 py-3 text-sm font-bold text-text transition-[transform,background-color,border-color] duration-150 ease-out hover:border-accent/45 hover:bg-accent/10 active:scale-[0.98]"
                    >
                      <Download size={17} />
                      Download image
                    </a>
                    <label htmlFor="fragment-answer" className="mt-5 block text-sm font-bold text-text">
                      Paste the hex payload.
                    </label>
                    <div className="mt-3 rounded-2xl border border-border/70 bg-surface/70 px-4 py-3 transition-colors focus-within:border-accent/70">
                      <input
                        id="fragment-answer"
                        value={puzzleInput}
                        onChange={(event) => {
                          setPuzzleInput(event.target.value);
                          setPuzzleStatus('idle');
                        }}
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="w-full bg-transparent text-base font-bold tracking-wide text-text outline-none"
                      />
                    </div>
                    <PuzzleSubmitButton disabled={!puzzleInput.trim() || puzzleStatus === 'checking'} loading={puzzleStatus === 'checking'} />
                    {puzzleStatus === 'wrong' && <PuzzleError>Wrong fragment.</PuzzleError>}
                    {puzzleStatus === 'error' && <PuzzleError>The fragment could not be checked right now.</PuzzleError>}
                  </form>
                )}

                {stage === 'hex' && (
                  <form onSubmit={handlePuzzleSubmit}>
                    <h3 className="text-2xl font-bold text-text">Turn hex into text.</h3>
                    <p className="mt-3 text-sm font-medium leading-7 text-muted">
                      Decode the payload. The first word tells you what kind of cipher comes next.
                    </p>
                    <label htmlFor="hex-answer" className="mt-5 block text-sm font-bold text-text">
                      Enter the cipher name, or paste the decoded sentence.
                    </label>
                    <div className="mt-3 rounded-2xl border border-border/70 bg-surface/70 px-4 py-3 transition-colors focus-within:border-accent/70">
                      <input
                        id="hex-answer"
                        value={puzzleInput}
                        onChange={(event) => {
                          setPuzzleInput(event.target.value);
                          setPuzzleStatus('idle');
                        }}
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="w-full bg-transparent text-xl font-bold tracking-wide text-text outline-none"
                      />
                    </div>
                    <PuzzleSubmitButton disabled={!puzzleInput.trim() || puzzleStatus === 'checking'} loading={puzzleStatus === 'checking'} />
                    {puzzleStatus === 'wrong' && <PuzzleError>Not that cipher.</PuzzleError>}
                    {puzzleStatus === 'error' && <PuzzleError>The cipher could not be checked right now.</PuzzleError>}
                  </form>
                )}

                {stage === 'cipher' && (
                  <form onSubmit={handlePuzzleSubmit}>
                    <h3 className="text-2xl font-bold text-text">Read the cipher line.</h3>
                    <p className="mt-3 text-sm font-medium leading-7 text-muted">
                      Use the cipher from the last step. Enter the sentence it gives you.
                    </p>
                    <label htmlFor="cipher-answer" className="mt-5 block text-sm font-bold text-text">
                      Enter the decoded sentence.
                    </label>
                    <div className="mt-3 rounded-2xl border border-border/70 bg-surface/70 px-4 py-3 transition-colors focus-within:border-accent/70">
                      <input
                        id="cipher-answer"
                        value={puzzleInput}
                        onChange={(event) => {
                          setPuzzleInput(event.target.value);
                          setPuzzleStatus('idle');
                        }}
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="w-full bg-transparent text-base font-bold tracking-wide text-text outline-none"
                      />
                    </div>
                    <PuzzleSubmitButton disabled={!puzzleInput.trim() || puzzleStatus === 'checking'} loading={puzzleStatus === 'checking'} />
                    {puzzleStatus === 'wrong' && <PuzzleError>Line does not match.</PuzzleError>}
                    {puzzleStatus === 'error' && <PuzzleError>The line could not be checked right now.</PuzzleError>}
                  </form>
                )}

                {stage === 'name' && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-accent">Private line</p>
                    <h3 className="mt-3 text-xl font-bold text-text">
                      {status === 'matched' ? 'The name is:' : 'Opening the sealed line.'}
                    </h3>
                    <div className="mt-4 rounded-2xl border border-border/70 bg-bg/35 px-4 py-4">
                      {status === 'checking' && (
                        <div className="flex items-center gap-3 text-base font-bold text-muted">
                          <Loader2 size={18} className="animate-spin" />
                          Revealing
                        </div>
                      )}
                      {status === 'matched' && (
                        <RevealedName name={revealedName} />
                      )}
                      {status === 'error' && (
                        <p className="text-base font-semibold leading-7 text-warm-accent">
                          The reveal is not connected right now.
                        </p>
                      )}
                    </div>
                    {status === 'matched' && (
                      <p className="mt-4 rounded-2xl border border-border/60 bg-surface/45 px-4 py-3 text-sm font-semibold leading-6">
                        <DecodedText text="Some things are only meant to open once." />
                      </p>
                    )}
                    {status === 'error' && (
                      <button
                        type="button"
                        onClick={() => moveToStage('cipher')}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-4 text-base font-bold text-bg transition-[transform,background-color] duration-150 ease-out hover:bg-accent-dark active:scale-[0.97]"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CutesyOpenedNote({ onLockAgain }: { onLockAgain: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-[1.75rem] border border-border/55 bg-bg/35 p-5 shadow-inner shadow-black/10"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
        <Check size={13} />
        Sealed line opened
      </div>
      <h3 className="mt-5 text-2xl font-bold leading-tight text-text">
        A little note unlocked.
      </h3>
      <p className="mt-3 text-sm font-medium leading-7 text-muted">
        You found the right name. Keep it soft, keep it quiet.
      </p>

      <div className="mt-5 rounded-3xl border border-border/55 bg-bg/45 p-5">
        <p className="text-xl font-semibold leading-9 text-text">
          quiet things,
          <br />
          soft timing,
          <br />
          the right name.
        </p>
      </div>

      <p className="mt-4 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm font-semibold leading-6 text-accent">
        <DecodedText text="Some things are only meant to open once." />
      </p>

      <button
        type="button"
        onClick={onLockAgain}
        className="mt-4 w-full rounded-full border border-border/65 bg-surface/70 px-5 py-3 text-sm font-bold text-muted transition-[transform,background-color,border-color,color] duration-150 ease-out hover:border-accent/40 hover:bg-accent/10 hover:text-text active:scale-[0.97]"
      >
        Lock it again
      </button>
    </motion.div>
  );
}

function PuzzleSubmitButton({ disabled, loading = false }: { disabled: boolean; loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-4 text-base font-bold text-bg transition-[transform,background-color,opacity] duration-150 ease-out hover:bg-accent-dark active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {loading ? 'Checking' : 'Continue'}
    </button>
  );
}

function RevealedName({ name }: { name: string }) {
  return (
    <div
      className="flex flex-wrap items-center gap-1.5 text-2xl font-black tracking-[0.08em] sm:text-3xl"
      aria-label="Encrypted name. Hover or focus each character to reveal it."
    >
      {Array.from(name).map((character, index) => (
        <ScrambleRevealLetter character={character} index={index} key={`${character}-${index}`} />
      ))}
    </div>
  );
}

function ScrambleRevealLetter({ character, index }: { character: string; index: number }) {
  const [displayCharacter, setDisplayCharacter] = useState(() => getScrambleCharacter(index));
  const [isRevealed, setIsRevealed] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const clearScramble = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reveal = () => {
    if (character === ' ') return;

    clearScramble();
    setIsRevealed(true);
    setDisplayCharacter(character);
  };

  const encrypt = () => {
    if (character === ' ') return;

    setIsRevealed(false);
  };

  useEffect(() => {
    if (character === ' ' || isRevealed) {
      clearScramble();
      return clearScramble;
    }

    let frame = 0;
    intervalRef.current = window.setInterval(() => {
      frame += 1;
      setDisplayCharacter(getScrambleCharacter(index + frame));
    }, 90);

    return clearScramble;
  }, [character, index, isRevealed]);

  if (character === ' ') {
    return <span aria-hidden="true" className="w-[0.35em]">&nbsp;</span>;
  }

  return (
    <button
      type="button"
      aria-label={`Reveal character ${index + 1}`}
      onMouseEnter={reveal}
      onMouseLeave={encrypt}
      onFocus={reveal}
      onBlur={encrypt}
      className="grid h-12 min-w-10 place-items-center rounded-xl border border-border/55 bg-surface/55 px-2 font-mono text-accent/75 shadow-inner shadow-black/10 outline-none transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out hover:-translate-y-px hover:border-warm-accent/55 hover:bg-warm-accent/10 hover:text-warm-accent focus-visible:-translate-y-px focus-visible:border-warm-accent/60 focus-visible:bg-warm-accent/10 focus-visible:text-warm-accent focus-visible:ring-2 focus-visible:ring-accent/50 sm:h-14 sm:min-w-11"
    >
      {displayCharacter}
    </button>
  );
}

function getScrambleCharacter(index: number) {
  return SCRAMBLE_CHARS[index % SCRAMBLE_CHARS.length];
}

function SunlightSparkles({
  imageUrls = defaultSunlightImages,
  count = 8,
}: {
  imageUrls?: string[];
  count?: number;
}) {
  type Particle = {
    id: string;
    x: string;
    y: string;
    delay: number;
    scale: number;
    rotate: number;
    duration: number;
    repeatDelay: number;
    src: string;
  };

  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const makeParticle = (): Particle => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      x: `${10 + Math.random() * 80}%`,
      y: `${5 + Math.random() * 70}%`,
      delay: Math.random() * 3.5,
      scale: 0.6 + Math.random() * 0.9,
      rotate: -15 + Math.random() * 30,
      duration: 1 + Math.random() * 0.8,
      repeatDelay: 6 + Math.random() * 6,
      src: imageUrls[Math.floor(Math.random() * imageUrls.length)],
    });

    setParticles(Array.from({ length: count }, makeParticle));
    const interval = window.setInterval(() => {
      setParticles((currentParticles) =>
        currentParticles.map((particle) => ({
          ...particle,
          delay: Math.random() * 3.5,
        })),
      );
    }, 8000);

    return () => window.clearInterval(interval);
  }, [count, imageUrls]);

  return (
    <span className="relative inline-block overflow-visible align-baseline">
      <span className="relative z-10 font-semibold text-warm-accent">sunlight</span>
      {particles.map((particle) => (
        <motion.img
          key={particle.id}
          src={particle.src}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute z-30 h-[1.3em] w-[1.3em]"
          style={{
            left: particle.x,
            top: particle.y,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 0, scale: 0.45, rotate: particle.rotate }}
          animate={{
            opacity: [0, 0.9, 0],
            scale: [0.45, particle.scale, 0.45],
            y: [0, -8, 0],
            rotate: particle.rotate,
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            repeatDelay: particle.repeatDelay,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </span>
  );
}

function PuzzleError({ children }: { children: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-2xl border border-warm-accent/30 bg-warm-accent/10 px-4 py-3 text-sm font-semibold text-warm-accent"
    >
      {children}
    </motion.p>
  );
}
