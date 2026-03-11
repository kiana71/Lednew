/**
 * Drawing Info Panel
 *
 * Bottom bar containing a Notes editor and a metadata Info Table.
 * Mirrors the original LEDmap bottom row but with clean shadcn/ui components.
 */

import React from 'react';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useDrawingBuilderStore } from '../../stores/drawingBuilderStore';
import { format } from 'date-fns';

// ─── Info Row ────────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <tr className="border-b border-black/20 last:border-0">
    <td className="text-xs font-semibold pr-2 py-0.5 whitespace-nowrap">{label}</td>
    <td className="text-xs font-light py-0.5">{value || '—'}</td>
  </tr>
);

// ─── Main Component ──────────────────────────────────────────────────────────

interface DrawingInfoPanelProps {
  readOnly?: boolean;
}

export function DrawingInfoPanel({ readOnly = false }: DrawingInfoPanelProps) {
  const store = useDrawingBuilderStore();

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex gap-4 border-t bg-white px-4 py-2 shrink-0">
      {/* Notes Section */}
      <div className="flex-1 border border-black/30 rounded p-2 flex flex-col">
        <Label className="text-xs font-bold mb-1">Notes</Label>
        <Textarea
          className="flex-1 text-xs resize-none border-0 p-0 shadow-none focus-visible:ring-0"
          placeholder="Add installation notes, wood backing specs, special instructions..."
          value={store.notes}
          onChange={(e) => store.setNotes(e.target.value)}
          rows={4}
          readOnly={readOnly}
        />
      </div>

      {/* Info Table */}
      <div className="flex-1 border border-black/30 rounded p-2">
        <table className="w-full">
          <tbody>
            <InfoRow label="Title" value={store.drawingTitle} />
            <InfoRow label="Screen" value={store.selectedScreen?.alias ?? ''} />
            <InfoRow label="Mount" value={store.selectedMount?.alias ?? ''} />
            <InfoRow label="Media Player" value={store.selectedMediaPlayer?.alias ?? ''} />
            <InfoRow label="Receptacle Box" value={store.selectedReceptacleBox?.alias ?? ''} />
            <InfoRow label="Orientation" value={store.isHorizontal ? 'Horizontal' : 'Vertical'} />
            <InfoRow label="Mounting" value={store.isNiche ? 'Niche' : 'Flat Wall'} />
            <InfoRow label="Date" value={today} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
