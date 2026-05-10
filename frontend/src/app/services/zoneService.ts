import { api } from "./api";
import type { Zone } from "../types/user.types";

export const getZones = async () => {
  const response = await api.get<{ success: boolean; data: Zone[] }>("/zones");
  return response.data;
};

export const createZone = async (data: any) => {
  const response = await api.post<{ success: boolean; data: Zone }>(
    "/zones",
    data,
  );
  return response.data;
};

export const updateZone = async (id: string, data: any) => {
  const response = await api.put<{ success: boolean; data: Zone }>(
    `/zones/${id}`,
    data,
  );
  return response.data;
};

export const deleteZone = async (id: string) => {
  await api.delete(`/zones/${id}`);
};

export const getZoneById = async (id: string): Promise<Zone> => {
  try {
    const response = await api.get<{ success: boolean; data: Zone }>(
      `/zones/${id}`,
    );
    return response.data;
  } catch (error: any) {
    console.error(`Lỗi khi lấy Zone ID ${id}:`, error);
    throw error;
  }
};
