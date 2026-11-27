import { PenLine, RotateCcw } from 'lucide-react';
import { defaultFlowerDesign, flowerDesignLimits, type FlowerDesign, type FlowerShape } from '../garden/flowerDesign';

const shapes: { id: FlowerShape; label: string }[] = [{ id: 'round', label: 'Round' }, { id: 'star', label: 'Star' }, { id: 'cup', label: 'Cup' }];
const controls = [
  { id: 'petals', label: 'Petal count' },
  { id: 'size', label: 'Bloom size' },
  { id: 'stemHeight', label: 'Stem height' },
  { id: 'leafPairs', label: 'Leaf pairs' },
] as const;

export function FlowerDesigner({ design, onChange }: { design: FlowerDesign; onChange(design: FlowerDesign): void }) {
  function valueLabel(id: typeof controls[number]['id']) {
    if (id === 'size') return `${Math.round(design.size * 100)}%`;
    if (id === 'stemHeight') return design.stemHeight < .65 ? 'Short' : design.stemHeight > .9 ? 'Tall' : 'Medium';
    return String(design[id]);
  }
  return <div className="flower-designer" role="group" aria-label="Design your own flower">
    <div className="flower-designer-heading"><span><PenLine size={14} />Design your own flower</span><button type="button" aria-label="Reset flower design" onClick={() => onChange(defaultFlowerDesign())}><RotateCcw size={12} />Reset</button></div>
    <div className="flower-shapes" role="group" aria-label="Petal shape">{shapes.map(shape => <button type="button" key={shape.id} aria-label={`${shape.label} petals`} aria-pressed={design.shape === shape.id} onClick={() => onChange({ ...design, shape: shape.id })}>{shape.label}</button>)}</div>
    <div className="flower-ranges">{controls.map(control => <div className="flower-range" key={control.id}>
      <label htmlFor={`flower-${control.id}`}><span>{control.label}</span><output aria-hidden="true">{valueLabel(control.id)}</output></label>
      <input id={`flower-${control.id}`} type="range" aria-label={control.label} aria-valuetext={valueLabel(control.id)} {...flowerDesignLimits[control.id]} value={design[control.id]} onChange={event => onChange({ ...design, [control.id]: Number(event.target.value) })} />
    </div>)}</div>
    <label className="flower-center-colour"><input type="color" value={design.center} onChange={event => onChange({ ...design, center: event.target.value })} />Centre colour</label>
    <p className="flower-designer-hint">Your shape grows in the preview. Choose your petal and leaf colours below.</p>
  </div>;
}
