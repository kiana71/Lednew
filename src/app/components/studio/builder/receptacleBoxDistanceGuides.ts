import type { ReceptacleBoxConfig } from './types';
import {
  RECEPTACLE_GAP_SNAP_STEP,
  RECEPTACLE_GAP_SNAP_THRESHOLD,
  RECEPTACLE_POSITION_STEP,
  roundToStep,
} from './utils';

export type BoxEdgeGuide = {
  distance: number;
  source: 'screen' | 'box';
};

export type BoxEdgeGuides = {
  left: BoxEdgeGuide;
  right: BoxEdgeGuide;
  top: BoxEdgeGuide;
  bottom: BoxEdgeGuide;
};

function rangesOverlap(a1: number, a2: number, b1: number, b2: number): boolean {
  return a1 < b2 && b1 < a2;
}

export function boxesOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return rangesOverlap(ax, ax + aw, bx, bx + bw) && rangesOverlap(ay, ay + ah, by, by + bh);
}

/** Push a box out of overlaps with others; uses drag direction when axes tie. */
export function resolveReceptacleBoxPositionNoOverlap(
  posX: number,
  posY: number,
  width: number,
  height: number,
  others: ReceptacleBoxConfig[],
  bounds: { maxX: number; maxY: number },
  from: { x: number; y: number },
): { posX: number; posY: number } {
  let x = posX;
  let y = posY;
  const dx = posX - from.x;
  const dy = posY - from.y;

  for (let pass = 0; pass < Math.max(others.length, 1); pass++) {
    let moved = false;

    for (const other of others) {
      if (!boxesOverlap(x, y, width, height, other.posX, other.posY, other.width, other.height)) {
        continue;
      }

      const pushLeft = x + width - other.posX;
      const pushRight = other.posX + other.width - x;
      const pushUp = y + height - other.posY;
      const pushDown = other.posY + other.height - y;

      if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx > 0) {
          x = other.posX - width;
        } else if (dx < 0) {
          x = other.posX + other.width;
        } else if (pushLeft <= pushRight) {
          x = other.posX - width;
        } else {
          x = other.posX + other.width;
        }
      } else if (dy > 0) {
        y = other.posY - height;
      } else if (dy < 0) {
        y = other.posY + other.height;
      } else if (pushUp <= pushDown) {
        y = other.posY - height;
      } else {
        y = other.posY + other.height;
      }

      moved = true;
      x = Math.max(0, Math.min(x, bounds.maxX - width));
      y = Math.max(0, Math.min(y, bounds.maxY - height));
    }

    if (!moved) break;
  }

  return { posX: x, posY: y };
}

function snapGapDistance(gap: number): number | null {
  const snapped = roundToStep(gap, RECEPTACLE_GAP_SNAP_STEP);
  if (Math.abs(gap - snapped) < RECEPTACLE_GAP_SNAP_THRESHOLD) {
    return snapped;
  }
  return null;
}

/** Snap position so edge-to-edge gaps land on 0.5" steps. */
export function snapReceptacleBoxDragPosition({
  posX,
  posY,
  width,
  height,
  others,
  totalWidth,
  totalHeight,
}: {
  posX: number;
  posY: number;
  width: number;
  height: number;
  others: ReceptacleBoxConfig[];
  totalWidth: number;
  totalHeight: number;
}): { posX: number; posY: number } {
  let x = posX;
  let y = posY;
  const boxRight = x + width;
  const boxBottom = y + height;

  for (const other of others) {
    const otherRight = other.posX + other.width;
    const otherBottom = other.posY + other.height;
    const yOverlap = rangesOverlap(y, boxBottom, other.posY, otherBottom);
    const xOverlap = rangesOverlap(x, boxRight, other.posX, otherRight);

    if (yOverlap) {
      if (x >= otherRight - 0.001) {
        const gap = x - otherRight;
        const snappedGap = snapGapDistance(gap);
        if (snappedGap !== null) {
          x = otherRight + snappedGap;
        }
      } else if (other.posX >= boxRight - 0.001) {
        const gap = other.posX - boxRight;
        const snappedGap = snapGapDistance(gap);
        if (snappedGap !== null) {
          x = other.posX - width - snappedGap;
        }
      }
    }

    if (xOverlap) {
      if (y >= otherBottom - 0.001) {
        const gap = y - otherBottom;
        const snappedGap = snapGapDistance(gap);
        if (snappedGap !== null) {
          y = otherBottom + snappedGap;
        }
      } else if (other.posY >= boxBottom - 0.001) {
        const gap = other.posY - boxBottom;
        const snappedGap = snapGapDistance(gap);
        if (snappedGap !== null) {
          y = other.posY - height - snappedGap;
        }
      }
    }
  }

  const leftGap = snapGapDistance(x);
  if (leftGap !== null) {
    x = leftGap;
  }

  const rightGap = snapGapDistance(totalWidth - (x + width));
  if (rightGap !== null) {
    x = totalWidth - width - rightGap;
  }

  const topGap = snapGapDistance(y);
  if (topGap !== null) {
    y = topGap;
  }

  const bottomGap = snapGapDistance(totalHeight - (y + height));
  if (bottomGap !== null) {
    y = totalHeight - height - bottomGap;
  }

  return {
    posX: roundToStep(x, RECEPTACLE_POSITION_STEP),
    posY: roundToStep(y, RECEPTACLE_POSITION_STEP),
  };
}

/** Nearest gap on each side — to another box when aligned, else to screen edge. */
export function computeReceptacleBoxEdgeGuides(
  box: ReceptacleBoxConfig,
  others: ReceptacleBoxConfig[],
  totalWidth: number,
  totalHeight: number,
): BoxEdgeGuides {
  const boxRight = box.posX + box.width;
  const boxBottom = box.posY + box.height;

  let left: BoxEdgeGuide = { distance: box.posX, source: 'screen' };
  let right: BoxEdgeGuide = { distance: totalWidth - boxRight, source: 'screen' };
  let top: BoxEdgeGuide = { distance: box.posY, source: 'screen' };
  let bottom: BoxEdgeGuide = {
    distance: totalHeight - boxBottom,
    source: 'screen',
  };

  for (const other of others) {
    const otherRight = other.posX + other.width;
    const otherBottom = other.posY + other.height;

    if (
      rangesOverlap(box.posY, boxBottom, other.posY, otherBottom) &&
      otherRight <= box.posX + 0.001
    ) {
      const gap = box.posX - otherRight;
      if (gap >= 0 && gap < left.distance) {
        left = { distance: gap, source: 'box' };
      }
    }

    if (
      rangesOverlap(box.posY, boxBottom, other.posY, otherBottom) &&
      other.posX >= boxRight - 0.001
    ) {
      const gap = other.posX - boxRight;
      if (gap >= 0 && gap < right.distance) {
        right = { distance: gap, source: 'box' };
      }
    }

    if (
      rangesOverlap(box.posX, boxRight, other.posX, otherRight) &&
      otherBottom <= box.posY + 0.001
    ) {
      const gap = box.posY - otherBottom;
      if (gap >= 0 && gap < top.distance) {
        top = { distance: gap, source: 'box' };
      }
    }

    if (
      rangesOverlap(box.posX, boxRight, other.posX, otherRight) &&
      other.posY >= boxBottom - 0.001
    ) {
      const gap = other.posY - boxBottom;
      if (gap >= 0 && gap < bottom.distance) {
        bottom = { distance: gap, source: 'box' };
      }
    }
  }

  return { left, right, top, bottom };
}

export type SideBySideBoxGap = {
  gap: number;
  xStart: number;
  xEnd: number;
  yCenter: number;
  yTop: number;
  overlapHeight: number;
};

function isBoxBetweenHorizontally(
  other: ReceptacleBoxConfig,
  leftEdge: number,
  rightEdge: number,
  top: number,
  bottom: number,
): boolean {
  if (other.posX + other.width <= leftEdge + 0.001) return false;
  if (other.posX >= rightEdge - 0.001) return false;
  return rangesOverlap(other.posY, other.posY + other.height, top, bottom);
}

/** Horizontal gaps between adjacent side-by-side boxes (Y overlap, nothing between). */
export function findSideBySideBoxGaps(
  boxes: ReceptacleBoxConfig[],
): SideBySideBoxGap[] {
  const results: SideBySideBoxGap[] = [];
  const seen = new Set<string>();

  for (const left of boxes) {
    const leftRight = left.posX + left.width;
    let nearestRight: ReceptacleBoxConfig | null = null;
    let nearestGap = Infinity;

    for (const right of boxes) {
      if (right.id === left.id) continue;
      if (right.posX < leftRight - 0.001) continue;
      if (
        !rangesOverlap(
          left.posY,
          left.posY + left.height,
          right.posY,
          right.posY + right.height,
        )
      ) {
        continue;
      }

      const gap = right.posX - leftRight;
      if (gap < 0) continue;

      const blocked = boxes.some((other) =>
        isBoxBetweenHorizontally(
          other,
          leftRight,
          right.posX,
          left.posY,
          left.posY + left.height,
        ),
      );
      if (blocked) continue;

      if (right.posX < (nearestRight?.posX ?? Infinity)) {
        nearestRight = right;
        nearestGap = gap;
      }
    }

    if (!nearestRight) continue;

    const key = [left.id, nearestRight.id].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);

    const overlapTop = Math.max(left.posY, nearestRight.posY);
    const overlapBottom = Math.min(
      left.posY + left.height,
      nearestRight.posY + nearestRight.height,
    );

    results.push({
      gap: nearestGap,
      xStart: leftRight,
      xEnd: nearestRight.posX,
      yCenter: (overlapTop + overlapBottom) / 2,
      yTop: overlapTop,
      overlapHeight: overlapBottom - overlapTop,
    });
  }

  return results.sort((a, b) => a.xStart - b.xStart);
}

/** Leftmost adjacent side-by-side pair only. */
export function findFirstSideBySideBoxGap(
  boxes: ReceptacleBoxConfig[],
): SideBySideBoxGap | null {
  return findSideBySideBoxGaps(boxes)[0] ?? null;
}

export type StackedBoxGap = {
  gap: number;
  yStart: number;
  yEnd: number;
  xLeft: number;
  overlapWidth: number;
};

function isBoxBetweenVertically(
  other: ReceptacleBoxConfig,
  topEdge: number,
  bottomEdge: number,
  left: number,
  right: number,
): boolean {
  if (other.posY + other.height <= topEdge + 0.001) return false;
  if (other.posY >= bottomEdge - 0.001) return false;
  return rangesOverlap(other.posX, other.posX + other.width, left, right);
}

/** Vertical gaps between adjacent stacked boxes (X overlap, nothing between). */
export function findStackedBoxGaps(
  boxes: ReceptacleBoxConfig[],
): StackedBoxGap[] {
  const results: StackedBoxGap[] = [];
  const seen = new Set<string>();

  for (const top of boxes) {
    const topBottom = top.posY + top.height;
    let nearestBelow: ReceptacleBoxConfig | null = null;
    let nearestGap = Infinity;

    for (const below of boxes) {
      if (below.id === top.id) continue;
      if (below.posY < topBottom - 0.001) continue;
      if (
        !rangesOverlap(
          top.posX,
          top.posX + top.width,
          below.posX,
          below.posX + below.width,
        )
      ) {
        continue;
      }

      const gap = below.posY - topBottom;
      if (gap < 0) continue;

      const pairLeft = Math.max(top.posX, below.posX);
      const pairRight = Math.min(
        top.posX + top.width,
        below.posX + below.width,
      );

      const blocked = boxes.some((other) =>
        isBoxBetweenVertically(
          other,
          topBottom,
          below.posY,
          pairLeft,
          pairRight,
        ),
      );
      if (blocked) continue;

      if (below.posY < (nearestBelow?.posY ?? Infinity)) {
        nearestBelow = below;
        nearestGap = gap;
      }
    }

    if (!nearestBelow) continue;

    const key = [top.id, nearestBelow.id].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);

    const overlapLeft = Math.max(top.posX, nearestBelow.posX);
    const overlapRight = Math.min(
      top.posX + top.width,
      nearestBelow.posX + nearestBelow.width,
    );

    results.push({
      gap: nearestGap,
      yStart: topBottom,
      yEnd: nearestBelow.posY,
      xLeft: overlapLeft,
      overlapWidth: overlapRight - overlapLeft,
    });
  }

  return results.sort((a, b) => a.yStart - b.yStart);
}

/** Topmost adjacent stacked pair only. */
export function findFirstStackedBoxGap(
  boxes: ReceptacleBoxConfig[],
): StackedBoxGap | null {
  return findStackedBoxGaps(boxes)[0] ?? null;
}

export type ReceptacleBoxGapToShow =
  | ({ orientation: 'horizontal' } & SideBySideBoxGap)
  | ({ orientation: 'vertical' } & StackedBoxGap);

export function findReceptacleBoxGapsToShow(
  boxes: ReceptacleBoxConfig[],
): ReceptacleBoxGapToShow[] {
  const gaps: ReceptacleBoxGapToShow[] = [];
  const horizontal = findFirstSideBySideBoxGap(boxes);
  if (horizontal) {
    gaps.push({ orientation: 'horizontal', ...horizontal });
  }
  const vertical = findFirstStackedBoxGap(boxes);
  if (vertical) {
    gaps.push({ orientation: 'vertical', ...vertical });
  }
  return gaps;
}
