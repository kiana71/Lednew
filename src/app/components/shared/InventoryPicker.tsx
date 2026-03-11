/**
 * Inventory Picker Component
 *
 * A custom dropdown that shows inventory items as searchable mini cards.
 * Used inside the Request Drawing pane for selecting screens, mounts,
 * media players and receptacle boxes.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Screen, Mount, MediaPlayer, ReceptacleBox } from '../../types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { ChevronDown, Search, X, Monitor, Settings, Tv, Zap, Check } from 'lucide-react';

// ── Type helpers ──────────────────────────────────────────────────────

type PickerItem = Screen | Mount | MediaPlayer | ReceptacleBox;

interface InventoryPickerProps<T extends PickerItem> {
  label: string;
  icon: React.ReactNode;
  items: T[];
  value: T | null;
  onChange: (item: T | null) => void;
  loading?: boolean;
  renderCard: (item: T, selected: boolean) => React.ReactNode;
  renderDetail: (item: T) => React.ReactNode;
  placeholder?: string;
}

export function InventoryPicker<T extends PickerItem>({
  label,
  icon,
  items,
  value,
  onChange,
  loading,
  renderCard,
  renderDetail,
  placeholder = 'Select an item...',
}: InventoryPickerProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Small delay so the popover renders first
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  const filtered = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.alias.toLowerCase().includes(q) ||
      item.model.toLowerCase().includes(q) ||
      item.manufacturer?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 py-2 text-left"
          >
            {value ? (
              <span className="flex items-center gap-2 truncate">
                {icon}
                <span className="truncate">{value.alias}</span>
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                {icon}
                {placeholder}
              </span>
            )}
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          sideOffset={4}
        >
          {/* Search */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="size-4 text-muted-foreground mr-2 shrink-0" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Items */}
          <ScrollArea className="max-h-64">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {search ? 'No items match your search' : 'No items available'}
              </div>
            ) : (
              <div className="p-1.5 space-y-1">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full text-left rounded-md transition-colors ${
                      value?.id === item.id
                        ? 'bg-slate-100 ring-1 ring-slate-300'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      onChange(value?.id === item.id ? null : item);
                      setOpen(false);
                    }}
                  >
                    {renderCard(item, value?.id === item.id)}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Clear */}
          {value && (
            <div className="border-t px-3 py-2">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { onChange(null); setOpen(false); }}
              >
                Clear selection
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected detail card */}
      {value && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          {renderDetail(value)}
        </div>
      )}
    </div>
  );
}

// ── Pre-built card / detail renderers ────────────────────────────────

export function ScreenPickerCard({ item, selected }: { item: Screen; selected: boolean }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="flex items-center justify-center size-8 rounded-md bg-blue-50 text-blue-600 shrink-0">
        <Monitor className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.alias}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.manufacturer}</span>
          <span className="text-slate-300">&middot;</span>
          <span className="font-mono">{item.model}</span>
          {item.sizeInInch && (
            <>
              <span className="text-slate-300">&middot;</span>
              <span>{item.sizeInInch}&quot;</span>
            </>
          )}
        </div>
      </div>
      {selected && <Check className="size-4 text-slate-600 shrink-0" />}
    </div>
  );
}

export function ScreenPickerDetail({ item }: { item: Screen }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Monitor className="size-4 text-blue-600" />
        <span className="text-sm font-medium">{item.alias}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div>Make: <span className="text-foreground">{item.manufacturer || '—'}</span></div>
        <div>Part: <span className="text-foreground font-mono">{item.model}</span></div>
        <div>Size: <span className="text-foreground">{item.sizeInInch ? `${item.sizeInInch}"` : '—'}</span></div>
        <div>Resolution: <span className="text-foreground">{item.resolution || '—'}</span></div>
        <div>Dimensions: <span className="text-foreground">{item.dimensions.width} &times; {item.dimensions.height} &times; {item.dimensions.depth} {item.dimensions.unit}</span></div>
        {item.panelType && <div>Panel: <span className="text-foreground">{item.panelType}</span></div>}
      </div>
    </div>
  );
}

export function MountPickerCard({ item, selected }: { item: Mount; selected: boolean }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="flex items-center justify-center size-8 rounded-md bg-amber-50 text-amber-600 shrink-0">
        <Settings className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.alias}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.manufacturer}</span>
          <span className="text-slate-300">&middot;</span>
          <span className="font-mono">{item.model}</span>
          {item.maxLoadLbs && (
            <>
              <span className="text-slate-300">&middot;</span>
              <span>{item.maxLoadLbs} lbs</span>
            </>
          )}
        </div>
      </div>
      {selected && <Check className="size-4 text-slate-600 shrink-0" />}
    </div>
  );
}

export function MountPickerDetail({ item }: { item: Mount }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Settings className="size-4 text-amber-600" />
        <span className="text-sm font-medium">{item.alias}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div>Brand: <span className="text-foreground">{item.manufacturer || '—'}</span></div>
        <div>Part: <span className="text-foreground font-mono">{item.model}</span></div>
        <div>Max Load: <span className="text-foreground">{item.maxLoadLbs ? `${item.maxLoadLbs} lbs` : '—'}</span></div>
        <div>Clearance: <span className="text-foreground">{item.clearance || '—'}</span></div>
        <div>Dimensions: <span className="text-foreground">{item.dimensions.width} &times; {item.dimensions.height} &times; {item.dimensions.depth} {item.dimensions.unit}</span></div>
      </div>
    </div>
  );
}

export function MediaPlayerPickerCard({ item, selected }: { item: MediaPlayer; selected: boolean }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="flex items-center justify-center size-8 rounded-md bg-emerald-50 text-emerald-600 shrink-0">
        <Tv className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.alias}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.manufacturer}</span>
          <span className="text-slate-300">&middot;</span>
          <span className="font-mono">{item.model}</span>
        </div>
      </div>
      {selected && <Check className="size-4 text-slate-600 shrink-0" />}
    </div>
  );
}

export function MediaPlayerPickerDetail({ item }: { item: MediaPlayer }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Tv className="size-4 text-emerald-600" />
        <span className="text-sm font-medium">{item.alias}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div>Make: <span className="text-foreground">{item.manufacturer || '—'}</span></div>
        <div>Part: <span className="text-foreground font-mono">{item.model}</span></div>
        <div>Dimensions: <span className="text-foreground">{item.dimensions.width} &times; {item.dimensions.height} &times; {item.dimensions.depth} {item.dimensions.unit}</span></div>
      </div>
    </div>
  );
}

export function ReceptacleBoxPickerCard({ item, selected }: { item: ReceptacleBox; selected: boolean }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="flex items-center justify-center size-8 rounded-md bg-violet-50 text-violet-600 shrink-0">
        <Zap className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.alias}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.manufacturer}</span>
          <span className="text-slate-300">&middot;</span>
          <span className="font-mono">{item.model}</span>
        </div>
      </div>
      {selected && <Check className="size-4 text-slate-600 shrink-0" />}
    </div>
  );
}

export function ReceptacleBoxPickerDetail({ item }: { item: ReceptacleBox }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Zap className="size-4 text-violet-600" />
        <span className="text-sm font-medium">{item.alias}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div>Brand: <span className="text-foreground">{item.manufacturer || '—'}</span></div>
        <div>Part: <span className="text-foreground font-mono">{item.model}</span></div>
        <div>Dimensions: <span className="text-foreground">{item.dimensions.width} &times; {item.dimensions.height} &times; {item.dimensions.depth} {item.dimensions.unit}</span></div>
      </div>
    </div>
  );
}