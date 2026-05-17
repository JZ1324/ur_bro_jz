import { motion } from 'motion/react';
import { TypewriterEffectSmooth } from './ui/typewriter-effect';
import type { ProfileData } from '../data/site';

type ProfileCardProps = {
  profile: ProfileData;
  onResumeClick: () => void;
};

export function ProfileCard({ profile, onResumeClick }: ProfileCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative mt-8 flex flex-col items-center gap-8 overflow-hidden rounded-2xl border border-border/60 bg-surface p-6 shadow-2xl shadow-black/20 ring-1 ring-accent/5 md:flex-row md:items-start md:gap-12"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(201,211,176,0.12),transparent_46%),radial-gradient(circle_at_85%_25%,rgba(228,154,120,0.09),transparent_34%)]" />
      <div className="flex-shrink-0 group p-2 relative">
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
          className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-accent p-1 transition-transform duration-500 group-hover:scale-[1.02] relative bg-surface shadow-xl shadow-black/30"
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

      <div className="relative z-10 flex flex-col items-center md:items-start gap-4 flex-grow text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text" aria-label={profile.displayName}>
          <TypewriterEffectSmooth
            words={[
              {
                text: profile.displayName,
                className: 'text-text',
              },
            ]}
            className="justify-center md:justify-start text-3xl md:text-4xl"
            cursorClassName="bg-warm-accent"
          />
        </h1>
        <a
          href={profile.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted font-semibold tracking-wide text-sm hover:text-accent premium-transition"
        >
          {profile.handle}
        </a>

        <div className="flex gap-8 md:gap-12 py-2">
          {profile.stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold text-accent">{stat.value}</span>
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>

        <p className="text-text max-w-md leading-relaxed">{profile.bio}</p>

        <div className="flex gap-4 w-full md:w-auto mt-4">
          <a
            href={profile.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none px-8 py-3 bg-accent text-bg font-semibold rounded-full hover:bg-accent-dark active:scale-95 premium-transition shadow-lg shadow-accent/10 text-center"
          >
            Instagram
          </a>
          <button
            onClick={onResumeClick}
            className="flex-1 md:flex-none px-8 py-3 bg-accent-soft border border-accent/40 text-text font-semibold rounded-full hover:bg-[#2A3125] active:scale-95 premium-transition shadow-sm"
          >
            Resume
          </button>
        </div>
      </div>
    </motion.section>
  );
}
