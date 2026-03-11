/**
 * Screen Form Pane
 *
 * Slide-in side panel for adding/editing screens.
 */

import React, { useState, useEffect } from 'react';
import { Screen } from '../../types';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { MediaUploader, UploadedFile } from '../shared';

interface ScreenFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screen: Screen | null;
  onSubmit: (data: Omit<Screen, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function ScreenFormDialog({ open, onOpenChange, screen, onSubmit }: ScreenFormDialogProps) {
  const [formData, setFormData] = useState({
    alias: '',
    model: '',
    manufacturer: '',
    sizeInInch: '',
    resolution: '',
    refreshRate: '',
    panelType: '',
    width: '',
    height: '',
    depth: '',
    unit: 'in' as 'in' | 'cm' | 'mm',
  });
  const [attachment, setAttachment] = useState<UploadedFile | null>(null);

  useEffect(() => {
    if (screen) {
      setFormData({
        alias: screen.alias,
        model: screen.model,
        manufacturer: screen.manufacturer || '',
        sizeInInch: screen.sizeInInch?.toString() || '',
        resolution: screen.resolution || '',
        refreshRate: screen.refreshRate?.toString() || '',
        panelType: screen.panelType || '',
        width: screen.dimensions.width.toString(),
        height: screen.dimensions.height.toString(),
        depth: screen.dimensions.depth.toString(),
        unit: screen.dimensions.unit,
      });
    } else {
      setFormData({
        alias: '', model: '', manufacturer: '', sizeInInch: '', resolution: '',
        refreshRate: '', panelType: '', width: '', height: '', depth: '', unit: 'in',
      });
    }
    setAttachment(null);
  }, [screen, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: 'screen',
      alias: formData.alias,
      model: formData.model,
      manufacturer: formData.manufacturer || undefined,
      sizeInInch: formData.sizeInInch ? Number(formData.sizeInInch) : undefined,
      resolution: formData.resolution || undefined,
      refreshRate: formData.refreshRate ? Number(formData.refreshRate) : undefined,
      panelType: formData.panelType || undefined,
      dimensions: {
        width: Number(formData.width),
        height: Number(formData.height),
        depth: Number(formData.depth),
        unit: formData.unit,
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 gap-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b flex-shrink-0">
          <SheetTitle>{screen ? 'Edit Screen' : 'Add New Screen'}</SheetTitle>
          <SheetDescription>
            {screen ? 'Update the screen details below.' : 'Enter the details for the new screen.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="alias">Alias *</Label>
                <Input id="alias" value={formData.alias} onChange={(e) => setFormData({ ...formData, alias: e.target.value })} required placeholder='e.g., Samsung 55" Display' />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input id="model" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} required placeholder="e.g., QM55R" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input id="manufacturer" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} placeholder="e.g., Samsung" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sizeInInch">Screen Size (inches)</Label>
                <Input id="sizeInInch" type="number" value={formData.sizeInInch} onChange={(e) => setFormData({ ...formData, sizeInInch: e.target.value })} placeholder="e.g., 55" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution</Label>
                <Input id="resolution" value={formData.resolution} onChange={(e) => setFormData({ ...formData, resolution: e.target.value })} placeholder="e.g., 3840x2160" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refreshRate">Refresh Rate (Hz)</Label>
                <Input id="refreshRate" type="number" value={formData.refreshRate} onChange={(e) => setFormData({ ...formData, refreshRate: e.target.value })} placeholder="e.g., 60" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panelType">Panel Type</Label>
                <Input id="panelType" value={formData.panelType} onChange={(e) => setFormData({ ...formData, panelType: e.target.value })} placeholder="e.g., QLED, IPS, OLED" />
              </div>
              <div className="col-span-2 pt-4">
                <h4 className="text-sm text-muted-foreground pb-3 border-b">Physical Dimensions</h4>
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width *</Label>
                <Input id="width" type="number" step="0.1" value={formData.width} onChange={(e) => setFormData({ ...formData, width: e.target.value })} required placeholder="e.g., 48.5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height *</Label>
                <Input id="height" type="number" step="0.1" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} required placeholder="e.g., 27.6" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depth">Depth *</Label>
                <Input id="depth" type="number" step="0.1" value={formData.depth} onChange={(e) => setFormData({ ...formData, depth: e.target.value })} required placeholder="e.g., 2.3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v as any })}>
                  <SelectTrigger id="unit"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Inches</SelectItem>
                    <SelectItem value="cm">Centimeters</SelectItem>
                    <SelectItem value="mm">Millimeters</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 pt-4">
                <h4 className="text-sm text-muted-foreground pb-3 border-b">Attachment</h4>
              </div>
              <div className="col-span-2">
                <MediaUploader
                  value={attachment}
                  onChange={setAttachment}
                  label="Upload a product photo or spec sheet"
                />
              </div>
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t flex-shrink-0 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{screen ? 'Update' : 'Add'} Screen</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}