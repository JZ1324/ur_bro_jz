import { AnimatePresence, motion } from 'motion/react';
import { Check, Download, Loader2, Lock, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { checkSecretName, revealSecretName } from '../lib/secretName';
import { ShinyText } from './ui/ShinyText';

type SecretPuzzleOverlayProps = {
  isOpen: boolean;
  onClose: () => void;
};

type PuzzleStage = 'manual' | 'fragment' | 'hex' | 'cipher' | 'name';
type PuzzleStatus = 'idle' | 'wrong';

const fragmentHex = '726f7431333a2067757220657674756720616e7a722076662067757220626172206775722066626174207666206e6f626867';
const cipherName = 'rot13';
const cipherAnswer = 'the right name is the one the song is about';
const fragmentSrc = `${import.meta.env.BASE_URL}archive-fragment.png`;
const defaultSunlightImages = ['/sunshine.png'];

const stageLabels: Record<PuzzleStage, string> = {
  manual: 'private line',
  fragment: '01 / fragment',
  hex: '02 / hex',
  cipher: '03 / cipher',
  name: '04 / reveal',
};

function findHexPayload(value: string) {
  return value.toLowerCase().match(/[a-f0-9]{40,}/)?.[0] || '';
}

function phrase(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function SecretPuzzleOverlay({ isOpen, onClose }: SecretPuzzleOverlayProps) {
  const [secretName, setSecretName] = useState('');
  const [revealedName, setRevealedName] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'matched' | 'missed' | 'error'>('idle');
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
    moveToStage('fragment');
  };

  const revealName = async () => {
    setStatus('checking');
    setRevealedName('');
    moveToStage('name');
    try {
      const name = await revealSecretName(cipherAnswer);
      setRevealedName(name);
      setStatus('matched');
    } catch {
      setStatus('error');
    }
  };

  const handlePuzzleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = puzzleInput.trim();
    if (!value) return;

    if (stage === 'fragment' && findHexPayload(value) === fragmentHex) {
      moveToStage('hex');
      return;
    }

    if (stage === 'hex') {
      const normalizedValue = phrase(value);
      if (normalizedValue === cipherName || normalizedValue.startsWith(`${cipherName} `)) {
        moveToStage('cipher');
        return;
      }
    }

    if (stage === 'cipher' && phrase(value) === cipherAnswer) {
      await revealName();
      return;
    }

    setPuzzleStatus('wrong');
  };

  const handleManualSubmit = async (event: FormEvent<HTMLFormElement>) => {
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

  const puzzleStarted = stage !== 'manual';

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
                <button
                  type="button"
                  onClick={puzzleStarted ? () => moveToStage('manual') : startPuzzle}
                  className="mx-auto inline-flex items-center gap-2 rounded-full border border-warm-accent/25 bg-warm-accent/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-warm-accent transition-all hover:border-warm-accent/55 hover:bg-warm-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-accent/45 active:scale-95 lg:mx-0"
                  aria-label={puzzleStarted ? 'Return to sealed note input' : 'Start sealed note puzzle'}
                >
                  <Lock size={13} />
                  Sealed note
                </button>
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
                  <form onSubmit={handleManualSubmit}>
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
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-border/60 bg-surface/80 px-5 py-3 text-sm font-bold text-text transition-all hover:border-accent/45 hover:bg-accent/10"
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
                    <PuzzleSubmitButton disabled={!puzzleInput.trim()} />
                    {puzzleStatus === 'wrong' && <PuzzleError>Wrong fragment.</PuzzleError>}
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
                    <PuzzleSubmitButton disabled={!puzzleInput.trim()} />
                    {puzzleStatus === 'wrong' && <PuzzleError>Not that cipher.</PuzzleError>}
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
                    <PuzzleSubmitButton disabled={!puzzleInput.trim()} />
                    {puzzleStatus === 'wrong' && <PuzzleError>Line does not match.</PuzzleError>}
                  </form>
                )}

                {stage === 'name' && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-accent">Private line</p>
                    <h3 className="mt-4 text-2xl font-bold text-text">
                      {status === 'matched' ? 'The name is:' : 'Opening the sealed line.'}
                    </h3>
                    <div className="mt-5 rounded-2xl border border-border/70 bg-surface/70 px-4 py-5">
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
                      <p className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
                        Solved.
                      </p>
                    )}
                    {status === 'error' && (
                      <button
                        type="button"
                        onClick={revealName}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-4 text-base font-bold text-bg transition-all hover:bg-accent-dark active:scale-[0.99]"
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

function PuzzleSubmitButton({ disabled }: { disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-4 flex w-full items-center justify-center rounded-full bg-accent px-5 py-4 text-base font-bold text-bg transition-all hover:bg-accent-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      Continue
    </button>
  );
}

function RevealedName({ name }: { name: string }) {
  return (
    <div
      className="flex flex-wrap items-center gap-[0.04em] text-4xl font-black tracking-wide sm:text-5xl"
      aria-label={name}
    >
      {Array.from(name).map((character, index) => (
        <span aria-hidden="true" key={`${character}-${index}`}>
          <ShinyText
            text={character === ' ' ? '\u00a0' : character}
            color="#E49A78"
            shineColor="#FFF4CF"
            speed={3.2}
            delay={index * 0.08}
            yoyo
            pauseOnHover
            className="font-black"
          />
        </span>
      ))}
    </div>
  );
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
