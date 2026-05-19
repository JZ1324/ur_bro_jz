import { motion } from 'motion/react';
import { TypewriterEffectSmooth } from './ui/typewriter-effect';
import { FaithHoverCard } from './ui/faith-hover-card';
import { MiniMusicPlayer } from './MiniMusicPlayer';
import { ShinyText } from './ui/ShinyText';
import type { FaithHover, ProfileData, ProfileStat } from '../data/site';

type ProfileCardProps = {
  profile: ProfileData;
  faithHover: FaithHover;
  onFaithClick: () => void;
};

function ProfileStatItem({ stat }: { stat: ProfileStat }) {
  return (
    <div className="flex min-w-0 flex-col items-center rounded-xl px-4 py-2">
      <span className="text-lg font-bold leading-none text-accent">{stat.value}</span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">{stat.label}</span>
    </div>
  );
}

export function ProfileCard({ profile, faithHover, onFaithClick }: ProfileCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative mx-auto mt-6 grid w-full max-w-4xl grid-cols-1 items-center gap-7 overflow-hidden rounded-2xl border border-border/60 bg-surface px-5 py-5 shadow-2xl shadow-black/20 ring-1 ring-accent/5 sm:px-6 sm:py-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-7 md:px-8 md:py-7"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,211,176,0.12),transparent_46%),radial-gradient(circle_at_85%_25%,rgba(228,154,120,0.09),transparent_34%)]" />
      <div className="relative z-10 flex w-full min-w-0 flex-col items-center justify-center md:-translate-x-4">
        <div className="group relative p-1.5">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-full bg-accent/20 blur-xl -z-10"
          />

          <motion.div
            animate={{
              boxShadow: [
                '0 4px 20px -2px rgba(184, 121, 91, 0.15)',
                '0 4px 25px -2px rgba(110, 115, 94, 0.25)',
                '0 4px 20px -2px rgba(184, 121, 91, 0.15)',
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative h-32 w-32 overflow-hidden rounded-full border-[3px] border-accent bg-surface p-1 shadow-xl shadow-black/30 transition-transform duration-500 group-hover:scale-[1.02] sm:h-36 sm:w-36 md:h-[9rem] md:w-[9rem]"
          >
            <img
              src={profile.imageSrc}
              alt={`${profile.displayName} Instagram profile`}
              className="w-full h-full object-cover rounded-full bg-accent-soft/30"
            />

            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
              <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
            </div>
          </motion.div>
        </div>

        {profile.track && <MiniMusicPlayer track={profile.track} />}
      </div>

      <div className="relative z-10 flex min-w-0 flex-col items-center gap-3 text-center md:-translate-x-4 md:items-start md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-text md:text-[2.35rem]" aria-label={profile.displayName}>
          <TypewriterEffectSmooth
            words={[
              {
                text: profile.displayName,
                className: 'text-text',
              },
            ]}
            className="justify-center text-3xl md:justify-start md:text-[2.35rem]"
            cursorClassName="bg-warm-accent"
            characterDelay={0.34}
            revealDuration={4.6}
          />
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm font-semibold tracking-wide text-muted md:justify-start">
          <a
            href={profile.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent premium-transition"
          >
            {profile.handle}
          </a>
          <span className="text-border" aria-hidden="true">/</span>
          <span className="text-muted">{profile.bio}</span>
        </div>

        <div className="grid w-full max-w-xs grid-cols-2 gap-1.5 rounded-2xl border border-border/45 bg-bg/25 p-1.5 md:max-w-sm">
          {profile.stats.map((stat) => stat.label === 'Following' ? (
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
            <span key={stat.label} className="min-w-0 rounded-xl transition-colors hover:bg-accent/5">
              <ProfileStatItem stat={stat} />
            </span>
          ))}
        </div>

        <div className="mt-1 flex w-full max-w-sm gap-3">
          <a
            href={profile.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-full bg-accent px-7 py-2 text-center font-semibold text-bg shadow-lg shadow-accent/10 premium-transition hover:bg-accent-dark active:scale-95 md:flex-none"
          >
            Instagram
          </a>
          <a
            href={profile.dumpsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-full border border-warm-accent/45 bg-warm-accent/10 px-7 py-2 text-center font-semibold text-text shadow-sm premium-transition hover:bg-warm-accent/15 active:scale-95 md:flex-none"
          >
            <ShinyText text="My Dumpy" color="#E49A78" shineColor="#FFF4CF" speed={3.2} delay={0.45} />
          </a>
        </div>
      </div>
    </motion.section>
  );
}
