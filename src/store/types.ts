import type { Point } from '../utils/coordinates';

export type AssetType = 'Gun' | 'Spotter' | 'RefPoint' | 'Target' | 'StarShell';

export type ConstraintType = 
  | 'Direct' 
  | 'Bearing' 
  | 'Distance' 
  | 'BearingDistance';

export interface Constraint {
  id: string;
  type: ConstraintType;
  referenceAssetId?: string;
  gridStr?: string;
  bearing?: number;
  distance?: number;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  constraints: Constraint[];
  // Derived fields:
  resolvedPoint?: Point | null;
  ambiguousPoints?: Point[];
  selectedAmbiguousIndex?: number;
}
