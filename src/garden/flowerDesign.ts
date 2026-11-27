export type FlowerShape = 'round' | 'star' | 'cup';
export type FlowerDesign = { shape: FlowerShape; petals: number; size: number; stemHeight: number; leafPairs: number; center: string };

export const flowerDesignLimits = {
  petals: { min: 4, max: 12, step: 1 },
  size: { min: .75, max: 1.2, step: .05 },
  stemHeight: { min: .45, max: 1.05, step: .05 },
  leafPairs: { min: 0, max: 3, step: 1 },
};

export function defaultFlowerDesign(): FlowerDesign {
  return { shape: 'round', petals: 8, size: 1, stemHeight: .85, leafPairs: 2, center: '#d5b46c' };
}

export function isFlowerDesign(value: unknown): value is FlowerDesign {
  if (!value || typeof value !== 'object') return false;
  const design = value as FlowerDesign;
  return ['round', 'star', 'cup'].includes(design.shape)
    && Object.entries(flowerDesignLimits).every(([key, limits]) => {
      const number = design[key as keyof typeof flowerDesignLimits];
      return Number.isFinite(number) && number >= limits.min && number <= limits.max;
    })
    && Number.isInteger(design.petals) && Number.isInteger(design.leafPairs)
    && typeof design.center === 'string' && /^#[0-9a-f]{6}$/i.test(design.center);
}

export function copyFlowerDesign(design: FlowerDesign): FlowerDesign {
  return { shape: design.shape, petals: design.petals, size: design.size, stemHeight: design.stemHeight, leafPairs: design.leafPairs, center: design.center };
}
