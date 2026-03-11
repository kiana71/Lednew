/**
 * Drawing Sidebar
 *
 * Configuration panel for the LED technical drawing builder.
 * Uses shadcn/ui components and reads inventory from the service.
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import {
  Monitor,
  Layers,
  Tv2,
  Box,
  RotateCcw,
  Eye,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react';
import { useDrawingBuilderStore } from '../../stores/drawingBuilderStore';
import { useDrawingInventory } from '../../hooks/useDrawingInventory';
import type { Screen, Mount, MediaPlayer, ReceptacleBox } from '../../types';

// ─── Section Wrapper ─────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      {icon}
      {title}
    </div>
    {children}
  </div>
);

// ─── Number Stepper ──────────────────────────────────────────────────────────

const NumberStepper: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, step = 0.5, min = 0, max = 100, suffix = '"', disabled }) => (
  <div className="flex items-center justify-between gap-2">
    <Label className="text-xs text-slate-600 whitespace-nowrap">{label}</Label>
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-6 w-6"
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        disabled={disabled || value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="text-xs font-mono w-12 text-center">
        {value.toFixed(1)}{suffix}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-6 w-6"
        onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}
        disabled={disabled || value >= max}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

interface DrawingSidebarProps {
  readOnly?: boolean;
}

export function DrawingSidebar({ readOnly = false }: DrawingSidebarProps) {
  const store = useDrawingBuilderStore();
  const { screens, mounts, mediaPlayers, receptacleBoxes, loading } = useDrawingInventory();

  const maxValues = store.selectedScreen && store.selectedReceptacleBox ? store.getMaxValues() : null;
  const isDisabled = readOnly || loading;

  return (
    <aside className="w-80 border-l bg-white flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">Drawing Configuration</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* ── Component Selection ─────────────────────────────── */}
          <Section title="Components" icon={<Monitor className="h-4 w-4" />}>
            {/* Screen */}
            <div className="space-y-1">
              <Label className="text-xs">Screen</Label>
              <Select
                value={store.selectedScreen?.id ?? ''}
                onValueChange={(id) => {
                  const s = screens.find((x: Screen) => x.id === id) ?? null;
                  store.setSelectedScreen(s);
                }}
                disabled={isDisabled}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Select screen..." />
                </SelectTrigger>
                <SelectContent>
                  {screens.map((s: Screen) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.alias} ({s.sizeInInch}&quot;)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mount */}
            <div className="space-y-1">
              <Label className="text-xs">Mount</Label>
              <Select
                value={store.selectedMount?.id ?? ''}
                onValueChange={(id) => {
                  const m = mounts.find((x: Mount) => x.id === id) ?? null;
                  store.setSelectedMount(m);
                }}
                disabled={isDisabled}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Select mount..." />
                </SelectTrigger>
                <SelectContent>
                  {mounts.map((m: Mount) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.alias}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Media Player */}
            <div className="space-y-1">
              <Label className="text-xs">Media Player</Label>
              <Select
                value={store.selectedMediaPlayer?.id ?? ''}
                onValueChange={(id) => {
                  const mp = mediaPlayers.find((x: MediaPlayer) => x.id === id) ?? null;
                  store.setSelectedMediaPlayer(mp);
                }}
                disabled={isDisabled}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Select media player..." />
                </SelectTrigger>
                <SelectContent>
                  {mediaPlayers.map((mp: MediaPlayer) => (
                    <SelectItem key={mp.id} value={mp.id}>
                      {mp.alias}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Receptacle Box */}
            <div className="space-y-1">
              <Label className="text-xs">Receptacle Box</Label>
              <Select
                value={store.selectedReceptacleBox?.id ?? ''}
                onValueChange={(id) => {
                  const rb = receptacleBoxes.find((x: ReceptacleBox) => x.id === id) ?? null;
                  store.setSelectedReceptacleBox(rb);
                }}
                disabled={isDisabled}
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Select receptacle box..." />
                </SelectTrigger>
                <SelectContent>
                  {receptacleBoxes.map((rb: ReceptacleBox) => (
                    <SelectItem key={rb.id} value={rb.id}>
                      {rb.alias}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Section>

          <Separator />

          {/* ── Display Settings ────────────────────────────────── */}
          <Section title="Display Settings" icon={<Layers className="h-4 w-4" />}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Horizontal</Label>
                <Switch checked={store.isHorizontal} onCheckedChange={() => store.toggleOrientation()} disabled={readOnly} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Niche</Label>
                <Switch checked={store.isNiche} onCheckedChange={() => store.toggleNiche()} disabled={readOnly} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Edge-to-Edge</Label>
                <Switch checked={store.isEdgeToEdge} onCheckedChange={() => store.toggleEdgeToEdge()} disabled={readOnly} />
              </div>

              <NumberStepper
                label="Variant Depth"
                value={store.variantDepth}
                onChange={store.setVariantDepth}
                step={0.25}
                min={0}
                max={10}
                disabled={readOnly}
              />

              <NumberStepper
                label="Floor Distance"
                value={store.floorDistance}
                onChange={store.setFloorDistance}
                step={1}
                min={5}
                max={200}
                disabled={readOnly}
              />
            </div>
          </Section>

          <Separator />

          {/* ── Receptacle Box Layout ───────────────────────────── */}
          <Section title="Receptacle Box Layout" icon={<Box className="h-4 w-4" />}>
            <div className="space-y-3">
              {/* Box count */}
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-slate-600">Count</Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={store.decrementBoxCount}
                    disabled={readOnly || store.boxCount <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs font-mono w-8 text-center">{store.boxCount}</span>
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={store.incrementBoxCount} disabled={readOnly}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Column Layout</Label>
                <Switch checked={store.isColumnLayout} onCheckedChange={() => store.toggleColumnLayout()} disabled={readOnly} />
              </div>

              <NumberStepper
                label="Bottom Distance"
                value={store.bottomDistance}
                onChange={store.setBottomDistance}
                step={0.5}
                max={maxValues?.maxBottomDistance ?? 100}
                disabled={readOnly}
              />

              <NumberStepper
                label="Top Distance"
                value={store.topDistance}
                onChange={store.setTopDistance}
                step={0.5}
                max={maxValues?.maxTopDistance ?? 100}
                disabled={readOnly}
              />

              <NumberStepper
                label="Left Distance"
                value={store.leftDistance}
                onChange={store.setLeftDistance}
                step={0.5}
                max={maxValues?.maxLeftDistance ?? 100}
                disabled={readOnly}
              />

              <NumberStepper
                label="Box Gap"
                value={store.boxGap}
                onChange={store.setBoxGap}
                step={0.5}
                max={maxValues?.maxBoxGap ?? 100}
                disabled={readOnly}
              />
            </div>
          </Section>

          <Separator />

          {/* ── Visibility Toggles ─────────────────────────────── */}
          <Section title="Visibility" icon={<Eye className="h-4 w-4" />}>
            <div className="space-y-2">
              {[
                { label: 'Floor Line', checked: store.showFloorLine, onChange: store.setShowFloorLine },
                { label: 'Center Lines', checked: store.showCenterLines, onChange: store.setShowCenterLines },
                { label: 'Wood Backing', checked: store.showWoodBacking, onChange: store.setShowWoodBacking },
                { label: 'Receptacle Boxes', checked: store.showReceptacleBoxes, onChange: store.setShowReceptacleBoxes },
                { label: 'Intended Position', checked: store.showIntendedPosition, onChange: store.setShowIntendedPosition },
                { label: 'Side View', checked: store.showSideView, onChange: store.setShowSideView },
              ].map(({ label, checked, onChange }) => (
                <div key={label} className="flex items-center justify-between">
                  <Label className="text-xs">{label}</Label>
                  <Switch checked={checked} onCheckedChange={onChange} disabled={readOnly} />
                </div>
              ))}
            </div>
          </Section>

          <Separator />

          {/* ── Zoom Controls ──────────────────────────────────── */}
          <Section title="Zoom" icon={<Tv2 className="h-4 w-4" />}>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={store.zoomOut}>
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs font-mono flex-1 text-center">
                {Math.round(store.zoom * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={store.zoomIn}>
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" onClick={store.resetZoom}>
                <Maximize className="h-3 w-3" />
              </Button>
            </div>
          </Section>
        </div>
      </ScrollArea>
    </aside>
  );
}
