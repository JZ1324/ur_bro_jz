import { useEffect, useRef, useState } from 'react';
import { RotateCcw, RotateCw } from 'lucide-react';
import type { createPlantPreview } from '../garden/createPlantPreview';
import { plantInfo, type PlantColors, type PlantKind } from '../garden/plantings';
import type { FlowerDesign } from '../garden/flowerDesign';
import { PlantIllustration } from './PlantIllustration';

export function PlantPreview({ kind, colors, design }: { kind: PlantKind; colors: PlantColors; design?: FlowerDesign }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<ReturnType<typeof createPlantPreview> | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const currentPlant = useRef({ kind, colors, design });
  currentPlant.current = { kind, colors, design };
  useEffect(() => {
    let disposed = false;
    setState('loading');
    void import('../garden/createPlantPreview').then(({ createPlantPreview }) => {
      if (disposed || !host.current) return;
      api.current = createPlantPreview(host.current, () => { if (!disposed) setState('error'); });
      api.current.setPlant(currentPlant.current.kind, currentPlant.current.colors, currentPlant.current.design);
      setState('ready');
    }).catch(() => { if (!disposed) setState('error'); });
    return () => { disposed = true; api.current?.dispose(); api.current = null; };
  }, [attempt]);
  useEffect(() => { api.current?.setPlant(kind, colors, design); }, [kind, colors.main, colors.leaves, design, attempt]);
  return <div className="plant-preview">
    <div className="plant-preview-canvas" ref={host} role="img" aria-hidden={state !== 'ready' || undefined} aria-label={`3D voxel ${plantInfo(kind).name.toLowerCase()} preview`} />
    {state !== 'ready' ? <div className="plant-preview-fallback"><PlantIllustration kind={kind} colors={colors} design={design} />{state === 'error' ? <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry 3D preview</button> : <p role="status">Growing your 3D preview…</p>}</div>
      : <div className="plant-preview-turn"><button type="button" aria-label="Turn plant left" onClick={() => api.current?.turn(-1)}><RotateCcw size={14} /></button><span>Drag to turn</span><button type="button" aria-label="Turn plant right" onClick={() => api.current?.turn(1)}><RotateCw size={14} /></button></div>}
  </div>;
}
