import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase client (Ép kiểu string để TS không báo lỗi thiếu biến môi trường)
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cấu hình Adafruit IO
const AIO_USERNAME = process.env.AIO_USERNAME;
const AIO_KEY = process.env.AIO_KEY;
const AIO_BASE_URL = `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds`;

export const getSensorHistory = async (limit: number) => {
  const { data, error } = await supabase
    .from('sensor_data')
    .select(
      `
      value,
      timestamp,
      sensors ( type )
    `,
    )
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

/**
 * Logic: Lấy tất cả sensor, mỗi sensor lấy kèm 1 bản ghi mới nhất từ sensor_data
 */
export const getAllSensorsWithLastValue = async () => {
  const { data, error } = await supabase
    .from('sensors')
    .select(
      `
      id,
      name,
      type,
      unit,
      status,
      sensor_data (
        value,
        timestamp
      )
    `,
    )
    // Sắp xếp sensor_data bên trong theo thời gian giảm dần
    .order('timestamp', { foreignTable: 'sensor_data', ascending: false })
    // Chỉ lấy 1 dòng sensor_data cho mỗi sensor
    .limit(1, { foreignTable: 'sensor_data' });

  if (error) throw error;

  // Format lại dữ liệu cho Frontend dễ đọc: đưa 'value' ra ngoài cùng cấp
  return data.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    unit: s.unit,
    status: s.status,
    value:
      s.sensor_data && s.sensor_data.length > 0 ? s.sensor_data[0].value : 0,
    updated_at:
      s.sensor_data && s.sensor_data.length > 0
        ? s.sensor_data[0].timestamp
        : null,
  }));
};
