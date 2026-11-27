import { useEffect, type RefObject } from 'react';

export function useScrollReveals(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const host = root.current;
    if (!host || !('IntersectionObserver' in window)) return;

    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const targets = host.querySelectorAll<HTMLElement>('[data-scroll-reveal]');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (!motion.matches && !entry.target.contains(document.activeElement)) {
          entry.target.classList.add('is-scroll-revealing');
        }
      }
    });

    for (const target of targets) {
      // Deep links and restored scroll positions render their initial view normally.
      if (target.getBoundingClientRect().top >= innerHeight) observer.observe(target);
    }
    return () => observer.disconnect();
  }, [root]);
}
