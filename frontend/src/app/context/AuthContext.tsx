/**
 * AuthContext.tsx
 * Context quản lý trạng thái xác thực (đăng nhập/đăng xuất) toàn ứng dụng
 * Sử dụng Context API + useReducer theo pattern chuẩn
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { UserRole } from '../data/mockData';

// ===== TYPES =====

const API_URL = 'http://localhost:5000';

/** Minimal user shape stored in context. */
interface AuthUser {
  id:       string;
  name:     string;
  email:    string;
  phone:    string | null;
  role:     UserRole;
  status:   string;
  zoneId?:  string;
}

interface AuthState {
  user:            AuthUser | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  error:           string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: AuthUser }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

interface AuthContextValue extends AuthState {
  login:         (email: string, password: string) => Promise<boolean>;
  logout:        () => void;
  clearError:    () => void;
  hasRole:       (role: UserRole) => boolean;
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
        isLoading:       false,
        isAuthenticated: true,
        user:            action.payload,
        error:           null,
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading:       false,
        isAuthenticated: false,
        user:            null,
        error:           action.payload,
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
  user:            null,
  isAuthenticated: false,
  isLoading:       false,
  error:           null,
};

// ===== CONTEXT =====

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ===== PROVIDER =====

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session from storage on initial mount
  useEffect(() => {
    const raw = sessionStorage.getItem('aquasmart_session');
    if (raw) {
      try {
        const session = JSON.parse(raw) as { token: string; user: AuthUser };
        if (session.token && session.user) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: session.user });
        }
      } catch {
        sessionStorage.removeItem('aquasmart_session');
      }
    }
  }, []);

  /**
   * Hàm đăng nhập — gọi backend POST /auth/login để lấy JWT.
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        dispatch({ type: 'LOGIN_FAILURE', payload: data.message ?? 'Đăng nhập thất bại.' });
        return false;
      }

      const authUser: AuthUser = {
        id:    data.user.id,
        name:  data.user.fullName ?? data.user.email,
        email: data.user.email,
        phone: data.user.phone ?? null,
        role:  data.user.role,
        status: data.user.status,
      };

      dispatch({ type: 'LOGIN_SUCCESS', payload: authUser });
      // Persist token + user so session survives page refresh
      sessionStorage.setItem('aquasmart_session', JSON.stringify({ token: data.token, user: authUser }));
      return true;
    } catch {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.' });
      return false;
    }
  }, []);

  /**
   * Hàm đăng xuất — xóa session
   */
  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
    sessionStorage.removeItem('aquasmart_session');
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  /** Kiểm tra user có role nhất định không */
  const hasRole = useCallback(
    (role: UserRole): boolean => state.user?.role === role,
    [state.user]
  );

  /** Kiểm tra user có quyền truy cập vào zone không */
  const hasZoneAccess = useCallback(
    (zoneId: string): boolean => {
      if (!state.user) return false;
      if (state.user.role === 'admin') return true;
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
