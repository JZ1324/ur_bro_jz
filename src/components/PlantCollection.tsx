import { ChevronDown, PenLine } from 'lucide-react';
import { plantInfo, type GardenPlant } from '../garden/plantings';
import { PlantIllustration } from './PlantIllustration';
import './planting.css';

export function PlantCollection({ plants, onEdit }: { plants: GardenPlant[]; onEdit(plant: GardenPlant): void }) {
  if (!plants.length) return null;
  return <details className="plant-collection"><summary><span>Your plantings <small>{plants.length}</small></span><ChevronDown size={15} strokeWidth={1.3} /></summary>
    <p className="plant-collection-hint">Choose a plant to read its note or edit it. Older saved plants stay private until you share them.</p>
    <div className="plant-collection-list">{[...plants].reverse().map(plant => <button type="button" key={plant.id} onClick={() => onEdit(plant)} aria-label={`Edit ${plantInfo(plant.kind).name.toLowerCase()}${plant.author ? ` from ${plant.author}` : ''}`}>
      <PlantIllustration kind={plant.kind} colors={plant.colors} design={plant.design} /><span><strong>{plantInfo(plant.kind).name}{plant.author && <small> · {plant.author}</small>}</strong>{plant.note ? <span className="plant-saved-note">{plant.note}</span> : <span className="plant-no-note">No note added.</span>}{!plant.shared && <span className="plant-no-note">Private · not shared yet</span>}</span><PenLine size={13} strokeWidth={1.3} />
    </button>)}</div>
  </details>;
}
