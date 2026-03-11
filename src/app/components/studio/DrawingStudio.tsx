/**
 * Drawing Studio
 * 
 * Full-page layout that integrates the LED technical drawing builder:
 *   - Header with back, title, save/export
 *   - Main area: Canvas (left) + Sidebar (right)
 *   - Bottom: Notes + Info Table
 */

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { ArrowLeft, Save, Download, Loader2 } from 'lucide-react';
import { useDrawing } from '../../hooks/useDrawings';
import { useAuth } from '../../contexts/AuthContext';
import { useDrawingInventory } from '../../hooks/useDrawingInventory';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import { DrawingNumberBadge } from '../dashboard/DrawingNumberBadge';
import { dataService } from '../../services/DataService';
import { useDrawingBuilderStore } from '../../stores/drawingBuilderStore';
import type { DrawingBuilderSnapshot } from '../../stores/drawingBuilderStore';
import { DrawingCanvas } from './DrawingCanvas';
import { DrawingSidebar } from './DrawingSidebar';
import { DrawingInfoPanel } from './DrawingInfoPanel';

export function DrawingStudio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { drawing, loading } = useDrawing(id || null);
  const { user } = useAuth();
  const { screens, mounts, mediaPlayers, receptacleBoxes } = useDrawingInventory();
  const [isNewDrawing, setIsNewDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const store = useDrawingBuilderStore();
  const isViewer = user?.role === 'viewer';
  // Track what has been restored so we don't double-apply
  const configRestoredRef = useRef(null as string | null);
  const inventoryRestoredRef = useRef(null as string | null);

  // ── Reset store whenever the target drawing changes ────────────────
  useEffect(() => {
    // Always start with a clean slate
    store.reset();
    configRestoredRef.current = null;
    inventoryRestoredRef.current = null;

    if (!id) {
      setIsNewDrawing(true);
    } else {
      setIsNewDrawing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Redirect if drawing not found ──────────────────────────────────
  useEffect(() => {
    if (id && !loading && !drawing) {
      toast.error('Drawing not found');
      navigate('/dashboard');
    }
  }, [id, loading, drawing, navigate]);

  // ── Helper: extract inventory IDs from either a saved config or requestData
  const getInventoryIds = (dwg: typeof drawing) => {
    if (!dwg) return null;

    // Prefer full saved config (from a previously saved drawing)
    const settings = dwg.canvasData?.settings as Record<string, unknown> | undefined;
    const config = settings?.drawingBuilderConfig as DrawingBuilderSnapshot | undefined;
    if (config) {
      return {
        source: 'config' as const,
        config,
        screenId: config.selectedScreenId,
        mountId: config.selectedMountId,
        mediaPlayerId: config.selectedMediaPlayerId,
        receptacleBoxId: config.selectedReceptacleBoxId,
      };
    }

    // Fall back to request data (from RequestDrawingPane)
    const rd = dwg.requestData;
    if (rd) {
      return {
        source: 'request' as const,
        config: null,
        screenId: rd.screenId ?? null,
        mountId: rd.mountId ?? null,
        mediaPlayerId: rd.mediaPlayerId ?? null,
        receptacleBoxId: rd.receptacleBoxId ?? null,
        orientation: rd.orientation,
        mountingOn: rd.mountingOn,
      };
    }

    return null;
  };

  // ── Restore config values (toggles, distances, notes) — no inventory needed
  useEffect(() => {
    if (!drawing || configRestoredRef.current === drawing.id) return;

    const ids = getInventoryIds(drawing);

    if (ids?.source === 'config' && ids.config) {
      // Full snapshot — restore all toggles/distances
      store.restore(ids.config);
    } else if (ids?.source === 'request') {
      // Request data — apply orientation and mounting style
      if (ids.orientation) {
        const shouldBeHorizontal = ids.orientation === 'horizontal';
        if (store.isHorizontal !== shouldBeHorizontal) store.toggleOrientation();
      }
      if (ids.mountingOn === 'niche' && !store.isNiche) store.toggleNiche();
      if (ids.mountingOn === 'wall' && store.isNiche) store.toggleNiche();
    }

    if (drawing.title) {
      store.setDrawingTitle(drawing.title);
    }

    configRestoredRef.current = drawing.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing?.id]);

  // ── Restore inventory items — runs when BOTH drawing + inventory are ready
  useEffect(() => {
    if (!drawing || inventoryRestoredRef.current === drawing.id) return;

    const ids = getInventoryIds(drawing);
    if (!ids) {
      inventoryRestoredRef.current = drawing.id;
      return;
    }

    // Wait until inventory has loaded for any needed types
    const needsScreen = !!ids.screenId;
    const needsMount = !!ids.mountId;
    const needsMP = !!ids.mediaPlayerId;
    const needsRB = !!ids.receptacleBoxId;

    if (
      (needsScreen && screens.length === 0) ||
      (needsMount && mounts.length === 0) ||
      (needsMP && mediaPlayers.length === 0) ||
      (needsRB && receptacleBoxes.length === 0)
    ) {
      return; // Inventory not loaded yet — wait for the next run
    }

    // Resolve inventory IDs → actual objects
    if (needsScreen) {
      const screen = screens.find((s) => s.id === ids.screenId);
      if (screen) store.setSelectedScreen(screen);
    }
    if (needsMount) {
      const mount = mounts.find((m) => m.id === ids.mountId);
      if (mount) store.setSelectedMount(mount);
    }
    if (needsMP) {
      const mp = mediaPlayers.find((p) => p.id === ids.mediaPlayerId);
      if (mp) store.setSelectedMediaPlayer(mp);
    }
    if (needsRB) {
      const rb = receptacleBoxes.find((b) => b.id === ids.receptacleBoxId);
      if (rb) store.setSelectedReceptacleBox(rb);
    }

    inventoryRestoredRef.current = drawing.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawing?.id, screens, mounts, mediaPlayers, receptacleBoxes]);

  const handleBack = () => navigate('/dashboard');

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const snapshot = store.serialize();

      const canvasSettings = {
        backgroundColor: '#ffffff',
        gridEnabled: true,
        gridSize: 10,
        snapToGrid: true,
        zoom: store.zoom,
        drawingBuilderConfig: snapshot,
      };

      if (isNewDrawing) {
        const response = await dataService.createDrawing({
          title: store.drawingTitle || 'Untitled Drawing',
          createdBy: user.id,
          createdByName: user.name,
          companyName: user.companyName || '',
          status: 'draft',
          metadata: { version: '1.0' },
          canvasData: {
            elements: [],
            settings: canvasSettings as never,
          },
        });

        if (response.success && response.data) {
          toast.success(`Drawing saved as ${response.data.drawingNumber}`);
          navigate(`/studio/${response.data.id}`);
        } else {
          toast.error('Failed to save drawing');
        }
      } else if (drawing) {
        // Build update payload
        const updates: Record<string, unknown> = {
          title: store.drawingTitle || drawing.title,
          canvasData: {
            elements: [],
            settings: canvasSettings as never,
          },
        };

        // If this was a pending request, clear the status and assign to current user
        if (drawing.requestStatus === 'pending') {
          updates.requestStatus = null;
          updates.createdBy = user.id;
          updates.createdByName = user.name;
          updates.companyName = user.companyName || drawing.companyName || '';
          // Remove the "requested" tag
          updates.tags = (drawing.tags ?? []).filter((t: string) => t !== 'requested');
        }

        const response = await dataService.updateDrawing(drawing.id, updates);

      if (response.success) {
          toast.success('Drawing saved!');
      } else {
        toast.error('Failed to save drawing');
      }
      }
    } catch {
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b bg-white px-6 py-4">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // ── Studio Layout ──────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b bg-white px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-1 size-4" />
            Back
          </Button>
          
          <div className="h-6 w-px bg-border" />
          
          <div>
            <input
              className="font-semibold text-sm bg-transparent border-0 outline-none focus:ring-0 p-0 w-64"
              value={store.drawingTitle}
              onChange={(e) => store.setDrawingTitle(e.target.value)}
              placeholder="Untitled Drawing"
              readOnly={isViewer}
            />
            {drawing && (
              <div className="mt-0.5">
                <DrawingNumberBadge drawingNumber={drawing.drawingNumber} />
              </div>
            )}
            {isNewDrawing && (
              <p className="text-[10px] text-muted-foreground">
                Drawing number assigned on save
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Download className="mr-1 size-4" />
            Export
          </Button>
          {!isViewer && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Save className="mr-1 size-4" />}
              Save
          </Button>
          )}
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <DrawingCanvas />
          <DrawingInfoPanel readOnly={isViewer} />
        </div>

        {/* Sidebar */}
        <DrawingSidebar readOnly={isViewer} />
      </div>
    </div>
  );
}
