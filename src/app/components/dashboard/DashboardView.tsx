/**
 * Main Dashboard View
 *
 * Orchestrator component that composes the dashboard from smaller pieces:
 * - Action bar (new drawing, request, inventory quick-add)
 * - Overview widgets (drawing + inventory counts) — hidden for viewers
 * - Search bar with integrated status filter (all / done / pending)
 * - Drawing grid
 * - Side panels (edit drawing, share, request)
 * - Inventory quick-add dialogs
 * - Delete confirmation dialog
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { useDrawings } from '../../hooks/useDrawings';
import { useInventory } from '../../hooks/useInventory';
import { Drawing, SearchFilters } from '../../types';
import { toast } from 'sonner';

// Layout / UI
import { Button } from '../ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Plus, ChevronDown, FileText, Monitor, Settings, Tv, Zap, Package, ClipboardList,
} from 'lucide-react';

// Dashboard components
import { SearchBar } from './SearchBar';
import { DrawingGrid } from './DrawingGrid';
import { DrawingNumberBadge } from './DrawingNumberBadge';
import { WidgetCard } from './WidgetCard';
import { EditDrawingPane } from './EditDrawingPane';
import { ShareDrawingPane } from './ShareDrawingPane';
import { RequestDrawingPane } from './RequestDrawingPane';

// Inventory quick-add dialogs
import { ScreenFormDialog } from '../screens/ScreenFormDialog';
import { MountFormDialog } from '../mounts/MountFormDialog';
import { MediaPlayerFormDialog } from '../media-players/MediaPlayerFormDialog';
import { ReceptacleBoxFormDialog } from '../receptacle-boxes/ReceptacleBoxFormDialog';

export function DashboardView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';
  const isTechnician = user?.role === 'technician';
  const isViewer = user?.role === 'viewer';
  const canCreate = isSuperadmin || isTechnician;   // can create/request/edit/duplicate
  const canDelete = isSuperadmin;                     // only superadmin
  const canShare = isSuperadmin;                      // only superadmin

  // Drawing state
  const [drawingToDelete, setDrawingToDelete] = useState<Drawing | null>(null);
  const [drawingToEdit, setDrawingToEdit] = useState<Drawing | null>(null);
  const [drawingToShare, setDrawingToShare] = useState<Drawing | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [lastSearchFilters, setLastSearchFilters] = useState<SearchFilters>({});
  const [requestPaneOpen, setRequestPaneOpen] = useState(false);

  const {
    drawings, loading, searching, error,
    searchDrawings, deleteDrawing, duplicateDrawing, updateDrawing,
    total, loadDrawings,
  } = useDrawings({ autoLoad: false });

  // Inventory state — hook always called (React rules), but UI hidden for viewers
  const {
    inventoryCounts, countsLoading, totalInventory,
    inventoryFormOpen, setInventoryFormOpen,
    handleScreenSubmit, handleMountSubmit,
    handleMediaPlayerSubmit, handleReceptacleBoxSubmit,
  } = useInventory();

  // ---- Search & filtering ----

  const handleSearch = (filters: SearchFilters) => {
    const enrichedFilters: SearchFilters = {
      ...filters,
      requestStatus: statusFilter,
      // Non-superadmin users only see their company's drawings + shared
      ...(!isSuperadmin && user?.companyName ? { companyName: user.companyName, userId: user.id } : {}),
    };
    setLastSearchFilters(filters);
    searchDrawings(enrichedFilters);
  };

  /** Re-run the current search (preserving all filters including company scope) */
  const refreshDrawings = () => handleSearch(lastSearchFilters);

  // Initial load + re-trigger when status filter changes
  useEffect(() => {
    handleSearch(lastSearchFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // ---- Drawing CRUD handlers ----

  const handleNewDrawing = () => navigate('/studio');
  const handleOpenDrawing = (drawing: Drawing) => navigate(`/studio/${drawing.id}`);

  const handleEditSave = async (
    id: string,
    updates: { title: string; description: string; companyName?: string },
  ): Promise<boolean> => {
    const result = await updateDrawing(id, updates);
    if (result) {
      toast.success(`Drawing "${updates.title}" updated successfully!`);
      return true;
    }
    toast.error('Failed to update drawing. Please try again.');
    return false;
  };

  const handleDuplicateDrawing = async (drawing: Drawing) => {
    const result = await duplicateDrawing(drawing);
    if (result) {
      toast.success(`Drawing "${drawing.title}" duplicated successfully as "${result.title}"!`, {
        description: `New drawing number: ${result.drawingNumber}`,
      });
      refreshDrawings();
    } else {
      toast.error('Failed to duplicate drawing. Please try again.');
    }
  };

  const confirmDelete = async () => {
    if (!drawingToDelete) return;
    const success = await deleteDrawing(drawingToDelete.id);
    if (success) {
      toast.success(`Drawing "${drawingToDelete.title}" has been permanently deleted.`, {
        description: `Drawing number: ${drawingToDelete.drawingNumber}`,
      });
    } else {
      toast.error('Failed to delete drawing. Please try again.');
    }
    setDrawingToDelete(null);
  };

  // ---- Render ----

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">My Drawings</h2>
            <p className="text-muted-foreground">
              {total} {total === 1 ? 'drawing' : 'drawings'} total
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canCreate && (
              <>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setRequestPaneOpen(true)}
                >
                  <ClipboardList className="size-4" />
                  Request Drawing
                </Button>

                {/* Inventory quick-add — superadmin only */}
                {isSuperadmin && <InventoryDropdown onSelect={setInventoryFormOpen} />}

                {/* <Button onClick={handleNewDrawing} className="gap-2">
                  <Plus className="size-4" />
                  New Drawing
                </Button> */}
              </>
            )}
          </div>
        </div>

        {/* Overview Widgets — superadmin only */}
        {isSuperadmin && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <WidgetCard icon={<FileText className="size-5" />} label="Drawings" value={total} loading={loading} accentColor="bg-slate-900" />
            <WidgetCard icon={<Monitor className="size-5" />} label="Screens" value={inventoryCounts.screens} loading={countsLoading} accentColor="bg-blue-600" />
            <WidgetCard icon={<Settings className="size-5" />} label="Mounts" value={inventoryCounts.mounts} loading={countsLoading} accentColor="bg-amber-600" />
            <WidgetCard icon={<Tv className="size-5" />} label="Media Players" value={inventoryCounts.mediaPlayers} loading={countsLoading} accentColor="bg-emerald-600" />
            <WidgetCard icon={<Package className="size-5" />} label="Total Inventory" value={totalInventory} loading={countsLoading} accentColor="bg-violet-600" className="col-span-2 lg:col-span-1" />
          </div>
        )}

        {/* Search Bar — status filter lives inside the Filters popover */}
        <SearchBar
          onSearch={handleSearch}
          isSearching={searching}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-medium">Error loading drawings</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Drawing Grid */}
        <DrawingGrid
          drawings={drawings}
          loading={loading && !searching}
          // Temporarily disable opening drawings in the studio from the dashboard.after that change it to handleOpenDrawing
          //onOpen={handleOpenDrawing}
          onOpen={undefined}
          onEdit={canCreate ? (d) => setDrawingToEdit(d) : undefined}
          onDelete={canDelete ? (d) => setDrawingToDelete(d) : undefined}
          onDuplicate={canCreate ? handleDuplicateDrawing : undefined}
          onNewDrawing={canCreate ? handleNewDrawing : undefined}
          onShare={canShare ? (d) => setDrawingToShare(d) : undefined}
        />

        {!loading && drawings.length > 0 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <p className="text-sm text-muted-foreground">
              Showing {drawings.length} of {total} drawings
            </p>
          </div>
        )}
      </main>

      {/* ---- Dialogs & Panes ---- */}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!drawingToDelete}
        onOpenChange={(open) => !open && setDrawingToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Drawing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{drawingToDelete?.title}&rdquo;? This action
              cannot be undone.
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                Drawing Number:{' '}
                {drawingToDelete && (
                  <DrawingNumberBadge drawingNumber={drawingToDelete.drawingNumber} variant="inline" />
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Drawing */}
      <EditDrawingPane
        drawing={drawingToEdit}
        onOpenChange={() => setDrawingToEdit(null)}
        onSave={handleEditSave}
      />

      {/* Share Drawing */}
      <ShareDrawingPane
        drawing={drawingToShare}
        onOpenChange={() => setDrawingToShare(null)}
        onShared={refreshDrawings}
      />

      {/* Request Drawing */}
      <RequestDrawingPane
        open={requestPaneOpen}
        onOpenChange={setRequestPaneOpen}
        onSubmitted={() => {
          toast.success('Drawing request submitted! It will appear as a pending drawing.');
          refreshDrawings();
        }}
      />

      {/* Inventory Quick-Add Dialogs — superadmin only */}
      {isSuperadmin && (
        <>
          <ScreenFormDialog
            open={inventoryFormOpen === 'screen'}
            onOpenChange={(open) => !open && setInventoryFormOpen(null)}
            screen={null}
            onSubmit={handleScreenSubmit}
          />
          <MountFormDialog
            open={inventoryFormOpen === 'mount'}
            onOpenChange={(open) => !open && setInventoryFormOpen(null)}
            mount={null}
            onSubmit={handleMountSubmit}
          />
          <MediaPlayerFormDialog
            open={inventoryFormOpen === 'mediaPlayer'}
            onOpenChange={(open) => !open && setInventoryFormOpen(null)}
            mediaPlayer={null}
            onSubmit={handleMediaPlayerSubmit}
          />
          <ReceptacleBoxFormDialog
            open={inventoryFormOpen === 'receptacleBox'}
            onOpenChange={(open) => !open && setInventoryFormOpen(null)}
            receptacleBox={null}
            onSubmit={handleReceptacleBoxSubmit}
          />
        </>
      )}
    </div>
  );
}

// ============================================================
// Small inline sub-component — too trivial for its own file
// ============================================================

/** Dropdown for the "New Inventory" button */
function InventoryDropdown({ onSelect }: { onSelect: (type: 'screen' | 'mount' | 'mediaPlayer' | 'receptacleBox') => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Package className="size-4" />
          New Inventory
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => onSelect('screen')} className="gap-3 py-2.5 cursor-pointer">
          <Monitor className="size-4 text-slate-500" />
          <div>
            <p className="font-medium">Screen</p>
            <p className="text-xs text-muted-foreground">Display panel</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect('mount')} className="gap-3 py-2.5 cursor-pointer">
          <Settings className="size-4 text-slate-500" />
          <div>
            <p className="font-medium">Mount</p>
            <p className="text-xs text-muted-foreground">Wall or ceiling mount</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect('mediaPlayer')} className="gap-3 py-2.5 cursor-pointer">
          <Tv className="size-4 text-slate-500" />
          <div>
            <p className="font-medium">Media Player</p>
            <p className="text-xs text-muted-foreground">Content playback device</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect('receptacleBox')} className="gap-3 py-2.5 cursor-pointer">
          <Zap className="size-4 text-slate-500" />
          <div>
            <p className="font-medium">Receptacle Box</p>
            <p className="text-xs text-muted-foreground">Electrical junction box</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}