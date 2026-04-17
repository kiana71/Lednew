import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useDrawing } from '../../hooks/useDrawings';
import { useAuth } from '../../contexts/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'sonner';
import { dataService } from '../../services/DataService';
import { DrawingBuilder } from './builder/DrawingBuilder';
import type { AppState } from './builder/types';

export function DrawingStudio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { drawing, loading, error } = useDrawing(id || null);
  const { user } = useAuth();
  const [isNewDrawing, setIsNewDrawing] = useState(false);
  const [drawingTitle, setDrawingTitle] = useState('New Drawing');
  const isViewer = user?.role === 'viewer';

  useEffect(() => {
    setIsNewDrawing(!id);
  }, [id]);

  // Sync title when drawing loads
  useEffect(() => {
    if (drawing?.title) {
      setDrawingTitle(drawing.title);
    }
  }, [drawing?.title]);

  useEffect(() => {
    if (id && error) {
      toast.error('Drawing not found');
      navigate('/dashboard');
    }
  }, [id, error, navigate]);

  const handleBack = () => navigate('/dashboard');

  const handleSave = async (appState: AppState, title: string) => {
    if (!user) return;

    try {
      const saveTitle = title.trim() || 'Untitled Drawing';
      
      const canvasSettings = {
        backgroundColor: '#ffffff',
        gridEnabled: true,
        gridSize: 10,
        snapToGrid: true,
        zoom: appState.view?.zoom ?? 1,
      };

      if (isNewDrawing) {
        const response = await dataService.createDrawing({
          title: saveTitle,
          createdBy: user.id,
          createdByName: user.name,
          companyName: user.companyName || '',
          status: 'draft',
          metadata: { version: '1.0' },
          canvasData: {
            elements: [],
            settings: {
              ...canvasSettings,
              appState,
            } as never,
          },
        });

        if (response.success && response.data) {
          toast.success('New drawing created successfully!');
          navigate(`/studio/${response.data.id}`, { replace: true });
        } else {
          toast.error('Failed to save drawing');
        }
      } else if (drawing) {
        const updates: Record<string, unknown> = {
          title: saveTitle,
          canvasData: {
            elements: [],
            settings: {
              ...canvasSettings,
              appState,
            } as never,
          },
        };

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
          if (drawing.requestStatus === 'pending') navigate('/dashboard');
        } else {
          toast.error('Failed to save drawing');
        }
      } else {
        toast.error('Drawing not found');
      }
    } catch {
      toast.error('An error occurred while saving');
    }
  };

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

  const rawSettings = drawing?.canvasData?.settings as Record<string, unknown> | undefined;
  const savedState = rawSettings?.appState as Partial<AppState> | undefined;

  // Merge the real drawing number from the backend into the initial state.
  // Only override settings if we actually have saved state; otherwise let
  // DrawingContext use its own defaults so nothing is undefined.
  const drawingNumber = drawing?.drawingNumber || (isNewDrawing ? 'New Drawing' : '');
  const initialState: Partial<AppState> | undefined = savedState
    ? {
        ...savedState,
        settings: {
          ...savedState.settings,
          drawingNumber,
        } as AppState['settings'],
      }
    : drawingNumber
      ? { settings: { drawingNumber } as AppState['settings'] }
      : undefined;

  return (
    <DrawingBuilder
      initialState={initialState}
      onSave={isViewer ? undefined : handleSave}
      onBack={handleBack}
      title={drawingTitle}
      onTitleChange={isViewer ? undefined : setDrawingTitle}
      readOnly={isViewer}
    />
  );
}
