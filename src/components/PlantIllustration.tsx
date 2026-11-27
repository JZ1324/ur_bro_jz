import { memo } from 'react';
import { plantVoxels } from '../garden/plantModels';
import type { PlantColors, PlantKind } from '../garden/plantings';
import type { FlowerDesign } from '../garden/flowerDesign';

// Small catalogue thumbnails are projections of the actual 3D voxel definitions.
export const PlantIllustration = memo(function PlantIllustration({ kind, colors, design }: { kind: PlantKind; colors: PlantColors; design?: FlowerDesign }) {
  const project = (x: number, y: number, z: number) => `${50 + (x - z) * 37},${83 - y * 47 + (x + z) * 15}`;
  const voxels = plantVoxels(kind, colors, design).sort((a, b) => a.x + a.z - a.y * .2 - (b.x + b.z - b.y * .2));
  return <svg className="plant-illustration" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <ellipse cx="50" cy="86" rx="24" ry="7" fill="#7e8b5815" />
    {voxels.map((v, i) => {
      const x = v.x - v.w / 2, y = v.y - v.h / 2, z = v.z - v.d / 2;
      return <g key={i}>
        <polygon points={[project(x, y, z + v.d), project(x + v.w, y, z + v.d), project(x + v.w, y + v.h, z + v.d), project(x, y + v.h, z + v.d)].join(' ')} fill={v.color} />
        <polygon points={[project(x + v.w, y, z), project(x + v.w, y, z + v.d), project(x + v.w, y + v.h, z + v.d), project(x + v.w, y + v.h, z)].join(' ')} fill={`color-mix(in srgb, ${v.color} 78%, #394631)`} />
        <polygon points={[project(x, y + v.h, z), project(x + v.w, y + v.h, z), project(x + v.w, y + v.h, z + v.d), project(x, y + v.h, z + v.d)].join(' ')} fill={`color-mix(in srgb, ${v.color} 88%, white)`} />
      </g>;
    })}
  </svg>;
});
