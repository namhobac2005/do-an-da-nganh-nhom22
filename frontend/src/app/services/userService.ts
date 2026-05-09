/**
 * userService.ts
 * All API calls for User management — uses the central api client
 * which automatically attaches the Authorization: Bearer token.
 *
 * Also exports authService for backward compatibility with AuthContext.
 */

import { api } from './api';
import type {
  UserProfile,
  CreateUserDto,
  UpdateUserDto,
  ApiListResponse,
  ApiItemResponse,
} from '../types/user.types';
import axios from 'axios';

// ===== USER CRUD (Admin) =====

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

export const updateUserPonds = (id: string, pondIds: string[]): Promise<UserProfile> =>
  api.put<ApiItemResponse<UserProfile>>(`/admin/users/${id}/ponds`, { pondIds }).then((r) => r.data);

// ===== AUTH SERVICE (used by AuthContext) =====

const API_URL = 'http://localhost:5000';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const authService = {
  /**
   * Gọi API đăng nhập
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_URL}/auth/login`,
        {
          email,
          password,
        },
      );

      // Lưu token và user info
      if (response.data.data.token) {
        localStorage.setItem('accessToken', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        // Also save to sessionStorage for the api client
        sessionStorage.setItem('aquasmart_session', JSON.stringify({
          token: response.data.data.token,
        }));
      }

      return response.data;
    } catch (error: any) {
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Lỗi kết nối máy chủ');
    }
  },

  /**
   * Hàm đăng xuất
   */
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('aquasmart_session');
  },

  /**
   * Lấy token hiện tại
   */
  getToken: () => {
    return localStorage.getItem('accessToken');
  },
};
