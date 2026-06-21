import type { Asset } from './types';
import { parseCoordinate } from '../utils/coordinates';
import type { Point } from '../utils/coordinates';
import { polarOffset, intersectLines, intersectLineCircle, intersectCircles } from '../utils/geometry';

function extractResolvedPoint(assetId: string, assets: Asset[]): Point | null {
  const asset = assets.find(a => a.id === assetId);
  return asset?.resolvedPoint || null;
}

export function resolveAssets(assets: Asset[]): Asset[] {
  // Create a deep copy to avoid mutating state directly during calculation
  let newAssets: Asset[] = JSON.parse(JSON.stringify(assets));

  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 50; // Prevent infinite loops

  // Clear existing resolved state
  newAssets.forEach(a => {
    a.resolvedPoint = null;
    a.ambiguousPoints = undefined;
  });

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;

    for (const asset of newAssets) {
      if (asset.resolvedPoint) continue; // already resolved

      const constraints = asset.constraints;
      if (constraints.length === 0) continue;

      // Handle single Direct constraint
      if (constraints.length === 1 && constraints[0].type === 'Direct') {
        const pt = parseCoordinate(constraints[0].gridStr || '');
        if (pt) {
          asset.resolvedPoint = pt;
          changed = true;
        }
        continue;
      }

      // Handle BearingDistance (Polar Offset)
      if (constraints.length === 1 && constraints[0].type === 'BearingDistance') {
        const c = constraints[0];
        if (c.referenceAssetId && c.bearing !== undefined && c.distance !== undefined) {
          const refPt = extractResolvedPoint(c.referenceAssetId, newAssets);
          if (refPt) {
            asset.resolvedPoint = polarOffset(refPt, c.distance, c.bearing);
            changed = true;
          }
        }
        continue;
      }

      // Handle 2 Constraints
      if (constraints.length >= 2) {
        const c1 = constraints[0];
        const c2 = constraints[1];

        const refPt1 = c1.referenceAssetId ? extractResolvedPoint(c1.referenceAssetId, newAssets) : null;
        const refPt2 = c2.referenceAssetId ? extractResolvedPoint(c2.referenceAssetId, newAssets) : null;

        if (!refPt1 || !refPt2) continue; // Waiting for dependencies to resolve

        let pts: Point[] = [];

        // Two Bearings -> Line-Line
        if (c1.type === 'Bearing' && c2.type === 'Bearing' && c1.bearing !== undefined && c2.bearing !== undefined) {
          const pt = intersectLines(refPt1, c1.bearing, refPt2, c2.bearing);
          if (pt) pts = [pt];
        } 
        // Bearing and Distance -> Line-Circle
        else if (c1.type === 'Bearing' && c2.type === 'Distance' && c1.bearing !== undefined && c2.distance !== undefined) {
          pts = intersectLineCircle(refPt1, c1.bearing, refPt2, c2.distance);
        } else if (c1.type === 'Distance' && c2.type === 'Bearing' && c1.distance !== undefined && c2.bearing !== undefined) {
          pts = intersectLineCircle(refPt2, c2.bearing, refPt1, c1.distance);
        }
        // Two Distances -> Circle-Circle
        else if (c1.type === 'Distance' && c2.type === 'Distance' && c1.distance !== undefined && c2.distance !== undefined) {
          pts = intersectCircles(refPt1, c1.distance, refPt2, c2.distance);
        }

        if (pts.length === 1) {
          asset.resolvedPoint = pts[0];
          changed = true;
        } else if (pts.length > 1) {
          asset.ambiguousPoints = pts;
          // Use selected ambiguous index if available, otherwise it remains unresolved (needs player pick)
          const idx = asset.selectedAmbiguousIndex || 0;
          if (idx >= 0 && idx < pts.length) {
            asset.resolvedPoint = pts[idx];
            changed = true;
          }
        }
      }
    }
  }

  return newAssets;
}
