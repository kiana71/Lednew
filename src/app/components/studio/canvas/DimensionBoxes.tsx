/**
 * Dimension Boxes — Screen Dimensions + Niche Dimensions info boxes (right-side panel).
 */

import React from 'react';

interface DimensionBoxesProps {
  screenWidth: number;
  screenHeight: number;
  screenDepth: number;
  isHorizontal: boolean;
  isNiche: boolean;
  nicheDimensionWidth: number;
  nicheDimensionHeight: number;
  nicheDepth: number;
}

const DimRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between text-sm h-5">
    <span className="font-semibold">{label}:</span>
    <span className="font-light">{value}</span>
  </div>
);

export const DimensionBoxes: React.FC<DimensionBoxesProps> = React.memo(
  ({
    screenWidth,
    screenHeight,
    screenDepth,
    isHorizontal,
    isNiche,
    nicheDimensionWidth,
    nicheDimensionHeight,
    nicheDepth,
  }) => {
    const displayHeight = isHorizontal ? screenHeight : screenWidth;
    const displayWidth = isHorizontal ? screenWidth : screenHeight;

    return (
      <div className="flex flex-col gap-4 w-full max-w-[180px]">
        {/* Screen Dimensions */}
        <div className="border border-black p-2 bg-white/30">
          <p className="font-bold text-sm mb-1 border-b border-black pb-1">Screen Dimensions</p>
          <DimRow label="Height" value={`${displayHeight}"`} />
          <DimRow label="Width" value={`${displayWidth}"`} />
          <DimRow label="Depth" value={`${screenDepth}"`} />
          <div className="flex items-center justify-center gap-1 mt-2 text-xs font-light text-gray-600">
            <span className="w-1 h-1 rounded-full bg-black" />
            For installer use only
          </div>
        </div>

        {/* Niche Dimensions (only when isNiche) */}
        {isNiche && (
          <div className="border border-black p-2 bg-white/30">
            <p className="font-bold text-sm mb-1 border-b border-black pb-1">Niche Dimensions</p>
            <DimRow label="Height" value={`${isHorizontal ? nicheDimensionHeight : nicheDimensionWidth}"`} />
            <DimRow label="Width" value={`${isHorizontal ? nicheDimensionWidth : nicheDimensionHeight}"`} />
            <DimRow label="Depth" value={`${nicheDepth.toFixed(2)}"`} />
          </div>
        )}
      </div>
    );
  },
);

DimensionBoxes.displayName = 'DimensionBoxes';
