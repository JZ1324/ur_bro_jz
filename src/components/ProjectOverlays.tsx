import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { LinkPreview } from './ui/link-preview';
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
            className="fixed inset-0 z-50 overflow-y-auto bg-bg/96 px-4 py-8 backdrop-blur-xl sm:px-6 sm:py-10"
          >
            <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-8 pb-12">
              <div className="flex items-start justify-between gap-4 pr-16 sm:pr-20">
                <div className="flex max-w-2xl flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-warm-accent">Project Archive</p>
                  <h2 className="text-4xl font-bold tracking-tight text-text sm:text-5xl">Projects</h2>
                  <p className="text-base font-medium leading-relaxed text-muted sm:text-lg">
                    Real builds from GitHub, live pages, and experiments. Click a project to open the full notes.
                  </p>
                  <span className="w-fit rounded-full border border-border/50 bg-surface px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-accent">
                    {projects.length} entries
                  </span>
                </div>
                <button
                  onClick={onCloseBento}
                  className="fixed right-4 top-4 z-[55] shrink-0 rounded-full border border-border/45 bg-surface/90 p-3 text-accent shadow-xl shadow-black/30 transition-all hover:bg-accent/15 active:scale-90 sm:right-8 sm:top-8 sm:p-4"
                  aria-label="Close projects"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onCardClick(project.id)}
                    className="group flex min-h-[340px] flex-col overflow-hidden rounded-2xl border border-border/55 bg-surface text-left shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-2xl hover:shadow-warm-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0E130D]">
                      <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(201,211,176,0.14),transparent_46%),linear-gradient(135deg,#1B2018,#11150F)] p-6 text-center">
                        <span className="text-xl font-bold text-text">{project.title}</span>
                      </div>
                      <img
                        src={project.image}
                        alt={project.title}
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                        className="relative z-[1] h-full w-full object-cover object-top opacity-[0.94] transition-all duration-500 group-hover:scale-[1.025] group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 z-[2] bg-linear-to-b from-bg/5 via-bg/8 to-bg/46" />
                      <div className="absolute left-4 top-4 z-[3] flex flex-wrap gap-2">
                        {project.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-bg/75 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent backdrop-blur-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-4 p-5">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-2xl font-bold leading-tight text-text">{project.title}</h3>
                        <p className="line-clamp-3 text-sm leading-relaxed text-muted">{project.description}</p>
                      </div>
                      <div className="mt-auto flex flex-wrap gap-2">
                        {project.tech.slice(0, 3).map((tech) => (
                          <span key={tech} className="rounded-lg border border-border/35 bg-bg/55 px-2.5 py-1 text-xs font-semibold text-text">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
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
            className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-bg/82 p-4 backdrop-blur-xl sm:p-6"
            onClick={onCloseProject}
          >
            <motion.div
              key={selectedProject.id}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="my-0 max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-3xl border border-border/60 bg-surface shadow-2xl shadow-black/40 sm:my-auto sm:max-h-[calc(100vh-3rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[16/8] min-h-[240px] overflow-hidden bg-[#0E130D] sm:min-h-[340px]">
                <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_0%,rgba(201,211,176,0.14),transparent_46%),linear-gradient(135deg,#1B2018,#11150F)] p-6 text-center">
                  <span className="text-3xl font-bold text-text">{selectedProject.title}</span>
                </div>
                <img
                  src={selectedProject.image}
                  alt={selectedProject.title}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                  className="relative z-[1] h-full w-full object-cover object-top"
                />
                <div className="absolute inset-0 z-[2] bg-linear-to-b from-bg/8 via-transparent to-surface/70" />
                <button
                  onClick={onCloseProject}
                  className="absolute right-4 top-4 z-[3] rounded-full bg-surface/85 p-2 text-text shadow-lg shadow-black/25 backdrop-blur-md transition-colors hover:bg-surface"
                  aria-label="Close project"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-6 p-5 sm:p-8">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-bold uppercase tracking-widest text-accent px-2 py-0.5 bg-accent/10 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-3xl font-bold text-text sm:text-4xl">{selectedProject.title}</h3>
                </div>
                <p className="text-base leading-relaxed text-muted sm:text-lg">{selectedProject.longDescription}</p>

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

                <LinkPreview
                  url={selectedProject.link}
                  imageSrc={selectedProject.image}
                  isStatic
                  className="w-full py-4 bg-accent text-bg font-bold rounded-2xl text-center hover:bg-accent-dark transition-all shadow-lg shadow-accent/15"
                >
                  View Project
                </LinkPreview>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
