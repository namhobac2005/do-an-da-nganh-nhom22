/**
 * AuthContext.tsx
 * Context quản lý trạng thái xác thực (đăng nhập/đăng xuất) toàn ứng dụng
 * Đã được tích hợp với authService.ts
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from 'react';
import { authService } from '../services/userService'; // Đảm bảo đường dẫn import chính xác

// ===== TYPES =====

// Định nghĩa AuthUser khớp với bảng public.users trong database
export interface AuthUser {
  id: string;
  username: string; // Trong DB của bạn là username
  email: string;
  role: string; // 'admin' | 'user'
  zoneId?: string; // Tùy chọn (nếu có logic join với bảng user_zones sau này)
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthUser }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  hasRole: (role: string) => boolean;
  hasZoneAccess: (zoneId: string) => boolean;
}

// ===== REDUCER =====

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null, error: null };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// ===== INITIAL STATE =====

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// ===== CONTEXT =====

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ===== PROVIDER =====

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Khôi phục session từ localStorage (do authService lưu bằng localStorage)
  useEffect(() => {
    const token = authService.getToken();
    const rawUser = localStorage.getItem('user');

    if (token && rawUser) {
      try {
        const user = JSON.parse(rawUser) as AuthUser;
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } catch {
        authService.logout(); // Xóa nếu dữ liệu bị lỗi
      }
    }
  }, []);

  /**
   * Hàm đăng nhập — gọi authService
   */
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      dispatch({ type: 'LOGIN_START' });
      try {
        // Gọi service đã cấu hình
        const response = await authService.login(email, password);

        // backend trả về: data.data.user
        const userData = response.data.user;

        const authUser: AuthUser = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          role: userData.role,
        };

        dispatch({ type: 'LOGIN_SUCCESS', payload: authUser });
        return true;
      } catch (error: any) {
        // Bắt lỗi từ authService ném ra
        dispatch({
          type: 'LOGIN_FAILURE',
          payload:
            error.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
        });
        return false;
      }
    },
    [],
  );

  /**
   * Hàm đăng xuất
   */
  const logout = useCallback(() => {
    authService.logout(); // 1. Xóa Token & User trong localStorage
    dispatch({ type: 'LOGOUT' }); // 2. Reset state trong React (isAuthenticated -> false)

    window.location.href = '/login';
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  /** Kiểm tra user có role nhất định không */
  const hasRole = useCallback(
    (role: string): boolean => state.user?.role === role,
    [state.user],
  );

  /** Kiểm tra user có quyền truy cập vào zone không */
  const hasZoneAccess = useCallback(
    (zoneId: string): boolean => {
      if (!state.user) return false;
      if (state.user.role === 'admin') return true;
      return state.user.zoneId === zoneId;
    },
    [state.user],
  );

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    clearError,
    hasRole,
    hasZoneAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ===== HOOK =====

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider');
  }
  return context;
};
