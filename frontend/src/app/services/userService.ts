// /**
//  * userService.ts
//  * All API calls for User management — uses the central api client
//  * which automatically attaches the Authorization: Bearer token.
//  */

// import { api } from './api';
// import type {
//   UserProfile,
//   CreateUserDto,
//   UpdateUserDto,
//   ApiListResponse,
//   ApiItemResponse,
// } from '../types/user.types';

// export const getUsers = (): Promise<UserProfile[]> =>
//   api.get<ApiListResponse<UserProfile>>('/admin/users').then((r) => r.data);

// export const getUserById = (id: string): Promise<UserProfile> =>
//   api.get<ApiItemResponse<UserProfile>>(`/admin/users/${id}`).then((r) => r.data);

// export const createUser = (dto: CreateUserDto): Promise<UserProfile> =>
//   api.post<ApiItemResponse<UserProfile>>('/admin/users', dto).then((r) => r.data);

// export const updateUser = (id: string, dto: UpdateUserDto): Promise<UserProfile> =>
//   api.put<ApiItemResponse<UserProfile>>(`/admin/users/${id}`, dto).then((r) => r.data);

// export const deleteUser = (id: string): Promise<void> =>
//   api.delete<{ success: boolean }>(`/admin/users/${id}`).then(() => undefined);

// export const updateUserZones = (id: string, zoneIds: string[]): Promise<UserProfile> =>
//   api.put<ApiItemResponse<UserProfile>>(`/admin/users/${id}/zones`, { zoneIds }).then((r) => r.data);

import axios from 'axios';

// Thay đổi URL này thành URL backend của bạn
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

      // Bạn có thể lưu token ở đây hoặc để AuthContext lo việc đó
      if (response.data.data.token) {
        localStorage.setItem('accessToken', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error: any) {
      // Xử lý lỗi từ backend trả về
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
  },

  /**
   * Lấy token hiện tại
   */
  getToken: () => {
    return localStorage.getItem('accessToken');
  },
};
