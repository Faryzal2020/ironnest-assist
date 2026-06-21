export interface FiringSolution {
  charge: number;
  elevation: number;
}

/**
 * The game uses a custom linear formula:
 * Elevation = (12 * Distance) / Charge
 * Valid elevations are 0 to 60 degrees.
 */
export const solveElevation = (R: number, charge: number): number | null => {
  const elevation = (12 * R) / charge;
  if (elevation >= 0 && elevation <= 60) {
    return elevation;
  }
  return null;
};

/**
 * Find all valid firing solutions (charge and elevations) for a given distance.
 * Sorted by preferred (lowest valid charge first).
 */
export const findFiringSolutions = (distance: number): FiringSolution[] => {
  const solutions: FiringSolution[] = [];

  for (let c = 1; c <= 6; c++) {
    const elevation = solveElevation(distance, c);
    if (elevation !== null) {
      solutions.push({
        charge: c,
        elevation: elevation,
      });
    }
  }

  return solutions;
};
