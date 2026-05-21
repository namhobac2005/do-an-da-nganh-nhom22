/**
 * zoneService.ts
 * Frontend API client for Zone > Pond hierarchy.
 * All methods include JWT Authorization header.
 */

import type {
  CreateZoneDto, UpdateZoneDto,
  CreatePondDto, UpdatePondDto,
} from '../types/user.types';

const API_URL = 'http://localhost:5000/zones';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
  'Content-Type': 'application/json',
});

/** Xử lý response — throw nếu lỗi */
const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Lỗi ${res.status}`);
  }
  return res.json();
};

// ===== ZONE ENDPOINTS =====

export const getZones = () =>
  fetch(API_URL, { headers: getHeaders() }).then(handleResponse);

export const getZoneById = (id: string) =>
  fetch(`${API_URL}/${id}`, { headers: getHeaders() }).then(handleResponse);

export const createZone = (dto: CreateZoneDto) =>
  fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(dto),
  }).then(handleResponse);

export const updateZone = (id: string, dto: UpdateZoneDto) =>
  fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(dto),
  }).then(handleResponse);

export const deleteZone = (id: string) =>
  fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(handleResponse);

// ===== POND ENDPOINTS (nested under zone) =====

export const getPondsByZone = (zoneId: string) =>
  fetch(`${API_URL}/${zoneId}/ponds`, { headers: getHeaders() }).then(handleResponse);

export const getPondDetail = (zoneId: string, pondId: string) =>
  fetch(`${API_URL}/${zoneId}/ponds/${pondId}`, { headers: getHeaders() }).then(handleResponse);

export const createPond = (zoneId: string, dto: CreatePondDto) =>
  fetch(`${API_URL}/${zoneId}/ponds`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(dto),
  }).then(handleResponse);

export const updatePond = (zoneId: string, pondId: string, dto: UpdatePondDto) =>
  fetch(`${API_URL}/${zoneId}/ponds/${pondId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(dto),
  }).then(handleResponse);

export const deletePond = (zoneId: string, pondId: string) =>
  fetch(`${API_URL}/${zoneId}/ponds/${pondId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  }).then(handleResponse);
