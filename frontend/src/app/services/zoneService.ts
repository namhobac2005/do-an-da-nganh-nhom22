/**
 * zoneService.ts
 * All API calls for Zone management (UC01) — uses the central api client.
 */

import { api } from './api';
import type {
  Zone,
  CreateZoneDto,
  UpdateZoneDto,
  ApiListResponse,
  ApiItemResponse,
} from '../types/user.types';

export const getZones = (): Promise<Zone[]> =>
  api.get<ApiListResponse<Zone>>('/admin/zones').then((r) => r.data);

export const getZoneById = (id: string): Promise<Zone> =>
  api.get<ApiItemResponse<Zone>>(`/admin/zones/${id}`).then((r) => r.data);

export const createZone = (dto: CreateZoneDto): Promise<Zone> =>
  api.post<ApiItemResponse<Zone>>('/admin/zones', dto).then((r) => r.data);

export const updateZone = (id: string, dto: UpdateZoneDto): Promise<Zone> =>
  api.put<ApiItemResponse<Zone>>(`/admin/zones/${id}`, dto).then((r) => r.data);

export const deleteZone = (id: string): Promise<void> =>
  api.delete<{ success: boolean }>(`/admin/zones/${id}`).then(() => undefined);

/** Fetches distinct farming types already stored — feeds the creatable combobox */
export const getFarmingTypes = (): Promise<string[]> =>
  api.get<ApiListResponse<string>>('/admin/zones/farming-types').then((r) => r.data);
