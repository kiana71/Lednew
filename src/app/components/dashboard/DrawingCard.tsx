/**
 * Drawing Card Component
 * 
 * Displays individual drawing with preview and metadata
 */

import React from 'react';
import { Drawing } from '../../types';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import { FileText, MoreVertical, Edit, Trash2, Copy, Clock, Share2, UserCircle, CalendarDays } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { DrawingNumberBadge } from './DrawingNumberBadge';
import { UserAvatar } from './UserAvatar';

interface DrawingCardProps {
  drawing: Drawing;
  onOpen?: (drawing: Drawing) => void;
  onEdit?: (drawing: Drawing) => void;
  onDelete?: (drawing: Drawing) => void;
  onDuplicate?: (drawing: Drawing) => void;
  onShare?: (drawing: Drawing) => void;
}

export function DrawingCard({
  drawing,
  onOpen,
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
}: DrawingCardProps) {
  return (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
      <CardHeader className="p-0">
        <div
          className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative overflow-hidden"
          onClick={() => onOpen?.(drawing)}
        >
          {drawing.thumbnailUrl ? (
            <img
              src={drawing.thumbnailUrl}
              alt={drawing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <FileText className="size-16 text-slate-400" />
          )}
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <Button
              variant="secondary"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onOpen?.(drawing);
              }}
            >
              Open Drawing
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate" title={drawing.title}>
              {drawing.title}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <DrawingNumberBadge drawingNumber={drawing.drawingNumber} />
              {drawing.companyName && (
                <span className="inline-flex items-center font-mono text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-md tracking-wide">
                  {drawing.companyName}
                </span>
              )}
              {drawing.requestStatus === 'pending' && (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md">
                  <Clock className="size-3" />
                  Pending
                </span>
              )}
            </div>
          </div>

          {/* 3-dot menu — only shown when user has any action permissions */}
          {(onEdit || onDelete || onDuplicate || onShare) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="size-8 p-0">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onOpen?.(drawing)}>
                  <FileText className="mr-2 size-4" />
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
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {drawing.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {drawing.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {drawing.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {drawing.tags && drawing.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{drawing.tags.length - 2}
            </Badge>
          )}
        </div>

        {drawing.metadata.projectName && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Project:</span> {drawing.metadata.projectName}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-4 py-3 pt-0">
        <div className="w-full space-y-2.5">
          {/* Separator line */}
          <div className="border-t border-slate-100" />

          {/* People row */}
          {drawing.requestStatus === 'pending' ? (
            <div className="flex flex-col gap-1.5">
              {/* Requested by */}
              {drawing.requestData && (
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
                <span className="text-xs text-muted-foreground/60 italic">Unassigned</span>
              </div>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar name={drawing.createdByName} size="sm" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-muted-foreground truncate">
                      {drawing.createdByName}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">Created by</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start">
                <p className="text-xs">Created by {drawing.createdByName}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Time row */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="size-3 text-muted-foreground/50 flex-shrink-0" />
                <span className="text-[11px] text-muted-foreground/70">
                  {formatDistanceToNow(new Date(drawing.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              <p className="text-xs">{format(new Date(drawing.updatedAt), 'MMM d, yyyy · h:mm a')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardFooter>
    </Card>
  );
}