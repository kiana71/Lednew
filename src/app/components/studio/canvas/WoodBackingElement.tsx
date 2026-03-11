/**
 * Wood Backing Element — inner dashed rectangle with label.
 */

import React from 'react';

interface WoodBackingElementProps {
  x: number;
  y: number;
  width: number;
  height: number;
  screenY: number;
  isEdgeToEdge: boolean;
}

export const WoodBackingElement: React.FC<WoodBackingElementProps> = React.memo(
  ({ x, y, width, height, screenY, isEdgeToEdge }) => {
    const labelY = isEdgeToEdge ? screenY - 50 : screenY - 80;
    const lineEndY = isEdgeToEdge ? screenY - 60 : screenY - 90;

    return (
      <g>
        {/* Dashed rectangle */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="#f4f2f2"
          stroke="black"
          strokeDasharray="8,8"
          strokeWidth="1"
        />

        {/* Indicator dot */}
        <circle cx={x + 20} cy={y + 20} r="4" fill="black" stroke="black" />

        {/* Leader line (vertical) */}
        <line x1={x + 20} y1={y + 20} x2={x + 20} y2={lineEndY} stroke="black" strokeWidth="1" />

        {/* Leader line (horizontal) */}
        <line x1={x + 20} y1={lineEndY} x2={x - 40} y2={lineEndY} stroke="black" strokeWidth="1" />

        {/* Label */}
        <text x={x - 155} y={labelY + 10} fontSize="18" fontWeight="300">
          {isEdgeToEdge ? 'Woodbacking' : 'Wood Backing'}
        </text>
        <text x={x - 147} y={labelY + 30} fontSize="18" fontWeight="300">
          (See Notes)
        </text>
      </g>
    );
  },
);

WoodBackingElement.displayName = 'WoodBackingElement';
