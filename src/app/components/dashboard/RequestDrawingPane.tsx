/**
 * Request Drawing Pane
 *
 * Slide-in side panel where users can order a new drawing by selecting
 * inventory components, specifying orientation, mounting style, and
 * additional details. The logged-in user is automatically recorded as
 * the requester. Creates a pending drawing record upon submission.
 */

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  InventoryPicker,
  ScreenPickerCard,
  ScreenPickerDetail,
  MountPickerCard,
  MountPickerDetail,
  MediaPlayerPickerCard,
  MediaPlayerPickerDetail,
  ReceptacleBoxPickerCard,
  ReceptacleBoxPickerDetail,
} from '../shared/InventoryPicker';
import { Badge } from '../ui/badge';
import { Monitor, Settings, Tv, Zap, ClipboardList, Hash } from 'lucide-react';
import {
  Screen,
  Mount,
  MediaPlayer,
  ReceptacleBox,
  DrawingRequestData,
} from '../../types';
import { inventoryService } from '../../services/InventoryService';
import { dataService } from '../../services/DataService';
import { useAuth } from '../../contexts/AuthContext';

// ── Order number counter ──────────────────────────────────────────────

let orderCounter = 10001;
function generateOrderNumber(): string {
  return `ORD-${orderCounter++}`;
}

// ── Props ─────────────────────────────────────────────────────────────

interface RequestDrawingPaneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: () => void;
}

export function RequestDrawingPane({ open, onOpenChange, onSubmitted }: RequestDrawingPaneProps) {
  const { user } = useAuth();

  // ── Inventory data ────────────────────────────────────────────────
  const [screens, setScreens] = useState<Screen[]>([]);
  const [mounts, setMounts] = useState<Mount[]>([]);
  const [mediaPlayers, setMediaPlayers] = useState<MediaPlayer[]>([]);
  const [receptacleBoxes, setReceptacleBoxes] = useState<ReceptacleBox[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // ── Form state ────────────────────────────────────────────────────
  const [orderNumber, setOrderNumber] = useState('');
  const [selectedScreen, setSelectedScreen] = useState<Screen | null>(null);
  const [selectedMount, setSelectedMount] = useState<Mount | null>(null);
  const [selectedMediaPlayer, setSelectedMediaPlayer] = useState<MediaPlayer | null>(null);
  const [selectedReceptacleBox, setSelectedReceptacleBox] = useState<ReceptacleBox | null>(null);
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal' | ''>('');
  const [mountingOn, setMountingOn] = useState<'wall' | 'niche' | 'table' | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Load inventory when pane opens ────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setOrderNumber(generateOrderNumber());
    loadInventory();
  }, [open]);

  const loadInventory = async () => {
    setInventoryLoading(true);
    try {
      const [sRes, mRes, mpRes, rbRes] = await Promise.all([
        inventoryService.getScreens(),
        inventoryService.getMounts(),
        inventoryService.getMediaPlayers(),
        inventoryService.getReceptacleBoxes(),
      ]);
      setScreens(sRes.data?.items ?? []);
      setMounts(mRes.data?.items ?? []);
      setMediaPlayers(mpRes.data?.items ?? []);
      setReceptacleBoxes(rbRes.data?.items ?? []);
    } catch {
      // Silently fail — pickers will show empty state
    }
    setInventoryLoading(false);
  };

  // ── Reset form ────────────────────────────────────────────────────
  const resetForm = () => {
    setSelectedScreen(null);
    setSelectedMount(null);
    setSelectedMediaPlayer(null);
    setSelectedReceptacleBox(null);
    setOrientation('');
    setMountingOn('');
    setDescription('');
  };

  // ── Derived ───────────────────────────────────────────────────────
  const canSubmit =
    !!user &&
    (selectedScreen || selectedMount || selectedMediaPlayer || selectedReceptacleBox);

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !user) return;

    setSubmitting(true);

    const requestData: DrawingRequestData = {
      orderNumber,
      screenId: selectedScreen?.id,
      mountId: selectedMount?.id,
      mediaPlayerId: selectedMediaPlayer?.id,
      receptacleBoxId: selectedReceptacleBox?.id,
      orientation: orientation || undefined,
      mountingOn: mountingOn || undefined,
      requestedById: user.id,
      requestedByName: user.name,
    };

    // Build a title from the selected components
    const parts: string[] = [];
    if (selectedScreen) parts.push(selectedScreen.alias);
    if (selectedMount) parts.push(selectedMount.alias);
    const title = parts.length > 0 ? parts.join(' + ') : `Drawing Request ${orderNumber}`;

    try {
      const response = await dataService.createDrawing({
        title,
        description: description || undefined,
        createdBy: '',
        createdByName: 'Unassigned',
        status: 'draft',
        companyName: user.companyName,
        metadata: { version: '1.0' },
        canvasData: {
          elements: [],
          settings: {
            backgroundColor: '#ffffff',
            gridEnabled: true,
            gridSize: 10,
            snapToGrid: true,
            zoom: 1,
          },
        },
        tags: ['requested'],
        requestStatus: 'pending',
        requestData,
      });

      if (response.success) {
        resetForm();
        onOpenChange(false);
        onSubmitted();
      }
    } catch {
      // Error handling — toast in parent
    }

    setSubmitting(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) resetForm();
    onOpenChange(o);
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="sm:max-w-xl w-full p-0 gap-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="size-5" />
            Request a Drawing
          </SheetTitle>
          <SheetDescription>
            Specify the components and requirements for the drawing you need
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Order Number */}
            <div className="space-y-2">
              <Label>Order Number</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-sm px-3 py-1.5">
                  <Hash className="size-3.5 mr-1.5 text-muted-foreground" />
                  {orderNumber}
                </Badge>
                <span className="text-xs text-muted-foreground">Auto-generated</span>
              </div>
            </div>

            <Separator />

            {/* ── Inventory Selections ─────────────────────────────── */}

            {/* Screen */}
            <div className="space-y-2">
              <Label>Screen</Label>
              <InventoryPicker<Screen>
                label="Screens"
                icon={<Monitor className="size-4 text-blue-600" />}
                items={screens}
                value={selectedScreen}
                onChange={setSelectedScreen}
                loading={inventoryLoading}
                placeholder="Select a screen..."
                renderCard={(item, sel) => <ScreenPickerCard item={item} selected={sel} />}
                renderDetail={(item) => <ScreenPickerDetail item={item} />}
              />
            </div>

            {/* Mount */}
            <div className="space-y-2">
              <Label>Mount</Label>
              <InventoryPicker<Mount>
                label="Mounts"
                icon={<Settings className="size-4 text-amber-600" />}
                items={mounts}
                value={selectedMount}
                onChange={setSelectedMount}
                loading={inventoryLoading}
                placeholder="Select a mount..."
                renderCard={(item, sel) => <MountPickerCard item={item} selected={sel} />}
                renderDetail={(item) => <MountPickerDetail item={item} />}
              />
            </div>

            {/* Media Player */}
            <div className="space-y-2">
              <Label>Media Player</Label>
              <InventoryPicker<MediaPlayer>
                label="Media Players"
                icon={<Tv className="size-4 text-emerald-600" />}
                items={mediaPlayers}
                value={selectedMediaPlayer}
                onChange={setSelectedMediaPlayer}
                loading={inventoryLoading}
                placeholder="Select a media player..."
                renderCard={(item, sel) => <MediaPlayerPickerCard item={item} selected={sel} />}
                renderDetail={(item) => <MediaPlayerPickerDetail item={item} />}
              />
            </div>

            {/* Receptacle Box */}
            <div className="space-y-2">
              <Label>Receptacle Box</Label>
              <InventoryPicker<ReceptacleBox>
                label="Receptacle Boxes"
                icon={<Zap className="size-4 text-violet-600" />}
                items={receptacleBoxes}
                value={selectedReceptacleBox}
                onChange={setSelectedReceptacleBox}
                loading={inventoryLoading}
                placeholder="Select a receptacle box..."
                renderCard={(item, sel) => <ReceptacleBoxPickerCard item={item} selected={sel} />}
                renderDetail={(item) => <ReceptacleBoxPickerDetail item={item} />}
              />
            </div>

            <Separator />

            {/* ── Orientation & Mounting ───────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orientation">Orientation</Label>
                <Select value={orientation} onValueChange={(v) => setOrientation(v as any)}>
                  <SelectTrigger id="orientation"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mounting-on">Mounting On</Label>
                <Select value={mountingOn} onValueChange={(v) => setMountingOn(v as any)}>
                  <SelectTrigger id="mounting-on"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wall">Wall</SelectItem>
                    <SelectItem value="niche">Niche</SelectItem>
                    <SelectItem value="table">Table</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* ── Description ─────────────────────────────────────── */}
            <div className="space-y-2">
              <Label htmlFor="request-description">Additional Details</Label>
              <Textarea
                id="request-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any special requirements, notes, or context for this drawing..."
                rows={3}
              />
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t flex-shrink-0 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
