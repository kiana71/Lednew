/**
 * Receptacle Boxes — renders all positioned receptacle boxes inside the LED boundary.
 */

import React from 'react';
import type { ReceptacleBoxInstance } from '../../../stores/drawingBuilderStore';

interface ReceptacleBoxesProps {
  boxes: ReceptacleBoxInstance[];
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

export const ReceptacleBoxes: React.FC<ReceptacleBoxesProps> = React.memo(({ boxes }) => (
  <g>
    {boxes.map((box) => (
      <g key={box.id}>
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
        <ElectricalIcon x={box.x} y={box.y} w={box.width} h={box.height} />
      </g>
    ))}
  </g>
));

ReceptacleBoxes.displayName = 'ReceptacleBoxes';
