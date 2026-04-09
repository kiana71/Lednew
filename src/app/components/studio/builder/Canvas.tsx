
import React, { useRef, useState, useEffect } from 'react';
import { useDrawingContext } from './DrawingContext';
import { LETTER_WIDTH, LETTER_HEIGHT, roundToNearestQuarter } from './utils';
import { BOMTable } from './BOMTable';
import { useInventory } from '../../../hooks/useInventory';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

const PAPER_WIDTH_PX = 1056; // 11 inches * 96 DPI
const PAPER_HEIGHT_PX = 816; // 8.5 inches * 96 DPI
export function Canvas() {
  const { 
    state, 
    updateReceptacleBox, 
    orientedScreen,
    scale,
    totalDrawWidth, 
    nicheDimensions,
    selectNote
  } = useDrawingContext();

  const { grid, receptacleBoxes, view, mode, nicheSettings } = state;
  // Use orientedScreen for all layout so vertical/horizontal is respected
  const screen = orientedScreen;
  const { zoom, pan, showLayers } = view;

  const svgRef = useRef<SVGSVGElement>(null);
  
  // Dragging State
  const [draggingBoxId, setDraggingBoxId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [boxStartPos, setBoxStartPos] = useState({ x: 0, y: 0 });
  
  // Smart Guides State
  const [guides, setGuides] = useState<{
    x: number | null; // X position of vertical guide
    y: number | null; // Y position of horizontal guide
    label?: string;
  }>({ x: null, y: null });

  // Calculate drawing dimensions in inches
  const drawingWidthInches = totalDrawWidth;
  const drawingHeightInches = nicheDimensions.height; 

  // Scaled dimensions on paper (inches)
  const scaledWidth = drawingWidthInches * scale;
  const scaledHeight = drawingHeightInches * scale;

  // Instead of moving the drawing up and down based on the floor distance, 
  // we will pin the screen in the center of the available space.
  const startX = (LETTER_WIDTH - scaledWidth) / 2;
  
  // We want the floor line to be permanently fixed visually on the canvas, just above the footer.
  const FIXED_FLOOR_PAPER_Y = 6.0;

  // The floor position relative to the screen's top (which is at Y=0 in the drawing group)
  const floorYPosition = (scaledHeight / 2) + (state.settings.floorDistance * scale);

  // Calculate startY so that the floor line always lands exactly at FIXED_FLOOR_PAPER_Y
  const startY = FIXED_FLOOR_PAPER_Y - floorYPosition;

  // Screen grid calculation
  const screenWidth = screen.width * scale;
  const screenHeight = screen.height * scale;
  
  // Content Offset (for Niche mode)
  const contentOffsetX = (mode === 'NICHE' || mode === 'TABLE_NICHE') ? nicheSettings.clearanceSides * scale : 0;
  const contentOffsetY = (mode === 'NICHE' || mode === 'TABLE_NICHE') ? nicheSettings.clearanceTopBottom * scale : 0;

  // Helper to convert screen pixels to SVG inch coordinates
  const getMousePosInInches = (e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    const inverseCTM = CTM.inverse();
    const x = (clientX * inverseCTM.a) + (clientY * inverseCTM.c) + inverseCTM.e;
    const y = (clientX * inverseCTM.b) + (clientY * inverseCTM.d) + inverseCTM.f;
    
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent, boxId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const pos = getMousePosInInches(e);
    const box = receptacleBoxes.find(b => b.id === boxId);
    
    if (box) {
      setDraggingBoxId(boxId);
      setDragStart(pos);
      setBoxStartPos({ x: box.posX, y: box.posY });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingBoxId) return;
      
      const box = receptacleBoxes.find(b => b.id === draggingBoxId);
      if (!box) return;

      const pos = getMousePosInInches(e);
      const deltaXInches = pos.x - dragStart.x;
      const deltaYInches = pos.y - dragStart.y;

      // Convert visual delta to real-world delta
      const realDeltaX = deltaXInches / scale;
      const realDeltaY = deltaYInches / scale;

      let newPosX = boxStartPos.x + realDeltaX;
      let newPosY = boxStartPos.y + realDeltaY;

      // --- Snapping Logic ---
      const SNAP_THRESHOLD = 0.2; // inches (Real World)
      const GRID_SNAP = 0.5; // Snap to nearest 0.5 inch

      let activeGuides = { x: null as number | null, y: null as number | null };

      // 1. Snap to Grid (Pixel Perfect)
      const gridSnapX = Math.round(newPosX / GRID_SNAP) * GRID_SNAP;
      const gridSnapY = Math.round(newPosY / GRID_SNAP) * GRID_SNAP;

      if (Math.abs(newPosX - gridSnapX) < SNAP_THRESHOLD) {
        newPosX = gridSnapX;
      }
      if (Math.abs(newPosY - gridSnapY) < SNAP_THRESHOLD) {
        newPosY = gridSnapY;
      }

      // 2. Snap to Other Boxes (Alignment)
      receptacleBoxes.forEach(otherBox => {
        if (otherBox.id === draggingBoxId) return;

        // X Alignment
        // Left align
        if (Math.abs(newPosX - otherBox.posX) < SNAP_THRESHOLD) {
          newPosX = otherBox.posX;
          activeGuides.x = newPosX * scale;
        }
        // Right align (Right edge of this box to right edge of other box)
        if (Math.abs((newPosX + box.width) - (otherBox.posX + otherBox.width)) < SNAP_THRESHOLD) {
          newPosX = otherBox.posX + otherBox.width - box.width;
          activeGuides.x = (newPosX + box.width) * scale;
        }
        // Adjacent (Right edge of this box to left edge of other box)
        if (Math.abs((newPosX + box.width) - otherBox.posX) < SNAP_THRESHOLD) {
          newPosX = otherBox.posX - box.width;
          activeGuides.x = otherBox.posX * scale;
        }
        // Adjacent (Left edge of this box to right edge of other box)
        if (Math.abs(newPosX - (otherBox.posX + otherBox.width)) < SNAP_THRESHOLD) {
          newPosX = otherBox.posX + otherBox.width;
          activeGuides.x = (otherBox.posX + otherBox.width) * scale;
        }

        // Y Alignment (Same logic)
        // Top align
        if (Math.abs(newPosY - otherBox.posY) < SNAP_THRESHOLD) {
          newPosY = otherBox.posY;
          activeGuides.y = newPosY * scale;
        }
        // Bottom align
        if (Math.abs((newPosY + box.height) - (otherBox.posY + otherBox.height)) < SNAP_THRESHOLD) {
          newPosY = otherBox.posY + otherBox.height - box.height;
          activeGuides.y = (newPosY + box.height) * scale;
        }
        // Stack (Bottom of this to Top of other)
        if (Math.abs((newPosY + box.height) - otherBox.posY) < SNAP_THRESHOLD) {
          newPosY = otherBox.posY - box.height;
          activeGuides.y = otherBox.posY * scale;
        }
        // Stack (Top of this to Bottom of other)
        if (Math.abs(newPosY - (otherBox.posY + otherBox.height)) < SNAP_THRESHOLD) {
          newPosY = otherBox.posY + otherBox.height;
          activeGuides.y = (otherBox.posY + otherBox.height) * scale;
        }
      });

      // 3. Snap to Screen Edges
      // Screen Left (0)
      if (Math.abs(newPosX) < SNAP_THRESHOLD) {
        newPosX = 0;
        activeGuides.x = 0;
      }
      // Screen Right (Total Width)
      const totalWidth = drawingWidthInches - ((mode === 'NICHE' || mode === 'TABLE_NICHE') ? nicheSettings.clearanceSides * 2 : 0);
      if (Math.abs((newPosX + box.width) - totalWidth) < SNAP_THRESHOLD) {
        newPosX = totalWidth - box.width;
        activeGuides.x = totalWidth * scale;
      }
      
      // Screen Center
      const centerX = totalWidth / 2;
      const boxCenterX = newPosX + (box.width / 2);
      if (Math.abs(boxCenterX - centerX) < SNAP_THRESHOLD) {
        newPosX = centerX - (box.width / 2);
        activeGuides.x = centerX * scale;
      }

      // 4. Hard clamp to screen borders (prevent moving outside)
      const totalHeight = screen.height * grid.rows;
      newPosX = Math.max(0, Math.min(newPosX, totalWidth - box.width));
      newPosY = Math.max(0, Math.min(newPosY, totalHeight - box.height));

      setGuides(activeGuides);
      updateReceptacleBox(draggingBoxId, { posX: newPosX, posY: newPosY });
    };

    const handleMouseUp = () => {
      setDraggingBoxId(null);
      setGuides({ x: null, y: null });
    };

    if (draggingBoxId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingBoxId, dragStart, boxStartPos, scale, updateReceptacleBox, receptacleBoxes, startX, startY, contentOffsetX, contentOffsetY, drawingWidthInches, mode, nicheSettings, screen.height, grid.rows]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden bg-slate-200 p-8 print:p-0 print:bg-white print:overflow-visible">
      <div 
        className="canvas-container bg-white shadow-lg relative transition-transform duration-200 ease-out"
        style={{
          width: `${PAPER_WIDTH_PX}px`,
          height: `${PAPER_HEIGHT_PX}px`,
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center center'
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${LETTER_WIDTH} ${LETTER_HEIGHT}`}
          className="w-full h-full"
          style={{ cursor: draggingBoxId ? 'grabbing' : 'default' }}
        >
          {/* Paper Border/Background */}
          <rect x="0" y="0" width={LETTER_WIDTH} height={LETTER_HEIGHT} fill="white" />

          {/* Welcome Message when no screen/mount selected */}
          {(screen.width === 0 || screen.height === 0 || state.mount.depth === 0) && (
            <g>
              <text
                x={LETTER_WIDTH / 2}
                y={LETTER_HEIGHT / 2 - 0.35}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-800"
                style={{ fontSize: '0.22px', fontWeight: 600 }}
              >
                Welcome to LED Technical Map
              </text>
              <text
                x={LETTER_WIDTH / 2}
                y={LETTER_HEIGHT / 2 + 0.15}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-400"
                style={{ fontSize: '0.12px', fontWeight: 400 }}
              >
                Please select both a Screen and Mount option to view the layout
              </text>
            </g>
          )}

          {/* Drawing Group - Centered */}
          <g transform={`translate(${startX}, ${startY})`}>
            
            {screen.width > 0 && screen.height > 0 && state.mount.depth > 0 && (
              <>
                {/* Center Line and Floor */}
                {showLayers.centerLine && (
                  <g>
                    {/* 
                      1. The Floor Line (Red Box - Fixed Position visually via scale trickery) 
                      Always stretches across the full width of the viewable area.
                    */}
                    <line 
                      x1={-startX + 0.5} // Far left of the paper
                      y1={floorYPosition} 
                      x2={LETTER_WIDTH - startX - 0.5} // Far right of the paper
                      y2={floorYPosition} 
                      stroke="#475569" 
                      strokeWidth={0.02} 
                    />
                
                {/* Floor Hatching */}
                {Array.from({ length: 60 }).map((_, i) => {
                  const xPos = (-startX + 0.5) + (i * 0.2);
                  if (xPos > LETTER_WIDTH - startX - 0.5) return null;
                  return (
                    <line 
                      key={`hatch-${i}`}
                      x1={xPos} 
                      y1={floorYPosition} 
                      x2={xPos - 0.1} 
                      y2={floorYPosition + 0.1} 
                      stroke="#94a3b8" 
                      strokeWidth={0.01} 
                    />
                  );
                })}

                {/* Floor Label */}
                <text 
                  x={-startX + 0.6} 
                  y={floorYPosition - 0.1} 
                  fontSize={0.12} 
                  fill="#64748b"
                  fontFamily="sans-serif"
                >
                  Finished Floor
                </text>

                {/* 
                  2. Left Dimension Line (Red Box - Fixed Position on left edge) 
                  Always pinned to the far left of the paper.
                */}
                {(() => {
                  const dimX = -startX + 0.8;
                  const topY = scaledHeight / 2;
                  const botY = floorYPosition;
                  const midY = topY + (botY - topY) * 0.25;
                  const zz = 0.06; // zigzag half-width
                  const zzH = 0.08; // zigzag step height
                  const zzTop = midY - zzH * 2;
                  const zzBot = midY + zzH * 2;
                  return (
                    <g transform={`translate(${dimX}, 0)`}>
                      {/* Upper segment — top tick to zigzag start */}
                      <line x1="0" y1={topY} x2="0" y2={zzTop} stroke="#64748b" strokeWidth={0.01} />
                      {/* Zigzag break */}
                      <polyline
                        points={[
                          `0,${zzTop}`,
                          `${zz},${zzTop + zzH * 0.5}`,
                          `${-zz},${zzTop + zzH * 1.5}`,
                          `${zz},${zzTop + zzH * 2.5}`,
                          `${-zz},${zzTop + zzH * 3.5}`,
                        ].join(' ')}
                        stroke="#64748b"
                        strokeWidth={0.01}
                        fill="none"
                      />
                      {/* Lower segment — zigzag end to floor */}
                      <line x1="0" y1={zzBot} x2="0" y2={botY} stroke="#64748b" strokeWidth={0.01} />
                      {/* Arrow heads/ticks */}
                      <line x1="-0.05" y1={topY} x2="0.05" y2={topY} stroke="#64748b" strokeWidth={0.01} />
                      <line x1="-0.05" y1={botY} x2="0.05" y2={botY} stroke="#64748b" strokeWidth={0.01} />
                      {/* Distance Text */}
                      <text
                        x="-0.15"
                        y={midY}
                        textAnchor="middle"
                        fontSize={0.12}
                        fill="#64748b"
                        transform={`rotate(-90, -0.15, ${midY})`}
                      >
                        {state.settings.floorDistance}" AFF to Center
                      </text>
                    </g>
                  );
                })()}

                {/* 
                  3. Center Lines (Green Boxes - Dynamic Length) 
                  These stretch from the screen center out to meet the floor/dimension lines.
                */}
                
                {/* Center Mark Symbol at exact center of screens */}
                <circle cx={scaledWidth / 2} cy={scaledHeight / 2} r={0.05} fill="none" stroke="#64748b" strokeWidth={0.015} />

                {/* Vertical Center Line (Drops from screen to the floor) */}
                <line 
                  x1={scaledWidth / 2} 
                  y1={-0.8} 
                  x2={scaledWidth / 2} 
                  y2={floorYPosition} 
                  stroke="#94a3b8" 
                  strokeWidth={0.015} 
                  strokeDasharray="0.1, 0.05, 0.02, 0.05" 
                />
                
                {/* Horizontal Center Line (Stretches from left dimension line to the screen center) */}
                <line 
                  x1={-startX + 0.8} // Starts exactly at the fixed left dimension line
                  y1={scaledHeight / 2} 
                  x2={(scaledWidth / 2) - 0.1} // Ends at the center mark of the screen
                  y2={scaledHeight / 2} 
                  stroke="#94a3b8" 
                  strokeWidth={0.015} 
                  strokeDasharray="0.1, 0.05, 0.02, 0.05" 
                />

              </g>
            )}

            {/* Niche Outline */}
            {showLayers.niche && (mode === 'NICHE' || mode === 'TABLE_NICHE') && (
              <g>
                {/* Subtle hatching between niche outline and screen edges */}
                <defs>
                  <pattern id="nicheHatch" width="0.15" height="0.15" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="0.15" stroke="#3b82f6" strokeWidth="0.003" opacity="0.2" />
                  </pattern>
                </defs>
                
                {/* Left Gap */}
                <rect x="0" y="0" width={contentOffsetX} height={scaledHeight} fill="url(#nicheHatch)" />
                {/* Right Gap */}
                <rect x={scaledWidth - contentOffsetX} y="0" width={contentOffsetX} height={scaledHeight} fill="url(#nicheHatch)" />
                {/* Top Gap */}
                <rect x={contentOffsetX} y="0" width={scaledWidth - (contentOffsetX * 2)} height={contentOffsetY} fill="url(#nicheHatch)" />
                {/* Bottom Gap */}
                <rect x={contentOffsetX} y={scaledHeight - contentOffsetY} width={scaledWidth - (contentOffsetX * 2)} height={contentOffsetY} fill="url(#nicheHatch)" />

                {/* Thin, light blue dashed outline */}
                <rect
                  x="0"
                  y="0"
                  width={scaledWidth}
                  height={scaledHeight}
                  fill="none"
                  stroke="#3b82f6" // lighter blue (tailwind blue-500)
                  strokeWidth={0.01} // thinner line
                  strokeDasharray="0.1, 0.05" // refined dash pattern
                  opacity="0.6"
                />
                <text
                  x={scaledWidth / 2}
                  y="-0.15"
                  textAnchor="middle"
                  fontSize={0.12}
                  fill="#3b82f6"
                  fontWeight="bold"
                  opacity="0.8"
                >
                  Niche Boundary
                </text>
              </g>
            )}

            {/* Wood Backing */}
            {showLayers.woodBacking && state.settings.woodBacking && (
              <g transform={`translate(${contentOffsetX}, ${contentOffsetY})`}>
                <defs>
                  <pattern id="woodHatch" width="0.1" height="0.1" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="0.1" stroke="#d97706" strokeWidth="0.005" opacity="0.3" />
                  </pattern>
                </defs>
                <rect
                  x={state.settings.woodBackingClearance * scale}
                  y={state.settings.woodBackingClearance * scale}
                  width={Math.max(0, (screen.width * grid.cols * scale) - (state.settings.woodBackingClearance * 2 * scale))}
                  height={Math.max(0, (screen.height * grid.rows * scale) - (state.settings.woodBackingClearance * 2 * scale))}
                  fill="url(#woodHatch)"
                  stroke="#d97706"
                  strokeWidth={0.015}
                  strokeDasharray="0.1"
                  opacity="0.8"
                />
                <text
                  x={(screen.width * grid.cols * scale) / 2}
                  y={(state.settings.woodBackingClearance * scale) + 0.2}
                  textAnchor="middle"
                  fontSize={0.12}
                  fill="#d97706"
                  fontWeight="bold"
                >
                  Wood Backing
                </text>
                <text
                  x={(screen.width * grid.cols * scale) / 2}
                  y={(state.settings.woodBackingClearance * scale) + 0.35}
                  textAnchor="middle"
                  fontSize={0.08}
                  fill="#d97706"
                >
                  {state.settings.woodBackingClearance === 0 
                    ? "(Edge to Edge)" 
                    : `${state.settings.woodBackingClearance}" from screen edges`}
                </text>
              </g>
            )}

            {/* Screens Grid */}
            <g transform={`translate(${contentOffsetX}, ${contentOffsetY})`}>
              {Array.from({ length: grid.rows }).map((_, r) => (
                <g key={`row-${r}`} transform={`translate(0, ${r * screenHeight})`}>
                  {Array.from({ length: grid.cols }).map((_, c) => (
                    <g key={`col-${c}`} transform={`translate(${c * screenWidth}, 0)`}>
                      <rect
                        width={screenWidth}
                        height={screenHeight}
                        fill="rgba(30, 41, 59, 0.15)" // reduced darkness to make hatching/text more readable
                        stroke="#475569" // slate-600 border
                        strokeWidth={0.02}
                      />
                      <line x1="0" y1="0" x2={screenWidth} y2={screenHeight} stroke="#64748b" strokeWidth={0.01} opacity="0.3" />
                      <line x1={screenWidth} y1="0" x2="0" y2={screenHeight} stroke="#64748b" strokeWidth={0.01} opacity="0.3" />
                      
                      {/* Alias / Model Name on the bottom left of each screen */}
                      <text 
                        x="0.1" 
                        y={screenHeight - 0.1} 
                        fontSize={0.12} 
                        fill="#94a3b8"
                        fontFamily="sans-serif"
                      >
                        {screen.alias || screen.model || 'Display'}
                      </text>
                    </g>
                  ))}
                </g>
              ))}
            </g>

            {/* Receptacle Boxes */}
            {showLayers.receptacleBox && receptacleBoxes.map((box) => (
              <g 
                key={box.id}
                transform={`translate(${contentOffsetX + (box.posX * scale)}, ${contentOffsetY + (box.posY * scale)})`}
                style={{ cursor: 'grab' }}
                onMouseDown={(e) => handleMouseDown(e, box.id)}
              >
                {/* Box Background */}
                <rect
                  width={box.width * scale}
                  height={box.height * scale}
                  fill={draggingBoxId === box.id ? "rgba(239, 68, 68, 0.1)" : "rgba(241, 245, 249, 0.8)"}
                  stroke={draggingBoxId === box.id ? "#ef4444" : "#94a3b8"}
                  strokeWidth={0.015}
                  rx={0.05}
                />
                
                {/* Inner Cross/Detailing to indicate it's a box */}
                <rect 
                  x={(box.width * scale) * 0.1}
                  y={(box.height * scale) * 0.1}
                  width={(box.width * scale) * 0.8}
                  height={(box.height * scale) * 0.8}
                  fill="none"
                  stroke={draggingBoxId === box.id ? "#ef4444" : "#cbd5e1"}
                  strokeWidth={0.01}
                  rx={0.02}
                />

                {/* Lighting/Power Icon - Perfectly centered and scaled */}
                <svg 
                  x={(box.width * scale) / 2 - (Math.min(box.width, box.height) * scale * 0.4) / 2} 
                  y={(box.height * scale) / 2 - (Math.min(box.width, box.height) * scale * 0.4) / 2} 
                  width={Math.min(box.width, box.height) * scale * 0.4} 
                  height={Math.min(box.width, box.height) * scale * 0.4} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={draggingBoxId === box.id ? "#ef4444" : "#94a3b8"} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={draggingBoxId === box.id ? "rgba(239, 68, 68, 0.2)" : "rgba(148, 163, 184, 0.2)"} />
                </svg>
                
                {/* Distance to edges lines (Smart Guides for this box) */}
                {draggingBoxId === box.id && (
                  <g>
                    {/* Line to Left Edge of Screen Area */}
                    <line 
                      x1={-box.posX * scale} 
                      y1={(box.height * scale) / 2} 
                      x2={0} 
                      y2={(box.height * scale) / 2} 
                      stroke="red" 
                      strokeWidth={0.01} 
                      strokeDasharray="0.05" 
                    />
                    <text 
                      x={(-box.posX * scale) / 2} 
                      y={(box.height * scale) / 2 - 0.05} 
                      textAnchor="middle" 
                      fontSize={0.12} 
                      fill="red"
                    >
                      {box.posX.toFixed(1)}"
                    </text>

                    {/* Line to Top Edge of Screen Area */}
                    <line 
                      x1={(box.width * scale) / 2} 
                      y1={-box.posY * scale} 
                      x2={(box.width * scale) / 2} 
                      y2={0} 
                      stroke="red" 
                      strokeWidth={0.01} 
                      strokeDasharray="0.05" 
                    />
                    <text 
                      x={(box.width * scale) / 2 + 0.05} 
                      y={(-box.posY * scale) / 2} 
                      textAnchor="start" 
                      fontSize={0.12} 
                      fill="red"
                    >
                      {box.posY.toFixed(1)}"
                    </text>

                    {/* Line to Right Edge of Screen Area */}
                    <line 
                      x1={box.width * scale} 
                      y1={(box.height * scale) / 2} 
                      x2={((screen.width * grid.cols) - box.posX) * scale} 
                      y2={(box.height * scale) / 2} 
                      stroke="red" 
                      strokeWidth={0.01} 
                      strokeDasharray="0.05" 
                    />
                    <text 
                      x={((box.width * scale) + (((screen.width * grid.cols) - box.posX) * scale)) / 2} 
                      y={(box.height * scale) / 2 - 0.05} 
                      textAnchor="middle" 
                      fontSize={0.12} 
                      fill="red"
                    >
                      {((screen.width * grid.cols) - (box.posX + box.width)).toFixed(1)}"
                    </text>

                    {/* Line to Bottom Edge of Screen Area */}
                    <line 
                      x1={(box.width * scale) / 2} 
                      y1={box.height * scale} 
                      x2={(box.width * scale) / 2} 
                      y2={((screen.height * grid.rows) - box.posY) * scale} 
                      stroke="red" 
                      strokeWidth={0.01} 
                      strokeDasharray="0.05" 
                    />
                    <text 
                      x={(box.width * scale) / 2 + 0.05} 
                      y={((box.height * scale) + (((screen.height * grid.rows) - box.posY) * scale)) / 2} 
                      textAnchor="start" 
                      fontSize={0.12} 
                      fill="red"
                    >
                      {((screen.height * grid.rows) - (box.posY + box.height)).toFixed(1)}"
                    </text>
                  </g>
                )}
              </g>
            ))}

            {/* Dimensions Lines */}
            {showLayers.dimensions && (
              <g opacity="0.5">
                {/* Overall Width Dimension */}
                <line 
                  x1="0" 
                  y1={scaledHeight + 0.3} 
                  x2={scaledWidth} 
                  y2={scaledHeight + 0.3} 
                  stroke="black" 
                  strokeWidth={0.01} 
                />
                <line x1="0" y1={scaledHeight + 0.2} x2="0" y2={scaledHeight + 0.4} stroke="black" strokeWidth={0.01} />
                <line x1={scaledWidth} y1={scaledHeight + 0.2} x2={scaledWidth} y2={scaledHeight + 0.4} stroke="black" strokeWidth={0.01} />
                <text 
                  x={scaledWidth / 2} 
                  y={scaledHeight + 0.45} 
                  textAnchor="middle" 
                  fontSize={0.12}
                  fill="#64748b"
                >
                  {(mode === 'NICHE' || mode === 'TABLE_NICHE') ? 'Niche Width' : 'Width'}
                </text>
                <text 
                  x={scaledWidth / 2} 
                  y={scaledHeight + 0.6} 
                  textAnchor="middle" 
                  fontSize={0.15}
                  fill="#334155"
                  fontWeight="bold"
                >
                  {drawingWidthInches.toFixed(2)}"
                </text>

                {/* Overall Height Dimension */}
                <line 
                  x1={-0.3} 
                  y1="0" 
                  x2={-0.3} 
                  y2={scaledHeight} 
                  stroke="black" 
                  strokeWidth={0.01} 
                />
                <line x1={-0.2} y1="0" x2={-0.4} y2="0" stroke="black" strokeWidth={0.01} />
                <line x1={-0.2} y1={scaledHeight} x2={-0.4} y2={scaledHeight} stroke="black" strokeWidth={0.01} />
                <g transform={`translate(-0.5, ${scaledHeight / 2})`}>
                  <text 
                    x="0" 
                    y="-0.2" 
                    textAnchor="middle" 
                    fontSize={0.12}
                    fill="#64748b"
                    transform="rotate(-90)"
                  >
                    {(mode === 'NICHE' || mode === 'TABLE_NICHE') ? 'Niche Height' : 'Height'}
                  </text>
                  <text 
                    x="0" 
                    y="0.2" 
                    textAnchor="middle" 
                    fontSize={0.15}
                    fill="#334155"
                    fontWeight="bold"
                    transform="rotate(-90)"
                  >
                    {drawingHeightInches.toFixed(2)}"
                  </text>
                </g>
              </g>
            )}

            {/* Side View Panel - Rendered far to the right, only when active and 1x1 grid and has screen */}
            {showLayers.sideView && grid.rows === 1 && grid.cols === 1 && screen.width > 0 && (
              <g transform={`translate(${scaledWidth + 1.5}, ${contentOffsetY})`}>
                
                {(() => {
                  const hasMount = state.mount.depth > 0 && state.mount.model;
                  const mountDepth = hasMount ? state.mount.depth : 0;
                  // Use real height from DB if available, otherwise fallback to a proportional 40% of screen height
                  const mountHeightRaw = state.mount.height && state.mount.height > 0 ? state.mount.height : (screen.height * 0.4);
                  const mountHeight = mountHeightRaw * scale;
                  
                  const hasPlayer = state.mediaPlayer.position === 'BEHIND_SCREEN' && state.mediaPlayer.depth > 0 && state.mediaPlayer.model;
                  const playerDepth = hasPlayer ? state.mediaPlayer.depth : 0;
                  // Use real height from DB if available, otherwise fallback to 15% of screen height
                  const playerHeightRaw = state.mediaPlayer.height && state.mediaPlayer.height > 0 ? state.mediaPlayer.height : (screen.height * 0.15);
                  const playerHeight = playerHeightRaw * scale;
                  
                  const equipmentGap = Math.max(mountDepth, playerDepth);
                  const totalEquipmentDepth = screen.depth + equipmentGap;
                  const isNiche = mode === 'NICHE' || mode === 'TABLE_NICHE';
                  const depthVariant = isNiche ? state.nicheSettings.depthVariant : 0;
                  const totalNicheDepth = totalEquipmentDepth + depthVariant;
                  const maxDepthForTitle = Math.max(totalNicheDepth, totalEquipmentDepth);

                  return (
                    <g>
                      {/* 1. Wall Line */}
                      {/* If niche, wall is flush with screen front. If surface mount, wall is at 0 (behind equipment) */}
                      <line 
                        x1={isNiche ? (depthVariant * scale + equipmentGap * scale + screen.depth * scale) : 0} 
                        y1={-0.5} 
                        x2={isNiche ? (depthVariant * scale + equipmentGap * scale + screen.depth * scale) : 0} 
                        y2={scaledHeight + (isNiche ? nicheSettings.clearanceTopBottom * scale : 0) + 1.2} 
                        stroke="#94a3b8" 
                        strokeWidth={0.02} 
                        opacity={0.5} // Made wall line more transparent
                      />
                      <text 
                        x={(isNiche ? (depthVariant * scale + equipmentGap * scale + screen.depth * scale) : 0)} 
                        y={-0.6} // Moved wall text above the tip of the line
                        textAnchor="middle" 
                        fontSize={0.12} 
                        fill="#94a3b8"
                      >
                        {mode === 'TABLE_NICHE' ? 'Table Surface' : 'Wall'}
                      </text>

                      {/* Optional Niche Side View Background */}
                      {isNiche && (
                        <g>
                          {/* Niche cut into wall */}
                          <rect 
                            x={0} 
                            y={-nicheSettings.clearanceTopBottom * scale} 
                            width={totalNicheDepth * scale} 
                            height={scaledHeight + (nicheSettings.clearanceTopBottom * 2 * scale)} 
                            fill="#e2e8f0" 
                            stroke="#94a3b8" 
                            strokeWidth={0.01} 
                            strokeDasharray="0.05"
                          />
                          <text 
                            x={(totalNicheDepth * scale) / 2} 
                            y={-nicheSettings.clearanceTopBottom * scale - 0.1} 
                            textAnchor="middle" 
                            fontSize={0.12} 
                            fill="#64748b"
                          >
                            Niche Boundary
                          </text>
                          
                          {/* Niche Depth Marker */}
                          <g opacity="0.7">
                            <line 
                              x1={0} 
                              y1={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.5} 
                              x2={totalNicheDepth * scale} 
                              y2={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.5} 
                              stroke="#64748b" 
                              strokeWidth={0.01} 
                            />
                            <line x1={0} y1={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.45} x2={0} y2={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.55} stroke="#64748b" strokeWidth={0.01} />
                            <line x1={totalNicheDepth * scale} y1={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.45} x2={totalNicheDepth * scale} y2={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.55} stroke="#64748b" strokeWidth={0.01} />
                            <text 
                              x={(totalNicheDepth * scale) / 2} 
                              y={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.65} 
                              textAnchor="middle" 
                              fontSize={0.12}
                              fill="#64748b"
                            >
                              {roundToNearestQuarter(totalNicheDepth).toFixed(2)}" Niche Depth
                            </text>
                          </g>
                        </g>
                      )}

                      {/* Wood Backing (Side View representation) */}
                      {/* Must be rendered AFTER Niche Background so it is visible inside it */}
                      {showLayers.woodBacking && state.settings.woodBacking && (
                        <g>
                          <rect 
                            x={isNiche ? 0 : 0} // In niche mode, it sits at 0 (the back of the niche). In surface mode, it sits at 0 (the front of the wall, behind equipment)
                            y={state.settings.woodBackingClearance * scale}
                            width={0.03} // Extremely thin layer
                            height={Math.max(0, scaledHeight - (state.settings.woodBackingClearance * 2 * scale))}
                            fill="#d97706"
                            opacity="0.8"
                          />
                          {/* Indicator line for Wood Backing */}
                          <line 
                            x1={isNiche ? 0 : 0} 
                            y1={state.settings.woodBackingClearance * scale + 0.5} 
                            x2={-0.4} 
                            y2={state.settings.woodBackingClearance * scale + 0.5} 
                            stroke="#d97706" 
                            strokeWidth={0.01} 
                            opacity="0.8"
                          />
                          <text 
                            x={-0.45} 
                            y={state.settings.woodBackingClearance * scale + 0.53} 
                            textAnchor="end" 
                            fontSize={0.08} 
                            fill="#d97706"
                          >
                            Wood Backing
                          </text>
                        </g>
                      )}

                      {/* 2. Mount & Player (Rendered behind screen in available space) */}
                      {hasMount && (
                        <g>
                          <rect 
                            x={depthVariant * scale + equipmentGap * scale - mountDepth * scale} 
                            y={(scaledHeight / 2) - (mountHeight / 2)} 
                            width={mountDepth * scale} 
                            height={mountHeight} 
                            fill="#334155" // Darker neutral slate for mount
                          />
                          {/* Indicator line for Mount */}
                          <line 
                            x1={depthVariant * scale + equipmentGap * scale - mountDepth * scale} 
                            y1={scaledHeight / 2} 
                            x2={-0.4} 
                            y2={scaledHeight / 2} 
                            stroke="#475569" 
                            strokeWidth={0.01} 
                            opacity="0.8"
                          />
                          <text 
                            x={-0.45} 
                            y={scaledHeight / 2} 
                            textAnchor="end"
                            alignmentBaseline="middle"
                            fontSize={0.12} 
                            fill="#475569"
                          >
                            Mount
                          </text>
                        </g>
                      )}

                      {/* 3. Media Player */}
                      {hasPlayer && (
                        <g>
                          <rect 
                            x={depthVariant * scale + equipmentGap * scale - playerDepth * scale} 
                            y={(scaledHeight / 2) + (scaledHeight * 0.05)} // Slight gap below center
                            width={playerDepth * scale} 
                            height={playerHeight} 
                            fill="#64748b" // Lighter neutral slate for player
                            rx={0.02} // Slight rounded corners for a device look
                            opacity={0.6} // Made media player shape more transparent
                          />
                          {/* Indicator line for Media Player */}
                          <line 
                            x1={depthVariant * scale + equipmentGap * scale - playerDepth * scale} 
                            y1={(scaledHeight / 2) + (scaledHeight * 0.05) + (playerHeight / 2)} 
                            x2={-0.4} 
                            y2={(scaledHeight / 2) + (scaledHeight * 0.05) + (playerHeight / 2)} 
                            stroke="#64748b" 
                            strokeWidth={0.01} 
                            opacity="0.8"
                          />
                          <text 
                            x={-0.45} 
                            y={(scaledHeight / 2) + (scaledHeight * 0.05) + (playerHeight / 2)} 
                            textAnchor="end"
                            alignmentBaseline="middle"
                            fontSize={0.12} 
                            fill="#64748b"
                          >
                            Player
                          </text>
                        </g>
                      )}
                      
                      {/* 4. Screen Side Profile */}
                      <rect 
                        x={depthVariant * scale + equipmentGap * scale} 
                        y={0} 
                        width={screen.depth * scale} 
                        height={scaledHeight} 
                        fill="#1e293b" 
                      />
                      {/* Indicator line for Screen */}
                      <line 
                        x1={depthVariant * scale + equipmentGap * scale} 
                        y1={scaledHeight * 0.1} 
                        x2={-0.4} 
                        y2={scaledHeight * 0.1} 
                        stroke="#1e293b" 
                        strokeWidth={0.01} 
                        opacity="0.8"
                      />
                      <text 
                        x={-0.45} 
                        y={scaledHeight * 0.1} 
                        textAnchor="end"
                        alignmentBaseline="middle"
                        fontSize={0.12} 
                        fill="#1e293b"
                      >
                        Screen
                      </text>

                      {/* Total Depth Dimension Marker */}
                      <g opacity="0.7">
                        <line 
                          x1={depthVariant * scale} 
                          y1={scaledHeight + (isNiche ? nicheSettings.clearanceTopBottom * scale : 0) + 0.3} 
                          x2={depthVariant * scale + totalEquipmentDepth * scale} 
                          y2={scaledHeight + (isNiche ? nicheSettings.clearanceTopBottom * scale : 0) + 0.3} 
                          stroke="black" 
                          strokeWidth={0.01} 
                        />
                        <line x1={depthVariant * scale} y1={scaledHeight + (isNiche ? nicheSettings.clearanceTopBottom * scale : 0) + 0.25} x2={depthVariant * scale} y2={scaledHeight + (isNiche ? nicheSettings.clearanceTopBottom * scale : 0) + 0.35} stroke="black" strokeWidth={0.01} />
                        <line x1={depthVariant * scale + totalEquipmentDepth * scale} y1={scaledHeight + (isNiche ? nicheSettings.clearanceTopBottom * scale : 0) + 0.25} x2={depthVariant * scale + totalEquipmentDepth * scale} y2={scaledHeight + (isNiche ? nicheSettings.clearanceTopBottom * scale : 0) + 0.35} stroke="black" strokeWidth={0.01} />
                        <text 
                          x={depthVariant * scale + (totalEquipmentDepth * scale) / 2} 
                          y={scaledHeight + (isNiche ? nicheSettings.clearanceTopBottom * scale : 0) + 0.45} 
                          textAnchor="middle" 
                          fontSize={0.12}
                          fill="#334155"
                          fontWeight="bold"
                        >
                          {roundToNearestQuarter(totalEquipmentDepth).toFixed(2)}" Total Depth
                        </text>
                      </g>

                      {/* Depth Variant (Gap) Marker if applicable */}
                      {isNiche && depthVariant > 0 && (
                        <g opacity="0.7">
                          <line 
                            x1={0} 
                            y1={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.15} 
                            x2={depthVariant * scale} 
                            y2={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.15} 
                            stroke="#eab308" 
                            strokeWidth={0.01} 
                          />
                          <line x1={0} y1={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.1} x2={0} y2={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.2} stroke="#eab308" strokeWidth={0.01} />
                          <line x1={depthVariant * scale} y1={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.1} x2={depthVariant * scale} y2={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.2} stroke="#eab308" strokeWidth={0.01} />
                          <text 
                            x={(depthVariant * scale) / 2} 
                            y={scaledHeight + (nicheSettings.clearanceTopBottom * scale) + 0.1} 
                            textAnchor="middle" 
                            fontSize={0.1}
                            fill="#eab308"
                          >
                            {depthVariant.toFixed(1)}" Gap
                          </text>
                        </g>
                      )}

                      {/* Title at the bottom */}
                      <text 
                        x={(isNiche ? (depthVariant * scale + equipmentGap * scale + screen.depth * scale) : 0)} 
                        y={scaledHeight + (isNiche ? nicheSettings.clearanceTopBottom * scale : 0) + 1.8} 
                        textAnchor="middle" 
                        fontSize={0.15} 
                        fill="#0f172a" 
                        fontWeight="bold"
                      >
                        Side View
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}
            </>
            )}

          </g>
          
          {/* Global Smart Guides (Visual Feedback) - Restricted to Screen Bounds */}
          <g className="smart-guide" transform={`translate(${startX + contentOffsetX}, ${startY + contentOffsetY})`}>
            {guides.x !== null && (
              <line 
                x1={guides.x} 
                y1={0} 
                x2={guides.x} 
                y2={screen.height * grid.rows * scale} 
                stroke="cyan" 
                strokeWidth={0.02} 
              />
            )}
            {guides.y !== null && (
              <line 
                x1={0} 
                y1={guides.y} 
                x2={screen.width * grid.cols * scale} 
                y2={guides.y} 
                stroke="cyan" 
                strokeWidth={0.02} 
              />
            )}
          </g>
        </svg>

        {/* Footer Overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 flex flex-col gap-2 pointer-events-none">
          {/* Top Row: Notes & BOM */}
          <div className="flex gap-4">
            {/* Left: Notes */}
            <div className="flex-1 h-36 pointer-events-auto border border-slate-300 rounded p-2 bg-white/95 overflow-hidden flex flex-col relative">
              <div className="flex items-center justify-between mb-1 shrink-0">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Installation Notes</h3>
                {state.notes.length > 0 && (
                  <Select 
                    value={state.selectedNoteId || 'none'} 
                    onValueChange={(val) => selectNote(val === 'none' ? null : val)}
                  >
                    <SelectTrigger className="h-5 w-32 text-[9px] px-1 py-0 bg-transparent border-slate-200">
                      <SelectValue placeholder="Select note" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {state.notes.map(note => (
                        <SelectItem key={note.id} value={note.id}>{note.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div
                className="flex-1 overflow-hidden text-[10px] prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
                dangerouslySetInnerHTML={{ 
                  __html: state.selectedNoteId 
                    ? (state.notes.find(n => n.id === state.selectedNoteId)?.content || '')
                    : '<p class="text-slate-400 italic">No note selected.</p>'
                }}
              />
            </div>
            {/* Right: BOM */}
            <div className="w-[55%] pointer-events-auto border border-slate-300 rounded px-2 pt-2 pb-0 bg-white/95 flex flex-col">
              <div className="flex items-center justify-between mb-1 shrink-0">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bill of Materials</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dimensions (in)</span>
              </div>
              <div>
                <BOMTable />
              </div>
            </div>
          </div>

          {/* Bottom Row: Title Block (Full Width) */}
          <div className="w-full h-8 pointer-events-auto border border-slate-300 rounded px-3 py-1 bg-white/95 flex items-center justify-between">
            <div className="text-[9px] text-slate-600 flex items-center gap-2">
              <strong className="text-[10px] text-slate-900 tracking-tight">Signcast Media Inc.</strong>
              <span className="text-slate-300">|</span>
              <span>+1 416-900-2233</span>
              <span className="text-slate-300">|</span>
              <span>361 Steelcase Rd W Unit 1, Markham, ON</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[9px] text-slate-900 uppercase">Date:</span>
                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[9px] text-slate-900 uppercase">DWG NO:</span>
                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{state.settings.drawingNumber || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[9px] text-slate-900 uppercase">REV:</span>
                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{state.settings.revision || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

