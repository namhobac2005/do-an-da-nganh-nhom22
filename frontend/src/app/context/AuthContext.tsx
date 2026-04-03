/**
 * AuthContext.tsx
 * Context quản lý trạng thái xác thực (đăng nhập/đăng xuất) toàn ứng dụng
 * Sử dụng Context API + useReducer theo pattern chuẩn
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { User, UserRole } from '../data/mockData';

// ===== TYPES =====

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  hasRole: (role: UserRole) => boolean;
  hasZoneAccess: (zoneId: string) => boolean;
}

// ===== MOCK CREDENTIALS =====
// Trong production, đây sẽ là API call đến backend

const MOCK_CREDENTIALS: Record<string, { password: string; user: User }> = {
  'admin@aquasmart.vn': {
    password: 'Admin@123',
    user: {
      id: 'user-1',
      name: 'Nguyễn Văn Admin',
      email: 'admin@aquasmart.vn',
      phone: '0901234567',
      role: 'admin',
      status: 'active',
      createdAt: '2023-01-01',
      lastLogin: new Date().toISOString(),
    },
  },
  'mai.tran@aquasmart.vn': {
    password: 'User@123',
    user: {
      id: 'user-2',
      name: 'Trần Thị Mai',
      email: 'mai.tran@aquasmart.vn',
      phone: '0912345678',
      role: 'user',
      zoneId: 'zone-1',
      status: 'active',
      createdAt: '2023-01-15',
      lastLogin: new Date().toISOString(),
    },
  },
};

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
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        error: null,
      };

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Hàm đăng nhập - giả lập API call
   * Trong production: gọi axios.post('/api/auth/login', { email, password })
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    // Giả lập network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const credentials = MOCK_CREDENTIALS[email.toLowerCase()];

    if (credentials && credentials.password === password) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: credentials.user });
      // Lưu vào sessionStorage để persist qua refresh (optional)
      sessionStorage.setItem('aquasmart_user', JSON.stringify(credentials.user));
      return true;
    } else {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.' });
      return false;
    }
  }, []);

  /**
   * Hàm đăng xuất - xóa session
   */
  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
    sessionStorage.removeItem('aquasmart_user');
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  /** Kiểm tra user có role nhất định không */
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return state.user?.role === role;
    },
    [state.user]
  );

  /** Kiểm tra user có quyền truy cập vào zone không */
  const hasZoneAccess = useCallback(
    (zoneId: string): boolean => {
      if (!state.user) return false;
      // Admin có quyền truy cập tất cả zone
      if (state.user.role === 'admin') return true;
      // User chỉ có quyền trên zone được phân công
      return state.user.zoneId === zoneId;
    },
    [state.user]
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
