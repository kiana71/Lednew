/**
 * API Data Service — talks to the newFeatures-backend over HTTP.
 *
 * Implements the same IDataService interface used by the MockDataService
 * so the rest of the app is unaffected by the switch.
 */

import type {
  Drawing,
  User,
  SearchFilters,
  SearchResult,
  PaginationParams,
  ApiResponse,
} from '../types';
import type { IDataService } from './DataService';
import { apiFetch } from './apiClient';

export class ApiDataService implements IDataService {
  // ── Drawings ─────────────────────────────────────────────────────────────

  async getDrawings(
    params: PaginationParams,
    userContext?: { role: string; companyName?: string; userId?: string },
  ): Promise<ApiResponse<SearchResult<Drawing>>> {
    const qs = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
    });
    return apiFetch(`/drawings?${qs}`);
  }

  async getDrawingById(id: string): Promise<ApiResponse<Drawing>> {
    return apiFetch(`/drawings/${id}`);
  }

  async createDrawing(
    drawing: Omit<Drawing, 'id' | 'createdAt' | 'updatedAt' | 'drawingNumber'>,
  ): Promise<ApiResponse<Drawing>> {
    return apiFetch('/drawings', { method: 'POST', body: drawing });
  }

  async updateDrawing(id: string, updates: Partial<Drawing>): Promise<ApiResponse<Drawing>> {
    return apiFetch(`/drawings/${id}`, { method: 'PUT', body: updates });
  }

  async deleteDrawing(id: string): Promise<ApiResponse<void>> {
    return apiFetch(`/drawings/${id}`, { method: 'DELETE' });
  }

  async searchDrawings(
    filters: SearchFilters,
    params: PaginationParams,
  ): Promise<ApiResponse<SearchResult<Drawing>>> {
    const qs = new URLSearchParams({
      page: String(params.page),
      pageSize: String(params.pageSize),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
      ...(filters.query && { search: filters.query }),
      ...(filters.status?.length && { status: filters.status[0] }),
      ...(filters.requestStatus && { requestStatus: filters.requestStatus }),
      ...(filters.dateRange?.start && { dateFrom: filters.dateRange.start.toISOString() }),
      ...(filters.dateRange?.end && { dateTo: filters.dateRange.end.toISOString() }),
    });
    return apiFetch(`/drawings?${qs}`);
  }

  async shareDrawing(drawingId: string, userIds: string[]): Promise<ApiResponse<Drawing>> {
    return apiFetch(`/drawings/${drawingId}/share`, {
      method: 'PUT',
      body: { userIds },
    });
  }

  async unshareDrawing(drawingId: string, userId: string): Promise<ApiResponse<Drawing>> {
    return apiFetch(`/drawings/${drawingId}/share/${userId}`, { method: 'DELETE' });
  }

  // ── Users ────────────────────────────────────────────────────────────────

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return apiFetch(`/users/${id}`);
  }

  async getUserByEmail(email: string): Promise<ApiResponse<User>> {
    // The backend doesn't expose a by-email endpoint; fall back to get-all and filter
    const all = await this.getAllUsers();
    if (!all.success || !all.data) return { success: false, error: 'User not found' };
    const user = all.data.find((u) => u.email === email);
    return user ? { success: true, data: user } : { success: false, error: 'User not found' };
  }

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return apiFetch('/users');
  }

  async getCompanyNames(): Promise<ApiResponse<string[]>> {
    return apiFetch('/users/companies');
  }

  async createUser(
    user: Omit<User, 'id' | 'createdAt' | 'lastLogin'> & { password?: string },
  ): Promise<ApiResponse<User>> {
    return apiFetch('/users', { method: 'POST', body: user });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    return apiFetch(`/users/${id}`, { method: 'PUT', body: updates });
  }

  async updateUserPassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<ApiResponse<void>> {
    // Self-service password change from Settings uses current password.
    // Admin reset dialog sends an empty current password and uses /users/:id/password.
    if (currentPassword.trim().length > 0) {
      return apiFetch('/auth/password', {
        method: 'PUT',
        body: { currentPassword, newPassword },
      });
    }

    return apiFetch(`/users/${id}/password`, {
      method: 'PUT',
      body: { newPassword },
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return apiFetch(`/users/${id}`, { method: 'DELETE' });
  }
  
// ── Authentication ───────────────────────────────────────────────────────

  async authenticate(email: string, password: string): Promise<ApiResponse<User>> {
    const res = await apiFetch<{
      success: boolean;
      data?: { user: User; token: string };
      error?: string;
    }>('/auth/login', { method: 'POST', body: { email, password }, noAuth: true });

    if (res.success && res.data) {
      // Store the real JWT token
      localStorage.setItem('auth_token', res.data.token);
      return { success: true, data: res.data.user };
    }
    return { success: false, error: res.error || 'Authentication failed' };
  }

  async validateToken(_token: string): Promise<ApiResponse<User>> {
    // The token is already in localStorage, apiFetch will attach it automatically
    return apiFetch('/auth/validate', { method: 'POST' });
  }
}
