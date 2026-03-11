/**
 * Edit Drawing Pane
 *
 * Slide-in side panel for editing a drawing's title and description.
 * Superadmins can also edit the company name; others see it as a read-only badge.
 */

import React, { useState, useEffect } from 'react';
import { Drawing } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { DrawingNumberBadge } from './DrawingNumberBadge';
import { CompanyCombobox } from '../shared/CompanyCombobox';
import { useAuth } from '../../contexts/AuthContext';

interface EditDrawingPaneProps {
  drawing: Drawing | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: { title: string; description: string; companyName?: string }) => Promise<boolean>;
}

export function EditDrawingPane({ drawing, onOpenChange, onSave }: EditDrawingPaneProps) {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Sync local state when the drawing changes
  useEffect(() => {
    if (drawing) {
      setTitle(drawing.title);
      setDescription(drawing.description || '');
      setCompanyName(drawing.companyName || '');
    }
  }, [drawing]);

  const handleSave = async () => {
    if (!drawing) return;
    const updates: { title: string; description: string; companyName?: string } = {
      title,
      description,
    };
    // Only superadmins can change the company
    if (isSuperadmin) {
      updates.companyName = companyName;
    }
    const success = await onSave(drawing.id, updates);
    if (success) onOpenChange(false);
  };

  return (
    <Sheet open={!!drawing} onOpenChange={(open) => !open && onOpenChange(false)}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0 gap-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b flex-shrink-0">
          <SheetTitle>Edit Drawing</SheetTitle>
          <SheetDescription>
            Update the drawing details for{' '}
            {drawing && (
              <DrawingNumberBadge drawingNumber={drawing.drawingNumber} variant="inline" />
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter drawing title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter drawing description (optional)"
                rows={4}
              />
            </div>

            {/* Company — editable for superadmin, read-only badge for others */}
            <div className="space-y-2">
              <Label htmlFor="edit-company-name">Company</Label>
              {isSuperadmin ? (
                <CompanyCombobox
                  value={companyName}
                  onChange={setCompanyName}
                  placeholder="Select or add a company..."
                  id="edit-company-name"
                />
              ) : drawing?.companyName ? (
                <div>
                  <Badge variant="secondary" className="text-xs">
                    {drawing.companyName}
                  </Badge>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No company assigned</p>
              )}
            </div>

            {/* Tags shown as read-only badges */}
            {drawing?.tags && drawing.tags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1.5">
                  {drawing.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t flex-shrink-0 flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
