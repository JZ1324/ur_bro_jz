import { Folder, GraduationCap, Lock, Music, User, Users } from 'lucide-react';
import { motion } from 'motion/react';
import type { StoryItem } from '../data/site';

const icons = {
  folder: Folder,
  user: User,
  graduationCap: GraduationCap,
  music: Music,
  users: Users,
};

type StoryHighlightsProps = {
  stories: StoryItem[];
  isUnlocked: boolean;
  lockedPulseId?: string | null;
  onStoryClick: (story: StoryItem) => void;
};

export function StoryHighlights({ stories, isUnlocked, lockedPulseId, onStoryClick }: StoryHighlightsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: 0.16, ease: [0.23, 1, 0.32, 1] }}
      className="w-full"
    >
      <div className="flex justify-start gap-3.5 overflow-x-auto px-1 py-3 scrollbar-hide sm:gap-5 sm:px-2 md:justify-center md:gap-6 md:py-4">
        {stories.map((story) => {
          const Icon = icons[story.icon];
          const isLocked = story.locked && !isUnlocked;
          const isPulsing = lockedPulseId === story.id;

          return (
            <button
              key={story.id}
              onClick={() => onStoryClick(story)}
              className="group flex w-[5rem] flex-shrink-0 cursor-pointer flex-col items-center gap-2 transition-transform duration-150 ease-out active:scale-[0.98] md:w-auto md:gap-2.5"
            >
              <div
                className={`relative h-[4.35rem] w-[4.35rem] rounded-full p-1 transition-[transform,background-color,box-shadow,opacity] duration-200 ease-out group-hover:bg-accent-soft/30 md:h-20 md:w-20 ${
                  isLocked
                    ? 'ring-2 ring-border/75 opacity-95 group-hover:opacity-100'
                    : 'ring-2 ring-accent group-hover:scale-[1.015] group-hover:shadow-[0_0_14px_rgba(201,211,176,0.18)]'
                } ${isPulsing ? 'animate-lock-wiggle' : ''}`}
              >
                <div className="w-full h-full bg-surface rounded-full flex items-center justify-center border border-border/60 shadow-lg shadow-black/10">
                  <Icon className={`h-6 w-6 md:h-7 md:w-7 ${isLocked ? 'text-muted' : 'text-accent'}`} />
                </div>
                {isLocked && (
                  <div
                    className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-accent/35 bg-bg/95 text-accent shadow-lg shadow-black/25 ring-2 ring-surface md:-bottom-1 md:-right-1 md:h-6 md:w-6"
                    aria-hidden="true"
                  >
                    <Lock className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" strokeWidth={2.4} />
                  </div>
                )}
              </div>
              <span className={`story-label-pill max-w-full truncate text-[11px] font-semibold transition-[background-color,border-color,color] duration-150 ease-out md:text-[12px] ${isLocked ? 'text-muted group-hover:text-text' : 'text-text'}`}>
                {story.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}
