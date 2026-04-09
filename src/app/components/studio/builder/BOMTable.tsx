
import React from 'react';
import { useDrawingContext } from './DrawingContext';

export function BOMTable() {
  const { state, nicheDimensions, nicheDepth } = useDrawingContext();
  const { screen, mount, mediaPlayer, grid } = state;

  const totalScreens = grid.rows * grid.cols;

  const obscureModel = (model?: string) => {
    if (!model) return '';
    if (model.length <= 3) return model + '***';
    return model.substring(0, 3) + '***' + model.substring(model.length - 1);
  };

  return (
    <div className="w-full overflow-hidden bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th colSpan={4} className="py-1 px-2">
              <div className="flex items-center justify-between text-[9px] text-slate-500">
                <span><span className="font-semibold text-slate-700">Mounting:</span> {state.mode === 'WALL' ? 'Wall' : state.mode === 'NICHE' ? 'Niche' : 'Table'}</span>
                <span><span className="font-semibold text-slate-700">Orientation:</span> {state.orientation === 'HORIZONTAL' ? 'Horizontal' : 'Vertical'}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="text-[9px]">
          {/* Screens */}
          <tr className="border-b border-slate-200 bg-slate-50/50">
            <td className="py-2 px-2 font-bold text-[10px] text-slate-900">Screen</td>
            <td className="py-2 px-2 truncate max-w-[120px] text-[10px] text-slate-900">{screen.model ? `${screen.manufacturer || ''} ${screen.model}` : 'LED Display Panel'}</td>
            <td className="py-2 px-2 text-center font-bold text-[10px] text-slate-900">{totalScreens}</td>
            <td className="py-2 px-2 text-right whitespace-nowrap font-bold text-[10px] text-slate-900">
              <span className="text-slate-500 font-normal mr-1">W:</span>{screen.width} 
              <span className="text-slate-500 font-normal mx-1">H:</span>{screen.height} 
              <span className="text-slate-500 font-normal mx-1">D:</span>{screen.depth}
            </td>
          </tr>

          {/* Niche (if applicable) - Moved under Screen */}
          {(state.mode === 'NICHE' || state.mode === 'TABLE_NICHE') && (
            <tr className="bg-blue-50/30 border-b border-slate-200">
              <td className="py-2 px-2 font-bold text-[10px] text-blue-900">Niche</td>
              <td className="py-2 px-2 truncate max-w-[120px] text-[10px] text-blue-900">Wall Cutout Requirement</td>
              <td className="py-2 px-2 text-center font-bold text-[10px] text-blue-900">1</td>
              <td className="py-2 px-2 text-right whitespace-nowrap font-bold text-[10px] text-blue-900">
                <span className="text-blue-500/70 font-normal mr-1">W:</span>{nicheDimensions.width.toFixed(2)} 
                <span className="text-blue-500/70 font-normal mx-1">H:</span>{nicheDimensions.height.toFixed(2)} 
                <span className="text-blue-500/70 font-normal mx-1">D:</span>{nicheDepth.toFixed(2)}
              </td>
            </tr>
          )}

          {/* Mounts & Players Inline Row */}
          <tr className="last:border-0">
            <td colSpan={4} className="p-0">
              <div className="flex w-full divide-x divide-slate-100">
                {/* Mount Column */}
                <div className="flex-1 py-0.5 px-2 flex items-center gap-2 overflow-hidden">
                  <span className="font-medium text-[9px] w-[35px] shrink-0">Mount</span>
                  <span className="truncate text-[9px] flex-1">{mount.model ? `${obscureModel(mount.model)} (${mount.type})` : `${mount.type.replace('_', ' ')}`}</span>
                  <span className="text-center text-[9px] w-[20px] shrink-0">{totalScreens}</span>
                </div>
                {/* Player Column */}
                <div className="flex-1 py-0.5 px-2 flex items-center gap-2 overflow-hidden">
                  <span className="font-medium text-[9px] w-[35px] shrink-0">Player</span>
                  <span className="truncate text-[9px] flex-1">
                    {mediaPlayer.alias ? `${mediaPlayer.alias}` : `Media Player`}
                    <span className="text-[8px] text-slate-400 ml-1">
                      ({mediaPlayer.position === 'BEHIND_SCREEN' ? 'Behind' : 'Remote'})
                    </span>
                  </span>
                  <span className="text-center text-[9px] w-[20px] shrink-0">{totalScreens}</span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  );
}
