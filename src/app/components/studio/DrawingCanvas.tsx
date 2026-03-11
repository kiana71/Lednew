/**
 * Drawing Canvas
 *
 * Main SVG canvas that renders the complete LED technical diagram.
 * Composes all canvas sub-components and delegates layout to the store.
 */

import React, { useMemo } from 'react';
import { useDrawingBuilderStore } from '../../stores/drawingBuilderStore';
import {
  SvgDefs,
  ScreenElement,
  NicheElement,
  WoodBackingElement,
  CenterLines,
  IntendedPosition,
  ReceptacleBoxes,
  FloorLine,
  SideViewPanel,
  FlatWallDimensions,
  DimensionBoxes,
} from './canvas';

export function DrawingCanvas() {
  const store = useDrawingBuilderStore();
  const layout = store.getLayout();
  const canRender = store.canRender();

  const {
    screenX,
    screenY,
    screenWidthPx,
    screenHeightPx,
    centerX,
    centerY,
    nicheX,
    nicheY,
    nicheWidthPx,
    nicheHeightPx,
    nicheDimensionWidth,
    nicheDimensionHeight,
    nicheDepth,
    flatDepth,
    woodBackingX,
    woodBackingY,
    woodBackingWidth,
    woodBackingHeight,
    sideViewX,
    sideViewY,
    sideViewHeight,
    sideViewDepth,
    floorLineY,
    viewBoxWidth,
    viewBoxHeight,
    orientedWidth,
    orientedHeight,
  } = layout;

  const depthLabel = useMemo(
    () => (store.isNiche ? nicheDepth.toFixed(2) : flatDepth.toFixed(2)),
    [store.isNiche, nicheDepth, flatDepth],
  );

  // ── Empty state ──────────────────────────────────────────────────────

  if (!canRender) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0 bg-white">
        <div className="text-center text-slate-500 space-y-2">
          <p className="text-2xl font-semibold">LED Technical Drawing</p>
          <p className="text-base">
            Select a <strong>Screen</strong> and <strong>Mount</strong> from the sidebar to begin.
          </p>
        </div>
      </div>
    );
  }

  // ── Rendered diagram ─────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Main drawing area — fills all available space */}
      <div className="flex-1 flex min-h-0 bg-white">
        {/* SVG container — stretches to fill */}
        <div className="flex-1 min-w-0 relative">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            style={{ touchAction: 'none' }}
          >
            <title>LED Display Installation Diagram</title>

            <SvgDefs />

            {/* Grid */}
            <rect width="100%" height="100%" fill="url(#grid)" opacity="0.1" />

            {/* Wood Backing (behind screen) */}
            {store.showWoodBacking && (
              <WoodBackingElement
                x={woodBackingX}
                y={woodBackingY}
                width={woodBackingWidth}
                height={woodBackingHeight}
                screenY={screenY}
                isEdgeToEdge={store.isEdgeToEdge}
              />
            )}

            {/* Receptacle Boxes */}
            {store.showReceptacleBoxes && <ReceptacleBoxes boxes={store.receptacleBoxes} />}

            {/* Niche */}
            {store.isNiche && (
              <NicheElement
                nicheX={nicheX}
                nicheY={nicheY}
                nicheWidthPx={nicheWidthPx}
                nicheHeightPx={nicheHeightPx}
                nicheDimensionWidth={nicheDimensionWidth}
                nicheDimensionHeight={nicheDimensionHeight}
                isHorizontal={store.isHorizontal}
                centerY={centerY}
                sideViewX={sideViewX}
              />
            )}

            {/* Side View */}
            {store.showSideView && (
              <SideViewPanel
                sideViewX={sideViewX}
                sideViewY={sideViewY}
                sideViewHeight={sideViewHeight}
                sideViewDepth={sideViewDepth}
                depthLabel={depthLabel}
              />
            )}

            {/* Screen (main rectangle) */}
            <ScreenElement x={screenX} y={screenY} width={screenWidthPx} height={screenHeightPx} />

            {/* Center Lines */}
            {store.showCenterLines && (
              <CenterLines
                centerX={centerX}
                centerY={centerY}
                screenX={screenX}
                screenY={screenY}
                screenWidthPx={screenWidthPx}
                screenHeightPx={screenHeightPx}
              />
            )}

            {/* Intended Position */}
            {store.showIntendedPosition && <IntendedPosition centerX={centerX} centerY={centerY} />}

            {/* Flat Wall Dimension Lines (when no niche) */}
            {!store.isNiche && (
              <FlatWallDimensions
                screenX={screenX}
                screenY={screenY}
                screenWidthPx={screenWidthPx}
                screenHeightPx={screenHeightPx}
                centerX={centerX}
                centerY={centerY}
                widthValue={orientedWidth.toFixed(2)}
                heightValue={orientedHeight.toFixed(2)}
                isHorizontal={store.isHorizontal}
              />
            )}

            {/* Floor Line */}
            {store.showFloorLine && (
              <FloorLine floorLineY={floorLineY} centerY={centerY} floorDistance={store.floorDistance} />
            )}
          </svg>
        </div>

        {/* Right-side dimension info boxes */}
        <div className="shrink-0 p-3 border-l flex flex-col justify-center">
          <DimensionBoxes
            screenWidth={store.selectedScreen?.dimensions.width ?? 0}
            screenHeight={store.selectedScreen?.dimensions.height ?? 0}
            screenDepth={store.selectedScreen?.dimensions.depth ?? 0}
            isHorizontal={store.isHorizontal}
            isNiche={store.isNiche}
            nicheDimensionWidth={nicheDimensionWidth}
            nicheDimensionHeight={nicheDimensionHeight}
            nicheDepth={nicheDepth}
          />
        </div>
      </div>
    </div>
  );
}
