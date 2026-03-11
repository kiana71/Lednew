/**
 * Center Lines — horizontal + vertical dashed centerlines through the screen.
 */

import React from 'react';

interface CenterLinesProps {
  centerX: number;
  centerY: number;
  screenX: number;
  screenY: number;
  screenWidthPx: number;
  screenHeightPx: number;
}

export const CenterLines: React.FC<CenterLinesProps> = React.memo(
  ({ centerX, centerY, screenX, screenY, screenWidthPx, screenHeightPx }) => (
    <g>
      {/* Horizontal */}
      <line
        x1={screenX - 40}
        y1={centerY}
        x2={screenX + screenWidthPx + 40}
        y2={centerY}
        stroke="black"
        strokeWidth="1"
        strokeDasharray="12"
      />
      <text fontSize="22" fontWeight="300" x={screenX - 58} y={centerY}>
        &#8452;
      </text>

      {/* Vertical */}
      <line
        x1={centerX}
        y1={screenY - 40}
        x2={centerX}
        y2={screenY + screenHeightPx + 40}
        stroke="black"
        strokeWidth="1"
        strokeDasharray="12"
      />
      <text fontSize="22" fontWeight="300" textAnchor="middle" x={centerX - 2} y={screenY - 46}>
        &#8452;
      </text>
    </g>
  ),
);

CenterLines.displayName = 'CenterLines';
