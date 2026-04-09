
import React from 'react';
import { useDrawingContext } from './DrawingContext';
import { Button } from '../../ui/button';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Layers,
  Ruler,
  Zap,
  AlignVerticalSpaceAround,
  SquareDashed,
  SplitSquareHorizontal
} from 'lucide-react';
import { Toggle } from '../../ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

export function Toolbar() {
  const { state, updateView, resetView, toggleLayer } = useDrawingContext();
  const { zoom, showLayers } = state.view;

  const handleZoomIn = () => updateView({ zoom: Math.min(5, zoom + 0.1) });
  const handleZoomOut = () => updateView({ zoom: Math.max(0.2, zoom - 0.1) });

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white text-xs px-2 py-1 border-none shadow-md">Zoom Out</TooltipContent>
          </Tooltip>

          <span className="text-xs font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white text-xs px-2 py-1 border-none shadow-md">Zoom In</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={resetView}>
                <Maximize className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white text-xs px-2 py-1 border-none shadow-md">Fit to Paper</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground mr-2">Layers:</span>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Toggle 
                  pressed={showLayers.niche} 
                  onPressedChange={() => toggleLayer('niche')}
                  aria-label="Toggle Niche"
                  className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
                  disabled={state.mode !== 'NICHE' && state.mode !== 'TABLE_NICHE'}
                >
                  <Layers className="size-4" />
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white text-xs px-2 py-1 border-none shadow-md">Show/Hide Niche Boundaries</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Toggle 
                  pressed={showLayers.centerLine} 
                  onPressedChange={() => toggleLayer('centerLine')}
                  aria-label="Toggle Center Line"
                  className="data-[state=on]:bg-indigo-100 data-[state=on]:text-indigo-700"
                >
                  <AlignVerticalSpaceAround className="size-4" />
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white text-xs px-2 py-1 border-none shadow-md">Show/Hide Center & Floor Lines</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Toggle 
                  pressed={showLayers.dimensions} 
                  onPressedChange={() => toggleLayer('dimensions')}
                  aria-label="Toggle Dimensions"
                  className="data-[state=on]:bg-green-100 data-[state=on]:text-green-700"
                >
                  <Ruler className="size-4" />
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white text-xs px-2 py-1 border-none shadow-md">Show/Hide Dimension Lines</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Toggle 
                  pressed={showLayers.woodBacking} 
                  onPressedChange={() => toggleLayer('woodBacking')}
                  aria-label="Toggle Wood Backing"
                  className="data-[state=on]:bg-amber-100 data-[state=on]:text-amber-700"
                  disabled={!state.settings.woodBacking}
                >
                  <SquareDashed className="size-4" />
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white text-xs px-2 py-1 border-none shadow-md">Show/Hide Wood Backing</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Toggle 
                  pressed={showLayers.sideView} 
                  onPressedChange={() => toggleLayer('sideView')}
                  aria-label="Toggle Side View"
                  className="data-[state=on]:bg-purple-100 data-[state=on]:text-purple-700"
                  disabled={state.grid.rows > 1 || state.grid.cols > 1 || state.screen.width === 0}
                >
                  <SplitSquareHorizontal className="size-4" />
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white text-xs px-2 py-1 border-none shadow-md">Show/Hide Side View</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Toggle 
                  pressed={showLayers.receptacleBox} 
                  onPressedChange={() => toggleLayer('receptacleBox')}
                  aria-label="Toggle Receptacle Box"
                  className="data-[state=on]:bg-red-100 data-[state=on]:text-red-700"
                  disabled={state.receptacleBoxes.length === 0}
                >
                  <Zap className="size-4" />
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-800 text-white text-xs px-2 py-1 border-none shadow-md">Show/Hide Receptacle Boxes</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
