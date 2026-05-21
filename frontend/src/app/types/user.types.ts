/**
 * user.types.ts
 * Shared TypeScript interfaces for Zone > Pond hierarchy + User management.
 */

// ===== CORE ENUMS =====

export type UserRole   = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive';
export type ZoneStatus = 'active' | 'inactive' | 'maintenance';
export type PondStatus = 'active' | 'inactive' | 'maintenance';

// ===== ZONE (Vùng nuôi) =====

export interface Zone {
  id:         string;
  name:       string;
  location:   string | null;
  status:     ZoneStatus;
  created_at: string;
  pond_count?: number;      // populated by backend
}

export interface CreateZoneDto {
  name:      string;
  location?: string;
  status?:   ZoneStatus;
}

export interface UpdateZoneDto {
  name?:     string;
  location?: string;
  status?:   ZoneStatus;
}

// ===== POND (Ao nuôi) =====

export interface Pond {
  id:           string;
  zone_id:      string;
  name:         string;
  location:     string | null;
  farming_type: string | null;
  status:       PondStatus;
  created_at:   string;
  sensor_count?:   number;    // populated by backend
  actuator_count?: number;    // populated by backend
}

export interface PondDetail extends Pond {
  zone_name: string | null;
  sensors?:    { id: string; name: string; type: string; status: string }[];
  actuators?:  { id: string; name: string; type: string; status: string }[];
  stats: {
    totalSensors:   number;
    totalActuators: number;
    managers:       string[];
  };
}

export interface CreatePondDto {
  name:          string;
  location?:     string;
  farming_type?: string;
  status?:       PondStatus;
}

export interface UpdatePondDto {
  name?:         string;
  location?:     string;
  farming_type?: string;
  status?:       PondStatus;
}

// ===== USER =====

export interface UserProfile {
  id:         string;
  email:      string;
  username:   string | null;
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
  username?: string;
  phone?:    string;
  role?:     UserRole;
  pondIds?:  string[];
}

export interface UpdateUserDto {
  username?: string;
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
    username: string | null;
    phone:    string | null;
    status:   string;
  };
}
