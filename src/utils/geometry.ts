import type { Point } from './coordinates';

export const toRadians = (deg: number) => deg * (Math.PI / 180);
export const toDegrees = (rad: number) => rad * (180 / Math.PI);

/**
 * Compass bearing to Cartesian angle (radians).
 * Compass: 0 = +Y, 90 = +X, 180 = -Y, 270 = -X
 * Cartesian: 0 = +X, PI/2 = +Y, PI = -X, 3PI/2 = -Y
 */
export const compassToCartesian = (bearing: number): number => {
  return toRadians((90 - bearing + 360) % 360);
};

export const cartesianToCompass = (rad: number): number => {
  let deg = toDegrees(rad);
  let bearing = (90 - deg) % 360;
  if (bearing < 0) bearing += 360;
  return bearing;
};

export const distanceBetween = (p1: Point, p2: Point) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const bearingBetween = (from: Point, to: Point) => {
  const rad = Math.atan2(to.y - from.y, to.x - from.x);
  return cartesianToCompass(rad);
};

/**
 * Get a point offset from origin by distance and compass bearing.
 */
export const polarOffset = (origin: Point, distance: number, bearingDeg: number): Point => {
  const rad = compassToCartesian(bearingDeg);
  return {
    x: origin.x + distance * Math.cos(rad),
    y: origin.y + distance * Math.sin(rad),
  };
};

/**
 * Line-Line intersection
 * Line defined by origin and compass bearing
 */
export const intersectLines = (p1: Point, b1: number, p2: Point, b2: number): Point | null => {
  const rad1 = compassToCartesian(b1);
  const rad2 = compassToCartesian(b2);
  
  const d1x = Math.cos(rad1);
  const d1y = Math.sin(rad1);
  const d2x = Math.cos(rad2);
  const d2y = Math.sin(rad2);

  const det = d1x * d2y - d1y * d2x;
  if (Math.abs(det) < 1e-6) return null; // parallel

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  const t1 = (dx * d2y - dy * d2x) / det;
  // We return the actual intersection point
  return {
    x: p1.x + t1 * d1x,
    y: p1.y + t1 * d1y
  };
};

/**
 * Line-Circle Intersection
 * Line defined by origin (p1) and compass bearing (b1).
 * Circle defined by center (c) and radius (r).
 */
export const intersectLineCircle = (p1: Point, b1: number, c: Point, r: number): Point[] => {
  const rad = compassToCartesian(b1);
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);

  const fx = p1.x - c.x;
  const fy = p1.y - c.y;

  const A = dx * dx + dy * dy; // should be 1
  const B = 2 * (fx * dx + fy * dy);
  const C = (fx * fx + fy * fy) - r * r;

  const discriminant = B * B - 4 * A * C;
  if (discriminant < 0) return []; // no intersection

  if (Math.abs(discriminant) < 1e-6) {
    const t = -B / (2 * A);
    return [{ x: p1.x + t * dx, y: p1.y + t * dy }];
  }

  const t1 = (-B + Math.sqrt(discriminant)) / (2 * A);
  const t2 = (-B - Math.sqrt(discriminant)) / (2 * A);

  return [
    { x: p1.x + t1 * dx, y: p1.y + t1 * dy },
    { x: p1.x + t2 * dx, y: p1.y + t2 * dy },
  ];
};

/**
 * Circle-Circle Intersection
 */
export const intersectCircles = (c1: Point, r1: number, c2: Point, r2: number): Point[] => {
  const d = distanceBetween(c1, c2);
  
  if (d > r1 + r2 || d < Math.abs(r1 - r2) || (d === 0 && r1 === r2)) {
    return [];
  }

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

  const p2x = c1.x + a * (c2.x - c1.x) / d;
  const p2y = c1.y + a * (c2.y - c1.y) / d;

  const rx = -h * (c2.y - c1.y) / d;
  const ry = h * (c2.x - c1.x) / d;

  if (Math.abs(h) < 1e-6) {
    return [{ x: p2x, y: p2y }];
  }

  return [
    { x: p2x + rx, y: p2y + ry },
    { x: p2x - rx, y: p2y - ry },
  ];
};
