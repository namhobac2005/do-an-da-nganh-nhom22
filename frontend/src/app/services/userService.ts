/**
 * userService.ts
 * All API calls for User management — uses the central api client
 * which automatically attaches the Authorization: Bearer token.
 */

import { api } from './api';
import type {
  UserProfile,
  CreateUserDto,
  UpdateUserDto,
  ApiListResponse,
  ApiItemResponse,
} from '../types/user.types';

export const getUsers = (): Promise<UserProfile[]> =>
  api.get<ApiListResponse<UserProfile>>('/admin/users').then((r) => r.data);

export const getUserById = (id: string): Promise<UserProfile> =>
  api.get<ApiItemResponse<UserProfile>>(`/admin/users/${id}`).then((r) => r.data);

export const createUser = (dto: CreateUserDto): Promise<UserProfile> =>
  api.post<ApiItemResponse<UserProfile>>('/admin/users', dto).then((r) => r.data);

export const updateUser = (id: string, dto: UpdateUserDto): Promise<UserProfile> =>
  api.put<ApiItemResponse<UserProfile>>(`/admin/users/${id}`, dto).then((r) => r.data);

export const deleteUser = (id: string): Promise<void> =>
  api.delete<{ success: boolean }>(`/admin/users/${id}`).then(() => undefined);

export const updateUserZones = (id: string, zoneIds: string[]): Promise<UserProfile> =>
  api.put<ApiItemResponse<UserProfile>>(`/admin/users/${id}/zones`, { zoneIds }).then((r) => r.data);
