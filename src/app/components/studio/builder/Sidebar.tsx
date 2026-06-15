
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
import { SearchableSelect } from './SearchableSelect';
import { getDrawingSaveValidation } from './drawingValidation';
import { roundToStep, RECEPTACLE_POSITION_STEP } from './utils';
import { cn } from '../../ui/utils';
import { DEFAULT_RECEPTACLE_BOX_MOUNT_TYPE } from '../../../constants/receptacleBoxTypes';
import {
  buildDefaultInstallationNoteHtml,
  DEFAULT_INSTALLATION_NOTE_NAME,
  getConfiguredReceptacleBoxes,
  receptacleBoxesTemplateKey,
} from './installationNoteTemplate';

const PLACEHOLDER_BOX_ROW_LABEL = 'Choose from the box';

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
    showRequiredFieldErrors,
  } = useDrawingContext();

  const saveValidation = getDrawingSaveValidation(state);
  const showAffError = showRequiredFieldErrors && saveValidation.aff;
  const showScreenError = showRequiredFieldErrors && saveValidation.screen;

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

  useEffect(() => {
    if (state.selectedNoteId) {
      setSidebarSelectedNoteId(state.selectedNoteId);
    }
  }, [state.selectedNoteId]);

  const receptacleTemplateKey = receptacleBoxesTemplateKey(
    state.receptacleBoxes,
    selectedBoxId,
    state.grid,
    state.mediaPlayer,
  );

  const applyDefaultNoteTemplate = () => {
    const content = buildDefaultInstallationNoteHtml(
      state.receptacleBoxes,
      selectedBoxId,
      state.grid,
      state.mediaPlayer,
    );
    const templateFields = {
      name: DEFAULT_INSTALLATION_NOTE_NAME,
      content,
      templateSource: 'receptacle-in-wall' as const,
    };
    if (sidebarSelectedNoteId) {
      updateNote(sidebarSelectedNoteId, templateFields);
      selectNote(sidebarSelectedNoteId);
      return;
    }
    const newId = addNote();
    updateNote(newId, templateFields);
    setSidebarSelectedNoteId(newId);
    selectNote(newId);
  };

  // Keep template-linked notes in sync when box count or dimensions change
  useEffect(() => {
    if (readOnly) return;
    const content = buildDefaultInstallationNoteHtml(
      state.receptacleBoxes,
      selectedBoxId,
      state.grid,
      state.mediaPlayer,
    );
    for (const note of state.notes) {
      if (note.templateSource === 'receptacle-in-wall' && note.content !== content) {
        updateNote(note.id, { content });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receptacleTemplateKey, readOnly]);

  // Minimum floor distance (drawing zoom layout): at least half the screen height (+ 1") so the screen never overlaps the floor
  const totalScreenHeight = orientedScreen.height * state.grid.rows;
  const minFloorDistance = Math.max(20, Math.ceil(totalScreenHeight / 2) + 1);

  // Auto-correct global state if screen size/grid changes make the current distance invalid
  useEffect(() => {
    if (state.settings.floorDistance < minFloorDistance) {
      updateSettings({ floorDistance: minFloorDistance });
    }
  }, [minFloorDistance, state.settings.floorDistance, updateSettings]);

  // Select first box when none is selected; keep one starter row for the dropdown
  useEffect(() => {
    if (readOnly) return;
    if (state.receptacleBoxes.length === 0) {
      const newId = addReceptacleBox();
      setSelectedBoxId(newId);
      return;
    }
    if (!selectedBoxId) {
      setSelectedBoxId(state.receptacleBoxes[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.receptacleBoxes, selectedBoxId, readOnly]);

  const hasConfiguredReceptacleBox =
    getConfiguredReceptacleBoxes(state.receptacleBoxes).length > 0;

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
        alias: undefined,
        inventoryId: undefined,
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
        alias: selected.alias,
        inventoryId: selected.id,
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
        type: (selected.mountType as any) || 'FIXED',
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

  const activeBoxId =
    selectedBoxId ?? state.receptacleBoxes[0]?.id ?? null;

  const getReceptacleBoxSelectValue = (box: (typeof state.receptacleBoxes)[0]) => {
    if (!box.inventoryId) return 'none';
    return box.inventoryId;
  };

  const receptacleBoxSelectOptions = [
    { value: 'none', label: 'Select a box' },
    { value: 'custom', label: 'Custom Box' },
    ...receptacleBoxes.map((b) => ({
      value: b.id,
      label: b.model + (b.alias ? ` — ${b.alias}` : ''),
    })),
  ];

  const handleReceptacleBoxSelect = (boxId: string, inventoryId: string) => {
    if (inventoryId === 'none') {
      updateReceptacleBox(boxId, {
        inventoryId: undefined,
        model: undefined,
        boxType: undefined,
        configured: false,
      });
      return;
    }

    if (inventoryId === 'custom') {
      updateReceptacleBox(boxId, {
        inventoryId,
        model: 'Custom Box',
        boxType: DEFAULT_RECEPTACLE_BOX_MOUNT_TYPE,
        configured: true,
      });
      return;
    }
    const selected = receptacleBoxes.find(b => b.id === inventoryId);
    if (selected) {
      updateReceptacleBox(boxId, {
        inventoryId,
        width: selected.dimensions.width,
        height: selected.dimensions.height,
        model: selected.model,
        boxType: selected.boxType ?? DEFAULT_RECEPTACLE_BOX_MOUNT_TYPE,
        configured: true,
      });
    }
  };

  const handleAddReceptacleBox = () => {
    const newId = addReceptacleBox();
    setSelectedBoxId(newId);
  };

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
          <Label className="text-xs">Screen</Label>
          <SearchableSelect
            value={
                    state.screen.inventoryId ||
                    screens.find(s => s.model === state.screen.model && s.manufacturer === state.screen.manufacturer)?.id ||
                    'none'
                  }
            onValueChange={handleScreenSelect}
            placeholder="Select a screen..."
            searchPlaceholder="Search screens..."
            disabled={readOnly}
            invalid={showScreenError}
            options={[
              { value: 'none', label: 'No Screen Selected' },
              ...screens.map(s => ({
                value: s.id,
                label: `${s.manufacturer} ${s.model} (${s.sizeInInch || 'N/A'}")`,
              })),
            ]}
          />
          <p className="text-[11px] text-slate-500">required</p>
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
          <Label className="text-xs">Mount</Label>
          <SearchableSelect
            value={mounts.find(m => m.model === state.mount.model)?.id || 'none'}
            onValueChange={handleMountSelect}
            placeholder="Select a mount..."
            searchPlaceholder="Search mounts..."
            disabled={readOnly}
            options={[
              { value: 'none', label: 'No Mount Selected' },
              ...mounts.map(m => ({
                value: m.id,
                label: m.model + (m.alias ? ` — ${m.alias}` : ''),
              })),
            ]}
          />
        </div>

        <div className="space-y-3 pt-2">
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
          <Label className="text-xs">Media Player</Label>
          <SearchableSelect
            value={mediaPlayers.find(p => p.model === state.mediaPlayer.model)?.id || 'none'}
            onValueChange={handleMediaPlayerSelect}
            placeholder="Select a media player..."
            searchPlaceholder="Search media players..."
            disabled={readOnly}
            options={[
              { value: 'none', label: 'No Media Player Selected' },
              ...mediaPlayers.map(m => ({
                value: m.id,
                label: m.model + (m.alias ? ` — ${m.alias}` : ''),
              })),
            ]}
          />
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
        <div className="space-y-3">
          <div className="flex w-full items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex-1 min-w-8 p-0 text-base"
              disabled={readOnly || state.settings.floorDistance <= minFloorDistance}
              onClick={() => {
                const next = Math.max(minFloorDistance, state.settings.floorDistance - 1);
                updateSettings({ floorDistance: next });
              }}
            >
              +
            </Button>
            <Label className="text-xs text-slate-700 shrink-0 px-1">Drawing Zoom</Label>
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex-1 min-w-8 p-0 text-base"
              disabled={readOnly || state.settings.floorDistance >= 400}
              onClick={() => {
                const next = Math.min(400, state.settings.floorDistance + 1);
                updateSettings({ floorDistance: next });
              }}
            >
              -
            </Button>
          </div>
          <p className="text-[11px] leading-snug text-slate-500">
            Drawing zoom adjusts on screen layout only. It is not true architectural scale use
            dimension labels.
          </p>
          <div className="space-y-1">
            <Label className="text-xs">AFF to Center (in)</Label>
            <Input
              type="number"
              min={0}
              max={400}
              value={state.settings.affLabel ?? 0}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!isNaN(val) && val >= 0 && val <= 400) {
                  updateSettings({ affLabel: val });
                }
              }}
              className={cn(
                'h-8 text-xs w-full',
                showAffError && 'border-red-500 focus-visible:ring-red-500',
              )}
              disabled={readOnly}
              placeholder="0"
            />
            <p className="text-[11px] text-slate-500">required</p>
          </div>
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
          {hasConfiguredReceptacleBox && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddReceptacleBox}
              className="h-7 text-xs"
              disabled={readOnly}
            >
              <Plus className="size-3 mr-1" /> Add
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {state.receptacleBoxes.map((box) => (
            <div
              key={box.id}
              className={`rounded border border-slate-200 bg-white shadow-none px-2 py-1 ${
                box.inventoryId === 'custom' ? 'space-y-2' : ''
              }`}
              onClick={() => setSelectedBoxId(box.id)}
            >
              <div className="flex items-center gap-2 py-0">
                <div
                  className="flex-1 min-w-0 py-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SearchableSelect
                    key={box.id}
                    flat
                    value={getReceptacleBoxSelectValue(box)}
                    onValueChange={(value) => handleReceptacleBoxSelect(box.id, value)}
                    placeholder={PLACEHOLDER_BOX_ROW_LABEL}
                    searchPlaceholder="Search boxes..."
                    disabled={readOnly}
                    options={receptacleBoxSelectOptions}
                  />
                </div>
                <div
                  className="flex shrink-0 items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-blue-500"
                    onClick={() => {
                      const newId = addReceptacleBox(box);
                      setSelectedBoxId(newId);
                    }}
                    title="Duplicate box"
                    disabled={readOnly}
                  >
                    <Copy className="size-3" />
                  </Button>
                  {state.receptacleBoxes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-500"
                      onClick={() => {
                        removeReceptacleBox(box.id);
                        if (activeBoxId === box.id) {
                          const remaining = state.receptacleBoxes.filter((b) => b.id !== box.id);
                          setSelectedBoxId(remaining[0]?.id ?? null);
                        }
                      }}
                      title="Remove box"
                      disabled={readOnly}
                    >
                      <Minus className="size-3" />
                    </Button>
                  )}
                </div>
              </div>

              {box.inventoryId === 'custom' && (
                <div
                  className="grid grid-cols-2 gap-3 pt-2 pb-1 border-t border-slate-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Width (in)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={box.width}
                      onChange={(e) =>
                        updateReceptacleBox(box.id, {
                          width: Math.max(0, Number(e.target.value)),
                        })
                      }
                      disabled={readOnly}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Height (in)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={box.height}
                      onChange={(e) =>
                        updateReceptacleBox(box.id, {
                          height: Math.max(0, Number(e.target.value)),
                        })
                      }
                      disabled={readOnly}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Pos X (in)</Label>
                    <Input
                      type="number"
                      step={RECEPTACLE_POSITION_STEP}
                      min={0}
                      max={(orientedScreen.width * state.grid.cols) - box.width}
                      value={box.posX}
                      onChange={(e) => {
                        const maxPosX =
                          orientedScreen.width * state.grid.cols - box.width;
                        const val = roundToStep(
                          Math.max(0, Math.min(Number(e.target.value), maxPosX)),
                          RECEPTACLE_POSITION_STEP,
                        );
                        updateReceptacleBox(box.id, { posX: val });
                      }}
                      disabled={readOnly}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Pos Y (in)</Label>
                    <Input
                      type="number"
                      step={RECEPTACLE_POSITION_STEP}
                      min={0}
                      max={(orientedScreen.height * state.grid.rows) - box.height}
                      value={box.posY}
                      onChange={(e) => {
                        const maxPosY =
                          orientedScreen.height * state.grid.rows - box.height;
                        const val = roundToStep(
                          Math.max(0, Math.min(Number(e.target.value), maxPosY)),
                          RECEPTACLE_POSITION_STEP,
                        );
                        updateReceptacleBox(box.id, { posY: val });
                      }}
                      disabled={readOnly}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm text-slate-900 shrink-0">Installation Notes</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={applyDefaultNoteTemplate}
              className="h-7 text-xs"
              disabled={readOnly}
              title="Fill selected note with default in-wall box text (uses receptacle box count and size)"
            >
              Default
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newId = addNote();
                setSidebarSelectedNoteId(newId);
                selectNote(newId);
              }}
              className="h-7 text-xs"
              disabled={readOnly}
            >
              <Plus className="size-3 mr-1" /> Add
            </Button>
          </div>
        </div>

        {/* List of Notes */}
        <div className="space-y-2">
          {state.notes.map((note, index) => (
            <div 
              key={note.id} 
              className={`flex items-center justify-between p-2 rounded border text-sm cursor-pointer ${sidebarSelectedNoteId === note.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
              onClick={() => { setSidebarSelectedNoteId(note.id); selectNote(note.id); }}
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
                    selectNote(newId);
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
                    if (sidebarSelectedNoteId === note.id) {
                      setSidebarSelectedNoteId(null);
                      selectNote(null);
                    }
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
                  key={sidebarSelectedNoteId}
                  content={currentSidebarNote.content} 
                  onChange={(content) => updateNote(sidebarSelectedNoteId, { content })}
                  editable={!readOnly}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
