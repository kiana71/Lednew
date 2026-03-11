/**
 * API Inventory Service — talks to the newFeatures-backend /api/inventory endpoints.
 *
 * Drop-in replacement for the mock InventoryService.
 * Inventory GET endpoints are public (no auth needed for the drawing builder).
 */

import type {
  Screen,
  Mount,
  MediaPlayer,
  ReceptacleBox,
  ApiResponse,
  PaginationParams,
  SearchResult,
} from '../types';
import { apiFetch } from './apiClient';

class ApiInventoryServiceClass {
  // ── Screens ──────────────────────────────────────────────────────────────

  async getScreens(params?: PaginationParams): Promise<ApiResponse<SearchResult<Screen>>> {
    const qs = params ? `?page=${params.page}&pageSize=${params.pageSize}` : '';
    return apiFetch(`/inventory/screens${qs}`);
  }

  async createScreen(screen: Omit<Screen, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Screen>> {
    return apiFetch('/inventory/screens', { method: 'POST', body: screen });
  }

  async updateScreen(id: string, updates: Partial<Screen>): Promise<ApiResponse<Screen>> {
    return apiFetch(`/inventory/screens/${id}`, { method: 'PUT', body: updates });
  }

  async deleteScreen(id: string): Promise<ApiResponse<void>> {
    return apiFetch(`/inventory/screens/${id}`, { method: 'DELETE' });
  }

  // ── Mounts ───────────────────────────────────────────────────────────────

  async getMounts(params?: PaginationParams): Promise<ApiResponse<SearchResult<Mount>>> {
    const qs = params ? `?page=${params.page}&pageSize=${params.pageSize}` : '';
    return apiFetch(`/inventory/mounts${qs}`);
  }

  async createMount(mount: Omit<Mount, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Mount>> {
    return apiFetch('/inventory/mounts', { method: 'POST', body: mount });
  }

  async updateMount(id: string, updates: Partial<Mount>): Promise<ApiResponse<Mount>> {
    return apiFetch(`/inventory/mounts/${id}`, { method: 'PUT', body: updates });
  }

  async deleteMount(id: string): Promise<ApiResponse<void>> {
    return apiFetch(`/inventory/mounts/${id}`, { method: 'DELETE' });
  }

  // ── Media Players ────────────────────────────────────────────────────────

  async getMediaPlayers(params?: PaginationParams): Promise<ApiResponse<SearchResult<MediaPlayer>>> {
    const qs = params ? `?page=${params.page}&pageSize=${params.pageSize}` : '';
    return apiFetch(`/inventory/media-players${qs}`);
  }

  async createMediaPlayer(player: Omit<MediaPlayer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<MediaPlayer>> {
    return apiFetch('/inventory/media-players', { method: 'POST', body: player });
  }

  async updateMediaPlayer(id: string, updates: Partial<MediaPlayer>): Promise<ApiResponse<MediaPlayer>> {
    return apiFetch(`/inventory/media-players/${id}`, { method: 'PUT', body: updates });
  }

  async deleteMediaPlayer(id: string): Promise<ApiResponse<void>> {
    return apiFetch(`/inventory/media-players/${id}`, { method: 'DELETE' });
  }

  // ── Receptacle Boxes ─────────────────────────────────────────────────────

  async getReceptacleBoxes(params?: PaginationParams): Promise<ApiResponse<SearchResult<ReceptacleBox>>> {
    const qs = params ? `?page=${params.page}&pageSize=${params.pageSize}` : '';
    return apiFetch(`/inventory/receptacle-boxes${qs}`);
  }

  async createReceptacleBox(box: Omit<ReceptacleBox, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ReceptacleBox>> {
    return apiFetch('/inventory/receptacle-boxes', { method: 'POST', body: box });
  }

  async updateReceptacleBox(id: string, updates: Partial<ReceptacleBox>): Promise<ApiResponse<ReceptacleBox>> {
    return apiFetch(`/inventory/receptacle-boxes/${id}`, { method: 'PUT', body: updates });
  }

  async deleteReceptacleBox(id: string): Promise<ApiResponse<void>> {
    return apiFetch(`/inventory/receptacle-boxes/${id}`, { method: 'DELETE' });
  }
}

export const apiInventoryService = new ApiInventoryServiceClass();
