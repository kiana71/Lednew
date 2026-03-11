/**
 * Screen Element — the main LED screen rectangle.
 */

import React from 'react';

interface ScreenElementProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const ScreenElement: React.FC<ScreenElementProps> = React.memo(
  ({ x, y, width, height }) => (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="none"
      stroke="black"
      strokeWidth="2"
    />
  ),
);

ScreenElement.displayName = 'ScreenElement';
