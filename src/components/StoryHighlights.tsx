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
  onStoryClick: (story: StoryItem) => void;
};

export function StoryHighlights({ stories, isUnlocked, onStoryClick }: StoryHighlightsProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, delay: 0.16, ease: [0.23, 1, 0.32, 1] }}
      className="w-full"
    >
      <div className="flex justify-start md:justify-center gap-6 overflow-x-auto py-4 scrollbar-hide px-2">
        {stories.map((story) => {
          const Icon = icons[story.icon];
          const isLocked = story.locked && !isUnlocked;

          return (
            <button
              key={story.id}
              onClick={() => onStoryClick(story)}
              className="group flex flex-shrink-0 cursor-pointer flex-col items-center gap-3 active:scale-[0.98] transition-transform duration-150 ease-out"
            >
              <div
                className={`relative h-20 w-20 rounded-full p-1 transition-[transform,background-color,box-shadow,opacity] duration-200 ease-out group-hover:bg-accent-soft/30 ${
                  isLocked
                    ? 'ring-2 ring-border opacity-95 group-hover:opacity-100'
                    : 'ring-2 ring-accent group-hover:scale-[1.015] group-hover:shadow-[0_0_14px_rgba(201,211,176,0.18)]'
                }`}
              >
                <div className="w-full h-full bg-surface rounded-full flex items-center justify-center border border-border/60 shadow-lg shadow-black/10">
                  <Icon size={28} className={isLocked ? 'text-muted' : 'text-accent'} />
                </div>
                {isLocked && (
                  <div
                    className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-accent/45 bg-bg text-accent shadow-lg shadow-black/25 ring-2 ring-surface"
                    aria-hidden="true"
                  >
                    <Lock size={15} strokeWidth={2.4} />
                  </div>
                )}
              </div>
              <span className={`text-[12px] font-semibold transition-colors duration-150 ease-out ${isLocked ? 'text-muted group-hover:text-text' : 'text-text'}`}>
                {story.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}
