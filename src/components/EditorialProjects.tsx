import { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronDown, Search } from 'lucide-react';
import type { Project, ToolItem } from '../data/site';
import { EditorialDialog } from './EditorialDialog';

type Props = {
  projects: Project[];
  toolItems: ToolItem[];
  showBento: boolean;
  expandedProjectId: string | null;
  onCloseBento: () => void;
  onCardClick: (id: string) => void;
  onCloseProject: () => void;
};

const filters = ['All', 'Featured', 'Live', 'Web', 'macOS', 'AI-assisted'] as const;

export function EditorialProjects({ projects, toolItems, showBento, expandedProjectId, onCloseBento, onCardClick, onCloseProject }: Props) {
  const [filter, setFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const selected = projects.find(project => project.id === expandedProjectId);
  const filtered = useMemo(() => projects.filter(project => {
    const text = [project.title, project.description, project.longDescription, project.what, project.why, project.learned, project.status, ...project.tech, ...project.tags].join(' ').toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (
      filter === 'All' || (filter === 'Featured' && project.featured) ||
      (filter === 'Live' && project.tags.some(tag => tag.toLowerCase() === 'live')) ||
      (filter === 'Web' && text.includes('web')) || (filter === 'macOS' && text.includes('macos')) ||
      (filter === 'AI-assisted' && project.aiAssisted)
    );
  }), [filter, query, projects]);

  return <>
    <EditorialDialog open={showBento} onClose={onCloseBento} title="project archive" className="project-archive-dialog">
      <h2>All projects</h2>
      <p className="archive-intro">School tools, Mac apps and a few experiments.</p>
      <label className="project-search"><Search size={19} aria-hidden="true" /><span className="sr-only">Search projects</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects" /></label>
      <div className="archive-filter-row"><div className="archive-filters" aria-label="Filter projects">{filters.map(item => <button key={item} onClick={() => setFilter(item)} aria-pressed={filter === item}>{item}</button>)}</div><span aria-live="polite">{filtered.length} {filtered.length === 1 ? 'project' : 'projects'}</span></div>
      <div className="archive-project-list">{filtered.map(project => <button type="button" key={project.id} onClick={() => onCardClick(project.id)} className="archive-project-row"><span><strong>{project.title}</strong><span className="row-description">{project.description}</span><span className="row-tech">{project.tech.slice(0, 3).join(' · ')}</span></span><ArrowRight size={20} aria-hidden="true" /></button>)}</div>
      {filtered.length === 0 && <div className="empty-projects"><h3>No projects found</h3><button className="editorial-button secondary" onClick={() => { setQuery(''); setFilter('All'); }}>Clear filters</button></div>}
      <details className="project-tools">
        <summary>Tools I use<ChevronDown size={18} /></summary>
        <div className="tool-notes">{toolItems.map(tool => <details key={tool.label}><summary>{tool.label}<ChevronDown size={14} /></summary><p>{tool.note}</p></details>)}</div>
      </details>
    </EditorialDialog>
    <EditorialDialog open={Boolean(selected)} onClose={onCloseProject} title={selected ? `${selected.title} project` : 'project'} className="project-detail-dialog">
      {selected && <>
        <p className="small-label accent">{selected.tags.join(' / ')}</p><h2>{selected.title}</h2><p className="detail-intro">{selected.longDescription}</p>
        {selected.image && <img className="detail-preview" src={selected.image} alt={`${selected.title} website preview`} width="1280" height="720" onError={event => { event.currentTarget.hidden = true; }} />}
        <div className="detail-notes"><section><h3>Why I built it</h3><p>{selected.why}</p></section><section><h3>What it does</h3><p>{selected.what}</p></section>{selected.learned && <section><h3>What I learned</h3><p>{selected.learned}</p></section>}</div>
        {selected.aiAssisted && <p className="project-process">I used AI to help with drafts.</p>}
        <div className="detail-footer"><div><p className="detail-status">{selected.status}</p><div className="project-stack">{selected.tech.map(tech => <span key={tech}>{tech}</span>)}</div></div>{selected.link ? <a href={selected.link} target="_blank" rel="noreferrer" className="editorial-button primary">Visit project<ArrowUpRight size={20} /></a> : <p className="project-unpublished">This is a local build. There isn’t a public site to open yet.</p>}</div>
      </>}
    </EditorialDialog>
  </>;
}
