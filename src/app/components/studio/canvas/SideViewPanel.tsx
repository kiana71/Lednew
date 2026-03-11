/**
 * Side View Panel — depth cross-section with dimension lines.
 */

import React from 'react';

interface SideViewPanelProps {
  sideViewX: number;
  sideViewY: number;
  sideViewHeight: number;
  sideViewDepth: number;
  depthLabel: string;
}

export const SideViewPanel: React.FC<SideViewPanelProps> = React.memo(
  ({ sideViewX, sideViewY, sideViewHeight, sideViewDepth, depthLabel }) => {
    const x = sideViewX;
    const y = sideViewY;
    const h = sideViewHeight;
    const d = sideViewDepth;
    const bottomY = y + h;

    return (
      <g>
        {/* Gray fill */}
        <rect x={x} y={y} width={d + 6} height={h} fill="#CCCCCC" stroke="none" />

        {/* Front face */}
        <line x1={x} y1={y} x2={x} y2={bottomY} stroke="black" strokeWidth="1" />
        {/* Screen back edge */}
        <line x1={x + d} y1={y} x2={x + d} y2={bottomY} stroke="black" strokeWidth="1" />
        {/* Wall face */}
        <line x1={x + d + 6} y1={y} x2={x + d + 6} y2={bottomY} stroke="black" strokeWidth="1" />

        {/* Top lines */}
        <line x1={x} y1={y} x2={x + d} y2={y} stroke="black" strokeWidth="1" />
        <line x1={x + d} y1={y} x2={x + d + 6} y2={y} stroke="black" strokeWidth="1" />

        {/* Bottom lines */}
        <line x1={x} y1={bottomY} x2={x + d} y2={bottomY} stroke="black" strokeWidth="1" />
        <line x1={x + d} y1={bottomY} x2={x + d + 6} y2={bottomY} stroke="black" strokeWidth="1" />

        {/* Dimension extension lines */}
        <line x1={x} y1={bottomY + 5} x2={x} y2={bottomY + 47} stroke="black" strokeWidth=".5" />
        <line x1={x + d + 7} y1={bottomY + 5} x2={x + d + 7} y2={bottomY + 47} stroke="black" strokeWidth=".5" />

        {/* Dimension arrow */}
        <line
          x1={x + 2}
          y1={bottomY + 40}
          x2={x + d + 4}
          y2={bottomY + 40}
          stroke="black"
          strokeWidth="1"
          markerStart="url(#arrowReversed)"
          markerEnd="url(#arrow)"
        />

        {/* Depth label */}
        <text x={x + d / 2 + 5} y={bottomY + 65} textAnchor="middle" fontSize="18" fontWeight="300">
          {depthLabel}&quot;
        </text>
        <text x={x + d / 2 - 25} y={bottomY + 83} fontSize="18" fontWeight="300">
          (Depth)
        </text>
      </g>
    );
  },
);

SideViewPanel.displayName = 'SideViewPanel';
