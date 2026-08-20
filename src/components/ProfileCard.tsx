import { motion, useMotionValue, useTransform, type MotionValue } from 'motion/react';
import { FaithHoverCard } from './ui/faith-hover-card';
import { BibleVerseHoverCard } from './ui/bible-verse-hover-card';
import { MiniMusicPlayer } from './MiniMusicPlayer';
import { ShinyText } from './ui/ShinyText';
import type { FaithHover, ProfileData, ProfileStat } from '../data/site';

type ProfileCardMotion = {
  progress: MotionValue<number>;
  reducedMotion: boolean;
};

type ProfileCardProps = {
  profile: ProfileData;
  faithHover: FaithHover;
  onFaithClick: () => void;
  scrollMotion?: ProfileCardMotion;
};

function ProfileStatItem({ stat }: { stat: ProfileStat }) {
  return (
    <div className="flex min-w-0 flex-col items-center rounded-xl px-2.5 py-2 sm:px-4" data-profile-stat>
      <span className="text-lg font-bold leading-none text-accent">{stat.value}</span>
      <span className="mt-1 text-center text-[9px] font-semibold uppercase tracking-[0.14em] text-muted sm:text-[10px] sm:tracking-wider">{stat.label}</span>
    </div>
  );
}

export function ProfileCard({ profile, faithHover, onFaithClick, scrollMotion }: ProfileCardProps) {
  const fallbackProgress = useMotionValue(0);
  const progress = scrollMotion?.progress ?? fallbackProgress;
  const reducedMotion = scrollMotion?.reducedMotion ?? true;

  const cardOpacity = useTransform(
    progress,
    [0, 0.16, 0.74, 0.94, 1],
    reducedMotion ? [1, 1, 1, 1, 1] : [0.84, 1, 1, 0.18, 0],
  );
  const cardY = useTransform(
    progress,
    [0, 0.16, 0.74, 1],
    reducedMotion ? [0, 0, 0, 0] : [30, 0, 0, -55],
  );
  const cardScale = useTransform(
    progress,
    [0, 0.16, 0.74, 1],
    reducedMotion ? [1, 1, 1, 1] : [0.94, 1.02, 1.02, 0.96],
  );

  return (
    <motion.section
      className="archive-corner-panel relative mx-auto grid w-full max-w-4xl grid-cols-1 items-center gap-5 overflow-hidden rounded-[1.35rem] border border-border/55 bg-surface px-4 py-4 shadow-xl shadow-black/15 ring-1 ring-accent/5 min-[560px]:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] min-[560px]:gap-x-7 min-[560px]:gap-y-4 min-[560px]:px-6 min-[560px]:py-5 sm:rounded-2xl md:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] md:gap-x-9 md:px-8 md:py-6 lg:gap-x-10"
      style={{ opacity: cardOpacity, y: cardY, scale: cardScale }}
      data-profile-card
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,211,176,0.12),transparent_46%),radial-gradient(circle_at_85%_25%,rgba(228,154,120,0.09),transparent_34%)]" />
      <div
        className="relative z-10 flex w-full min-w-0 flex-col items-center justify-center gap-3.5 justify-self-center"
        data-profile-media
      >
        <div className="group relative p-1 sm:p-1.5">
          <div className="absolute -inset-3 -z-10 rounded-full bg-[radial-gradient(circle,rgba(201,211,176,0.2),transparent_68%)] blur-md" />

          <div
            className="relative h-[8rem] w-[8rem] overflow-hidden rounded-full border-[3px] border-accent bg-surface p-1 shadow-[0_14px_32px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-out hover:scale-[1.01] sm:h-36 sm:w-36 md:h-[9.25rem] md:w-[9.25rem]"
            data-profile-avatar
          >
            <img
              src={profile.imageSrc}
              alt={`${profile.displayName} Instagram profile`}
              className="w-full h-full object-cover rounded-full bg-accent-soft/30"
            />

            <div className="pointer-events-none absolute inset-0 opacity-100">
              <div className="profile-avatar-shine absolute inset-0 bg-linear-to-tr from-transparent via-white/14 to-transparent" />
            </div>
          </div>
        </div>

        {profile.track && (
          <div className="w-full max-w-[18rem]" data-profile-player>
            <MiniMusicPlayer track={profile.track} variant="strip" />
          </div>
        )}
      </div>

      <div
        className="relative z-10 flex w-full max-w-[22rem] min-w-0 flex-col items-center gap-2.5 justify-self-center text-center sm:max-w-[24rem] md:gap-3"
        data-profile-details
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl font-bold tracking-tight text-text md:text-[2.35rem]"
            data-profile-name
          >
            {profile.displayName}
          </motion.h1>
          <div className="flex max-w-[18rem] flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-semibold tracking-wide text-muted sm:max-w-none sm:text-sm">
            <a
              href={profile.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent premium-transition"
            >
              {profile.handle}
            </a>
            <span className="text-border" aria-hidden="true">/</span>
            {profile.bibleVersePreview ? (
              <BibleVerseHoverCard
                verse={profile.bibleVersePreview}
                className="-mx-1 rounded-full px-1.5 py-0.5 text-muted underline decoration-warm-accent/60 decoration-dotted underline-offset-4 premium-transition hover:bg-warm-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-accent/70"
              >
                {profile.bio}
              </BibleVerseHoverCard>
            ) : (
              <span className="text-muted">{profile.bio}</span>
            )}
          </div>
        </div>

        <div className="grid w-full max-w-[18rem] grid-cols-2 divide-x divide-border/40 sm:max-w-xs md:max-w-sm">
          {profile.stats.map((stat) => stat.label === 'Relationship' ? (
            <span key={stat.label} className="min-w-0">
              <FaithHoverCard
                faith={faithHover}
                onOpenPage={onFaithClick}
                className="w-full justify-center rounded-xl transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <ProfileStatItem stat={stat} />
              </FaithHoverCard>
            </span>
          ) : (
            <span key={stat.label} className="min-w-0 transition-colors hover:bg-accent/5">
              <ProfileStatItem stat={stat} />
            </span>
          ))}
        </div>

        <div
          className="mt-1 grid w-full max-w-[18rem] grid-cols-2 gap-2.5 sm:max-w-[20.5rem] sm:gap-3"
          data-profile-actions
        >
          <a
            href={profile.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[2.55rem] items-center justify-center rounded-full bg-accent px-4 py-2 text-center text-[0.92rem] font-semibold text-bg shadow-sm premium-transition hover:bg-accent-dark active:scale-[0.97] sm:min-h-[2.7rem] sm:px-5 sm:text-[0.95rem]"
          >
            Instagram
          </a>
          <a
            href={profile.dumpsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[2.55rem] items-center justify-center rounded-full border border-warm-accent/45 bg-warm-accent/10 px-4 py-2 text-center text-[0.92rem] font-semibold text-text shadow-sm premium-transition hover:bg-warm-accent/15 active:scale-[0.97] sm:min-h-[2.7rem] sm:px-5 sm:text-[0.95rem]"
          >
            <ShinyText text="My Dumpy" color="#E49A78" shineColor="#FFF4CF" speed={3.2} delay={0.45} className="whitespace-nowrap" />
          </a>
        </div>
      </div>
    </motion.section>
  );
}
