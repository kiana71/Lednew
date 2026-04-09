/**
 * Receptacle Boxes — renders all positioned receptacle boxes inside the LED boundary.
 */

import React from 'react';
import { useDrawingBuilderStore } from '../../../stores/drawingBuilderStore';
import type { ReceptacleBoxInstance } from '../../../stores/drawingBuilderStore';

interface ReceptacleBoxesProps {
  boxes: ReceptacleBoxInstance[];
  svgRef: React.RefObject<SVGSVGElement | null>;
  readOnly?: boolean;
  boundary: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
}

/** Simple electrical outlet SVG icon (inline, no external image). */
const ElectricalIcon: React.FC<{ x: number; y: number; w: number; h: number }> = ({ x, y, w, h }) => {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) * 0.3;
  return (
    <g>
      {/* Outer circle */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="black" strokeWidth="0.8" />
      {/* Left slot */}
      <line x1={cx - r * 0.3} y1={cy - r * 0.4} x2={cx - r * 0.3} y2={cy + r * 0.1} stroke="black" strokeWidth="1.2" />
      {/* Right slot */}
      <line x1={cx + r * 0.3} y1={cy - r * 0.4} x2={cx + r * 0.3} y2={cy + r * 0.1} stroke="black" strokeWidth="1.2" />
      {/* Ground */}
      <circle cx={cx} cy={cy + r * 0.35} r={r * 0.12} fill="black" />
    </g>
  );
};

export const ReceptacleBoxes: React.FC<ReceptacleBoxesProps> = React.memo(({ boxes, svgRef, readOnly = false, boundary, scaleFactor }) => {
  const snapReceptacleBoxToNearestSlot = useDrawingBuilderStore((s) => s.snapReceptacleBoxToNearestSlot);
  const [activeBoxId, setActiveBoxId] = React.useState<number | null>(null);

  const dragRef = React.useRef<{
    boxId: number | null;
    startSvgX: number;
    startSvgY: number;
    startBoxX: number;
    startBoxY: number;
  }>({
    boxId: null,
    startSvgX: 0,
    startSvgY: 0,
    startBoxX: 0,
    startBoxY: 0,
  });

  const clientToSVGCoordinates = React.useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };

    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };

    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const transformed = pt.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  }, [svgRef]);

  const handlePointerMove = React.useCallback((event: PointerEvent) => {
    const { boxId, startSvgX, startSvgY, startBoxX, startBoxY } = dragRef.current;
    if (!boxId) return;

    const point = clientToSVGCoordinates(event.clientX, event.clientY);
    const deltaX = point.x - startSvgX;
    const deltaY = point.y - startSvgY;

    const targetX = startBoxX + deltaX;
    const targetY = startBoxY + deltaY;

    snapReceptacleBoxToNearestSlot(boxId, targetX, targetY);
  }, [clientToSVGCoordinates, snapReceptacleBoxToNearestSlot]);

  const endDrag = React.useCallback(() => {
    dragRef.current.boxId = null;
    setActiveBoxId(null);
    document.removeEventListener('pointermove', handlePointerMove);
  }, [handlePointerMove]);

  React.useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
    };
  }, [handlePointerMove]);

  const handlePointerDown = (e: React.PointerEvent<SVGRectElement>, box: ReceptacleBoxInstance) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();

    if (!svgRef.current) return;

    const point = clientToSVGCoordinates(e.clientX, e.clientY);
    dragRef.current = {
      boxId: box.id,
      startSvgX: point.x,
      startSvgY: point.y,
      startBoxX: box.x,
      startBoxY: box.y,
    };
    setActiveBoxId(box.id);

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', endDrag, { once: true } as any);
    document.addEventListener('pointercancel', endDrag, { once: true } as any);
  };

  const activeBox = activeBoxId ? boxes.find((b) => b.id === activeBoxId) : null;

  return (
    <g>
      {activeBox && (
        <g pointerEvents="none">
          {/* Left distance guide */}
          <line
            x1={boundary.x}
            y1={activeBox.y + activeBox.height / 2}
            x2={activeBox.x}
            y2={activeBox.y + activeBox.height / 2}
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={boundary.x + (activeBox.x - boundary.x) / 2}
            y={activeBox.y + activeBox.height / 2 - 6}
            textAnchor="middle"
            fontSize="11"
            fill="#dc2626"
            fontWeight="600"
          >
            Left: {((activeBox.x - boundary.x) / Math.max(scaleFactor, 0.001)).toFixed(2)}"
          </text>

          {/* Top distance guide */}
          <line
            x1={activeBox.x + activeBox.width / 2}
            y1={boundary.y}
            x2={activeBox.x + activeBox.width / 2}
            y2={activeBox.y}
            stroke="#dc2626"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={activeBox.x + activeBox.width / 2 + 6}
            y={boundary.y + (activeBox.y - boundary.y) / 2}
            fontSize="11"
            fill="#dc2626"
            fontWeight="600"
          >
            Top: {((activeBox.y - boundary.y) / Math.max(scaleFactor, 0.001)).toFixed(2)}"
          </text>
        </g>
      )}

      {boxes.map((box) => (
        <g
          key={box.id}
          onPointerDown={(e) => handlePointerDown(e as unknown as React.PointerEvent<SVGRectElement>, box)}
          style={{ cursor: readOnly ? 'default' : 'grab' }}
        >
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill="white"
            stroke="black"
            strokeWidth="1.5"
            strokeDasharray="4"
          />
          <g pointerEvents="none">
            <ElectricalIcon x={box.x} y={box.y} w={box.width} h={box.height} />
          </g>
        </g>
      ))}
    </g>
  );
});

ReceptacleBoxes.displayName = 'ReceptacleBoxes';
