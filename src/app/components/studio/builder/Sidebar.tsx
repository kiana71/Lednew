
import React, { useEffect, useState } from 'react';
import { useDrawingContext } from './DrawingContext';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { Separator } from '../../ui/separator';
import { Button } from '../../ui/button';
import { Plus, Minus, Loader2, Copy } from 'lucide-react';
import { Switch } from '../../ui/switch';
import { inventoryService } from '../../../services/InventoryService';
import { Screen, Mount, MediaPlayer, ReceptacleBox } from '../../../types';
import { RichTextEditor } from './RichTextEditor';

export function Sidebar() {
  const { 
    state, 
    updateState, 
    updateScreen, 
    updateMount, 
    updateMediaPlayer, 
    updateGrid, 
    updateNicheSettings,
    addReceptacleBox,
    updateReceptacleBox,
    removeReceptacleBox,
    updateSettings,
    orientedScreen,
    addNote,
    updateNote,
    removeNote,
    selectNote,
    readOnly,
  } = useDrawingContext();

  // Inventory State
  const [screens, setScreens] = useState<Screen[]>([]);
  const [mounts, setMounts] = useState<Mount[]>([]);
  const [mediaPlayers, setMediaPlayers] = useState<MediaPlayer[]>([]);
  const [receptacleBoxes, setReceptacleBoxes] = useState<ReceptacleBox[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom Mode States
  const [isCustomScreen, setIsCustomScreen] = useState(false);
  const [isCustomMount, setIsCustomMount] = useState(false);
  const [isCustomPlayer, setIsCustomPlayer] = useState(false);
  
  // Selected Box State
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [sidebarSelectedNoteId, setSidebarSelectedNoteId] = useState<string | null>(null);

  // Local state for AFF input to allow typing while enforcing constraints
  const [localFloorDistance, setLocalFloorDistance] = useState(state.settings.floorDistance.toString());

  // Calculate dynamic minimum floor distance:
  // 1. Hard minimum of 20 inches for the AFF input itself
  // 2. Must be at least half the screen height (+ 1 inch clearance) so the screen never touches or overlaps the floor
  const totalScreenHeight = orientedScreen.height * state.grid.rows;
  const minFloorDistance = Math.max(20, Math.ceil(totalScreenHeight / 2) + 1);

  // Auto-correct global state if screen size/grid changes make the current distance invalid
  useEffect(() => {
    if (state.settings.floorDistance < minFloorDistance) {
      updateSettings({ floorDistance: minFloorDistance });
    }
  }, [minFloorDistance, state.settings.floorDistance, updateSettings]);

  // Sync local AFF state when global state changes
  useEffect(() => {
    setLocalFloorDistance(state.settings.floorDistance.toString());
  }, [state.settings.floorDistance]);

  // Select first box on mount
  useEffect(() => {
    if (state.receptacleBoxes.length > 0 && !selectedBoxId) {
      setSelectedBoxId(state.receptacleBoxes[0].id);
    }
  }, [state.receptacleBoxes, selectedBoxId]);

  // Fetch Inventory
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const [screensRes, mountsRes, playersRes, boxesRes] = await Promise.all([
          inventoryService.getScreens(),
          inventoryService.getMounts(),
          inventoryService.getMediaPlayers(),
          inventoryService.getReceptacleBoxes(),
        ]);
        
        if (screensRes.data) setScreens(screensRes.data.items);
        if (mountsRes.data) setMounts(mountsRes.data.items);
        if (playersRes.data) setMediaPlayers(playersRes.data.items);
        if (boxesRes.data) setReceptacleBoxes(boxesRes.data.items);
      } catch (error) {
        console.error('Failed to load inventory', error);
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  // Handlers for Inventory Selection
  const handleScreenSelect = (id: string) => {
    if (id === 'none') {
      setIsCustomScreen(false);
      updateScreen({
        width: 0,
        height: 0,
        depth: 0,
        model: undefined,
        manufacturer: undefined,
      });
      return;
    }
    setIsCustomScreen(false);
    const selected = screens.find(s => s.id === id);
    if (selected) {
      updateScreen({
        width: selected.dimensions.width,
        height: selected.dimensions.height,
        depth: selected.dimensions.depth,
        model: selected.model,
        manufacturer: selected.manufacturer,
      });
    }
  };

  const handleMountSelect = (id: string) => {
    if (id === 'none') {
      setIsCustomMount(false);
      updateMount({
        depth: 0,
        width: 0,
        height: 0,
        model: undefined,
      });
      return;
    }
    setIsCustomMount(false);
    const selected = mounts.find(m => m.id === id);
    if (selected) {
      updateMount({
        depth: selected.dimensions.depth,
        width: selected.dimensions.width,
        height: selected.dimensions.height,
        model: selected.model,
        // We might want to update type if the mount has a type property compatible with our enum
      });
    }
  };

  const handleMediaPlayerSelect = (id: string) => {
    if (id === 'none') {
      setIsCustomPlayer(false);
      updateMediaPlayer({
        depth: 0,
        width: 0,
        height: 0,
        model: undefined,
        alias: undefined,
      });
      return;
    }
    setIsCustomPlayer(false);
    const selected = mediaPlayers.find(m => m.id === id);
    if (selected) {
      updateMediaPlayer({
        depth: selected.dimensions.depth,
        width: selected.dimensions.width,
        height: selected.dimensions.height,
        model: selected.model,
        alias: selected.alias,
      });
    }
  };

  const handleReceptacleBoxSelect = (inventoryId: string) => {
    if (!selectedBoxId) return;

    if (inventoryId === 'custom') {
      updateReceptacleBox(selectedBoxId, { inventoryId, model: 'Custom Box' });
      return;
    }
    const selected = receptacleBoxes.find(b => b.id === inventoryId);
    if (selected) {
      updateReceptacleBox(selectedBoxId, {
        inventoryId,
        width: selected.dimensions.width,
        height: selected.dimensions.height,
        model: selected.model,
      });
    }
  };

  const currentBox = state.receptacleBoxes.find(b => b.id === selectedBoxId);
  const currentSidebarNote = state.notes.find(n => n.id === sidebarSelectedNoteId);

  return (
    <div className={`p-4 space-y-6 ${readOnly ? 'opacity-70 pointer-events-none select-none' : ''}`}>
      {/* 0. Document Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-slate-900">Document Info</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Drawing No.</Label>
            <Input 
              value={state.settings.drawingNumber || ''} 
              disabled
              className="bg-slate-50 cursor-not-allowed"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Revision</Label>
            <Input 
              value={state.settings.revision || ''} 
              disabled
              className="bg-slate-50 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <Separator/>

      {/* 1. Mode Selection */}
      <div className="space-y-3">
        <Label>Installation Mode</Label>
        <Tabs 
          value={state.mode} 
          onValueChange={(value: any) => updateState({ mode: value })}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="WALL">Wall</TabsTrigger>
            <TabsTrigger value="NICHE">Niche</TabsTrigger>
            <TabsTrigger value="TABLE_NICHE">Table</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator/>
      {/* 2. Device Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">Configurations</h3>
          {loading && <Loader2 className="size-3 animate-spin text-slate-400" />}
        </div>
        
        {/* Inventory Selector */}
        <div className="space-y-1">
          <Select onValueChange={handleScreenSelect} value={screens.find(s => s.model === state.screen.model)?.id || 'none'}>
            <SelectTrigger>
              <SelectValue placeholder="Select a screen..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Screen Selected</SelectItem>
              {screens.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.manufacturer} {s.model} ({s.sizeInInch || 'N/A'}")
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {state.screen.width > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-2 flex items-center justify-between text-[11px] text-slate-600 mt-2">
            <span><span className="font-medium text-slate-900">W:</span> {orientedScreen.width}&quot;</span>
            <span><span className="font-medium text-slate-900">H:</span> {orientedScreen.height}&quot;</span>
            <span><span className="font-medium text-slate-900">D:</span> {state.screen.depth}&quot;</span>
          </div>
        )}

        {/* Orientation Toggle */}
        <div className="pt-2">
          <Label className="text-xs mb-1.5 block">Orientation</Label>
          <Tabs
            value={state.orientation}
            onValueChange={(v) => updateState({ orientation: v as 'HORIZONTAL' | 'VERTICAL' })}
          >
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="HORIZONTAL" className="text-xs">Horizontal</TabsTrigger>
              <TabsTrigger value="VERTICAL" className="text-xs">Vertical</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

      </div>

      <div className="space-y-4">
        {/* Inventory Selector */}
        <div className="space-y-1">
          <Select onValueChange={handleMountSelect} value={mounts.find(m => m.model === state.mount.model)?.id || 'none'}>
            <SelectTrigger>
              <SelectValue placeholder="Select a mount..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Mount Selected</SelectItem>
              {mounts.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.model}{m.alias ? ` — ${m.alias}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select 
              value={state.mount.type} 
              onValueChange={(value: any) => updateMount({ type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">Fixed</SelectItem>
                <SelectItem value="TILT">Tilt</SelectItem>
                <SelectItem value="FULL_MOTION">Full Motion</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {state.mount.depth > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-2 flex items-center justify-between text-[11px] text-slate-600 mt-2">
              <span><span className="font-medium text-slate-900">W:</span> {state.mount.width || 0}&quot;</span>
              <span><span className="font-medium text-slate-900">H:</span> {state.mount.height || 0}&quot;</span>
              <span><span className="font-medium text-slate-900">D:</span> {state.mount.depth}&quot;</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Inventory Selector */}
        <div className="space-y-1">
          <Select onValueChange={handleMediaPlayerSelect} value={mediaPlayers.find(p => p.model === state.mediaPlayer.model)?.id || 'none'}>
            <SelectTrigger>
              <SelectValue placeholder="Select a media player..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Media Player Selected</SelectItem>
              {mediaPlayers.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.model}{m.alias ? ` — ${m.alias}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">Position</Label>
            <Select 
              value={state.mediaPlayer.position} 
              onValueChange={(value: any) => updateMediaPlayer({ position: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEHIND_SCREEN">Behind Screen</SelectItem>
                <SelectItem value="REMOTE">Remote Location</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {state.mediaPlayer.position === 'BEHIND_SCREEN' && (
            state.mediaPlayer.depth > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-2 flex items-center justify-between text-[11px] text-slate-600 mt-2">
                <span><span className="font-medium text-slate-900">W:</span> {state.mediaPlayer.width || 0}&quot;</span>
                <span><span className="font-medium text-slate-900">H:</span> {state.mediaPlayer.height || 0}&quot;</span>
                <span><span className="font-medium text-slate-900">D:</span> {state.mediaPlayer.depth}&quot;</span>
              </div>
            )
          )}
        </div>
      </div>

      <Separator />

      {/* 3. Video Wall Configuration */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-slate-900">Video Wall Grid</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Rows</Label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => updateGrid({ rows: Math.max(1, state.grid.rows - 1) })}
                disabled={readOnly}
              >
                <Minus className="size-3" />
              </Button>
              <span className="text-sm font-medium w-4 text-center">{state.grid.rows}</span>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => updateGrid({ rows: state.grid.rows + 1 })}
                disabled={readOnly}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Cols</Label>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => updateGrid({ cols: Math.max(1, state.grid.cols - 1) })}
                disabled={readOnly}
              >
                <Minus className="size-3" />
              </Button>
              <span className="text-sm font-medium w-4 text-center">{state.grid.cols}</span>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => updateGrid({ cols: state.grid.cols + 1 })}
                disabled={readOnly}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* 3.5 Environment Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-slate-900">Environment Settings</h3>
        <div className="space-y-1">
          <Label className="text-xs">AFF to Center (in)</Label>
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              min={minFloorDistance} // Dynamic minimum to ensure 20" clearance
              max={240} // Maximum realistic height (20 ft)
              value={localFloorDistance} 
              onChange={(e) => {
                setLocalFloorDistance(e.target.value);
                const val = Number(e.target.value);
                // Update global state if it's within valid range, otherwise let local state hold it while typing
                if (val >= minFloorDistance && val <= 400) {
                  updateSettings({ floorDistance: val });
                }
              }}
              onBlur={() => {
                // Snap to min/max on blur if left in an invalid state
                const val = Number(localFloorDistance);
                if (val < minFloorDistance) {
                  updateSettings({ floorDistance: minFloorDistance });
                  setLocalFloorDistance(minFloorDistance.toString());
                } else if (val > 400) {
                  updateSettings({ floorDistance: 400 });
                  setLocalFloorDistance("400");
                }
              }}
              className="w-full"
              disabled={readOnly}
            />
          </div>
          <p className="text-[10px] text-slate-500">Distance from floor to center of screen</p>
        </div>
      </div>

      <Separator />

      {/* 4. Wood Backing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">Wood Backing</h3>
          <Switch 
            checked={state.settings.woodBacking} 
            onCheckedChange={(checked) => updateSettings({ woodBacking: checked })} 
            disabled={readOnly}
          />
        </div>
        
        {state.settings.woodBacking && (
          <div className="space-y-1 pt-2">
            <Label className="text-xs">Edge Clearance (in)</Label>
            <Input 
              type="number" 
              min={0}
              max={Math.min(orientedScreen.width * state.grid.cols, orientedScreen.height * state.grid.rows) / 2}
              value={state.settings.woodBackingClearance} 
              onChange={(e) => {
                const maxClearance = Math.min(orientedScreen.width * state.grid.cols, orientedScreen.height * state.grid.rows) / 2;
                const val = Math.max(0, Math.min(Number(e.target.value), maxClearance));
                updateSettings({ woodBackingClearance: val });
              }}
            />
            <p className="text-[10px] text-slate-500">Distance from the edges of the screen</p>
          </div>
        )}
      </div>

      {/* 5. Niche Settings - Only visible in Niche modes */}
      {(state.mode === 'NICHE' || state.mode === 'TABLE_NICHE') && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-slate-900">Niche Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Side Clearance (in)</Label>
                <Input 
                  type="number" 
                  min={0}
                  value={state.nicheSettings.clearanceSides} 
                  onChange={(e) => updateNicheSettings({ clearanceSides: Math.max(0, Number(e.target.value)) })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Top/Bottom (in)</Label>
                <Input 
                  type="number" 
                  min={0}
                  value={state.nicheSettings.clearanceTopBottom} 
                  onChange={(e) => updateNicheSettings({ clearanceTopBottom: Math.max(0, Number(e.target.value)) })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Depth Variant (in)</Label>
                <Input 
                  type="number" 
                  min={0}
                  value={state.nicheSettings.depthVariant} 
                  onChange={(e) => updateNicheSettings({ depthVariant: Math.max(0, Number(e.target.value)) })}
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* 5. Receptacle Box Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">Receptacle Box</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const newId = addReceptacleBox();
              setSelectedBoxId(newId);
            }}
            className="h-7 text-xs"
            disabled={readOnly}
          >
            <Plus className="size-3 mr-1" /> Add
          </Button>
        </div>

        {/* List of Boxes */}
        <div className="space-y-2">
          {state.receptacleBoxes.map((box, index) => (
            <div 
              key={box.id} 
              className={`flex items-center justify-between p-2 rounded border text-sm cursor-pointer ${selectedBoxId === box.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
              onClick={() => setSelectedBoxId(box.id)}
            >
              <span>{box.model || `Box ${index + 1}`}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-400 hover:text-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newId = addReceptacleBox(box);
                    setSelectedBoxId(newId);
                  }}
                  title="Duplicate box"
                  disabled={readOnly}
                >
                  <Copy className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeReceptacleBox(box.id);
                    if (selectedBoxId === box.id) setSelectedBoxId(null);
                  }}
                  disabled={readOnly}
                >
                  <Minus className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Inventory Selector for Selected Box */}
        {selectedBoxId && currentBox && (
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-1">
              {/* Add key based on selectedBoxId to force re-mount and clear state, OR bind value */}
              <Select 
                key={selectedBoxId}
                value={currentBox.inventoryId} 
                onValueChange={handleReceptacleBoxSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a box..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Box</SelectItem>
                  {receptacleBoxes.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.model}{b.alias ? ` — ${b.alias}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {currentBox.inventoryId === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Width (in)</Label>
                  <Input 
                    type="number" 
                    min={0}
                    value={currentBox.width} 
                    onChange={(e) => updateReceptacleBox(selectedBoxId, { width: Math.max(0, Number(e.target.value)) })}
                    disabled={readOnly}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Height (in)</Label>
                  <Input 
                    type="number" 
                    min={0}
                    value={currentBox.height} 
                    onChange={(e) => updateReceptacleBox(selectedBoxId, { height: Math.max(0, Number(e.target.value)) })}
                    disabled={readOnly}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Pos X (in)</Label>
                  <Input 
                    type="number" 
                    min={0}
                    max={(orientedScreen.width * state.grid.cols) - currentBox.width}
                    value={currentBox.posX} 
                    onChange={(e) => {
                      const maxPosX = (orientedScreen.width * state.grid.cols) - currentBox.width;
                      const val = Math.max(0, Math.min(Number(e.target.value), maxPosX));
                      updateReceptacleBox(selectedBoxId, { posX: val });
                    }}
                    disabled={readOnly}
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Pos Y (in)</Label>
                  <Input 
                    type="number" 
                    min={0}
                    max={(orientedScreen.height * state.grid.rows) - currentBox.height}
                    value={currentBox.posY} 
                    onChange={(e) => {
                      const maxPosY = (orientedScreen.height * state.grid.rows) - currentBox.height;
                      const val = Math.max(0, Math.min(Number(e.target.value), maxPosY));
                      updateReceptacleBox(selectedBoxId, { posY: val });
                    }}
                    disabled={readOnly}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900">Installation Notes</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const newId = addNote();
              setSidebarSelectedNoteId(newId);
            }}
            className="h-7 text-xs"
            disabled={readOnly}
          >
            <Plus className="size-3 mr-1" /> Add
          </Button>
        </div>

        {/* List of Notes */}
        <div className="space-y-2">
          {state.notes.map((note, index) => (
            <div 
              key={note.id} 
              className={`flex items-center justify-between p-2 rounded border text-sm cursor-pointer ${sidebarSelectedNoteId === note.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
              onClick={() => setSidebarSelectedNoteId(note.id)}
            >
              <span>{note.name || `Note ${index + 1}`}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-400 hover:text-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newId = addNote(note);
                    setSidebarSelectedNoteId(newId);
                  }}
                  title="Duplicate note"
                  disabled={readOnly}
                >
                  <Copy className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-400 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNote(note.id);
                    if (sidebarSelectedNoteId === note.id) setSidebarSelectedNoteId(null);
                  }}
                  disabled={readOnly}
                >
                  <Minus className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {sidebarSelectedNoteId && currentSidebarNote && (
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-1">
              <Label className="text-xs">Note Name</Label>
              <Input 
                value={currentSidebarNote.name} 
                onChange={(e) => updateNote(sidebarSelectedNoteId, { name: e.target.value })}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Content</Label>
              {/* We need pb-12 so the resize handle isn't blocked by the bottom padding/margin of the sidebar */}
              <div className="min-h-[200px] max-h-[600px] border rounded-md bg-white resize-y overflow-auto flex flex-col mb-8">
                <RichTextEditor 
                  content={currentSidebarNote.content} 
                  onChange={(content) => updateNote(sidebarSelectedNoteId, { content })} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
