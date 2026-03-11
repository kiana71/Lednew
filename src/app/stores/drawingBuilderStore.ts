/**
 * Drawing Builder Store (Zustand)
 *
 * Central state for the LED technical drawing builder.
 * All configuration, selections, receptacle-box layout, and visibility toggles
 * live here. Pure calculation logic is delegated to `drawingCalculations.ts`.
 */

import { create } from 'zustand';
import type { Screen, Mount, MediaPlayer, ReceptacleBox } from '../types';
import {
  calculateLayout,
  calculateBoxPositions,
  calculateMaxValues,
  type LayoutResult,
  type BoxPosition,
  type MaxValues,
} from '../utils/drawingCalculations';

// ─── Store Types ─────────────────────────────────────────────────────────────

export interface ReceptacleBoxInstance {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawingBuilderState {
  // Selected inventory items
  selectedScreen: Screen | null;
  selectedMount: Mount | null;
  selectedMediaPlayer: MediaPlayer | null;
  selectedReceptacleBox: ReceptacleBox | null;

  // Configuration
  isHorizontal: boolean;
  isNiche: boolean;
  isEdgeToEdge: boolean;
  variantDepth: number;
  floorDistance: number;

  // Receptacle box layout
  bottomDistance: number;
  topDistance: number;
  leftDistance: number;
  boxGap: number;
  boxCount: number;
  isColumnLayout: boolean;
  receptacleBoxes: ReceptacleBoxInstance[];

  // Visibility
  showFloorLine: boolean;
  showCenterLines: boolean;
  showWoodBacking: boolean;
  showReceptacleBoxes: boolean;
  showIntendedPosition: boolean;
  showSideView: boolean;

  // Zoom
  zoom: number;

  // Notes & metadata
  notes: string;
  drawingTitle: string;

  // ── Actions ────────────────────────────────────────────────────────────

  setSelectedScreen: (s: Screen | null) => void;
  setSelectedMount: (m: Mount | null) => void;
  setSelectedMediaPlayer: (mp: MediaPlayer | null) => void;
  setSelectedReceptacleBox: (rb: ReceptacleBox | null) => void;

  toggleOrientation: () => void;
  toggleNiche: () => void;
  toggleEdgeToEdge: () => void;
  setVariantDepth: (v: number) => void;
  setFloorDistance: (v: number) => void;

  setBottomDistance: (v: number) => void;
  setTopDistance: (v: number) => void;
  setLeftDistance: (v: number) => void;
  setBoxGap: (v: number) => void;
  setBoxCount: (v: number) => void;
  incrementBoxCount: () => void;
  decrementBoxCount: () => void;
  toggleColumnLayout: () => void;

  setShowFloorLine: (v: boolean) => void;
  setShowCenterLines: (v: boolean) => void;
  setShowWoodBacking: (v: boolean) => void;
  setShowReceptacleBoxes: (v: boolean) => void;
  setShowIntendedPosition: (v: boolean) => void;
  setShowSideView: (v: boolean) => void;

  setZoom: (v: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  setNotes: (v: string) => void;
  setDrawingTitle: (v: string) => void;

  /** Recompute box positions from current settings. */
  refreshBoxPositions: () => void;

  // ── Derived (getters) ──────────────────────────────────────────────────

  /** Full SVG layout — call this in components that render the diagram. */
  getLayout: () => LayoutResult;

  /** Maximum allowed values for receptacle box settings (boundary enforcement). */
  getMaxValues: () => MaxValues;

  /** Whether the drawing is in a "ready" state (screen + mount selected). */
  canRender: () => boolean;

  /** Serialize the builder state for saving into a Drawing record. */
  serialize: () => DrawingBuilderSnapshot;

  /** Restore state from a saved snapshot. */
  restore: (snapshot: DrawingBuilderSnapshot) => void;

  /** Reset the entire store to default values (clean slate for new drawings). */
  reset: () => void;
}

// ─── Serialization Snapshot ──────────────────────────────────────────────────

export interface DrawingBuilderSnapshot {
  selectedScreenId: string | null;
  selectedMountId: string | null;
  selectedMediaPlayerId: string | null;
  selectedReceptacleBoxId: string | null;
  isHorizontal: boolean;
  isNiche: boolean;
  isEdgeToEdge: boolean;
  variantDepth: number;
  floorDistance: number;
  bottomDistance: number;
  topDistance: number;
  leftDistance: number;
  boxGap: number;
  boxCount: number;
  isColumnLayout: boolean;
  showFloorLine: boolean;
  showCenterLines: boolean;
  showWoodBacking: boolean;
  showReceptacleBoxes: boolean;
  showIntendedPosition: boolean;
  showSideView: boolean;
  notes: string;
  drawingTitle: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildBoxLayoutParams(state: DrawingBuilderState, boundary: LayoutResult['boundary'], scaleFactor: number) {
  return {
    boundary,
    boxWidthInches: state.selectedReceptacleBox?.dimensions.width ?? 0,
    boxHeightInches: state.selectedReceptacleBox?.dimensions.height ?? 0,
    scaleFactor,
    leftDistance: state.leftDistance,
    bottomDistance: state.bottomDistance,
    topDistance: state.topDistance,
    boxGap: state.boxGap,
    boxCount: state.boxCount,
    isColumnLayout: state.isColumnLayout,
  };
}

function recomputeBoxes(state: DrawingBuilderState): ReceptacleBoxInstance[] {
  if (!state.selectedReceptacleBox || !state.selectedScreen) return [];

  const layout = computeLayout(state);
  const params = buildBoxLayoutParams(state, layout.boundary, layout.scaleFactor);
  const { positions } = calculateBoxPositions(params);

  const count = Math.min(state.boxCount, positions.length);
  return positions.slice(0, count).map((pos, i) => ({
    id: state.receptacleBoxes[i]?.id ?? Date.now() + i,
    ...pos,
  }));
}

function computeLayout(state: DrawingBuilderState): LayoutResult {
  const screen = state.selectedScreen;
  const mount = state.selectedMount;
  const mp = state.selectedMediaPlayer;

  return calculateLayout({
    screenWidth: screen?.dimensions.width ?? 0,
    screenHeight: screen?.dimensions.height ?? 0,
    screenDepth: screen?.dimensions.depth ?? 0,
    isHorizontal: state.isHorizontal,
    clearanceInches: mount?.clearanceInches ?? 0,
    isNiche: state.isNiche,
    isEdgeToEdge: state.isEdgeToEdge,
    mountDepth: mount?.dimensions.depth ?? 0,
    mediaPlayerDepth: mp?.dimensions.depth ?? 0,
    variantDepth: state.variantDepth,
  });
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useDrawingBuilderStore = create<DrawingBuilderState>((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────

  selectedScreen: null,
  selectedMount: null,
  selectedMediaPlayer: null,
  selectedReceptacleBox: null,

  isHorizontal: true,
  isNiche: true,
  isEdgeToEdge: true,
  variantDepth: 0.5,
  floorDistance: 20,

  bottomDistance: 0,
  topDistance: 0,
  leftDistance: 0,
  boxGap: 0,
  boxCount: 1,
  isColumnLayout: false,
  receptacleBoxes: [],

  showFloorLine: true,
  showCenterLines: true,
  showWoodBacking: true,
  showReceptacleBoxes: true,
  showIntendedPosition: true,
  showSideView: true,

  zoom: 1,

  notes: '',
  drawingTitle: '',

  // ── Selection setters ────────────────────────────────────────────────

  setSelectedScreen: (s) => {
    set({ selectedScreen: s });
    // Recompute boxes after screen change (boundary changes)
    setTimeout(() => get().refreshBoxPositions(), 0);
  },

  setSelectedMount: (m) => {
    set({ selectedMount: m });
    setTimeout(() => get().refreshBoxPositions(), 0);
  },

  setSelectedMediaPlayer: (mp) => set({ selectedMediaPlayer: mp }),

  setSelectedReceptacleBox: (rb) => {
    set({ selectedReceptacleBox: rb });
    setTimeout(() => get().refreshBoxPositions(), 0);
  },

  // ── Configuration toggles ───────────────────────────────────────────

  toggleOrientation: () => {
    set((s) => ({ isHorizontal: !s.isHorizontal }));
    setTimeout(() => get().refreshBoxPositions(), 0);
  },

  toggleNiche: () => set((s) => ({ isNiche: !s.isNiche })),
  toggleEdgeToEdge: () => set((s) => ({ isEdgeToEdge: !s.isEdgeToEdge })),
  setVariantDepth: (v) => set({ variantDepth: Math.max(0, v) }),
  setFloorDistance: (v) => set({ floorDistance: Math.max(0, v) }),

  // ── Receptacle box settings with constraint enforcement ─────────────

  setBottomDistance: (v) => {
    const state = get();
    const layout = computeLayout(state);
    const params = buildBoxLayoutParams({ ...state, bottomDistance: v }, layout.boundary, layout.scaleFactor);
    const { maxBottomDistance } = calculateMaxValues(params);
    set({ bottomDistance: Math.min(Math.max(0, v), maxBottomDistance) });
    setTimeout(() => get().refreshBoxPositions(), 0);
  },

  setTopDistance: (v) => {
    const state = get();
    const layout = computeLayout(state);
    const params = buildBoxLayoutParams({ ...state, topDistance: v }, layout.boundary, layout.scaleFactor);
    const { maxTopDistance } = calculateMaxValues(params);
    set({ topDistance: Math.min(Math.max(0, v), maxTopDistance) });
    setTimeout(() => get().refreshBoxPositions(), 0);
  },

  setLeftDistance: (v) => {
    const state = get();
    const layout = computeLayout(state);
    const params = buildBoxLayoutParams({ ...state, leftDistance: v }, layout.boundary, layout.scaleFactor);
    const { maxLeftDistance } = calculateMaxValues(params);
    set({ leftDistance: Math.min(Math.max(0, v), maxLeftDistance) });
    setTimeout(() => get().refreshBoxPositions(), 0);
  },

  setBoxGap: (v) => {
    const state = get();
    const layout = computeLayout(state);
    const params = buildBoxLayoutParams({ ...state, boxGap: v }, layout.boundary, layout.scaleFactor);
    const { maxBoxGap } = calculateMaxValues(params);
    set({ boxGap: Math.min(Math.max(0, v), maxBoxGap) });
    setTimeout(() => get().refreshBoxPositions(), 0);
  },

  setBoxCount: (v) => {
    const state = get();
    const layout = computeLayout(state);
    const params = buildBoxLayoutParams({ ...state, boxCount: v }, layout.boundary, layout.scaleFactor);
    const { positions } = calculateBoxPositions(params);
    const maxBoxes = positions.length;
    const count = Math.min(Math.max(1, Math.floor(v)), maxBoxes);
    const boxes = positions.slice(0, count).map((pos, i) => ({
      id: state.receptacleBoxes[i]?.id ?? Date.now() + i,
      ...pos,
    }));
    set({ boxCount: count, receptacleBoxes: boxes });
  },

  incrementBoxCount: () => {
    const state = get();
    const layout = computeLayout(state);
    const params = buildBoxLayoutParams(state, layout.boundary, layout.scaleFactor);
    const { positions, maxBoxes } = calculateBoxPositions(params);
    if (state.boxCount >= maxBoxes) return;
    const newPos = positions[state.boxCount];
    if (!newPos) return;
    set({
      boxCount: state.boxCount + 1,
      receptacleBoxes: [
        ...state.receptacleBoxes,
        { id: Date.now(), ...newPos },
      ],
    });
  },

  decrementBoxCount: () => {
    const state = get();
    if (state.boxCount <= 1) return;
    set({
      boxCount: state.boxCount - 1,
      receptacleBoxes: state.receptacleBoxes.slice(0, state.boxCount - 1),
    });
  },

  toggleColumnLayout: () => {
    set((s) => ({ isColumnLayout: !s.isColumnLayout }));
    setTimeout(() => get().refreshBoxPositions(), 0);
  },

  // ── Visibility ──────────────────────────────────────────────────────

  setShowFloorLine: (v) => set({ showFloorLine: v }),
  setShowCenterLines: (v) => set({ showCenterLines: v }),
  setShowWoodBacking: (v) => set({ showWoodBacking: v }),
  setShowReceptacleBoxes: (v) => set({ showReceptacleBoxes: v }),
  setShowIntendedPosition: (v) => set({ showIntendedPosition: v }),
  setShowSideView: (v) => set({ showSideView: v }),

  // ── Zoom ────────────────────────────────────────────────────────────

  setZoom: (v) => set({ zoom: v }),
  zoomIn: () => set((s) => ({ zoom: Math.min(s.zoom + 0.1, 2) })),
  zoomOut: () => set((s) => ({ zoom: Math.max(s.zoom - 0.1, 0.5) })),
  resetZoom: () => set({ zoom: 1 }),

  // ── Notes & metadata ───────────────────────────────────────────────

  setNotes: (v) => set({ notes: v }),
  setDrawingTitle: (v) => set({ drawingTitle: v }),

  // ── Refresh box positions ──────────────────────────────────────────

  refreshBoxPositions: () => {
    const state = get();
    const boxes = recomputeBoxes(state);
    set({ receptacleBoxes: boxes, boxCount: boxes.length || state.boxCount });
  },

  // ── Derived getters ────────────────────────────────────────────────

  getLayout: () => computeLayout(get()),

  getMaxValues: () => {
    const state = get();
    const layout = computeLayout(state);
    return calculateMaxValues(buildBoxLayoutParams(state, layout.boundary, layout.scaleFactor));
  },

  canRender: () => {
    const { selectedScreen, selectedMount } = get();
    return !!(selectedScreen && selectedMount);
  },

  // ── Serialization ──────────────────────────────────────────────────

  serialize: () => {
    const s = get();
    return {
      selectedScreenId: s.selectedScreen?.id ?? null,
      selectedMountId: s.selectedMount?.id ?? null,
      selectedMediaPlayerId: s.selectedMediaPlayer?.id ?? null,
      selectedReceptacleBoxId: s.selectedReceptacleBox?.id ?? null,
      isHorizontal: s.isHorizontal,
      isNiche: s.isNiche,
      isEdgeToEdge: s.isEdgeToEdge,
      variantDepth: s.variantDepth,
      floorDistance: s.floorDistance,
      bottomDistance: s.bottomDistance,
      topDistance: s.topDistance,
      leftDistance: s.leftDistance,
      boxGap: s.boxGap,
      boxCount: s.boxCount,
      isColumnLayout: s.isColumnLayout,
      showFloorLine: s.showFloorLine,
      showCenterLines: s.showCenterLines,
      showWoodBacking: s.showWoodBacking,
      showReceptacleBoxes: s.showReceptacleBoxes,
      showIntendedPosition: s.showIntendedPosition,
      showSideView: s.showSideView,
      notes: s.notes,
      drawingTitle: s.drawingTitle,
    };
  },

  restore: (snap) => {
    set({
      isHorizontal: snap.isHorizontal,
      isNiche: snap.isNiche,
      isEdgeToEdge: snap.isEdgeToEdge,
      variantDepth: snap.variantDepth,
      floorDistance: snap.floorDistance,
      bottomDistance: snap.bottomDistance,
      topDistance: snap.topDistance,
      leftDistance: snap.leftDistance,
      boxGap: snap.boxGap,
      boxCount: snap.boxCount,
      isColumnLayout: snap.isColumnLayout,
      showFloorLine: snap.showFloorLine,
      showCenterLines: snap.showCenterLines,
      showWoodBacking: snap.showWoodBacking,
      showReceptacleBoxes: snap.showReceptacleBoxes,
      showIntendedPosition: snap.showIntendedPosition,
      showSideView: snap.showSideView,
      notes: snap.notes,
      drawingTitle: snap.drawingTitle,
    });
    // Inventory items are restored separately by DrawingStudio
    setTimeout(() => get().refreshBoxPositions(), 0);
  },

  reset: () => {
    set({
      selectedScreen: null,
      selectedMount: null,
      selectedMediaPlayer: null,
      selectedReceptacleBox: null,
      isHorizontal: true,
      isNiche: true,
      isEdgeToEdge: true,
      variantDepth: 0.5,
      floorDistance: 20,
      bottomDistance: 0,
      topDistance: 0,
      leftDistance: 0,
      boxGap: 0,
      boxCount: 1,
      isColumnLayout: false,
      receptacleBoxes: [],
      showFloorLine: true,
      showCenterLines: true,
      showWoodBacking: true,
      showReceptacleBoxes: true,
      showIntendedPosition: true,
      showSideView: true,
      zoom: 1,
      notes: '',
      drawingTitle: '',
    });
  },
}));
