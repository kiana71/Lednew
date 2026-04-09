
import { AppState, GridConfig, NicheSettings, ScreenConfig, MountConfig, MediaPlayerConfig } from './types';

export const LETTER_WIDTH = 11; // inches (Landscape)
export const LETTER_HEIGHT = 8.5; // inches (Landscape)
// Increase margin to give more breathing room and prevent screen from being too big
export const MARGIN = 1.0; // Reduce horizontal margin significantly so the screen can be much bigger
export const VERTICAL_MARGIN = 4.0; // Reserve space for footer and floor line

// ─── Rounding (matches original LED calculation logic) ─────────────────────

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

export const calculateTotalDrawWidth = (
  mode: 'WALL' | 'NICHE' | 'TABLE_NICHE',
  screen: ScreenConfig,
  grid: GridConfig,
  nicheSettings: NicheSettings
): number => {
  const { width } = screen;
  const { cols } = grid;
  const { clearanceSides } = nicheSettings;

  if (mode === 'NICHE' || mode === 'TABLE_NICHE') {
    return roundToNearestQuarter((width * cols) + (clearanceSides * 2));
  } else {
    // Mode == WALL — exact screen dimensions, no rounding
    return width * cols;
  }
};

export const calculateNicheDimensions = (
  screen: ScreenConfig,
  grid: GridConfig,
  nicheSettings: NicheSettings,
  mode: 'WALL' | 'NICHE' | 'TABLE_NICHE'
): { width: number; height: number } => {
  const { width, height } = screen;
  const { rows, cols } = grid;
  const { clearanceSides, clearanceTopBottom } = nicheSettings;

  if (mode === 'WALL') {
    return {
      width: width * cols,
      height: height * rows,
    };
  }

  return {
    width: roundToNearestQuarter((width * cols) + (clearanceSides * 2)),
    height: roundToNearestQuarter((height * rows) + (clearanceTopBottom * 2)),
  };
};

export const calculateScale = (
  mode: 'WALL' | 'NICHE' | 'TABLE_NICHE',
  screen: ScreenConfig,
  grid: GridConfig,
  nicheSettings: NicheSettings,
  floorDistance: number // Pass floor distance to scale calculations
): number => {
  const totalDrawWidth = calculateTotalDrawWidth(mode, screen, grid, nicheSettings);
  const totalDrawHeight = calculateNicheDimensions(screen, grid, nicheSettings, mode).height;
  
  if (totalDrawWidth === 0 || totalDrawHeight === 0) return 1;

  // Calculate Scale based on both Width and Height constraints
  const usableWidth = LETTER_WIDTH - MARGIN;
  
  // The screen is always in the center of the canvas. 
  // We need enough vertical space to fit:
  // (Screen Height / 2) + floorDistance
  // BUT we must also ensure we don't scale the screen so large that the floor line goes off the bottom of the canvas.
  // The absolute minimum total height we need to represent is from the top of the screen to the floor line:
  const topHalf = totalDrawHeight / 2;
  const bottomHalf = Math.max(totalDrawHeight / 2, floorDistance);
  const totalNeededHeight = topHalf + bottomHalf + 1.0; // +1.0 for labels and top margin
  
  const usableHeight = LETTER_HEIGHT - VERTICAL_MARGIN;

  const scaleX = usableWidth / totalDrawWidth;
  // Use the total needed height so the screen shrinks if floor distance is massive,
  // but stays large if floor distance is small.
  const scaleY = usableHeight / totalNeededHeight; 

  // Use the smaller scale to fit both dimensions
  return Math.min(scaleX, scaleY);
};

export const calculateNicheDepth = (
  screen: ScreenConfig,
  mount: MountConfig,
  mediaPlayer: MediaPlayerConfig,
  nicheSettings: NicheSettings
): number => {
  const { depth: screenDepth } = screen;
  const { depth: mountDepth } = mount;
  const { depth: mediaPlayerDepth, position: mediaPlayerPosition } = mediaPlayer;
  const { depthVariant } = nicheSettings;

  // Niche Depth = Screen Depth + Max(Mount Depth, Media Player Depth) + Depth Variant
  // Note: Only include Media Player Depth if its position is 'BEHIND_SCREEN'.

  let depthToAdd = mountDepth;
  if (mediaPlayerPosition === 'BEHIND_SCREEN') {
    depthToAdd = Math.max(mountDepth, mediaPlayerDepth);
  }

  return roundToNearestQuarter(screenDepth + depthToAdd + depthVariant);
};

export const pixelsToInches = (pixels: number, scale: number): number => {
  if (scale === 0) return 0;
  return pixels / scale;
};

export const inchesToPixels = (inches: number, scale: number): number => {
  return inches * scale;
};
