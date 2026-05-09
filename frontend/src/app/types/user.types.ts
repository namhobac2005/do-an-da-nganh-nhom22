/**
 * user.types.ts
 * Shared TypeScript interfaces for the User Management module (frontend).
 */

// ===== CORE MODELS =====

export type UserRole   = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive';
export type ZoneStatus = 'active' | 'inactive' | 'maintenance';

export interface Zone {
  id:           string;
  name:         string;
  location:     string | null;
  farming_type: string | null;
  status:       ZoneStatus;
  created_at:   string;
}

export interface CreateZoneDto {
  name:          string;
  location?:     string;
  farming_type?: string;
  status?:       ZoneStatus;
}

export interface UpdateZoneDto {
  name?:         string;
  location?:     string;
  farming_type?: string;
  status?:       ZoneStatus;
}

export interface UserProfile {
  id:         string;
  email:      string;
  full_name:  string | null;
  phone:      string | null;
  role:       UserRole;
  status:     UserStatus;
  created_at: string;
  updated_at: string;
  ponds:      { id: string; name: string }[];
}

export interface ActivityLog {
  id:          string;
  actor_id:    string | null;
  actor_email: string | null;
  action:      string;
  target_type: string | null;
  target_id:   string | null;
  details:     Record<string, unknown>;
  created_at:  string;
}

// ===== DTOs =====

export interface CreateUserDto {
  email:     string;
  password:  string;
  fullName?: string;
  phone?:    string;
  role?:     UserRole;
  pondIds?:  string[];
}

export interface UpdateUserDto {
  fullName?: string;
  phone?:    string;
  role?:     UserRole;
  status?:   UserStatus;
  pondIds?:  string[];
}

// ===== API RESPONSE WRAPPERS =====

export interface ApiListResponse<T> {
  success: boolean;
  data:    T[];
}

export interface ApiItemResponse<T> {
  success: boolean;
  data:    T;
}

export interface ApiLogsResponse {
  success: boolean;
  data:    ActivityLog[];
  total:   number;
  page:    number;
  limit:   number;
}

export interface AuthResponse {
  success:  boolean;
  token:    string;
  user: {
    id:       string;
    email:    string;
    role:     UserRole;
    fullName: string | null;
    phone:    string | null;
    status:   string;
  };
}
