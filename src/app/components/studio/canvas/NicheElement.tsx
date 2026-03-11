/**
 * Niche Element — outer niche rectangle with dimension annotations.
 */

import React from 'react';

interface NicheElementProps {
  nicheX: number;
  nicheY: number;
  nicheWidthPx: number;
  nicheHeightPx: number;
  nicheDimensionWidth: number;
  nicheDimensionHeight: number;
  isHorizontal: boolean;
  centerY: number;
  sideViewX: number;
}

export const NicheElement: React.FC<NicheElementProps> = React.memo(
  ({
    nicheX,
    nicheY,
    nicheWidthPx,
    nicheHeightPx,
    nicheDimensionWidth,
    nicheDimensionHeight,
    isHorizontal,
    centerY,
    sideViewX,
  }) => {
    const widthLabel = isHorizontal ? nicheDimensionWidth : nicheDimensionHeight;
    const heightLabel = isHorizontal ? nicheDimensionHeight : nicheDimensionWidth;

    return (
      <g>
        {/* Niche rectangle */}
        <rect
          x={nicheX}
          y={nicheY}
          width={nicheWidthPx}
          height={nicheHeightPx}
          fill="none"
          stroke="black"
          strokeWidth="1"
        />

        {/* Right-side height arrow */}
        <line
          x1={nicheX + nicheWidthPx + 30}
          y1={nicheY + 6}
          x2={nicheX + nicheWidthPx + 30}
          y2={nicheY + nicheHeightPx - 6}
          stroke="black"
          strokeWidth="1"
          markerStart="url(#arrowReversed)"
          markerEnd="url(#arrow)"
        />

        {/* Bottom width arrow + extension lines */}
        <line
          x1={nicheX + 6}
          y1={nicheY + nicheHeightPx + 40}
          x2={nicheX + nicheWidthPx - 6}
          y2={nicheY + nicheHeightPx + 40}
          stroke="black"
          strokeWidth="1"
          markerStart="url(#arrowReversed)"
          markerEnd="url(#arrow)"
        />
        <line x1={nicheX} y1={nicheY + nicheHeightPx + 6} x2={nicheX} y2={nicheY + nicheHeightPx + 50} stroke="black" strokeWidth=".5" />
        <line x1={nicheX + nicheWidthPx} y1={nicheY + nicheHeightPx + 5} x2={nicheX + nicheWidthPx} y2={nicheY + nicheHeightPx + 50} stroke="black" strokeWidth=".5" />

        {/* Width label */}
        <text x="370" y={nicheY + nicheHeightPx + 59} textAnchor="middle" fontSize="18" fontWeight="300">
          {widthLabel}&quot;
        </text>
        <text x="370" y={nicheY + nicheHeightPx + 80} textAnchor="middle" fontSize="18" fontWeight="200" letterSpacing="1px">
          (Width)
        </text>

        {/* Right-side height extension lines */}
        <line x1={nicheX + nicheWidthPx} y1={nicheY} x2={sideViewX - 86} y2={nicheY} stroke="black" strokeWidth=".5" />
        <line x1={nicheX + nicheWidthPx} y1={nicheY + nicheHeightPx} x2={sideViewX - 86} y2={nicheY + nicheHeightPx} stroke="black" strokeWidth=".5" />

        {/* Height label (rotated) */}
        <text
          x={sideViewX - 57}
          y={centerY - 30}
          textAnchor="middle"
          fontSize="18"
          fontWeight="300"
          transform={`rotate(270, ${sideViewX - 35}, ${centerY})`}
        >
          {heightLabel}&quot;
          <tspan x={sideViewX - 57} dy="14" y={centerY - 22}>
            (Height)
          </tspan>
        </text>
      </g>
    );
  },
);

NicheElement.displayName = 'NicheElement';
