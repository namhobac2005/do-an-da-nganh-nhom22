// frontend/src/app/services/sensorService.ts

import { API_BASE_URL } from "../../config";
import { authFetch } from "../../utils/auth"; // Assuming authFetch exists for authenticated requests

// --- Interfaces ---
export interface Zone {
  id: string;
  name: string;
}

export interface Pond {
  id: string;
  name: string;
  zone_id?: string; // Optional, useful for forms
}

export type SensorStatus = "normal" | "warning" | "critical";

export interface SensorData {
  id: string;
  name: string;
  type: string;
  unit: string;
  status: SensorStatus;
  value?: number; // Value might not be present for metadata-only fetches
  updated_at?: string; // ISO date string, might not be present for metadata-only fetches
  pond_id: string; // Required for a sensor to belong to a pond
  feed_key?: string | null; // Optional, can be null
}

export interface SensorCreateDto {
  pond_id: string;
  name: string;
  type: string;
  unit: string;
  status: SensorStatus;
  feed_key?: string | null;
}

export interface SensorUpdateDto {
  pond_id?: string; // Can update pond_id
  name?: string;
  type?: string;
  unit?: string;
  status?: SensorStatus;
  feed_key?: string | null; // Can update feed_key
}

// --- Service Functions ---

// Get all zones accessible by the user
export const getZones = async (): Promise<Zone[]> => {
  const response = await authFetch(`${API_BASE_URL}/sensors/zones`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch zones");
  }
  return response.json();
};

// Get ponds by zone accessible by the user
export const getPondsByZone = async (zoneId: string): Promise<Pond[]> => {
  const response = await authFetch(`${API_BASE_URL}/sensors/ponds/${zoneId}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to fetch ponds for zone ${zoneId}`,
    );
  }
  return response.json();
};

// Get latest sensor data for a specific pond
export const getLatestSensors = async (
  pondId: string,
): Promise<SensorData[]> => {
  const response = await authFetch(
    `${API_BASE_URL}/sensors/latest?pondId=${pondId}`,
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to fetch latest sensors for pond ${pondId}`,
    );
  }
  return response.json();
};

// Get latest sensor data for all ponds accessible by the user (for admin/overview pages)
export const getLatestSensorsByZoneAll = async (): Promise<SensorData[]> => {
  const response = await authFetch(`${API_BASE_URL}/sensors/latest/all`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch all latest sensors");
  }
  return response.json();
};

// Get sensor history for a specific pond
export const getSensorHistory = async (
  pondId: string,
  limit: number = 30,
): Promise<any[]> => {
  const response = await authFetch(
    `${API_BASE_URL}/sensors/history?pondId=${pondId}&limit=${limit}`,
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || `Failed to fetch sensor history for pond ${pondId}`,
    );
  }
  return response.json();
};

// CRUD Operations for Sensor Metadata
export const createSensor = async (
  sensor: SensorCreateDto,
): Promise<{ success: boolean; data?: SensorData; error?: string }> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/sensors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sensor),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || "Failed to create sensor",
      };
    }
    return { success: true, data: data.data };
  } catch (e: any) {
    return { success: false, error: e.message || "Network error" };
  }
};

export const updateSensor = async (
  id: string,
  sensor: SensorUpdateDto,
): Promise<{ success: boolean; data?: SensorData; error?: string }> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/sensors/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sensor),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || "Failed to update sensor",
      };
    }
    return { success: true, data: data.data };
  } catch (e: any) {
    return { success: false, error: e.message || "Network error" };
  }
};

export const deleteSensor = async (
  id: string,
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const response = await authFetch(`${API_BASE_URL}/sensors/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || "Failed to delete sensor",
      };
    }
    return { success: true, message: data.message };
  } catch (e: any) {
    return { success: false, error: e.message || "Network error" };
  }
};
