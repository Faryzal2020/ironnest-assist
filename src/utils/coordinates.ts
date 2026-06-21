export interface Point {
  x: number;
  y: number;
}

/**
 * Parse grid string like "K5 4:6" to (x, y) continuous coordinate.
 * Major grid: columns A-T (20 columns), rows 1-10 (10 rows).
 * Subgrid x:y is 0:0 to 9:9.
 */
export function parseCoordinate(gridStr: string): Point | null {
  const match = gridStr.trim().toUpperCase().match(/^([A-T])\s*(10|[1-9])\s+(\d)\s*:\s*(\d)$/);
  if (!match) return null;

  const colLetter = match[1];
  const rowNumber = parseInt(match[2], 10);
  const subX = parseInt(match[3], 10);
  const subY = parseInt(match[4], 10);

  const colIndex = colLetter.charCodeAt(0) - 'A'.charCodeAt(0); // A=0, T=19
  const rowIndex = rowNumber - 1; // 1=0, 10=9

  const x = colIndex + subX / 10 + 0.05;
  const y = rowIndex + subY / 10 + 0.05;

  return { x, y };
}

/**
 * Format (x, y) continuous coordinate to "K5 4:6" string.
 */
export function formatCoordinate(p: Point): string {
  // Add small epsilon to handle float inaccuracy before flooring
  const safeX = p.x + 0.00001;
  const safeY = p.y + 0.00001;

  if (safeX < 0 || safeX >= 20 || safeY < 0 || safeY >= 10) return 'OUT OF BOUNDS';

  const colIndex = Math.floor(safeX);
  const rowIndex = Math.floor(safeY);
  
  const colLetter = String.fromCharCode('A'.charCodeAt(0) + colIndex);
  const rowNumber = rowIndex + 1;

  const subX = Math.floor(safeX * 10) % 10;
  const subY = Math.floor(safeY * 10) % 10;

  return `${colLetter}${rowNumber} ${subX}:${subY}`;
}
