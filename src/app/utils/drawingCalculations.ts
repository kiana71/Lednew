/**
 * Drawing Calculations — Pure Utility Functions
 *
 * All mathematical logic for the LED technical drawing builder lives here.
 * These are pure functions (no side effects) for easy testing and reuse.
 */

// ─── Layout Constants ────────────────────────────────────────────────────────

export const BASE_WIDTH = 800;
export const MAX_SCREEN_WIDTH = 500;
export const MAX_SCREEN_HEIGHT = 400;
export const FIXED_FLOOR_LINE_Y = 600;
export const CENTER_X = BASE_WIDTH / 2;
export const CENTER_Y = FIXED_FLOOR_LINE_Y - 300;

// ─── Rounding ────────────────────────────────────────────────────────────────

/** Round up to the nearest ¼ inch (0, 0.25, 0.5, 0.75). */
export function roundToNearestQuarter(num: number): number {
  const whole = Math.floor(num);
  const decimal = num - whole;
  const quarters = [0, 0.25, 0.5, 0.75, 1] as const;
  for (const q of quarters) {
    if (decimal <= q) return q === 1 ? whole + 1 : whole + q;
  }
  return whole + 1;
}

// ─── Scale ───────────────────────────────────────────────────────────────────

/** Compute a px-per-inch scale factor so the screen fits within MAX bounds. */
export function calculateScaleFactor(width: number, height: number): number {
  const wScale = Math.min(10, MAX_SCREEN_WIDTH / Math.max(width, 1));
  const hScale = Math.min(10, MAX_SCREEN_HEIGHT / Math.max(height, 1));
  return Math.min(wScale, hScale);
}

// ─── Depth Calculations ─────────────────────────────────────────────────────

/** Niche depth = screen + max(mount, mediaPlayer) + variant, rounded ¼". */
export function calculateNicheDepth(
  screenDepth: number,
  mountDepth: number,
  mediaPlayerDepth: number,
  variantDepth: number,
): number {
  return roundToNearestQuarter(
    screenDepth + Math.max(mountDepth, mediaPlayerDepth) + variantDepth,
  );
}

/** Flat-wall depth = screen + max(mount, mediaPlayer), rounded ¼". */
export function calculateFlatDepth(
  screenDepth: number,
  mountDepth: number,
  mediaPlayerDepth: number,
): number {
  return roundToNearestQuarter(
    screenDepth + Math.max(mountDepth, mediaPlayerDepth),
  );
}

// ─── Full Layout ─────────────────────────────────────────────────────────────

export interface LayoutParams {
  screenWidth: number;
  screenHeight: number;
  screenDepth: number;
  isHorizontal: boolean;
  clearanceInches: number;
  isNiche: boolean;
  isEdgeToEdge: boolean;
  mountDepth: number;
  mediaPlayerDepth: number;
  variantDepth: number;
}

export interface LayoutResult {
  scaleFactor: number;
  // Screen
  screenWidthPx: number;
  screenHeightPx: number;
  screenX: number;
  screenY: number;
  centerX: number;
  centerY: number;
  // Niche
  nicheWidthPx: number;
  nicheHeightPx: number;
  nicheX: number;
  nicheY: number;
  nicheDimensionWidth: number;
  nicheDimensionHeight: number;
  nicheDepth: number;
  flatDepth: number;
  // Wood backing
  woodBackingX: number;
  woodBackingY: number;
  woodBackingWidth: number;
  woodBackingHeight: number;
  // Side view
  sideViewX: number;
  sideViewY: number;
  sideViewHeight: number;
  sideViewDepth: number;
  // Floor
  floorLineY: number;
  // ViewBox
  viewBoxWidth: number;
  viewBoxHeight: number;
  // Boundary for receptacle boxes
  boundary: { x: number; y: number; width: number; height: number };
  // Raw oriented dimensions for labels
  orientedWidth: number;
  orientedHeight: number;
}

/** Compute every position/dimension for the SVG diagram. */
export function calculateLayout(params: LayoutParams): LayoutResult {
  const {
    screenWidth: rawW,
    screenHeight: rawH,
    screenDepth,
    isHorizontal,
    clearanceInches,
    isEdgeToEdge,
    mountDepth,
    mediaPlayerDepth,
    variantDepth,
  } = params;

  // Orientation swap
  const width = isHorizontal ? rawW : rawH;
  const height = isHorizontal ? rawH : rawW;

  // Scale
  const scaleFactor = calculateScaleFactor(width, height);

  // Screen in pixels
  const screenWidthPx = Math.max(100, width * scaleFactor);
  const screenHeightPx = Math.max(100, height * scaleFactor);

  // Positions
  const screenX = CENTER_X - screenWidthPx / 2;
  const screenY = CENTER_Y - screenHeightPx / 2;

  // Niche (visual — uses *5 for a proportional visual offset, not exact scale)
  const nicheWidthPx = screenWidthPx + clearanceInches * 5;
  const nicheHeightPx = screenHeightPx + clearanceInches * 5;
  const nicheX = CENTER_X - nicheWidthPx / 2;
  const nicheY = CENTER_Y - nicheHeightPx / 2;

  // Niche dimension labels (true inch values, rounded ¼")
  const nicheDimW = roundToNearestQuarter(rawW + clearanceInches);
  const nicheDimH = roundToNearestQuarter(rawH + clearanceInches);
  const nicheDimensionWidth = isHorizontal ? nicheDimW : nicheDimH;
  const nicheDimensionHeight = isHorizontal ? nicheDimH : nicheDimW;

  // Depths
  const nicheDepth = calculateNicheDepth(screenDepth, mountDepth, mediaPlayerDepth, variantDepth);
  const flatDepth = calculateFlatDepth(screenDepth, mountDepth, mediaPlayerDepth);

  // Wood backing
  const margin = isEdgeToEdge ? 5 : 30;
  const woodBackingX = screenX + margin;
  const woodBackingY = screenY + margin;
  const woodBackingWidth = screenWidthPx - margin * 2;
  const woodBackingHeight = screenHeightPx - margin * 2;

  // Side view
  const sideViewX = screenX + screenWidthPx + 140;
  const sideViewY = screenY;
  const sideViewHeight = screenHeightPx;
  const sideViewDepth = Math.max(25, Math.min(50, screenDepth * scaleFactor));

  // Floor
  const floorLineY = FIXED_FLOOR_LINE_Y;

  // ViewBox
  const viewBoxWidth = Math.max(BASE_WIDTH, sideViewX + sideViewDepth + 60);
  const viewBoxHeight = Math.max(FIXED_FLOOR_LINE_Y + 100, 700);

  return {
    scaleFactor,
    screenWidthPx,
    screenHeightPx,
    screenX,
    screenY,
    centerX: CENTER_X,
    centerY: CENTER_Y,
    nicheWidthPx,
    nicheHeightPx,
    nicheX,
    nicheY,
    nicheDimensionWidth,
    nicheDimensionHeight,
    nicheDepth,
    flatDepth,
    woodBackingX,
    woodBackingY,
    woodBackingWidth,
    woodBackingHeight,
    sideViewX,
    sideViewY,
    sideViewHeight,
    sideViewDepth,
    floorLineY,
    viewBoxWidth,
    viewBoxHeight,
    boundary: { x: screenX, y: screenY, width: screenWidthPx, height: screenHeightPx },
    orientedWidth: width,
    orientedHeight: height,
  };
}

// ─── Receptacle Box Positions ────────────────────────────────────────────────

export interface BoxPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoxLayoutParams {
  boundary: { x: number; y: number; width: number; height: number };
  boxWidthInches: number;
  boxHeightInches: number;
  scaleFactor: number;
  leftDistance: number;
  bottomDistance: number;
  topDistance: number;
  boxGap: number;
  boxCount: number;
  isColumnLayout: boolean;
}

/** Calculate positions for all receptacle boxes within the LED boundary. */
export function calculateBoxPositions(p: BoxLayoutParams): {
  positions: BoxPosition[];
  maxBoxes: number;
} {
  const boxWPx = p.boxWidthInches * p.scaleFactor;
  const boxHPx = p.boxHeightInches * p.scaleFactor;
  const leftPx = p.leftDistance * p.scaleFactor;
  const bottomPx = p.bottomDistance * p.scaleFactor;
  const topPx = p.topDistance * p.scaleFactor;
  const gapPx = p.boxGap * p.scaleFactor;

  const usableW = p.boundary.width - leftPx;
  const usableH = p.boundary.height - bottomPx - topPx;

  const perRow = Math.max(1, Math.floor((usableW + gapPx) / (boxWPx + gapPx)));
  const perCol = Math.max(1, Math.floor((usableH + gapPx) / (boxHPx + gapPx)));
  const maxBoxes = perRow * perCol;

  const positions: BoxPosition[] = [];

  if (p.isColumnLayout) {
    const colsNeeded = Math.ceil(p.boxCount / perCol);
    const maxCols = Math.floor((usableW + gapPx) / (boxWPx + gapPx));
    const cols = Math.min(colsNeeded, maxCols);
    const startX = p.boundary.x + leftPx;

    for (let col = 0; col < cols; col++) {
      const inCol = Math.min(p.boxCount - col * perCol, perCol);
      for (let row = 0; row < inCol; row++) {
        positions.push({
          x: startX + col * (boxWPx + gapPx),
          y: p.boundary.y + topPx + row * (boxHPx + gapPx),
          width: boxWPx,
          height: boxHPx,
        });
      }
    }
  } else {
    const rowsNeeded = Math.ceil(p.boxCount / perRow);
    for (let row = 0; row < rowsNeeded; row++) {
      const inRow = Math.min(p.boxCount - row * perRow, perRow);
      for (let col = 0; col < inRow; col++) {
        positions.push({
          x: p.boundary.x + leftPx + col * (boxWPx + gapPx),
          y: p.boundary.y + p.boundary.height - bottomPx - boxHPx - row * (boxHPx + gapPx),
          width: boxWPx,
          height: boxHPx,
        });
      }
    }
  }

  return { positions, maxBoxes };
}

// ─── Max-Value Constraints for Box Settings ─────────────────────────────────

export interface MaxValues {
  maxBottomDistance: number;
  maxTopDistance: number;
  maxLeftDistance: number;
  maxBoxGap: number;
}

/** Compute the maximum allowed bottom/top/left distance and gap so boxes stay in bounds. */
export function calculateMaxValues(p: BoxLayoutParams): MaxValues {
  const boxWPx = p.boxWidthInches * p.scaleFactor;
  const boxHPx = p.boxHeightInches * p.scaleFactor;
  const gapPx = p.boxGap * p.scaleFactor;
  const leftPx = p.leftDistance * p.scaleFactor;
  const sf = p.scaleFactor;

  const availW = p.boundary.width - leftPx;
  const availH = p.boundary.height - (p.topDistance + p.bottomDistance) * sf;

  const perRow = Math.max(1, Math.floor((availW + gapPx) / (boxWPx + gapPx)));
  const perCol = Math.max(1, Math.floor((availH + gapPx) / (boxHPx + gapPx)));

  const rowsNeeded = Math.ceil(p.boxCount / perRow);
  const totalRowH = rowsNeeded * boxHPx + (rowsNeeded - 1) * gapPx;

  const maxBottom = Math.max(0, (p.boundary.height - totalRowH - p.topDistance * sf) / sf);
  const maxTop = Math.max(0, (p.boundary.height - totalRowH - p.bottomDistance * sf) / sf);

  let maxLeft: number;
  if (p.isColumnLayout) {
    const colsNeeded = Math.ceil(p.boxCount / perCol);
    const totalColW = colsNeeded * boxWPx + (colsNeeded - 1) * gapPx;
    maxLeft = Math.max(0, (p.boundary.width - totalColW) / sf);
  } else {
    const firstRow = Math.min(p.boxCount, perRow);
    const neededW = firstRow * boxWPx + (firstRow - 1) * gapPx;
    maxLeft = Math.max(0, (p.boundary.width - neededW) / sf);
  }

  let maxGap: number;
  if (p.isColumnLayout) {
    const firstCol = Math.min(p.boxCount, perCol);
    maxGap = firstCol > 1
      ? Math.max(0, (availH - firstCol * boxHPx) / (firstCol - 1) / sf)
      : p.boxGap;
  } else {
    const firstRow = Math.min(p.boxCount, perRow);
    maxGap = firstRow > 1
      ? Math.max(0, (availW - firstRow * boxWPx) / (firstRow - 1) / sf)
      : p.boxGap;
  }

  return {
    maxBottomDistance: maxBottom,
    maxTopDistance: maxTop,
    maxLeftDistance: maxLeft,
    maxBoxGap: maxGap,
  };
}
