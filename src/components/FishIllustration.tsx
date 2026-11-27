import { useId, useMemo } from 'react';
import type { Fish } from '../ocean/catalog';
import { fishVoxels, rainbowColors } from '../ocean/voxels';

// The same little blocks appear in the field guide and the swimming 3D scene.
export function FishIllustration({ fish, className = '' }: { fish: Fish; className?: string }) {
  const auraId = `fish-aura-${useId().replace(/:/g, '')}`;
  const { shapes, leftEdge, rightEdge } = useMemo(() => {
    const parts = fishVoxels(fish).sort((a, b) => a.z - b.z || a.x - b.x);
    const coordinates = parts.flatMap(part => [-1, 1].flatMap(dx => [-1, 1].flatMap(dy => [-1, 1].map(dz => {
      const x = part.x + dx * part.w / 2, y = part.y + dy * part.h / 2, z = part.z + dz * part.d / 2;
      return [x * 53 - z * 24, -y * 53 - x * 8 - z * 14];
    }))));
    const minX = Math.min(...coordinates.map(point => point[0])), maxX = Math.max(...coordinates.map(point => point[0]));
    const minY = Math.min(...coordinates.map(point => point[1])), maxY = Math.max(...coordinates.map(point => point[1]));
    const scale = Math.min(176 / (maxX - minX), 94 / (maxY - minY));
    const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
    const shapes = parts.map((voxel, index) => {
      const { x, y, z, w, h, d, color } = voxel;
      const project = (px: number, py: number, pz: number) => `${100 + (px * 53 - pz * 24 - centerX) * scale},${60 + (-py * 53 - px * 8 - pz * 14 - centerY) * scale}`;
      const left = x - w / 2, right = x + w / 2, top = y + h / 2, bottom = y - h / 2, front = z + d / 2, back = z - d / 2;
      return <g key={index} fill={color}>
        <polygon points={[project(left, top, back), project(right, top, back), project(right, top, front), project(left, top, front)].join(' ')} />
        <polygon points={[project(left, top, front), project(right, top, front), project(right, bottom, front), project(left, bottom, front)].join(' ')} />
        <polygon points={[project(right, top, back), project(right, bottom, back), project(right, bottom, front), project(right, top, front)].join(' ')} />
        <polygon fill="#fff" opacity=".12" points={[project(left, top, back), project(right, top, back), project(right, top, front), project(left, top, front)].join(' ')} />
        <polygon fill="#071f35" opacity=".16" points={[project(right, top, back), project(right, bottom, back), project(right, bottom, front), project(right, top, front)].join(' ')} />
      </g>;
    });
    return { shapes, leftEdge: 100 - (maxX - minX) * scale / 2, rightEdge: 100 + (maxX - minX) * scale / 2 };
  }, [fish]);
  return <svg className={`fish-illustration ${className}`} data-finish={fish.finish} viewBox="0 0 200 120" fill="none" aria-hidden="true">
    {fish.finish === 'rainbow-glow' && <>
      <defs>
        <linearGradient id={`${auraId}-colors`} gradientUnits="userSpaceOnUse" x1={leftEdge} y1="60" x2={rightEdge} y2="60">{rainbowColors.map((color, index) => <stop key={color} offset={`${index / (rainbowColors.length - 1) * 100}%`} stopColor={color} />)}</linearGradient>
        <mask id={`${auraId}-shape`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="120" style={{ maskType: 'alpha' }}>{shapes}</mask>
        <filter id={`${auraId}-glow`} x="-40%" y="-70%" width="180%" height="240%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="7" result="softGlow" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.7" result="edgeGlow" />
          <feMerge><feMergeNode in="softGlow" /><feMergeNode in="edgeGlow" /></feMerge>
        </filter>
      </defs>
      <g className="fish-rainbow-aura" filter={`url(#${auraId}-glow)`}><rect width="200" height="120" fill={`url(#${auraId}-colors)`} mask={`url(#${auraId}-shape)`} /></g>
    </>}
    <g className="fish-body">{shapes}</g>
  </svg>;
}
