/**
 * Floor Line — horizontal floor line with distance measurement + zigzag break.
 */

import React from 'react';

interface FloorLineProps {
  floorLineY: number;
  centerY: number;
  floorDistance: number;
}

export const FloorLine: React.FC<FloorLineProps> = React.memo(
  ({ floorLineY, centerY, floorDistance }) => {
    const midY = (centerY + floorLineY) / 2;

    return (
      <g>
        {/* Floor line */}
        <line x1="90" y1={floorLineY} x2="700" y2={floorLineY} stroke="black" strokeWidth="2" strokeLinecap="round" />

        {/* Top arrow (from center of screen going down) */}
        <line x1="90" y1={centerY + 7} x2="90" y2={centerY + 50} stroke="black" strokeWidth="1.5" markerStart="url(#arrowReversed)" />

        {/* Zigzag break */}
        <polyline
          points={`90,${centerY + 50} 80,${centerY + 60} 100,${centerY + 70} 80,${centerY + 80} 100,${centerY + 90}`}
          stroke="black"
          fill="transparent"
          strokeWidth="1.5"
        />

        {/* Bottom arrow (connects to floor line) */}
        <line x1="90" y1={centerY + 100} x2="90" y2={floorLineY - 3} stroke="black" strokeWidth="1.5" markerEnd="url(#arrow)" />

        {/* Distance label */}
        <text x="59" y={midY} textAnchor="middle" fontSize="16" fontWeight="300">
          {floorDistance}&quot;
        </text>
        <text x="53" y={midY + 20} textAnchor="middle" fontSize="16" fontWeight="200">
          Distance
        </text>
        <text x="55" y={midY + 40} textAnchor="middle" fontSize="16" fontWeight="200">
          to the
        </text>
        <text x="53" y={midY + 60} textAnchor="middle" fontSize="16" fontWeight="200">
          Floor Line
        </text>

        {/* Floor line label */}
        <text x="40" y={floorLineY} textAnchor="middle" fontSize="18" fontWeight="300">
          Floor Line
        </text>
      </g>
    );
  },
);

FloorLine.displayName = 'FloorLine';
