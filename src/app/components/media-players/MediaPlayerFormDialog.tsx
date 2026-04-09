/**
 * Media Player Form Pane
 *
 * Slide-in side panel for adding/editing media players.
 */

import React, { useState, useEffect } from 'react';
import { MediaPlayer } from '../../types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MediaUploader, UploadedFile } from '../shared';

interface MediaPlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaPlayer: MediaPlayer | null;
  onSubmit: (data: Omit<MediaPlayer, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function MediaPlayerFormDialog({ open, onOpenChange, mediaPlayer, onSubmit }: MediaPlayerFormDialogProps) {
  const [formData, setFormData] = useState({
    alias: '', model: '', manufacturer: '',
    width: '', height: '', depth: '', unit: 'in' as 'in' | 'cm' | 'mm',
  });
  const [attachment, setAttachment] = useState<UploadedFile | null>(null);

  useEffect(() => {
    if (mediaPlayer) {
      setFormData({
        alias: mediaPlayer.alias, model: mediaPlayer.model, manufacturer: mediaPlayer.manufacturer || '',
        width: mediaPlayer.dimensions.width.toString(), height: mediaPlayer.dimensions.height.toString(),
        depth: mediaPlayer.dimensions.depth.toString(), unit: mediaPlayer.dimensions.unit,
      });
    } else {
      setFormData({ alias: '', model: '', manufacturer: '', width: '', height: '', depth: '', unit: 'in' });
    }
    setAttachment(null);
  }, [mediaPlayer, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: 'mediaPlayer', alias: formData.alias, model: formData.model,
      manufacturer: formData.manufacturer || undefined,
      dimensions: { width: Number(formData.width), height: Number(formData.height), depth: Number(formData.depth), unit: formData.unit },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 gap-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b flex-shrink-0">
          <SheetTitle>{mediaPlayer ? 'Edit Media Player' : 'Add New Media Player'}</SheetTitle>
          <SheetDescription>{mediaPlayer ? 'Update the media player details below.' : 'Enter the details for the new media player.'}</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2"><Label htmlFor="alias">Alias *</Label><Input id="alias" value={formData.alias} onChange={(e) => setFormData({ ...formData, alias: e.target.value })} required placeholder="e.g., BrightSign 4K Player" /></div>
              <div className="space-y-2"><Label htmlFor="model">MFG. Part *</Label><Input id="model" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} required placeholder="e.g., XT1144" /></div>
              <div className="space-y-2"><Label htmlFor="manufacturer">Make</Label><Input id="manufacturer" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} placeholder="e.g., BrightSign" /></div>
              <div className="col-span-2 pt-4">
                <h4 className="text-sm text-muted-foreground pb-3 border-b">Physical Dimensions</h4>
              </div>
              <div className="space-y-2"><Label htmlFor="height">Height *</Label><Input id="height" type="number" step="0.01" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} required placeholder="e.g., 1.0" /></div>
              <div className="space-y-2"><Label htmlFor="width">Width *</Label><Input id="width" type="number" step="0.01" value={formData.width} onChange={(e) => setFormData({ ...formData, width: e.target.value })} required placeholder="e.g., 4.5" /></div>
              <div className="space-y-2"><Label htmlFor="depth">Depth *</Label><Input id="depth" type="number" step="0.01" value={formData.depth} onChange={(e) => setFormData({ ...formData, depth: e.target.value })} required placeholder="e.g., 4.5" /></div>
              <div className="space-y-2"><Label htmlFor="unit">Unit *</Label><Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v as any })}><SelectTrigger id="unit"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in">Inches</SelectItem><SelectItem value="cm">Centimeters</SelectItem><SelectItem value="mm">Millimeters</SelectItem></SelectContent></Select></div>

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
            <Button type="submit">{mediaPlayer ? 'Update' : 'Add'} Media Player</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
