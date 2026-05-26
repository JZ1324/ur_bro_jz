import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { DynamicIslandTOC } from './DynamicIslandTOC';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import type { FaithSection } from '../data/site';

type JesusOverlayProps = {
  isOpen: boolean;
  sections: FaithSection[];
  onClose: () => void;
};

type QuizAnswer = 'yes' | 'no';
type JudgmentAnswer = 'innocent' | 'guilty';
type DestinationAnswer = 'heaven' | 'hell' | 'not-sure';

type CommandmentQuestion = {
  id: string;
  question: string;
  brokenLabel: string;
  note?: string;
  challenge: string;
};

const commandmentQuestions: CommandmentQuestion[] = [
  {
    id: 'lie',
    question: 'Have you ever lied?',
    brokenLabel: 'lying',
    challenge: 'Even one lie counts. Think honestly before God, not compared to other people.',
  },
  {
    id: 'steal',
    question: 'Have you ever stolen anything?',
    brokenLabel: 'stealing',
    challenge: 'Even something small, copied, kept, or taken without permission still counts.',
  },
  {
    id: 'vain',
    question: 'Have you ever used God’s name in vain?',
    brokenLabel: 'using God’s name in vain',
    challenge: 'Using God’s name carelessly or as a swear word is still dishonoring Him.',
  },
  {
    id: 'lust',
    question: 'Have you ever looked with lust?',
    brokenLabel: 'adultery of the heart',
    note: 'Jesus says lust is adultery in the heart.',
    challenge: 'Jesus said lust is adultery in the heart, so this is about the heart, not just outward actions.',
  },
  {
    id: 'hate',
    question: 'Have you ever hated someone?',
    brokenLabel: 'murder in the heart',
    note: 'Jesus connects hatred with murder in the heart.',
    challenge: 'Jesus connects hatred and anger with murder in the heart, so the heart matters here too.',
  },
];

const totalQuizSteps = commandmentQuestions.length + 5;

export function JesusOverlay({ isOpen, sections, onClose }: JesusOverlayProps) {
  useBodyScrollLock(isOpen);

  const [quizStep, setQuizStep] = useState(0);
  const [goodPersonAnswer, setGoodPersonAnswer] = useState<QuizAnswer | null>(null);
  const [commandmentAnswers, setCommandmentAnswers] = useState<Record<string, QuizAnswer>>({});
  const [judgmentAnswer, setJudgmentAnswer] = useState<JudgmentAnswer | null>(null);
  const [destinationAnswer, setDestinationAnswer] = useState<DestinationAnswer | null>(null);

  const commandmentStepStart = 1;
  const summaryStep = commandmentStepStart + commandmentQuestions.length;
  const judgmentStep = summaryStep + 1;
  const destinationStep = judgmentStep + 1;
  const gospelStep = destinationStep + 1;
  const currentCommandment = quizStep >= commandmentStepStart && quizStep < summaryStep
    ? commandmentQuestions[quizStep - commandmentStepStart]
    : null;
  const brokenCommandments = commandmentQuestions.filter((question) => commandmentAnswers[question.id] === 'yes');
  const hasBrokenLaw = brokenCommandments.length > 0;
  const isBlockedCommandmentAnswer = currentCommandment !== null && commandmentAnswers[currentCommandment.id] === 'no';
  const isBlockedJudgmentAnswer = quizStep === judgmentStep && judgmentAnswer === 'innocent';
  const isBlockedDestinationAnswer =
    quizStep === destinationStep && (destinationAnswer === 'heaven' || destinationAnswer === 'not-sure');
  const isBlockedAnswer = isBlockedCommandmentAnswer || isBlockedJudgmentAnswer || isBlockedDestinationAnswer;

  const resetQuiz = () => {
    setQuizStep(0);
    setGoodPersonAnswer(null);
    setCommandmentAnswers({});
    setJudgmentAnswer(null);
    setDestinationAnswer(null);
  };

  const canContinue = (
    (quizStep === 0 && goodPersonAnswer !== null) ||
    (currentCommandment !== null && commandmentAnswers[currentCommandment.id] !== undefined) ||
    quizStep === summaryStep ||
    (quizStep === judgmentStep && judgmentAnswer !== null) ||
    (quizStep === destinationStep && destinationAnswer !== null)
  );

  const handleContinue = () => {
    if (currentCommandment && commandmentAnswers[currentCommandment.id] === 'no') {
      setCommandmentAnswers((current) => {
        const next = { ...current };
        delete next[currentCommandment.id];
        return next;
      });
      return;
    }

    if (quizStep === judgmentStep && judgmentAnswer === 'innocent') {
      setJudgmentAnswer(null);
      return;
    }

    if (quizStep === destinationStep && (destinationAnswer === 'heaven' || destinationAnswer === 'not-sure')) {
      setDestinationAnswer(null);
      return;
    }

    setQuizStep((step) => Math.min(gospelStep, step + 1));
  };

  const OptionButton = ({
    isSelected,
    onClick,
    children,
  }: {
    isSelected: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`rounded-full border px-5 py-2.5 text-sm font-bold transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out active:scale-[0.97] ${
        isSelected
          ? 'border-accent bg-accent text-bg shadow-lg shadow-accent/10'
          : 'border-border/60 bg-bg/30 text-muted hover:border-accent/60 hover:text-text'
      }`}
    >
      {children}
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-[70] bg-bg/96 backdrop-blur-2xl"
        >
          <article id="jesus-panel" className="h-screen overflow-y-auto overscroll-contain px-5 py-8 sm:px-8">
            <button
              onClick={onClose}
              className="fixed right-5 top-5 z-[80] rounded-full border border-border/45 bg-surface/90 p-3 text-accent shadow-xl shadow-black/25 transition-[transform,background-color,border-color] duration-150 ease-out hover:bg-accent/15 active:scale-[0.96] sm:right-8 sm:top-8"
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

                <section className="rounded-3xl border border-warm-accent/35 bg-surface p-6 shadow-2xl shadow-black/20 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-warm-accent">Good Person Test</p>
                    <p className="rounded-full border border-border/50 bg-bg/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                      {Math.min(quizStep + 1, totalQuizSteps)} / {totalQuizSteps}
                    </p>
                  </div>
                  <h2
                    data-toc
                    data-toc-title="Quiz"
                    data-toc-depth="2"
                    id="good-person-quiz"
                    className="mt-3 text-3xl font-bold text-text"
                  >
                    Quiz
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                    A Good Person Test through the Ten Commandments, then the courtroom picture for why the Gospel matters.
                  </p>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={quizStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                      className="mt-6 rounded-3xl border border-border/45 bg-bg/30 p-5"
                    >
                      {quizStep === 0 && (
                        <>
                          <p className="text-xl font-bold leading-relaxed text-text">
                            Do you think you are a good person?
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-muted">
                            This test uses God’s Law, not internet opinions or comparing yourself to other people.
                          </p>
                          <div className="mt-5 flex flex-wrap gap-3">
                            <OptionButton isSelected={goodPersonAnswer === 'yes'} onClick={() => setGoodPersonAnswer('yes')}>
                              Yes
                            </OptionButton>
                            <OptionButton isSelected={goodPersonAnswer === 'no'} onClick={() => setGoodPersonAnswer('no')}>
                              No
                            </OptionButton>
                          </div>
                        </>
                      )}

                      {currentCommandment && (
                        <>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-accent">
                            God’s Law
                          </p>
                          <p className="mt-3 text-xl font-bold leading-relaxed text-text">
                            {currentCommandment.question}
                          </p>
                          {currentCommandment.note && (
                            <p className="mt-3 text-sm leading-relaxed text-muted">{currentCommandment.note}</p>
                          )}
                          <div className="mt-5 flex flex-wrap gap-3">
                            <OptionButton
                              isSelected={commandmentAnswers[currentCommandment.id] === 'yes'}
                              onClick={() => setCommandmentAnswers((current) => ({ ...current, [currentCommandment.id]: 'yes' }))}
                            >
                              Yes
                            </OptionButton>
                            <OptionButton
                              isSelected={commandmentAnswers[currentCommandment.id] === 'no'}
                              onClick={() => setCommandmentAnswers((current) => ({ ...current, [currentCommandment.id]: 'no' }))}
                            >
                              No
                            </OptionButton>
                          </div>
                          {commandmentAnswers[currentCommandment.id] === 'no' && (
                            <div className="mt-5 rounded-2xl border border-warm-accent/30 bg-warm-accent/10 p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-accent">
                                Are you sure?
                              </p>
                              <p className="mt-2 text-sm font-semibold leading-relaxed text-text">
                                {currentCommandment.challenge}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {quizStep === summaryStep && (
                        <>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-accent">
                            Conclusion
                          </p>
                          <p className="mt-3 text-xl font-bold leading-relaxed text-text">
                            {hasBrokenLaw
                              ? 'By your own answers, you have broken God’s law.'
                              : 'Even if someone says no to these, God still sees the whole heart perfectly.'}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-muted">
                            {hasBrokenLaw
                              ? `Your answers included ${brokenCommandments.map((question) => question.brokenLabel).join(', ')}. The point is not that you are worse than everyone else. The point is that God’s standard is perfect.`
                              : 'The Good Person Test is meant to show that God judges by His perfect standard, not by whether we look better than someone else.'}
                          </p>
                        </>
                      )}

                      {quizStep === judgmentStep && (
                        <>
                          <p className="text-xl font-bold leading-relaxed text-text">
                            If God judged you by the Ten Commandments, would you be innocent or guilty?
                          </p>
                          <div className="mt-5 flex flex-wrap gap-3">
                            <OptionButton isSelected={judgmentAnswer === 'innocent'} onClick={() => setJudgmentAnswer('innocent')}>
                              Innocent
                            </OptionButton>
                            <OptionButton isSelected={judgmentAnswer === 'guilty'} onClick={() => setJudgmentAnswer('guilty')}>
                              Guilty
                            </OptionButton>
                          </div>
                          {isBlockedJudgmentAnswer && (
                            <div className="mt-5 rounded-2xl border border-warm-accent/30 bg-warm-accent/10 p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-accent">
                                Are you sure?
                              </p>
                              <p className="mt-2 text-sm font-semibold leading-relaxed text-text">
                                If the Law has been broken, “innocent” does not really fit. A good judge does not call
                                someone innocent by ignoring the evidence. Think about the verdict again.
                              </p>
                            </div>
                          )}
                          {judgmentAnswer === 'guilty' && (
                            <p className="mt-4 text-sm leading-relaxed text-muted">
                              That is the serious part of the test. Justice makes the Gospel necessary.
                            </p>
                          )}
                        </>
                      )}

                      {quizStep === destinationStep && (
                        <>
                          <p className="text-xl font-bold leading-relaxed text-text">
                            If God is holy and just, would sin deserve heaven or hell?
                          </p>
                          <div className="mt-5 flex flex-wrap gap-3">
                            <OptionButton isSelected={destinationAnswer === 'heaven'} onClick={() => setDestinationAnswer('heaven')}>
                              Heaven
                            </OptionButton>
                            <OptionButton isSelected={destinationAnswer === 'hell'} onClick={() => setDestinationAnswer('hell')}>
                              Hell
                            </OptionButton>
                            <OptionButton isSelected={destinationAnswer === 'not-sure'} onClick={() => setDestinationAnswer('not-sure')}>
                              Not sure
                            </OptionButton>
                          </div>
                          {destinationAnswer === 'heaven' && (
                            <div className="mt-5 rounded-2xl border border-warm-accent/30 bg-warm-accent/10 p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-accent">
                                Are you sure?
                              </p>
                              <p className="mt-2 text-sm font-semibold leading-relaxed text-text">
                                If God is just, heaven cannot come from pretending guilt is small. That is why the answer
                                has to be mercy through Christ, not earning it by being “good enough.” Think about it again.
                              </p>
                            </div>
                          )}
                          {destinationAnswer === 'hell' && (
                            <p className="mt-4 text-sm leading-relaxed text-muted">
                              That is why the next part matters: the Gospel is not “try harder,” it is rescue.
                            </p>
                          )}
                          {destinationAnswer === 'not-sure' && (
                            <div className="mt-5 rounded-2xl border border-warm-accent/30 bg-warm-accent/10 p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-accent">
                                Are you sure?
                              </p>
                              <p className="mt-2 text-sm font-semibold leading-relaxed text-text">
                                The courtroom picture helps here: if guilt is real, justice cannot just look away from it.
                                The question is what sin deserves before a holy God.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {quizStep === gospelStep && (
                        <>
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-warm-accent">
                            The Gospel
                          </p>
                          <p className="mt-3 text-xl font-bold leading-relaxed text-text">
                            That is why the Gospel is good news.
                          </p>
                          <div className="mt-4 rounded-2xl border border-warm-accent/25 bg-warm-accent/10 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-accent">
                              Courtroom picture
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-relaxed text-text">
                              Imagine someone is guilty in court and says, “Judge, I have done good things too.”
                              A good judge cannot ignore the crime just because the person has also done kind things.
                              Justice still has to be done.
                            </p>
                          </div>
                          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                            {(judgmentAnswer === 'innocent' || destinationAnswer === 'heaven') && hasBrokenLaw && (
                              <p className="font-semibold text-text">
                                Even when we want the verdict to be innocent or the destination to be heaven, the Law exposes
                                the problem: guilt has to be dealt with, not hidden.
                              </p>
                            )}
                            <p>God is holy and just, so sin must be judged.</p>
                            <p>At the cross, Jesus took the punishment for sinners, then rose again.</p>
                            <p>Because the fine has been paid, God can be just and still show mercy to the one who trusts in Christ.</p>
                            <p>Repent and trust in Jesus, not in your own goodness.</p>
                          </div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                    {quizStep > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuizStep((step) => Math.max(0, step - 1))}
                        className="rounded-full border border-border/60 px-6 py-3 font-bold text-muted transition-[transform,border-color,color] duration-150 ease-out hover:border-accent/60 hover:text-text active:scale-[0.97]"
                      >
                        Back
                      </button>
                    )}
                    {quizStep < gospelStep && (
                      <button
                        type="button"
                        onClick={handleContinue}
                        disabled={!canContinue}
                        className="rounded-full bg-accent px-6 py-3 font-bold text-bg transition-[transform,background-color,opacity] duration-150 ease-out hover:bg-accent-dark active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {isBlockedAnswer ? 'Ask again' : 'Continue'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={resetQuiz}
                      className="rounded-full border border-border/60 px-6 py-3 font-bold text-muted transition-[transform,border-color,color] duration-150 ease-out hover:border-accent/60 hover:text-text active:scale-[0.97] sm:ml-auto"
                    >
                      Reset
                    </button>
                  </div>
                </section>

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
