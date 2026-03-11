/**
 * Flat Wall Dimensions — screen width/height annotation lines (shown when isNiche=false).
 */

import React from 'react';

interface FlatWallDimensionsProps {
  screenX: number;
  screenY: number;
  screenWidthPx: number;
  screenHeightPx: number;
  centerX: number;
  centerY: number;
  widthValue: string;
  heightValue: string;
  isHorizontal: boolean;
}

export const FlatWallDimensions: React.FC<FlatWallDimensionsProps> = React.memo(
  ({ screenX, screenY, screenWidthPx, screenHeightPx, centerX, centerY, widthValue, heightValue, isHorizontal }) => {
    const displayWidth = isHorizontal ? widthValue : heightValue;
    const displayHeight = isHorizontal ? heightValue : widthValue;

    return (
      <g>
        {/* ── Top width arrow ────────────────────────────────────── */}
        <line
          x1={screenX + 6}
          y1={screenY - 40}
          x2={screenX + screenWidthPx - 6}
          y2={screenY - 40}
          stroke="black"
          strokeWidth="1"
          markerStart="url(#arrowReversed)"
          markerEnd="url(#arrow)"
        />
        <line x1={screenX} y1={screenY - 50} x2={screenX} y2={screenY - 12} stroke="black" strokeWidth="0.5" />
        <line x1={screenX + screenWidthPx} y1={screenY - 50} x2={screenX + screenWidthPx} y2={screenY - 12} stroke="black" strokeWidth="0.5" />

        <text x={centerX - 50} y={screenY - 70} textAnchor="middle" fontSize="18" fontWeight="300">
          {displayWidth}&quot;
        </text>
        <text x={centerX - 50} y={screenY - 50} textAnchor="middle" fontSize="18" fontWeight="300">
          (Width)
        </text>

        {/* ── Left height arrow ──────────────────────────────────── */}
        <line
          x1={screenX - 40}
          y1={screenY + 6}
          x2={screenX - 40}
          y2={screenY + screenHeightPx - 6}
          stroke="black"
          strokeWidth="1"
          markerStart="url(#arrowReversed)"
          markerEnd="url(#arrow)"
        />
        <line x1={screenX - 50} y1={screenY} x2={screenX - 12} y2={screenY} stroke="black" strokeWidth=".5" />
        <line x1={screenX - 50} y1={screenY + screenHeightPx} x2={screenX - 12} y2={screenY + screenHeightPx} stroke="black" strokeWidth=".5" />

        <text
          x={screenX - 70}
          y={centerY - 87}
          textAnchor="middle"
          fontSize="18"
          fontWeight="300"
          transform={`rotate(270, ${screenX - 75}, ${centerY})`}
        >
          {displayHeight}&quot;
          <tspan x={screenX - 73} dy="14" y={centerY - 80}>
            (Height)
          </tspan>
        </text>
      </g>
    );
  },
);

FlatWallDimensions.displayName = 'FlatWallDimensions';
