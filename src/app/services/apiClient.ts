/**
 * Lightweight HTTP client for the newFeatures backend API.
 *
 * - Automatically attaches the JWT Bearer token from localStorage.
 * - Returns parsed JSON with a consistent { success, data?, error? } shape.
 * - Handles 401 (expired/invalid token) by clearing session and redirecting to login.
 */

const API_BASE = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:5001/api';
const AUTH_TOKEN_KEY = 'auth_token';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Skip the Authorization header (e.g. for login/signup). */
  noAuth?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, noAuth = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!noAuth) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle expired/invalid token — redirect to login
  if (res.status === 401 && !noAuth) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    // Avoid redirect loops if already on login/reset pages
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/reset-password')) {
      window.location.href = '/login?expired=1';
    }
    return { success: false, error: 'Session expired. Please sign in again.' } as T;
  }

  const json = await res.json();
  return json as T;
}
