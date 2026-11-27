import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';

export class FeatureBoundary extends Component<{ children: ReactNode; onClose?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div role="alert" className="feature-recovery">
      <p>This part of the garden couldn’t load. Please reload to try again.</p>
      <button onClick={() => window.location.reload()}>Reload</button>
      {this.props.onClose && <button onClick={this.props.onClose}>Close</button>}
    </div>;
  }
}

// Keep a stable destination for deep links before downloading the optional UI.
export function DeferredFeature({ anchor, children }: { anchor: string; children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(() => window.location.hash === `#${anchor}`
    || (anchor === 'ocean' && document.documentElement.hasAttribute('data-restore-ocean')));
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setReady(true); observer.disconnect(); }
    }, { rootMargin: '600px' });
    observer.observe(host.current!);
    const navigate = () => { if (window.location.hash === `#${anchor}`) setReady(true); };
    window.addEventListener('hashchange', navigate);
    return () => { observer.disconnect(); window.removeEventListener('hashchange', navigate); };
  }, [anchor]);
  return <div ref={host} id={anchor} className="deferred-feature">
    {ready ? <FeatureBoundary><Suspense fallback={<p role="status">Loading the ocean…</p>}>{children}</Suspense></FeatureBoundary> : <p>There’s an ocean to explore below.</p>}
  </div>;
}
