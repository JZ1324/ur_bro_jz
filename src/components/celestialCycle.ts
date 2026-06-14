export type CelestialTheme = 'day' | 'evening';

export type CelestialCycleState = {
  theme: CelestialTheme;
  cycle: number;
};

export function advanceCelestialCycle(
  current: CelestialCycleState,
  nextTheme: CelestialTheme,
): CelestialCycleState {
  if (current.theme === nextTheme) return current;
  return { theme: nextTheme, cycle: current.cycle + 1 };
}
