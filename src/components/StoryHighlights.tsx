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
      transition={{ duration: 0.6, delay: 0.2 }}
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
              className="flex flex-col items-center gap-3 cursor-pointer group flex-shrink-0"
            >
              <div
                className={`w-20 h-20 rounded-full p-1 transition-all duration-300 relative group-hover:bg-accent-soft/30 ${
                  isLocked
                    ? 'ring-2 ring-border opacity-95 group-hover:opacity-100'
                    : 'ring-2 ring-accent group-hover:shadow-[0_0_18px_rgba(201,211,176,0.22)] group-hover:scale-[1.03]'
                }`}
              >
                <div className="w-full h-full bg-surface rounded-full flex items-center justify-center border border-border/60 shadow-lg shadow-black/10">
                  <Icon size={28} className={isLocked ? 'text-muted' : 'text-accent'} />
                </div>
                {isLocked && (
                  <div className="absolute bottom-1 right-0 bg-surface rounded-full p-1 border border-border shadow-sm text-warm-accent">
                    <Lock size={12} fill="currentColor" />
                  </div>
                )}
              </div>
              <span className={`text-[12px] font-semibold transition-colors ${isLocked ? 'text-muted group-hover:text-text' : 'text-text'}`}>
                {story.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}
