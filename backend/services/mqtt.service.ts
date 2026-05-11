import axios from 'axios';
import mqtt from 'mqtt';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Kiểm tra biến môi trường
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const aioUsername = process.env.AIO_USERNAME!;
const aioKey = process.env.AIO_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const client = mqtt.connect('mqtts://io.adafruit.com', {
  username: aioUsername,
  password: aioKey,
});

/**
 * KHỞI TẠO LẮNG NGHE MQTT (REAL-TIME)
 */
export const initMQTT = async () => {
  // Lấy danh sách feed_key từ cả 2 bảng
  const { data: senKeys } = await supabase.from('sensors').select('feed_key');
  const { data: actKeys } = await supabase.from('actuators').select('feed_key');

  const allKeys = [
    ...(senKeys?.map((k) => k.feed_key) || []),
    ...(actKeys?.map((k) => k.feed_key) || []),
  ].filter(Boolean);

  client.on('connect', () => {
    console.log('✅ MQTT Connected!');
    allKeys.forEach((key) => {
      client.subscribe(`${aioUsername}/feeds/${key}`);
      console.log(`Đang theo dõi feed: ${key}`);
    });
  });

  client.on('message', async (topic, message) => {
    const feedKey = topic.split('/').pop() || '';
    const value = message.toString();
    console.log(`Nhận tin real-time: [${feedKey}] -> ${value}`);

    // 1. KIỂM TRA VÀ GHI DỮ LIỆU SENSOR
    const { data: sensor } = await supabase
      .from('sensors')
      .select('id')
      .eq('feed_key', feedKey)
      .maybeSingle();

    if (sensor) {
      await supabase.from('sensor_data').insert([
        {
          sensor_id: sensor.id,
          value: parseFloat(value),
        },
      ]);
      console.log(`Đã ghi dữ liệu cảm biến ${feedKey}`);
      return;
    }

    // 2. KIỂM TRA VÀ GHI TRẠNG THÁI ACTUATOR
    const { data: actuator } = await supabase
      .from('actuators')
      .select('id, name')
      .eq('feed_key', feedKey)
      .maybeSingle();

    if (actuator) {
      // Cập nhật trạng thái hiện tại của thiết bị
      await supabase
        .from('actuators')
        .update({ status: value })
        .eq('id', actuator.id);

      // Ghi lịch sử hoạt động vào bảng actuator_logs
      // await supabase.from('actuator_logs').insert([
      //   {
      //     actuator_id: actuator.id,
      //     action: 'MQTT Update',
      //     status: value,
      //     mode: 'manual', // Mặc định thủ công khi nhận lệnh từ feed
      //   },
      // ]);

      console.log(`Đã cập nhật thiết bị: ${actuator.name} -> ${value}`);
    }
  });
};

/**
 * ĐỒNG BỘ DỮ LIỆU CŨ/CÓ SẴN (HTTP API)
 */
export const syncAllDataFromAdafruit = async () => {
  // 1. Lấy tất cả cảm biến (nên filter thêm để tránh lấy null feed_key)
  const { data: dbSensors } = await supabase
    .from('sensors')
    .select('id, feed_key')
    .not('feed_key', 'is', null);

  if (!dbSensors || dbSensors.length === 0) return;

  // 2. TẠO MỐC THỜI GIAN HỘI TỤ (Giờ VN)
  // Lấy giờ hiện tại, làm tròn giây để 3 sensor khớp nhau trên biểu đồ
  const now = new Date();
  now.setMilliseconds(0);

  // Chuyển sang chuỗi ISO khớp với múi giờ VN (+7) để lưu vào DB
  const vnTimestamp = new Date(
    now.getTime() + 7 * 60 * 60 * 1000,
  ).toISOString();

  // Dùng để log ra console cho dễ nhìn
  const displayTime = now.toLocaleTimeString('vi-VN');

  console.log(`🔄 Bắt đầu đồng bộ toàn hệ thống lúc: ${displayTime}`);

  const dataToInsert = [];

  for (const sensor of dbSensors) {
    try {
      const response = await axios.get(
        `https://io.adafruit.com/api/v2/${aioUsername}/feeds/${sensor.feed_key}/data/last`,
        { headers: { 'X-AIO-Key': aioKey } },
      );

      if (response.data && response.data.value !== undefined) {
        dataToInsert.push({
          sensor_id: sensor.id,
          value: parseFloat(response.data.value),
          timestamp: vnTimestamp, // TẤT CẢ SENSOR DÙNG CHUNG 1 TIMESTAMP NÀY
        });
      }
    } catch (err: any) {
      console.error(`❌ Lỗi feed ${sensor.feed_key}: ${err.message}`);
    }
  }

  // 3. Insert hàng loạt (Bulk Insert) để tối ưu và đảm bảo tính đồng nhất
  if (dataToInsert.length > 0) {
    const { error } = await supabase.from('sensor_data').insert(dataToInsert);

    if (error) {
      console.error('❌ Lỗi lưu dữ liệu đồng bộ:', error.message);
    } else {
      console.log(
        `✅ Thành công! Đã gộp ${dataToInsert.length} sensor vào mốc ${displayTime}`,
      );
    }
  }
};

export const startIoTSystem = async () => {
  // 1. Khởi tạo lắng nghe Real-time (Chỉ ghi khi có thay đổi)
  await initMQTT();

  // 2. Chạy đồng bộ lần đầu ngay khi mở máy
  await syncAllDataFromAdafruit();

  // 3. THIẾT LẬP POLLING: Cứ mỗi 5 giây tự đi lấy data 1 lần
  const SYNC_INTERVAL = 5 * 1000;
  setInterval(async () => {
    console.log('⏰ Đến giờ đồng bộ định kỳ...');
    await syncAllDataFromAdafruit();
  }, SYNC_INTERVAL);
};
