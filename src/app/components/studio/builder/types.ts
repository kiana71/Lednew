
// ==================== Application State ====================

export interface ScreenConfig {
  width: number; // e.g., 86.5
  height: number; // e.g., 49.3
  depth: number; // e.g., 3.13
  model?: string;
  manufacturer?: string;
  alias?: string;
}

export interface MountConfig {
  type: 'FIXED' | 'TILT' | 'FULL_MOTION';
  depth: number; // e.g., 2.0
  width?: number;
  height?: number;
  model?: string;
}

export interface MediaPlayerConfig {
  depth: number; // e.g., 1.5
  width?: number;
  height?: number;
  position: 'BEHIND_SCREEN' | 'REMOTE';
  model?: string;
  alias?: string;
}

export interface GridConfig {
  rows: number; // default 1
  cols: number; // default 1
}

export interface NicheSettings {
  clearanceSides: number; // default 2"
  clearanceTopBottom: number; // default 2"
  depthVariant: number; // default 0.5"
}

export interface ReceptacleBoxConfig {
  id: string;
  width: number; // Real width (e.g., 6)
  height: number; // Real height (e.g., 6)
  posX: number; // Distance from Screen Left Edge (Inches)
  posY: number; // Distance from Screen Top Edge (Inches)
  model?: string;
  inventoryId?: string; // Tracks the selected dropdown value
}

export interface DrawingSettings {
  floorDistance: number; // Floor to Center Line
  woodBacking: boolean; // Enable/Disable Wood Backing
  woodBackingClearance: number; // Distance from edges in inches
  drawingNumber: string;
  revision: string;
}

export interface InstallationNote {
  id: string;
  name: string;
  content: string;
}

export interface AppState {
  // 1. Environment Mode
  mode: 'WALL' | 'NICHE' | 'TABLE_NICHE';
  
  // 1b. Screen Orientation
  orientation: 'HORIZONTAL' | 'VERTICAL';
  
  // 2. Device Selection (Real dimensions in inches)
  screen: ScreenConfig;
  mount: MountConfig;
  mediaPlayer: MediaPlayerConfig;
  
  // 3. Video Wall Configuration (New Feature)
  grid: GridConfig;
  
  // 4. Niche Settings
  nicheSettings: NicheSettings;
  
  // 5. Receptacle Box (Interactive)
  receptacleBoxes: ReceptacleBoxConfig[];
  
  // 6. Settings
  settings: DrawingSettings;

  // 7. Notes
  notes: InstallationNote[];
  selectedNoteId: string | null;

  // View settings (UI State, not strictly part of the core model but needed for the app)
  view: {
    zoom: number;
    pan: { x: number; y: number };
    showLayers: {
      niche: boolean;
      centerLine: boolean;
      dimensions: boolean;
      receptacleBox: boolean;
      woodBacking: boolean;
      sideView: boolean;
    };
  };
}

export interface DrawingContextType {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  updateScreen: (updates: Partial<ScreenConfig>) => void;
  updateMount: (updates: Partial<MountConfig>) => void;
  updateMediaPlayer: (updates: Partial<MediaPlayerConfig>) => void;
  updateGrid: (updates: Partial<GridConfig>) => void;
  updateNicheSettings: (updates: Partial<NicheSettings>) => void;
  addReceptacleBox: (baseBox?: ReceptacleBoxConfig) => string;
  updateReceptacleBox: (id: string, updates: Partial<ReceptacleBoxConfig>) => void;
  removeReceptacleBox: (id: string) => void;
  updateSettings: (updates: Partial<DrawingSettings>) => void;
  addNote: (baseNote?: InstallationNote) => string;
  updateNote: (id: string, updates: Partial<InstallationNote>) => void;
  removeNote: (id: string) => void;
  selectNote: (id: string | null) => void;
  updateView: (updates: Partial<AppState['view']>) => void;
  toggleLayer: (layer: keyof AppState['view']['showLayers']) => void;
  resetView: () => void;
  /** Screen dimensions with orientation applied (width/height swapped when vertical). */
  orientedScreen: ScreenConfig;
  scale: number;
  totalDrawWidth: number;
  nicheDepth: number;
  nicheDimensions: { width: number; height: number };
}
