/**
 * Drawing Grid Component
 * 
 * Responsive list layout for displaying drawings with loading and empty states.
 * Uses CSS transitions for smooth content updates during search.
 */

import React from 'react';
import { Drawing } from '../../types';
import { DrawingListItem } from './DrawingListItem';
import { Skeleton } from '../ui/skeleton';
import { FileText, Search } from 'lucide-react';
import { Button } from '../ui/button';

interface DrawingGridProps {
  drawings: Drawing[];
  loading?: boolean;
  onOpen?: (drawing: Drawing) => void;
  onEdit?: (drawing: Drawing) => void;
  onDelete?: (drawing: Drawing) => void;
  onDuplicate?: (drawing: Drawing) => void;
  onNewDrawing?: () => void;
  onShare?: (drawing: Drawing) => void;
}

export function DrawingGrid({
  drawings,
  loading,
  onOpen,
  onEdit,
  onDelete,
  onDuplicate,
  onNewDrawing,
  onShare,
}: DrawingGridProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg">
            <Skeleton className="w-20 h-14" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (drawings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="size-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Search className="size-10 text-slate-400" />
        </div>
        <h3 className="text-lg mb-2">No drawings found</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          We couldn&apos;t find any drawings matching your search criteria. Try adjusting your
          filters or create a new drawing.
        </p>
        {/* {onNewDrawing && (
          <Button onClick={onNewDrawing}>
            <FileText className="mr-2 size-4" />
            Create New Drawing
          </Button>
        )} */}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {drawings.map((drawing) => (
        <DrawingListItem
          key={drawing.id}
          drawing={drawing}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onShare={onShare}
        />
      ))}
    </div>
  );
}