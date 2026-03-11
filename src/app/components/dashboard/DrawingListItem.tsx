/**
 * Drawing List Item Component
 * 
 * Compact list view for displaying drawing information in a table-like layout
 */

import React from 'react';
import { Drawing } from '../../types';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import { MoreVertical, Edit, Trash2, Copy, ExternalLink, FileText, Clock, Share2, UserCircle, CalendarDays, Users } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { DrawingNumberBadge } from './DrawingNumberBadge';
import { UserAvatar } from './UserAvatar';

interface DrawingListItemProps {
  drawing: Drawing;
  onOpen?: (drawing: Drawing) => void;
  onEdit?: (drawing: Drawing) => void;
  onDelete?: (drawing: Drawing) => void;
  onDuplicate?: (drawing: Drawing) => void;
  onShare?: (drawing: Drawing) => void;
}

export function DrawingListItem({
  drawing,
  onOpen,
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
}: DrawingListItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div
        className="w-20 h-14 bg-slate-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => onOpen?.(drawing)}
      >
        {drawing.thumbnailUrl ? (
          <img src={drawing.thumbnailUrl} alt={drawing.title} className="w-full h-full object-cover" />
        ) : (
          <FileText className="size-6 text-slate-400" />
        )}
      </div>

      {/* Title & Drawing Number */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => onOpen?.(drawing)}
          className="text-left w-full hover:underline"
        >
          <h3 className="font-semibold truncate">{drawing.title}</h3>
        </button>
        <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
          <DrawingNumberBadge drawingNumber={drawing.drawingNumber} variant="compact" />
          {drawing.companyName && (
            <span className="inline-flex items-center font-mono text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md tracking-wide">
              {drawing.companyName}
            </span>
          )}
          {drawing.requestStatus === 'pending' && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
              <Clock className="size-3" />
              Pending
            </span>
          )}
          {drawing.sharedWith && drawing.sharedWith.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
              <Users className="size-3" />
              Shared ({drawing.sharedWith.length})
            </span>
          )}
        </div>
      </div>

      {/* People column */}
      {drawing.requestStatus === 'pending' ? (
        <div className="hidden md:flex flex-col gap-1 flex-shrink-0 w-44 min-w-0">
          {/* Requested by */}
          {drawing.requestData?.requestedByName && (
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar name={drawing.requestData.requestedByName} size="sm" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-muted-foreground truncate">
                  {drawing.requestData.requestedByName}
                </span>
                <span className="text-[10px] text-muted-foreground/60">Requested by</span>
              </div>
            </div>
          )}
          {/* Assigned to */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center size-6 rounded-full border border-dashed border-slate-300 bg-slate-50 flex-shrink-0">
              <UserCircle className="size-3.5 text-slate-400" />
            </span>
            <span className="text-[10px] text-muted-foreground/60 italic">Unassigned</span>
          </div>
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden md:flex items-center gap-2 flex-shrink-0 w-44 min-w-0">
              <UserAvatar name={drawing.createdByName} size="sm" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-muted-foreground truncate">
                  {drawing.createdByName}
                </span>
                <span className="text-[10px] text-muted-foreground/60">Created by</span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Created by {drawing.createdByName}</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Last Modified */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0 w-32">
            <CalendarDays className="size-3 text-muted-foreground/50 flex-shrink-0" />
            <span className="text-xs text-muted-foreground/70">
              {formatDistanceToNow(new Date(drawing.updatedAt), { addSuffix: true })}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{format(new Date(drawing.updatedAt), 'MMM d, yyyy · h:mm a')}</p>
        </TooltipContent>
      </Tooltip>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {(onEdit || onDelete || onDuplicate || onShare) && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpen?.(drawing)}
              className="hidden sm:inline-flex"
            >
              <ExternalLink className="size-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpen?.(drawing)}>
                  <ExternalLink className="mr-2 size-4" />
                  Open
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(drawing)}>
                    <Edit className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(drawing)}>
                    <Copy className="mr-2 size-4" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                {onShare && (
                  <DropdownMenuItem onClick={() => onShare(drawing)}>
                    <Share2 className="mr-2 size-4" />
                    Share
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(drawing)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  );
}