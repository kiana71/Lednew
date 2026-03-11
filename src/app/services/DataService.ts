/**
 * Abstract Data Service Layer
 *
 * This service provides a clean abstraction over the data source,
 * allowing seamless transition from Google Sheets to a proper database.
 *
 * Design Pattern: Repository Pattern
 * Purpose: Decouple data access logic from business logic
 */

import {
  Drawing,
  User,
  SearchFilters,
  SearchResult,
  PaginationParams,
  ApiResponse,
} from '../types';

/**
 * Abstract interface for data operations
 * Implement this interface for different data sources
 */
export interface IDataService {
  // Drawing operations
  getDrawings(params: PaginationParams, userContext?: { role: string; companyName?: string; userId?: string }): Promise<ApiResponse<SearchResult<Drawing>>>;
  getDrawingById(id: string): Promise<ApiResponse<Drawing>>;
  createDrawing(drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt' | 'drawingNumber'>): Promise<ApiResponse<Drawing>>;
  updateDrawing(id: string, updates: Partial<Drawing>): Promise<ApiResponse<Drawing>>;
  deleteDrawing(id: string): Promise<ApiResponse<void>>;
  searchDrawings(filters: SearchFilters, params: PaginationParams): Promise<ApiResponse<SearchResult<Drawing>>>;
  shareDrawing(drawingId: string, userIds: string[]): Promise<ApiResponse<Drawing>>;
  unshareDrawing(drawingId: string, userId: string): Promise<ApiResponse<Drawing>>;

  // User operations
  getUserById(id: string): Promise<ApiResponse<User>>;
  getUserByEmail(email: string): Promise<ApiResponse<User>>;
  getAllUsers(): Promise<ApiResponse<User[]>>;
  getCompanyNames(): Promise<ApiResponse<string[]>>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'lastLogin'> & { password?: string }): Promise<ApiResponse<User>>;
  updateUser(id: string, updates: Partial<User>): Promise<ApiResponse<User>>;
  updateUserPassword(id: string, currentPassword: string, newPassword: string): Promise<ApiResponse<void>>;
  deleteUser(id: string): Promise<ApiResponse<void>>;

  // Authentication
  authenticate(email: string, password: string): Promise<ApiResponse<User>>;
  validateToken(token: string): Promise<ApiResponse<User>>;
}

/**
 * Mock Data Service Implementation
 * Used for development and testing
 */
export class MockDataService implements IDataService {
  private users: User[] = this.generateMockUsers();
  private drawings: Drawing[] = this.generateMockDrawings();
  private drawingCounter: number = 9006; // Start after the 6 mock drawings

  private generateMockUsers(): User[] {
    return [
      {
        id: 'user-0',
        email: 'admin@signcast.com',
        username: 'superadmin',
        name: 'Super Administrator',
        role: 'superadmin',
        createdAt: new Date('2024-01-01'),
        lastLogin: new Date('2026-02-17'),
      },
      {
        id: 'user-1',
        email: 'john.doe@example.com',
        username: 'johndoe',
        name: 'John Doe',
        role: 'technician',
        companyName: 'DimCast Media',
        createdAt: new Date('2024-01-15'),
        lastLogin: new Date('2026-02-13'),
      },
      {
        id: 'user-2',
        email: 'jane.smith@example.com',
        username: 'janesmith',
        name: 'Jane Smith',
        role: 'technician',
        companyName: 'Acme Corporation',
        createdAt: new Date('2024-02-20'),
        lastLogin: new Date('2026-02-12'),
      },
      {
        id: 'user-3',
        email: 'demo@example.com',
        username: 'demo',
        name: 'Demo User',
        role: 'technician',
        companyName: 'Acme Corporation',
        createdAt: new Date('2024-03-10'),
        lastLogin: new Date('2026-02-13'),
      },
      {
        id: 'user-4',
        email: 'sarah.jones@example.com',
        username: 'sarahjones',
        name: 'Sarah Jones',
        role: 'viewer',
        companyName: 'Metro Shopping Mall',
        createdAt: new Date('2024-04-05'),
        lastLogin: new Date('2026-02-10'),
      },
      {
        id: 'user-5',
        email: 'mike.chen@example.com',
        username: 'mikechen',
        name: 'Mike Chen',
        role: 'technician',
        companyName: 'DimCast Media',
        createdAt: new Date('2024-05-15'),
        lastLogin: new Date('2026-02-14'),
      },
    ];
  }

  private generateMockDrawings(): Drawing[] {
    const baseDrawings = [
      {
        title: 'Conference Room A - LED Display Layout',
        description: 'Main conference room display configuration',
        drawingNumber: 'SC-9000',
        status: 'draft' as const,
        projectName: 'Corporate HQ Renovation',
        clientName: 'Acme Corporation',
        companyName: 'Acme Corporation',
        createdByIdx: 2,
      },
      {
        title: 'Lobby Digital Signage Network',
        description: 'Lobby area digital signage deployment plan',
        drawingNumber: 'SC-9001',
        status: 'draft' as const,
        projectName: 'Retail Center Upgrade',
        clientName: 'Metro Shopping Mall',
        companyName: 'Metro Shopping Mall',
        createdByIdx: 4,
      },
      {
        title: 'Training Room Multi-Display Setup',
        description: 'Training facility AV system layout',
        drawingNumber: 'SC-9002',
        status: 'draft' as const,
        projectName: 'Education Center Build',
        clientName: 'DimCast Media',
        companyName: 'DimCast Media',
        createdByIdx: 1,
      },
      {
        title: 'Executive Board Room Video Wall',
        description: '3x3 video wall configuration with control system',
        drawingNumber: 'SC-9003',
        status: 'draft' as const,
        projectName: 'Executive Suite Remodel',
        clientName: 'Acme Corporation',
        companyName: 'Acme Corporation',
        createdByIdx: 3,
      },
      {
        title: 'Retail Store Window Displays',
        description: 'Storefront digital display installation',
        drawingNumber: 'SC-9004',
        status: 'draft' as const,
        projectName: 'Flagship Store Launch',
        clientName: 'DimCast Media',
        companyName: 'DimCast Media',
        createdByIdx: 5,
      },
      {
        title: 'Stadium Concourse Signage',
        description: 'Wayfinding and advertising display network',
        drawingNumber: 'SC-9005',
        status: 'draft' as const,
        projectName: 'Arena Modernization',
        clientName: 'Metro Shopping Mall',
        companyName: 'Metro Shopping Mall',
        createdByIdx: 4,
      },
    ];

    return baseDrawings.map((drawing, index) => ({
      id: `drawing-${index + 1}`,
      drawingNumber: drawing.drawingNumber,
      title: drawing.title,
      description: drawing.description,
      createdBy: this.users[drawing.createdByIdx].id,
      createdByName: this.users[drawing.createdByIdx].name,
      createdAt: new Date(2024, index, 15 + index),
      updatedAt: new Date(2026, 1, 10 - index),
      status: drawing.status,
      companyName: drawing.companyName,
      tags: ['led-display', 'technical-drawing', index % 2 === 0 ? 'high-priority' : 'standard'],
      metadata: {
        version: '1.0',
        projectName: drawing.projectName,
        clientName: drawing.clientName,
        dimensions: {
          width: 1920,
          height: 1080,
          unit: 'in' as const,
        },
      },
      canvasData: {
        elements: [],
        settings: {
          backgroundColor: '#ffffff',
          gridEnabled: true,
          gridSize: 10,
          snapToGrid: true,
          zoom: 1,
        },
      },
    }));
  }

  /** Apply company-based visibility filtering */
  private filterByVisibility(
    drawings: Drawing[],
    userContext?: { role: string; companyName?: string; userId?: string },
  ): Drawing[] {
    if (!userContext) return drawings;
    // Technicians and superadmin see everything
    if (userContext.role === 'technician' || userContext.role === 'superadmin') return drawings;
    // Viewers see only their company's drawings + drawings shared with them
    return drawings.filter(
      (d) =>
        d.companyName === userContext.companyName ||
        d.sharedWith?.includes(userContext.userId || ''),
    );
  }

  async getDrawings(
    params: PaginationParams,
    userContext?: { role: string; companyName?: string; userId?: string },
  ): Promise<ApiResponse<SearchResult<Drawing>>> {
    await this.simulateNetworkDelay();

    const { page, pageSize, sortBy = 'updatedAt', sortOrder = 'desc' } = params;

    let visible = this.filterByVisibility(this.drawings, userContext);

    // Sort
    const sorted = [...visible].sort((a, b) => {
      const aVal = a[sortBy as keyof Drawing];
      const bVal = b[sortBy as keyof Drawing];
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortOrder === 'asc' ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
      }
      return 0;
    });

    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);

    return {
      success: true,
      data: { items, total: sorted.length, page, pageSize },
    };
  }

  async getDrawingById(id: string): Promise<ApiResponse<Drawing>> {
    await this.simulateNetworkDelay();
    const drawing = this.drawings.find((d) => d.id === id);
    if (!drawing) return { success: false, error: 'Drawing not found' };
    return { success: true, data: drawing };
  }

  async createDrawing(
    drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt' | 'drawingNumber'>,
  ): Promise<ApiResponse<Drawing>> {
    await this.simulateNetworkDelay();
    const newDrawing: Drawing = {
      ...drawing,
      id: `drawing-${Date.now()}`,
      drawingNumber: `SC-${this.drawingCounter++}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.drawings.unshift(newDrawing);
    return { success: true, data: newDrawing, message: 'Drawing created successfully' };
  }

  async updateDrawing(id: string, updates: Partial<Drawing>): Promise<ApiResponse<Drawing>> {
    await this.simulateNetworkDelay();
    const index = this.drawings.findIndex((d) => d.id === id);
    if (index === -1) return { success: false, error: 'Drawing not found' };
    this.drawings[index] = { ...this.drawings[index], ...updates, updatedAt: new Date() };
    return { success: true, data: this.drawings[index], message: 'Drawing updated successfully' };
  }

  async deleteDrawing(id: string): Promise<ApiResponse<void>> {
    await this.simulateNetworkDelay();
    const index = this.drawings.findIndex((d) => d.id === id);
    if (index === -1) return { success: false, error: 'Drawing not found' };
    this.drawings.splice(index, 1);
    return { success: true, message: 'Drawing deleted successfully' };
  }

  async searchDrawings(
    filters: SearchFilters,
    params: PaginationParams,
  ): Promise<ApiResponse<SearchResult<Drawing>>> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    let filtered = [...this.drawings];

    // Company-based visibility
    if (filters.companyName) {
      filtered = filtered.filter(
        (d) =>
          d.companyName === filters.companyName ||
          d.sharedWith?.includes(filters.userId || ''),
      );
    }

    // Request status filter
    if (filters.requestStatus && filters.requestStatus !== 'all') {
      if (filters.requestStatus === 'pending') {
        filtered = filtered.filter((d) => d.requestStatus === 'pending');
      } else if (filters.requestStatus === 'done') {
        filtered = filtered.filter((d) => !d.requestStatus);
      }
    }

    // Search query
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.drawingNumber.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query) ||
          d.metadata.projectName?.toLowerCase().includes(query) ||
          d.metadata.clientName?.toLowerCase().includes(query) ||
          d.companyName?.toLowerCase().includes(query) ||
          d.createdByName?.toLowerCase().includes(query) ||
          d.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Date range
    if (filters.dateRange) {
      filtered = filtered.filter(
        (d) => d.createdAt >= filters.dateRange!.start && d.createdAt <= filters.dateRange!.end,
      );
    }

    if (filters.createdBy && filters.createdBy.length > 0) {
      filtered = filtered.filter((d) => filters.createdBy!.includes(d.createdBy));
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((d) => filters.status!.includes(d.status));
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((d) => d.tags?.some((tag) => filters.tags!.includes(tag)));
    }

    return {
      success: true,
      data: { items: filtered, total: filtered.length, page: 1, pageSize: filtered.length },
    };
  }

  async shareDrawing(drawingId: string, userIds: string[]): Promise<ApiResponse<Drawing>> {
    await this.simulateNetworkDelay();
    const index = this.drawings.findIndex((d) => d.id === drawingId);
    if (index === -1) return { success: false, error: 'Drawing not found' };

    // Replace the entire sharedWith list (not merge)
    this.drawings[index] = { ...this.drawings[index], sharedWith: [...userIds], updatedAt: new Date() };

    return { success: true, data: this.drawings[index], message: 'Drawing shared successfully' };
  }

  async unshareDrawing(drawingId: string, userId: string): Promise<ApiResponse<Drawing>> {
    await this.simulateNetworkDelay();
    const index = this.drawings.findIndex((d) => d.id === drawingId);
    if (index === -1) return { success: false, error: 'Drawing not found' };
    this.drawings[index].sharedWith = (this.drawings[index].sharedWith || []).filter((id) => id !== userId);
    return { success: true, data: this.drawings[index] };
  }

  // ── User operations ─────────────────────────────────────────────────

  async getUserById(id: string): Promise<ApiResponse<User>> {
    await this.simulateNetworkDelay();
    const user = this.users.find((u) => u.id === id);
    if (!user) return { success: false, error: 'User not found' };
    return { success: true, data: user };
  }

  async getUserByEmail(email: string): Promise<ApiResponse<User>> {
    await this.simulateNetworkDelay();
    const user = this.users.find((u) => u.email === email);
    if (!user) return { success: false, error: 'User not found' };
    return { success: true, data: user };
  }

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    await this.simulateNetworkDelay();
    return { success: true, data: this.users };
  }

  async getCompanyNames(): Promise<ApiResponse<string[]>> {
    await this.simulateNetworkDelay();
    const names = Array.from(
      new Set(this.users.map((u) => u.companyName).filter(Boolean) as string[]),
    ).sort();
    return { success: true, data: names };
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'lastLogin'> & { password?: string }): Promise<ApiResponse<User>> {
    await this.simulateNetworkDelay();
    const newUser: User = { ...user, id: `user-${Date.now()}`, createdAt: new Date(), lastLogin: new Date() };
    this.users.unshift(newUser);
    return { success: true, data: newUser, message: 'User created successfully' };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    await this.simulateNetworkDelay();
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return { success: false, error: 'User not found' };
    this.users[index] = { ...this.users[index], ...updates, lastLogin: new Date() };
    return { success: true, data: this.users[index], message: 'User updated successfully' };
  }

  async updateUserPassword(id: string, _currentPassword: string, _newPassword: string): Promise<ApiResponse<void>> {
    await this.simulateNetworkDelay();
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return { success: false, error: 'User not found' };
    this.users[index].lastLogin = new Date();
    return { success: true, message: 'Password updated successfully' };
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    await this.simulateNetworkDelay();
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return { success: false, error: 'User not found' };
    this.users.splice(index, 1);
    return { success: true, message: 'User deleted successfully' };
  }

  // ── Authentication ──────────────────────────────────────────────────

  async authenticate(email: string, _password: string): Promise<ApiResponse<User>> {
    await this.simulateNetworkDelay();
    const user = this.users.find((u) => u.email === email);
    if (!user) return { success: false, error: 'Invalid email or password' };
    user.lastLogin = new Date();
    return { success: true, data: user, message: 'Authentication successful' };
  }

  async validateToken(token: string): Promise<ApiResponse<User>> {
    await this.simulateNetworkDelay();
    try {
      const userId = atob(token);
      return this.getUserById(userId);
    } catch {
      return { success: false, error: 'Invalid token' };
    }
  }

  private simulateNetworkDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));
  }
}

/**
 * Data Service Factory
 */
import { ApiDataService } from './ApiDataService';
import { config } from '../config';

export function createDataService(source: 'mock' | 'googleSheets' | 'database' = 'mock'): IDataService {
  switch (source) {
    case 'mock':
      return new MockDataService();
    case 'googleSheets':
      throw new Error('Google Sheets service not yet implemented');
    case 'database':
      return new ApiDataService();
    default:
      return new MockDataService();
  }
}

// Singleton instance for the application — reads from config
export const dataService = createDataService(config.dataSource);