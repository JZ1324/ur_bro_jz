import { useCallback, useLayoutEffect, useState, type MouseEvent, type RefObject } from 'react';
import { sectionFromHash, sectionIds, type SectionId } from '../garden/journey';

type SceneSection = 'opening' | 'projects';
export type NavigateHandler = (event: MouseEvent<HTMLAnchorElement>, section: SectionId) => void;

export function useJourney(root: RefObject<HTMLElement | null>, suspended = false) {
  const [active, setActive] = useState<SectionId>(() => sectionFromHash(window.location.hash));
  const [sceneSection, setSceneSection] = useState<SceneSection>(
    () => window.location.hash === '#projects' ? 'projects' : 'opening',
  );
  const [sceneVisible, setSceneVisible] = useState(false);

  const navigate = useCallback((event: MouseEvent<HTMLAnchorElement>, id: SectionId, skip: boolean) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const section = root.current?.querySelector<HTMLElement>(`[data-journey-section="${id}"]`);
    if (!section) return;
    event.preventDefault();
    const hash = `#${id}`;
    if (window.location.hash !== hash) history.pushState(null, '', hash);
    setActive(id);
    section.querySelector<HTMLElement>('h1, h2')?.focus({ preventScroll: true });
    section.scrollIntoView({
      behavior: skip || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }, [root]);

  useLayoutEffect(() => {
    const html = document.documentElement;
    if (html.hasAttribute('data-restore-scroll')) {
      const position = Number(html.dataset.restoreScroll);
      const host = root.current;
      let disposed = false;
      let fontsReady = false;

      function reveal() {
        html.classList.add('is-finishing-scroll');
        window.scrollTo({ top: position, behavior: 'instant' });
        html.classList.remove('is-restoring-scroll');
        requestAnimationFrame(() => requestAnimationFrame(() => {
          html.classList.remove('is-finishing-scroll');
          history.scrollRestoration = 'auto';
        }));
        observer.disconnect();
        clearTimeout(timeout);
      }

      function restore() {
        const maxScroll = html.scrollHeight - innerHeight;
        if (fontsReady && maxScroll >= position - 1) reveal();
      }

      const observer = new ResizeObserver(restore);
      if (host) observer.observe(host);
      const timeout = window.setTimeout(reveal, 1200);
      void document.fonts.ready.then(() => {
        if (disposed) return;
        fontsReady = true;
        restore();
      });
      return () => {
        disposed = true;
        observer.disconnect();
        clearTimeout(timeout);
      };
    }

    const id = window.location.hash.slice(1);
    if (!id) return;
    const sections = root.current?.querySelectorAll<HTMLElement>('[id]');
    const target = Array.from(sections ?? []).find(element => element.id === id);
    target?.scrollIntoView({ behavior: 'instant' });
  }, [root]);

  useLayoutEffect(() => {
    const host = root.current;
    if (!host || suspended) return;
    const sections = sectionIds.map(id => host.querySelector<HTMLElement>(`[data-journey-section="${id}"]`)!);
    const opening = sections[0];
    const projects = sections[sectionIds.indexOf('projects')];
    let frame = 0;
    const update = () => {
      frame = 0;
      const bounds = sections.map(section => section.getBoundingClientRect());
      const line = innerHeight * .32;
      // School and Music can share a row. Keep the current link selected when
      // both are visible at the same scroll position.
      setActive(current => {
        let index = 0;
        for (let i = 1; i < bounds.length; i++) {
          if (bounds[i].top <= line && bounds[i].top > bounds[index].top) index = i;
        }
        const currentIndex = sectionIds.indexOf(current);
        return bounds[currentIndex].top === bounds[index].top ? current : sectionIds[index];
      });
      const hero = opening.getBoundingClientRect();
      const board = projects.getBoundingClientRect();
      const openingVisible = hero.top < innerHeight && hero.bottom > 76;
      const projectsVisible = board.top < innerHeight && board.bottom > 76;
      if (openingVisible) setSceneSection('opening');
      else if (projectsVisible) setSceneSection('projects');
      setSceneVisible(openingVisible || projectsVisible);
    };

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    function syncHash() {
      const hash = window.location.hash;
      if (!hash || hash === '#shared-garden' || hash === '#ocean') return;
      const id = sectionFromHash(hash);
      if (id === 'opening' && hash !== '#opening') return;
      setActive(id);
      if (hash !== `#${id}`) sections[sectionIds.indexOf(id)].scrollIntoView({ behavior: 'instant' });
      schedule();
    }

    syncHash();
    update();
    const observer = new ResizeObserver(schedule);
    sections.forEach(section => observer.observe(section));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', syncHash);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', syncHash);
    };
  }, [root, suspended]);

  const onNavigate: NavigateHandler = useCallback((event, id) => navigate(event, id, false), [navigate]);
  const onSkip: NavigateHandler = useCallback((event, id) => navigate(event, id, true), [navigate]);

  return { active, sceneSection, sceneVisible, onNavigate, onSkip };
}
