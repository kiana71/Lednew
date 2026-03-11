/**
 * SVG Definitions — arrow markers, grid pattern, and reusable defs.
 */

import React from 'react';

export const SvgDefs: React.FC = React.memo(() => (
  <defs>
    {/* Grid background */}
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#CCCCCC" strokeWidth="0.5" />
    </pattern>

    {/* Forward arrow */}
    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="black" />
    </marker>

    {/* Reversed arrow */}
    <marker id="arrowReversed" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M10,0 L0,5 L10,10 z" fill="black" />
    </marker>

    {/* Circle marker */}
    <marker id="circle" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
      <circle cx="5" cy="5" r="3" fill="black" />
    </marker>
  </defs>
));

SvgDefs.displayName = 'SvgDefs';
