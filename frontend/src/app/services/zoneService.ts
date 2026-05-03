/**
 * zoneService.ts
 * All API calls for Zone management — uses the central api client.
 */

import { api } from './api';
import type { Zone, ApiListResponse } from '../types/user.types';

export const getZones = (): Promise<Zone[]> =>
  api.get<ApiListResponse<Zone>>('/admin/zones').then((r) => r.data);
