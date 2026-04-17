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
      console.log(`📡 Đang theo dõi feed: ${key}`);
    });
  });

  client.on('message', async (topic, message) => {
    const feedKey = topic.split('/').pop() || '';
    const value = message.toString();

    // TÌM THEO FEED_KEY
    const { data: sensor } = await supabase
      .from('sensors')
      .select('id, pond_id')
      .eq('feed_key', feedKey) // Thay vì .eq('type', ...)
      .maybeSingle();

    if (sensor) {
      await supabase
        .from('sensor_data')
        .insert([{ sensor_id: sensor.id, value: parseFloat(value) }]);
      console.log(`✅ Đã lưu data cho hồ: ${sensor.pond_id}`);
      return;
    }

    // Tương tự cho Actuator...
  });
};

/**
 * ĐỒNG BỘ DỮ LIỆU CŨ/CÓ SẴN (HTTP API)
 */
export const syncAllDataFromAdafruit = async () => {
  // 1. Lấy tất cả cảm biến đã được gán vào hồ trong DB
  const { data: dbSensors } = await supabase
    .from('sensors')
    .select('id, feed_key');

  if (!dbSensors) return;

  for (const sensor of dbSensors) {
    try {
      const response = await axios.get(
        `https://io.adafruit.com/api/v2/${aioUsername}/feeds/${sensor.feed_key}/data/last`,
        { headers: { 'X-AIO-Key': aioKey } },
      );

      const lastValue = response.data.value;

      await supabase
        .from('sensor_data')
        .insert([{ sensor_id: sensor.id, value: parseFloat(lastValue) }]);
      console.log(
        `🔄 Đã đồng bộ feed ${sensor.feed_key} cho sensor ${sensor.id}`,
      );
    } catch (err) {
      console.error(`❌ Lỗi đồng bộ feed ${sensor.feed_key}`);
    }
  }
};

// export const startSensorPolling = () => {
//   setInterval(async () => {
//     for (const feedKey of FEEDS) {
//       try {
//         const res = await axios.get(
//           `https://io.adafruit.com/api/v2/${aioUsername}/feeds/${feedKey}/data/last`,
//           { headers: { 'X-AIO-Key': aioKey } },
//         );

//         const value = res.data.value;

//         // chỉ xử lý sensor
//         const isSensor = ['temperature', 'water-level', 'brightness'].includes(
//           feedKey,
//         );

//         if (!isSensor) continue;

//         const { data: sensor } = await supabase
//           .from('sensors')
//           .select('id')
//           .eq('type', feedKey)
//           .maybeSingle();

//         if (sensor) {
//           await supabase.from('sensor_data').insert([
//             {
//               sensor_id: sensor.id,
//               value: parseFloat(value),
//             },
//           ]);

//           console.log(`[Polling] ${feedKey}: ${value}`);
//         }
//       } catch (err: any) {
//         console.error(`Polling lỗi ${feedKey}:`, err.message);
//       }
//     }
//   }, 5000); // 5 giây
// };
