export const gardenMoods = ['breeze', 'rain', 'fireflies'] as const;
export type GardenMood = typeof gardenMoods[number];

export function readGardenMood(): GardenMood {
  try {
    const stored = localStorage.getItem('garden:mood');
    return gardenMoods.find(mood => mood === stored) ?? 'breeze';
  } catch { return 'breeze'; }
}

export function saveGardenMood(mood: GardenMood) {
  try { localStorage.setItem('garden:mood', mood); } catch { /* Still works without storage. */ }
}
