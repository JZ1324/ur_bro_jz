import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { MagicBento } from './ui/MagicBento';
import type { Project } from '../data/site';

type ProjectOverlaysProps = {
  projects: Project[];
  showBento: boolean;
  expandedProjectId: string | null;
  onCloseBento: () => void;
  onCardClick: (id: string) => void;
  onCloseProject: () => void;
};

export function ProjectOverlays({
  projects,
  showBento,
  expandedProjectId,
  onCloseBento,
  onCardClick,
  onCloseProject,
}: ProjectOverlaysProps) {
  const selectedProject = projects.find((project) => project.id === expandedProjectId);

  return (
    <>
      <AnimatePresence>
        {showBento && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-bg/96 p-4 backdrop-blur-xl"
          >
            <div className="min-h-screen w-full max-w-6xl flex flex-col gap-8 px-0 py-16 sm:px-4 sm:py-20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">Project Matrix</h2>
                  <p className="text-muted font-medium">Click a card to reveal project specifications</p>
                </div>
                <button
                  onClick={onCloseBento}
                  className="shrink-0 rounded-full bg-accent/10 p-3 text-accent transition-all hover:bg-accent/20 active:scale-90 sm:p-4"
                  aria-label="Close projects"
                >
                  <X size={32} />
                </button>
              </div>

              <MagicBento
                data={projects.map((project) => ({
                  id: project.id,
                  title: project.title,
                  description: project.description,
                  label: project.tags[0],
                  image: project.image,
                  color: '#1B2018',
                }))}
                onCardClick={onCardClick}
                glowColor="228, 154, 120"
                enableTilt={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-xl"
            onClick={onCloseProject}
          >
            <motion.div
              key={selectedProject.id}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-2xl w-full bg-surface border border-border/60 rounded-3xl overflow-hidden shadow-2xl shadow-black/40"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-video relative">
                <img src={selectedProject.image} alt={selectedProject.title} className="w-full h-full object-cover" />
                <button
                  onClick={onCloseProject}
                  className="absolute top-4 right-4 p-2 bg-surface/75 backdrop-blur-md rounded-full hover:bg-surface transition-colors text-text"
                  aria-label="Close project"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-accent px-2 py-0.5 bg-accent/10 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-3xl font-bold text-text">{selectedProject.title}</h3>
                </div>
                <p className="text-muted leading-relaxed">{selectedProject.longDescription}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['What it is', selectedProject.what],
                    ['Why I made it', selectedProject.why],
                    ['Status', selectedProject.status],
                  ].map(([label, body]) => (
                    <div key={label} className="rounded-2xl border border-border/45 bg-bg/70 p-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-accent">{label}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-text">{body}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#8E927F]">What I used</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tech.map((tech) => (
                      <span key={tech} className="px-3 py-1 bg-bg border border-border/20 rounded-lg text-sm text-text font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <a
                  href={selectedProject.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-accent text-bg font-bold rounded-2xl text-center hover:bg-accent-dark transition-all shadow-lg shadow-accent/15"
                >
                  View Project
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
