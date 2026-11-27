import { useEffect, useRef, useState } from 'react';
import { Archive, ChevronDown } from 'lucide-react';
import { sectionIds, type SectionId } from '../garden/journey';
import { sectionContent } from '../content/profile';
import type { NavigateHandler } from '../hooks/useJourney';
import { Sprout } from './Sprout';
import { GardenAccountButton } from './GardenAccount';

type Props = { active: SectionId; onNavigate: NavigateHandler; onArchive: () => void };
const primarySections = ['about', 'projects', 'memories'] as const;

export function Header({ active, onNavigate, onArchive }: Props) {
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus(); }
    }
    function outside(event: PointerEvent) { if (!header.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', outside); };
  }, [open]);

  return <header className="site-header" ref={header} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <a className="brand" href="#opening" onClick={event => { setOpen(false); onNavigate(event, 'opening'); }} aria-label="About me, return to the entrance"><Sprout /><span>about me</span></a>
    <div className="header-actions">
      <nav className="primary-nav" aria-label="Main navigation">
        {primarySections.map(id => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={event => {
          setOpen(false); onNavigate(event, id);
        }}>{sectionContent[id].label}</a>)}
      </nav>
      <div className="chapter-menu">
        <button className="menu-toggle" ref={menuButton} type="button" aria-label={open ? 'Close site menu' : 'Open site menu'} aria-expanded={open} aria-controls="chapter-navigation" onClick={() => setOpen(value => !value)}><span>Explore</span><ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" /></button>
        <nav className={`main-nav ${open ? 'is-open' : ''}`} id="chapter-navigation" aria-label="Explore" hidden={!open}>
          {sectionIds.map(id => <a key={id} href={`#${id}`} className={active === id ? 'active' : ''} aria-current={active === id ? 'location' : undefined} onClick={event => {
            menuButton.current?.focus({ preventScroll: true });
            setOpen(false); onNavigate(event, id);
          }}>{sectionContent[id].label}</a>)}
          <button className="chapter-menu-archive" type="button" onClick={() => {
            menuButton.current?.focus({ preventScroll: true }); setOpen(false); onArchive();
          }}><Archive size={16} strokeWidth={1.5} aria-hidden="true" />The archive</button>
        </nav>
      </div>
      <button className="garden-archive-link" type="button" aria-label="The archive" onClick={() => {
        if (open) menuButton.current?.focus({ preventScroll: true });
        setOpen(false); onArchive();
      }}><Archive size={17} strokeWidth={1.5} aria-hidden="true" /><span>The archive</span></button>
      <GardenAccountButton />
    </div>
  </header>;
}
