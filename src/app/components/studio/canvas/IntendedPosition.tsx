/**
 * Intended Position — center marker with leader line + label.
 */

import React from 'react';

interface IntendedPositionProps {
  centerX: number;
  centerY: number;
}

export const IntendedPosition: React.FC<IntendedPositionProps> = React.memo(
  ({ centerX, centerY }) => (
    <g>
      <circle cx={centerX} cy={centerY} r="5" fill="none" stroke="black" />
      <circle cx={centerX} cy={centerY} r="3" fill="yellow" stroke="black" />

      {/* Leader line */}
      <line x1={centerX} y1={centerY} x2="435" y2="53" stroke="black" strokeWidth="1" />
      <line x1="435" y1="53" x2="453" y2="53" stroke="black" strokeWidth="1" />

      {/* Label */}
      <text x="653" y="57" textAnchor="end" fontSize="18" fontWeight="300">
        Intended Screen Position
      </text>
    </g>
  ),
);

IntendedPosition.displayName = 'IntendedPosition';
