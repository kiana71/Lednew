/**
 * Core Type Definitions for Technical Drawing Dashboard
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the application. Designed to be extensible for future database migration.
 */

// ==================== User Types ====================

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'superadmin' | 'technician' | 'viewer';
  companyName?: string;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ==================== Drawing Types ====================

export interface Drawing {
  id: string;
  drawingNumber: string;
  title: string;
  description?: string;
  createdBy: string; // User ID
  createdByName: string; // Denormalized for display
  createdAt: Date;
  updatedAt: Date;
  thumbnailUrl?: string;
  metadata: DrawingMetadata;
  canvasData: CanvasData;
  tags?: string[];
  status: 'draft' | 'archived';
  companyName?: string;
  installedLocation?: string;
  installedDate?: string;
  locationCoordinates?: {
    lat: number;
    lng: number;
  };
  /** Set when drawing was created via a request order */
  requestStatus?: 'pending';
  /** User IDs this drawing has been shared with */
  sharedWith?: string[];
  /** Request metadata (only present for requested drawings) */
  requestData?: DrawingRequestData;
}

export interface DrawingRequestData {
  orderNumber: string;
  screenId?: string;
  mountId?: string;
  mediaPlayerId?: string;
  receptacleBoxId?: string;
  nicheHeight?: number;
  nicheWidth?: number;
  nicheDepth?: number;
  orientation?: 'vertical' | 'horizontal';
  mountingOn?: 'wall' | 'niche' | 'table';
  requestedById: string;
  requestedByName: string;
}

export interface DrawingMetadata {
  version: string;
  projectName?: string;
  clientName?: string;
  companyName?: string;
  installedLocation?: string;
  installedDate?: Date;
  dimensions?: {
    width: number;
    height: number;
    unit: 'in' | 'cm' | 'mm';
  };
  customFields?: Record<string, any>;
}

export interface CanvasData {
  elements: CanvasElement[];
  settings: CanvasSettings;
}

export interface CanvasElement {
  id: string;
  type: 'screen' | 'mount' | 'mediaPlayer' | 'receptacleBox' | 'text' | 'shape';
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: Record<string, any>;
}

export interface CanvasSettings {
  backgroundColor: string;
  gridEnabled: boolean;
  gridSize: number;
  snapToGrid: boolean;
  zoom: number;
}

// ==================== Inventory Types (Future Implementation) ====================

export interface InventoryItem {
  id: string;
  type: 'screen' | 'mount' | 'mediaPlayer' | 'receptacleBox';
  alias: string;
  model: string;
  manufacturer?: string;
  dimensions: {
    height: number;
    width: number;
    depth: number;
    unit: 'in' | 'cm' | 'mm';
  };
  sizeInInch?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Screen extends InventoryItem {
  type: 'screen';
  resolution?: string;
  refreshRate?: number;
  panelType?: string;
}

export interface Mount extends InventoryItem {
  type: 'mount';
  maxLoadLbs?: number;
  clearance?: string;
  /** Numeric total clearance in inches needed around the screen (used for niche calculations) */
  clearanceInches?: number;
  compatibleScreenSizes?: string[];
  weightCapacity?: number;
}

export interface MediaPlayer extends InventoryItem {
  type: 'mediaPlayer';
  supportedFormats?: string[];
  connectivity?: string[];
}

export interface ReceptacleBox extends InventoryItem {
  type: 'receptacleBox';
  outletCount?: number;
  voltage?: string;
}

// ==================== Search & Filter Types ====================

export interface SearchFilters {
  query?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  createdBy?: string[];
  status?: Drawing['status'][];
  tags?: string[];
  /** Filter by request status: 'pending' = requested but not claimed, 'done' = normal drawings */
  requestStatus?: 'pending' | 'done' | 'all';
  /** Filter drawings visible to this company (non-admin users) */
  companyName?: string;
  /** Include shared drawings for this user */
  userId?: string;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ==================== Configuration Types ====================

export interface FeatureFlags {
  inventoryManagement: boolean;
  advancedSearch: boolean;
  collaboration: boolean;
  versionControl: boolean;
  exportToPDF: boolean;
}

export interface AppConfig {
  features: FeatureFlags;
  dataSource: 'mock' | 'googleSheets' | 'database';
  apiEndpoint?: string;
}

// ==================== Migration Types ====================

export interface MigrationLog {
  id: string;
  sourceName: string;
  targetName: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  errors?: string[];
}