/**
 * api.ts
 * Central HTTP client for all backend API calls.
 *
 * Automatically attaches the Authorization: Bearer <token> header
 * from localStorage (stored by authService.login during authentication).
 *
 * Usage:
 *   import { api } from './api';
 *   const data = await api.get('/admin/users');
 *   const user = await api.post('/admin/users', { email, password, ... });
 */

const API_BASE = "http://localhost:5000";

/** Reads the JWT from localStorage (stored by authService.login) */
const getToken = (): string | null => {
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
};

const buildHeaders = (extra?: Record<string, string>): HeadersInit => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

/** Parses response and throws a descriptive error on non-2xx */
const parseResponse = async <T>(res: Response): Promise<T> => {
  let body: any;
  try {
    body = await res.json();
  } catch {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  if (!res.ok) {
    throw new Error(body?.message ?? `HTTP ${res.status}: ${res.statusText}`);
  }

  return body as T;
};

export const api = {
  get: <T>(path: string): Promise<T> =>
    fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers: buildHeaders(),
    }).then((r) => parseResponse<T>(r)),

  post: <T>(path: string, body: unknown): Promise<T> =>
    fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then((r) => parseResponse<T>(r)),

  put: <T>(path: string, body: unknown): Promise<T> =>
    fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers: buildHeaders(),
      body: JSON.stringify(body),
    }).then((r) => parseResponse<T>(r)),

  delete: <T>(path: string): Promise<T> =>
    fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers: buildHeaders(),
    }).then((r) => parseResponse<T>(r)),

  patch: <T>(path: string, body?: unknown): Promise<T> =>
    fetch(`${API_BASE}${path}`, {
      method: "PATCH",
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((r) => parseResponse<T>(r)),
};
