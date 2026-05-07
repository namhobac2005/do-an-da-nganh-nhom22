import axios from 'axios';

const API_URL = 'http://localhost:5000/zones';

export const getZones = async () => {
  const response = await axios.get(API_URL);
  // Backend trả về { success: true, data: [...] }
  return response.data.data;
};

export const createZone = async (data: any) => {
  const response = await axios.post(API_URL, data);
  return response.data.data;
};

export const updateZone = async (id: string, data: any) => {
  const response = await axios.put(`${API_URL}/${id}`, data);
  return response.data.data;
};

export const deleteZone = async (id: string) => {
  await axios.delete(`${API_URL}/${id}`);
};

export const getZoneById = async (id: string): Promise<Zone> => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);

    // Backend trả về format: { success: true, data: { ...zone } }
    if (response.data && response.data.success) {
      return response.data.data;
    }

    throw new Error('Không thể lấy dữ liệu vùng ao');
  } catch (error: any) {
    console.error(`Lỗi khi lấy Zone ID ${id}:`, error);
    throw error;
  }
};
