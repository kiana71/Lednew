
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  AppState, 
  ScreenConfig, 
  MountConfig, 
  MediaPlayerConfig, 
  GridConfig, 
  NicheSettings, 
  ReceptacleBoxConfig,
  DrawingSettings,
  DrawingContextType,
  InstallationNote
} from './types';import { 
  calculateScale, 
  calculateTotalDrawWidth, 
  calculateNicheDepth, 
  calculateNicheDimensions 
} from './utils';

// Initial default state based on prompt examples
const defaultState: AppState = {
  mode: 'NICHE',
  orientation: 'HORIZONTAL',
  screen: {
    width: 0,
    height: 0,
    depth: 0,
  },
  mount: {
    type: 'FIXED',
    depth: 0,
  },
  mediaPlayer: {
    depth: 0,
    position: 'BEHIND_SCREEN',
  },
  grid: {
    rows: 1,
    cols: 1,
  },
  nicheSettings: {
    clearanceSides: 2,
    clearanceTopBottom: 2,
    depthVariant: 0.5,
  },
  receptacleBoxes: [
    {
      id: 'default-box',
      width: 6,
      height: 6,
      posX: 10,
      posY: 10,
    }
  ],
  settings: {
    floorDistance: 60, // 5ft default
    woodBacking: false,
    woodBackingClearance: 3,
    drawingNumber: 'New Drawing',
    revision: '1.0',
  },
  notes: [
    {
      id: 'default-note-1',
      name: 'Standard Requirements',
      content: '<p>Please verify all site dimensions before installation.</p><p>Ensure power and data are available at the specified locations.</p>'
    }
  ],
  selectedNoteId: 'default-note-1',
  view: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    showLayers: {
      niche: true,
      centerLine: true,
      dimensions: true,
      receptacleBox: true,
      woodBacking: true,
      sideView: true,
    },
  },
};

const DrawingContext = createContext<DrawingContextType | undefined>(undefined);

export const DrawingProvider = ({ 
  children, 
  initialState,
  readOnly = false,
}: { 
  children: ReactNode; 
  initialState?: Partial<AppState>;
  readOnly?: boolean;
}) => {
  const [state, setState] = useState<AppState>(() => {
    if (!initialState) return defaultState;
    return {
      ...defaultState,
      ...initialState,
      // Deep-merge nested objects so partial overrides don't wipe defaults
      screen: { ...defaultState.screen, ...initialState.screen },
      mount: { ...defaultState.mount, ...initialState.mount },
      mediaPlayer: { ...defaultState.mediaPlayer, ...initialState.mediaPlayer },
      grid: { ...defaultState.grid, ...initialState.grid },
      nicheSettings: { ...defaultState.nicheSettings, ...initialState.nicheSettings },
      settings: { ...defaultState.settings, ...initialState.settings },
      view: {
        ...defaultState.view,
        ...initialState.view,
        showLayers: { ...defaultState.view.showLayers, ...initialState.view?.showLayers },
      },
      notes: initialState.notes ?? defaultState.notes,
      receptacleBoxes: initialState.receptacleBoxes ?? defaultState.receptacleBoxes,
    };
  });

  // Orientation: swap width/height when vertical
  const orientedScreen: ScreenConfig = state.orientation === 'VERTICAL'
    ? { ...state.screen, width: state.screen.height, height: state.screen.width }
    : state.screen;

  // Calculated values (use orientedScreen so all visuals respect orientation)
  const scale = calculateScale(state.mode, orientedScreen, state.grid, state.nicheSettings, state.settings.floorDistance);
  const totalDrawWidth = calculateTotalDrawWidth(state.mode, orientedScreen, state.grid, state.nicheSettings);
  const nicheDepth = calculateNicheDepth(state.screen, state.mount, state.mediaPlayer, state.nicheSettings);
  const nicheDimensions = calculateNicheDimensions(orientedScreen, state.grid, state.nicheSettings, state.mode);

  // Update helper
  const updateState = (updates: Partial<AppState>) => {
    if (readOnly) return;
    setState((prev: AppState) => ({ ...prev, ...updates }));
  };

  // Specific updaters
  const updateScreen = (updates: Partial<ScreenConfig>) => {
    if (readOnly) return;
    setState((prev: AppState) => ({ ...prev, screen: { ...prev.screen, ...updates } }));
  };

  const updateMount = (updates: Partial<MountConfig>) => {
    if (readOnly) return;
    setState((prev: AppState) => ({ ...prev, mount: { ...prev.mount, ...updates } }));
  };

  const updateMediaPlayer = (updates: Partial<MediaPlayerConfig>) => {
    if (readOnly) return;
    setState((prev: AppState) => ({ ...prev, mediaPlayer: { ...prev.mediaPlayer, ...updates } }));
  };

  const updateGrid = (updates: Partial<GridConfig>) => {
    if (readOnly) return;
    setState((prev: AppState) => ({ ...prev, grid: { ...prev.grid, ...updates } }));
  };

  const updateNicheSettings = (updates: Partial<NicheSettings>) => {
    if (readOnly) return;
    setState((prev: AppState) => ({ ...prev, nicheSettings: { ...prev.nicheSettings, ...updates } }));
  };

  const addReceptacleBox = (baseBox?: ReceptacleBoxConfig) => {
    if (readOnly) return '';
    const newBox: ReceptacleBoxConfig = baseBox ? {
      ...baseBox,
      id: crypto.randomUUID(),
      // slightly offset the duplicated box so it's visibly distinct
      posX: baseBox.posX + 2,
      posY: baseBox.posY + 2,
    } : {
      id: crypto.randomUUID(),
      width: 6,
      height: 6,
      posX: 10,
      posY: 10,
    };
    setState((prev: AppState) => ({
      ...prev,
      receptacleBoxes: [...prev.receptacleBoxes, newBox],
    }));
    return newBox.id;
  };

  const updateReceptacleBox = (id: string, updates: Partial<ReceptacleBoxConfig>) => {
    if (readOnly) return;
    setState((prev: AppState) => ({
      ...prev,
      receptacleBoxes: prev.receptacleBoxes.map((box) =>
        box.id === id ? { ...box, ...updates } : box
      ),
    }));
  };

  const removeReceptacleBox = (id: string) => {
    if (readOnly) return;
    setState((prev: AppState) => ({
      ...prev,
      receptacleBoxes: prev.receptacleBoxes.filter((box) => box.id !== id),
    }));
  };

  const updateSettings = (updates: Partial<DrawingSettings>) => {
    if (readOnly) return;
    setState((prev: AppState) => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  };

  const addNote = (baseNote?: InstallationNote) => {
    if (readOnly) return '';
    const newNote: InstallationNote = baseNote ? {
      ...baseNote,
      id: crypto.randomUUID(),
      name: `${baseNote.name} (Copy)`
    } : {
      id: crypto.randomUUID(),
      name: `Note ${state.notes.length + 1}`,
      content: '<p>New installation note...</p>'
    };
    setState((prev: AppState) => ({
      ...prev,
      notes: [...prev.notes, newNote],
      selectedNoteId: prev.selectedNoteId || newNote.id // Auto-select if none selected
    }));
    return newNote.id;
  };

  const updateNote = (id: string, updates: Partial<InstallationNote>) => {
    if (readOnly) return;
    setState((prev: AppState) => ({
      ...prev,
      notes: prev.notes.map((note) =>
        note.id === id ? { ...note, ...updates } : note
      ),
    }));
  };

  const removeNote = (id: string) => {
    if (readOnly) return;
    setState((prev: AppState) => ({
      ...prev,
      notes: prev.notes.filter((note) => note.id !== id),
      selectedNoteId: prev.selectedNoteId === id ? null : prev.selectedNoteId
    }));
  };

  const selectNote = (id: string | null) => {
    if (readOnly) return;
    setState((prev: AppState) => ({ ...prev, selectedNoteId: id }));
  };

  const updateView = (updates: Partial<AppState['view']>) => {
    if (readOnly) return;
    setState((prev: AppState) => ({ ...prev, view: { ...prev.view, ...updates } }));
  };

  const toggleLayer = (layer: keyof AppState['view']['showLayers']) => {
    if (readOnly) return;
    setState((prev: AppState) => ({
      ...prev,
      view: {
        ...prev.view,
        showLayers: {
          ...prev.view.showLayers,
          [layer]: !prev.view.showLayers[layer],
        },
      },
    }));
  };

  const resetView = () => {
    if (readOnly) return;
    setState((prev: AppState) => ({
      ...prev,
      view: {
        zoom: 1,
        pan: { x: 0, y: 0 },
        showLayers: prev.view.showLayers,
      },
    }));
  };

  return (
    <DrawingContext.Provider
      value={{
        state,
        readOnly,
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
        addNote,
        updateNote,
        removeNote,
        selectNote,
        updateView,
        toggleLayer,
        resetView,
        orientedScreen,
        scale,
        totalDrawWidth,
        nicheDepth,
        nicheDimensions,
      }}
    >
      {children}
    </DrawingContext.Provider>
  );
};

export const useDrawingContext = () => {
  const context = useContext(DrawingContext);
  if (context === undefined) {
    throw new Error('useDrawingContext must be used within a DrawingProvider');
  }
  return context;
};
