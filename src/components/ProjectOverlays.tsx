import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, Search, X } from 'lucide-react';
import { LinkPreview } from './ui/link-preview';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import type { Project, ToolItem } from '../data/site';

type ProjectOverlaysProps = {
  projects: Project[];
  toolItems: ToolItem[];
  showBento: boolean;
  expandedProjectId: string | null;
  onCloseBento: () => void;
  onCardClick: (id: string) => void;
  onCloseProject: () => void;
};

export function ProjectOverlays({
  projects,
  toolItems,
  showBento,
  expandedProjectId,
  onCloseBento,
  onCardClick,
  onCloseProject,
}: ProjectOverlaysProps) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const selectedProject = projects.find((project) => project.id === expandedProjectId);
  useBodyScrollLock(showBento || Boolean(selectedProject));

  const filters = ['All', 'Live', 'Web', 'macOS', 'AI-built'];
  const getCaseNumber = (project: Project) =>
    String(projects.findIndex((item) => item.id === project.id) + 1).padStart(2, '0');
  const getProjectCategory = (project: Project) =>
    project.tags.find((tag) => tag.toLowerCase() !== 'live') ?? project.tags[0] ?? 'Build';
  const selectedProjectNumber = selectedProject ? getCaseNumber(selectedProject) : null;

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return projects.filter((project) => {
      const text = [
        project.title,
        project.description,
        project.longDescription,
        project.what,
        project.why,
        project.learned ?? '',
        project.status,
        ...project.tags,
        ...project.tech,
      ].join(' ').toLowerCase();

      const matchesSearch = !normalizedSearch || text.includes(normalizedSearch);
      const matchesFilter = activeFilter === 'All'
        || (activeFilter === 'Live' && project.tags.some((tag) => tag.toLowerCase() === 'live'))
        || (activeFilter === 'Web' && text.includes('web'))
        || (activeFilter === 'macOS' && text.includes('macos'))
        || (activeFilter === 'AI-built' && project.aiAssisted);

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, projects, searchQuery]);

  return (
    <>
      <AnimatePresence>
        {showBento && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-bg/96 px-4 py-8 backdrop-blur-xl sm:px-6 sm:py-10"
          >
            <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6 pb-12">
              <div className="relative flex items-start justify-between gap-4 pr-16 sm:pr-20">
                <span className="pointer-events-none absolute -left-2 top-2 hidden h-2 w-2 rotate-45 rounded-[2px] bg-warm-accent/45 md:block" />
                <span className="pointer-events-none absolute left-[48%] top-8 hidden h-px w-14 rotate-[-10deg] bg-accent/25 md:block" />
                <div className="flex max-w-2xl flex-col gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-warm-accent">Project Archive</p>
                  <h2 className="text-4xl font-bold tracking-tight text-text sm:text-5xl">Projects</h2>
                  <p className="max-w-xl text-base font-medium leading-relaxed text-muted sm:text-lg">
                    Small builds, live pages, and the case notes behind each one.
                  </p>
                  <span className="w-fit rounded-full border border-border/50 bg-surface px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-accent">
                    {filteredProjects.length} / {projects.length} entries
                  </span>
                </div>
                <button
                  onClick={onCloseBento}
                  className="fixed right-4 top-4 z-[55] shrink-0 rounded-full border border-border/45 bg-surface/90 p-3 text-accent shadow-xl shadow-black/30 transition-[transform,background-color,border-color] duration-150 ease-out hover:bg-accent/15 active:scale-[0.96] sm:right-8 sm:top-8 sm:p-4"
                  aria-label="Close projects"
                >
                  <X size={28} />
                </button>
              </div>

              <section className="archive-corner-panel rounded-2xl border border-border/40 bg-surface/55 p-3 shadow-lg shadow-black/10">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8E927F]">Tool shelf / stack</p>
                    <p className="mt-1 text-xs font-semibold text-muted">The usual stack behind these case files.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {toolItems.map((tool) => (
                      <span
                        key={tool.label}
                        className="rounded-full border border-border/45 bg-bg/45 px-2.5 py-1 text-[11px] font-bold text-text"
                        title={tool.note}
                      >
                        {tool.label}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <div className="archive-corner-panel grid gap-2 rounded-2xl border border-border/45 bg-surface/70 p-2.5 shadow-xl shadow-black/10 md:grid-cols-[1fr_auto] md:items-center">
                <label className="relative block">
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    name="project-search"
                    aria-label="Search projects"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search projects, tech, notes…"
                    className="h-10 w-full rounded-xl border border-border/35 bg-bg/55 pl-11 pr-4 text-sm font-semibold text-text outline-none transition-[border-color,box-shadow,background-color] duration-150 ease-out placeholder:text-muted/65 focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
                  />
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide md:pb-0">
                  {filters.map((filter) => {
                    const isActive = activeFilter === filter;

                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                          isActive
                            ? 'border-accent bg-accent text-bg shadow-lg shadow-accent/10'
                            : 'border-border/45 bg-bg/45 text-muted hover:border-accent/40 hover:text-text'
                        }`}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onCardClick(project.id)}
                    aria-label={`Open case file for ${project.title}`}
                    className="archive-project-card group flex min-h-[330px] flex-col overflow-hidden rounded-2xl border border-border/55 bg-surface text-left shadow-xl shadow-black/20 transition-[transform,border-color,box-shadow,background-color] duration-200 ease-out hover:-translate-y-1 hover:border-accent/40 hover:bg-surface/95 hover:shadow-2xl hover:shadow-warm-accent/10 active:scale-[0.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <div className="project-screenshot-frame relative aspect-[16/9] w-full overflow-hidden bg-[#0E130D]">
                      <div className="project-fallback absolute inset-0 flex items-center justify-center p-6 text-center">
                        <div className="relative z-10">
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-warm-accent">Case {getCaseNumber(project)}</p>
                          <p className="mt-2 text-xl font-bold text-[#F3F4EA]">{project.title}</p>
                          <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[#B7BBA8]">{project.description}</p>
                        </div>
                      </div>
                      <img
                        src={project.image}
                        alt={project.title}
                        width={960}
                        height={540}
                        referrerPolicy="no-referrer"
                        onLoad={(event) => {
                          const fallback = event.currentTarget.previousElementSibling;
                          if (fallback instanceof HTMLElement) {
                            fallback.style.display = 'none';
                          }
                        }}
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                        className="relative z-[1] h-full w-full object-cover object-top transition-transform duration-300 ease-out group-hover:scale-[1.01]"
                      />
                      <div className="absolute inset-0 z-[2] bg-linear-to-b from-bg/5 via-bg/8 to-bg/46" />
                      <span className="absolute right-3 top-3 z-[3] rounded-md border border-accent/35 bg-bg/75 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent backdrop-blur-sm">
                        Live
                      </span>
                      <div className="absolute left-3 top-3 z-[3] flex items-center gap-2">
                        <span className="rounded-md bg-bg/75 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent backdrop-blur-sm">
                          Case {getCaseNumber(project)}
                        </span>
                        <span className="rounded-md bg-bg/75 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-accent backdrop-blur-sm">
                          {getProjectCategory(project)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-4 p-4.5 sm:p-5">
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-accent">{project.status}</p>
                        <h3 className="text-2xl font-bold leading-tight text-text">{project.title}</h3>
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{project.description}</p>
                      </div>
                      <div className="mt-auto flex flex-wrap gap-2">
                        {project.tech.slice(0, 3).map((tech) => (
                          <span key={tech} className="rounded-lg border border-border/35 bg-bg/55 px-2.5 py-1 text-[11px] font-semibold text-text">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {filteredProjects.length === 0 && (
                <div className="archive-corner-panel rounded-3xl border border-border/45 bg-surface p-8 text-center">
                  <p className="text-lg font-bold text-text">No entries matched this view.</p>
                  <p className="mt-2 text-sm font-medium text-muted">Clear the search or switch the archive filter back to All.</p>
                </div>
              )}
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
            className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto overscroll-contain bg-bg/82 p-4 backdrop-blur-xl sm:p-6"
            onClick={onCloseProject}
          >
            <motion.div
              key={selectedProject.id}
              initial={{ scale: 0.97, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.97, y: 12, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
              className="my-0 max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-3xl border border-border/60 bg-surface shadow-2xl shadow-black/40 sm:my-auto sm:max-h-[calc(100vh-3rem)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[16/8] min-h-[240px] overflow-hidden bg-[#0E130D] sm:min-h-[340px]">
                <div className="project-fallback absolute inset-0 flex items-center justify-center p-6 text-center">
                  <div className="relative z-10 max-w-lg">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-warm-accent">Case file / {selectedProjectNumber}</p>
                    <p className="mt-2 text-3xl font-bold text-[#F3F4EA]">{selectedProject.title}</p>
                    <p className="mt-3 text-sm font-semibold leading-6 text-[#B7BBA8]">{selectedProject.description}</p>
                  </div>
                </div>
                <img
                  src={selectedProject.image}
                  alt={selectedProject.title}
                  width={1280}
                  height={640}
                  referrerPolicy="no-referrer"
                  onLoad={(event) => {
                    const fallback = event.currentTarget.previousElementSibling;
                    if (fallback instanceof HTMLElement) {
                      fallback.style.display = 'none';
                    }
                  }}
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                  className="relative z-[1] h-full w-full object-cover object-top"
                />
                <div className="absolute inset-0 z-[2] bg-linear-to-b from-bg/8 via-transparent to-surface/70" />
                <div className="absolute bottom-4 left-4 z-[3] flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-accent/35 bg-bg/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent backdrop-blur-sm">
                    Case file / {selectedProjectNumber}
                  </span>
                  <span className="rounded-md border border-warm-accent/30 bg-bg/75 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-warm-accent backdrop-blur-sm">
                    {getProjectCategory(selectedProject)}
                  </span>
                </div>
                <button
                  onClick={onCloseProject}
                  className="absolute right-4 top-4 z-[3] rounded-full bg-surface/85 p-2 text-text shadow-lg shadow-black/25 backdrop-blur-md transition-[transform,background-color] duration-150 ease-out hover:bg-surface active:scale-[0.96]"
                  aria-label="Close project"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-6 p-5 sm:p-8">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border/45 bg-bg/45 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                      CASE FILE / {selectedProjectNumber}
                    </span>
                    {selectedProject.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-3xl font-bold text-text sm:text-4xl">{selectedProject.title}</h3>
                </div>
                <p className="text-base leading-relaxed text-muted sm:text-lg">{selectedProject.longDescription}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'What it is', body: selectedProject.what },
                    { label: 'Why it exists', body: selectedProject.why },
                    { label: 'What changed', body: selectedProject.learned ?? 'The idea got cleaner once the useful part was separated from the noise.' },
                    { label: 'Built with', body: selectedProject.tech.join(', ') },
                    { label: 'Status', body: selectedProject.status },
                  ].map(({ label, body }) => (
                    <div key={label} className="rounded-2xl border border-border/45 bg-bg/70 p-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-accent">{label}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-text">{body}</p>
                    </div>
                  ))}
                  <a
                    href={selectedProject.link}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl border border-border/45 bg-bg/70 p-4 transition-[transform,border-color,background-color] duration-150 ease-out hover:-translate-y-0.5 hover:border-accent/45 hover:bg-bg/80 active:scale-[0.99] sm:col-span-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-accent">Live link</h4>
                        <p className="mt-2 text-sm leading-relaxed text-text">Open the deployed build in a new tab.</p>
                      </div>
                      <ExternalLink
                        size={18}
                        className="mt-1 shrink-0 text-accent transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </div>
                  </a>
                </div>

                <div className="rounded-2xl border border-warm-accent/25 bg-warm-accent/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-warm-accent">Process note</p>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-muted">
                    {selectedProject.aiAssisted
                      ? 'AI helped with drafts and speed. The final shape still came down to spacing, copy, motion, and taste.'
                      : 'Built as a practical experiment, then cleaned up until the idea was clear.'}
                  </p>
                </div>

                <LinkPreview
                  url={selectedProject.link}
                  imageSrc={selectedProject.image}
                  isStatic
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-center font-bold text-bg shadow-lg shadow-accent/15 transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-accent-dark active:scale-[0.98]"
                >
                  View Live Project <ExternalLink size={18} />
                </LinkPreview>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
