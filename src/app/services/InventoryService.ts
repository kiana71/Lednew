/**
 * Inventory Service
 * 
 * Manages CRUD operations for inventory items (screens, mounts, media players, receptacle boxes)
 * Uses mock data initially, designed to be easily migrated to a real database
 */

import { 
  InventoryItem, 
  Screen, 
  Mount, 
  MediaPlayer, 
  ReceptacleBox,
  ApiResponse,
  PaginationParams,
  SearchResult 
} from '../types';

// Mock data storage
let mockScreens: Screen[] = [
  {
    id: '1',
    type: 'screen',
    alias: 'Samsung 55" Display',
    model: 'QM55R',
    manufacturer: 'Samsung',
    dimensions: { height: 27.6, width: 48.5, depth: 2.3, unit: 'in' },
    sizeInInch: 55,
    resolution: '3840x2160',
    refreshRate: 60,
    panelType: 'QLED',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    type: 'screen',
    alias: 'LG 65" Commercial',
    model: '65UM5KE',
    manufacturer: 'LG',
    dimensions: { height: 32.9, width: 57.3, depth: 2.4, unit: 'in' },
    sizeInInch: 65,
    resolution: '3840x2160',
    refreshRate: 60,
    panelType: 'IPS',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

let mockMounts: Mount[] = [
  {
    id: '1',
    type: 'mount',
    alias: 'Peerless Flat Wall Mount',
    model: 'SF650',
    manufacturer: 'Peerless-AV',
    dimensions: { height: 15.75, width: 23.62, depth: 1.03, unit: 'in' },
    maxLoadLbs: 150,
    clearance: '2" top, 2" sides',
    clearanceInches: 4,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    type: 'mount',
    alias: 'Chief Tilt Mount',
    model: 'RLT2',
    manufacturer: 'Chief',
    dimensions: { height: 17.5, width: 36.31, depth: 2.69, unit: 'in' },
    maxLoadLbs: 200,
    clearance: '3" top, 1.5" sides, 2" bottom',
    clearanceInches: 6,
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '3',
    type: 'mount',
    alias: 'Crimson AV Pop-Out',
    model: 'A63',
    manufacturer: 'Crimson AV',
    dimensions: { height: 14.5, width: 26.0, depth: 1.63, unit: 'in' },
    maxLoadLbs: 130,
    clearance: '1.5" all sides',
    clearanceInches: 3,
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-12'),
  },
];

let mockMediaPlayers: MediaPlayer[] = [
  {
    id: '1',
    type: 'mediaPlayer',
    alias: 'BrightSign 4K Player',
    model: 'XT1144',
    manufacturer: 'BrightSign',
    dimensions: { height: 1.0, width: 4.5, depth: 4.5, unit: 'in' },
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '2',
    type: 'mediaPlayer',
    alias: 'Samsung SoC Built-In',
    model: 'SBB-SSN',
    manufacturer: 'Samsung',
    dimensions: { height: 1.5, width: 5.0, depth: 5.0, unit: 'in' },
    createdAt: new Date('2024-02-18'),
    updatedAt: new Date('2024-02-18'),
  },
  {
    id: '3',
    type: 'mediaPlayer',
    alias: 'LG webOS Box',
    model: 'WP402',
    manufacturer: 'LG',
    dimensions: { height: 0.87, width: 5.31, depth: 5.31, unit: 'in' },
    createdAt: new Date('2024-03-25'),
    updatedAt: new Date('2024-03-25'),
  },
];

let mockReceptacleBoxes: ReceptacleBox[] = [
  {
    id: '1',
    type: 'receptacleBox',
    alias: 'Recessed Power Box',
    model: 'WB-100',
    manufacturer: 'Datacomm',
    dimensions: { height: 4.5, width: 6, depth: 3.5, unit: 'in' },
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: '2',
    type: 'receptacleBox',
    alias: 'In-Wall Media Panel',
    model: '45-0001-WH',
    manufacturer: 'Datacomm',
    dimensions: { height: 7.75, width: 5.5, depth: 3.75, unit: 'in' },
    createdAt: new Date('2024-02-14'),
    updatedAt: new Date('2024-02-14'),
  },
  {
    id: '3',
    type: 'receptacleBox',
    alias: 'Power Bridge Kit',
    model: 'TWP-IKP2',
    manufacturer: 'Arlington',
    dimensions: { height: 5.0, width: 3.5, depth: 2.75, unit: 'in' },
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
  },
];

class InventoryService {
  // Generic CRUD operations
  private async delay(ms: number = 300): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Screens
  async getScreens(params?: PaginationParams): Promise<ApiResponse<SearchResult<Screen>>> {
    await this.delay();
    
    const sortedScreens = [...mockScreens].sort((a, b) => {
      if (params?.sortOrder === 'asc') {
        return a.updatedAt.getTime() - b.updatedAt.getTime();
      }
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    return {
      success: true,
      data: {
        items: sortedScreens,
        total: sortedScreens.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 50,
      },
    };
  }

  async createScreen(screen: Omit<Screen, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Screen>> {
    await this.delay();
    
    const newScreen: Screen = {
      ...screen,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockScreens.push(newScreen);

    return {
      success: true,
      data: newScreen,
      message: 'Screen added successfully',
    };
  }

  async updateScreen(id: string, updates: Partial<Screen>): Promise<ApiResponse<Screen>> {
    await this.delay();
    
    const index = mockScreens.findIndex(s => s.id === id);
    if (index === -1) {
      return { success: false, error: 'Screen not found' };
    }

    mockScreens[index] = {
      ...mockScreens[index],
      ...updates,
      updatedAt: new Date(),
    };

    return {
      success: true,
      data: mockScreens[index],
      message: 'Screen updated successfully',
    };
  }

  async deleteScreen(id: string): Promise<ApiResponse<void>> {
    await this.delay();
    
    const index = mockScreens.findIndex(s => s.id === id);
    if (index === -1) {
      return { success: false, error: 'Screen not found' };
    }

    mockScreens.splice(index, 1);

    return {
      success: true,
      message: 'Screen deleted successfully',
    };
  }

  // Mounts
  async getMounts(params?: PaginationParams): Promise<ApiResponse<SearchResult<Mount>>> {
    await this.delay();
    
    return {
      success: true,
      data: {
        items: mockMounts,
        total: mockMounts.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 50,
      },
    };
  }

  async createMount(mount: Omit<Mount, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Mount>> {
    await this.delay();
    
    const newMount: Mount = {
      ...mount,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockMounts.push(newMount);

    return {
      success: true,
      data: newMount,
      message: 'Mount added successfully',
    };
  }

  async updateMount(id: string, updates: Partial<Mount>): Promise<ApiResponse<Mount>> {
    await this.delay();
    
    const index = mockMounts.findIndex(m => m.id === id);
    if (index === -1) {
      return { success: false, error: 'Mount not found' };
    }

    mockMounts[index] = {
      ...mockMounts[index],
      ...updates,
      updatedAt: new Date(),
    };

    return {
      success: true,
      data: mockMounts[index],
      message: 'Mount updated successfully',
    };
  }

  async deleteMount(id: string): Promise<ApiResponse<void>> {
    await this.delay();
    
    const index = mockMounts.findIndex(m => m.id === id);
    if (index === -1) {
      return { success: false, error: 'Mount not found' };
    }

    mockMounts.splice(index, 1);

    return {
      success: true,
      message: 'Mount deleted successfully',
    };
  }

  // Media Players
  async getMediaPlayers(params?: PaginationParams): Promise<ApiResponse<SearchResult<MediaPlayer>>> {
    await this.delay();
    
    return {
      success: true,
      data: {
        items: mockMediaPlayers,
        total: mockMediaPlayers.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 50,
      },
    };
  }

  async createMediaPlayer(player: Omit<MediaPlayer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<MediaPlayer>> {
    await this.delay();
    
    const newPlayer: MediaPlayer = {
      ...player,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockMediaPlayers.push(newPlayer);

    return {
      success: true,
      data: newPlayer,
      message: 'Media player added successfully',
    };
  }

  async updateMediaPlayer(id: string, updates: Partial<MediaPlayer>): Promise<ApiResponse<MediaPlayer>> {
    await this.delay();
    
    const index = mockMediaPlayers.findIndex(p => p.id === id);
    if (index === -1) {
      return { success: false, error: 'Media player not found' };
    }

    mockMediaPlayers[index] = {
      ...mockMediaPlayers[index],
      ...updates,
      updatedAt: new Date(),
    };

    return {
      success: true,
      data: mockMediaPlayers[index],
      message: 'Media player updated successfully',
    };
  }

  async deleteMediaPlayer(id: string): Promise<ApiResponse<void>> {
    await this.delay();
    
    const index = mockMediaPlayers.findIndex(p => p.id === id);
    if (index === -1) {
      return { success: false, error: 'Media player not found' };
    }

    mockMediaPlayers.splice(index, 1);

    return {
      success: true,
      message: 'Media player deleted successfully',
    };
  }

  // Receptacle Boxes
  async getReceptacleBoxes(params?: PaginationParams): Promise<ApiResponse<SearchResult<ReceptacleBox>>> {
    await this.delay();
    
    return {
      success: true,
      data: {
        items: mockReceptacleBoxes,
        total: mockReceptacleBoxes.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 50,
      },
    };
  }

  async createReceptacleBox(box: Omit<ReceptacleBox, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ReceptacleBox>> {
    await this.delay();
    
    const newBox: ReceptacleBox = {
      ...box,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReceptacleBoxes.push(newBox);

    return {
      success: true,
      data: newBox,
      message: 'Receptacle box added successfully',
    };
  }

  async updateReceptacleBox(id: string, updates: Partial<ReceptacleBox>): Promise<ApiResponse<ReceptacleBox>> {
    await this.delay();
    
    const index = mockReceptacleBoxes.findIndex(b => b.id === id);
    if (index === -1) {
      return { success: false, error: 'Receptacle box not found' };
    }

    mockReceptacleBoxes[index] = {
      ...mockReceptacleBoxes[index],
      ...updates,
      updatedAt: new Date(),
    };

    return {
      success: true,
      data: mockReceptacleBoxes[index],
      message: 'Receptacle box updated successfully',
    };
  }

  async deleteReceptacleBox(id: string): Promise<ApiResponse<void>> {
    await this.delay();
    
    const index = mockReceptacleBoxes.findIndex(b => b.id === id);
    if (index === -1) {
      return { success: false, error: 'Receptacle box not found' };
    }

    mockReceptacleBoxes.splice(index, 1);

    return {
      success: true,
      message: 'Receptacle box deleted successfully',
    };
  }
}

// Export the right implementation based on config
import { config } from '../config';
import { apiInventoryService } from './ApiInventoryService';

export const inventoryService: InventoryService =
  config.dataSource === 'database'
    ? (apiInventoryService as unknown as InventoryService)
    : new InventoryService();