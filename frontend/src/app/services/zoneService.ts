/**
 * zoneService.ts
 * All API calls for Zone (Pond) management.
 * Uses the central api client which automatically attaches Bearer token.
 */

import { api } from './api';
import type { Zone, CreateZoneDto, UpdateZoneDto, ApiListResponse, ApiItemResponse } from '../types/user.types';

export const getZones = (): Promise<Zone[]> =>
  api.get<ApiListResponse<Zone>>('/zones').then((r) => r.data);

export const getZoneById = (id: string): Promise<Zone> =>
  api.get<ApiItemResponse<Zone>>(`/zones/${id}`).then((r) => r.data);

export const createZone = (dto: CreateZoneDto): Promise<Zone> =>
  api.post<ApiItemResponse<Zone>>('/zones', dto).then((r) => r.data);

export const updateZone = (id: string, dto: UpdateZoneDto): Promise<Zone> =>
  api.put<ApiItemResponse<Zone>>(`/zones/${id}`, dto).then((r) => r.data);

export const deleteZone = (id: string): Promise<void> =>
  api.delete<{ success: boolean }>(`/zones/${id}`).then(() => undefined);

/**
 * Fetches distinct farming_type values from the ponds table.
 * Used to populate the Creatable Combobox for "Loại nuôi".
 */
export const getFarmingTypes = (): Promise<string[]> =>
  api.get<{ success: boolean; data: string[] }>('/zones/farming-types').then((r) => r.data);
