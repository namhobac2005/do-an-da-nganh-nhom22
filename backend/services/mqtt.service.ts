import axios from "axios";
import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { evaluateSensorData } from "./alert.service.ts";

dotenv.config();

// Kiểm tra biến môi trường
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const aioUsername = process.env.AIO_USERNAME!;
const aioKey = process.env.AIO_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const client = mqtt.connect("mqtts://io.adafruit.com", {
  username: aioUsername,
  password: aioKey,
});

/**
 * KHỞI TẠO LẮNG NGHE MQTT (REAL-TIME)
 */
export const initMQTT = async () => {
  // Lấy danh sách feed_key từ cả 2 bảng
  const { data: senKeys } = await supabase.from("sensors").select("feed_key");
  const { data: actKeys } = await supabase.from("actuators").select("feed_key");

  const allKeys = [
    ...(senKeys?.map((k) => k.feed_key) || []),
    ...(actKeys?.map((k) => k.feed_key) || []),
  ].filter(Boolean);

  client.on("connect", () => {
    console.log("✅ MQTT Connected!");
    allKeys.forEach((key) => {
      client.subscribe(`${aioUsername}/feeds/${key}`);
      console.log(`Đang theo dõi feed: ${key}`);
    });
  });

  client.on("message", async (topic, message) => {
    const feedKey = topic.split("/").pop() || "";
    const value = message.toString();
    console.log(`Nhận tin real-time: [${feedKey}] -> ${value}`);

    // 1. KIỂM TRA VÀ GHI DỮ LIỆU SENSOR
    const { data: sensor } = await supabase
      .from("sensors")
      .select("id, type, pond_id")
      .eq("feed_key", feedKey)
      .maybeSingle();

    if (sensor) {
      const numericValue = parseFloat(value);

      await supabase.from("sensor_data").insert([
        {
          sensor_id: sensor.id,
          value: numericValue,
        },
      ]);
      console.log(`Đã ghi dữ liệu cảm biến ${feedKey}`);

      // ⚡ ĐÁNH GIÁ NGƯỠNG CẢNH BÁO — The Missing Link
      if (sensor.pond_id && sensor.type) {
        try {
          const alert = await evaluateSensorData(
            sensor.pond_id,
            null,
            sensor.type,
            numericValue,
          );
          if (alert) {
            console.log(
              `🚨 CẢNH BÁO: ${sensor.type} = ${numericValue} tại ao ${sensor.pond_id} — ${alert.reason}`,
            );
          }
        } catch (err: any) {
          console.error(
            `❌ Lỗi kiểm tra ngưỡng cho ${feedKey}:`,
            err.message,
          );
        }
      }

      return;
    }

    // 2. KIỂM TRA VÀ GHI TRẠNG THÁI ACTUATOR
    const { data: actuator } = await supabase
      .from("actuators")
      .select("id, name, mode")
      .eq("feed_key", feedKey)
      .maybeSingle();

    if (actuator) {
      const normalizedStatus = (() => {
        const normalized = value.trim().toLowerCase();
        if (
          normalized === "1" ||
          normalized === "true" ||
          normalized === "on"
        ) {
          return "ON";
        }

        if (
          normalized === "0" ||
          normalized === "false" ||
          normalized === "off"
        ) {
          return "OFF";
        }

        return value.toUpperCase();
      })();

      const { error: updateError } = await supabase
        .from("actuators")
        .update({ status: normalizedStatus })
        .eq("id", actuator.id);

      if (updateError) {
        console.error(
          `❌ Lỗi cập nhật trạng thái thiết bị ${actuator.name}: ${updateError.message}`,
        );
        return;
      }

      const { error: logError } = await supabase.from("actuator_logs").insert([
        {
          actuator_id: actuator.id,
          action: "MQTT Update",
          status: normalizedStatus,
          mode: actuator.mode || "manual",
        },
      ]);

      if (logError) {
        console.error(
          `❌ Lỗi ghi log thiết bị ${actuator.name}: ${logError.message}`,
        );
      }

      console.log(
        `Đã cập nhật thiết bị: ${actuator.name} -> ${normalizedStatus}`,
      );
    }
  });
};

/**
 * ĐỒNG BỘ DỮ LIỆU CŨ/CÓ SẴN (HTTP API)
 */
export const syncAllDataFromAdafruit = async () => {
  // 1. Lấy tất cả cảm biến (bao gồm type và pond_id để đánh giá ngưỡng)
  const { data: dbSensors } = await supabase
    .from("sensors")
    .select("id, feed_key, type, pond_id")
    .not("feed_key", "is", null);

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
  const displayTime = now.toLocaleTimeString("vi-VN");

  console.log(`🔄 Bắt đầu đồng bộ toàn hệ thống lúc: ${displayTime}`);

  const dataToInsert = [];
  // Lưu thông tin sensor để đánh giá ngưỡng sau khi insert
  const sensorReadings: { pond_id: string; type: string; value: number }[] = [];

  for (const sensor of dbSensors) {
    try {
      const response = await axios.get(
        `https://io.adafruit.com/api/v2/${aioUsername}/feeds/${sensor.feed_key}/data/last`,
        { headers: { "X-AIO-Key": aioKey } },
      );

      if (response.data && response.data.value !== undefined) {
        const numericValue = parseFloat(response.data.value);
        dataToInsert.push({
          sensor_id: sensor.id,
          value: numericValue,
          timestamp: vnTimestamp, // TẤT CẢ SENSOR DÙNG CHUNG 1 TIMESTAMP NÀY
        });

        // Ghi nhận để đánh giá ngưỡng
        if (sensor.pond_id && sensor.type) {
          sensorReadings.push({
            pond_id: sensor.pond_id,
            type: sensor.type,
            value: numericValue,
          });
        }
      }
    } catch (err: any) {
      console.error(`❌ Lỗi feed ${sensor.feed_key}: ${err.message}`);
    }
  }

  // 3. Insert hàng loạt (Bulk Insert) để tối ưu và đảm bảo tính đồng nhất
  if (dataToInsert.length > 0) {
    const { error } = await supabase.from("sensor_data").insert(dataToInsert);

    if (error) {
      console.error("❌ Lỗi lưu dữ liệu đồng bộ:", error.message);
    } else {
      console.log(
        `✅ Thành công! Đã gộp ${dataToInsert.length} sensor vào mốc ${displayTime}`,
      );

      // ⚡ ĐÁNH GIÁ NGƯỠNG CHO TẤT CẢ SENSOR ĐÃ ĐỒNG BỘ
      for (const reading of sensorReadings) {
        try {
          const alert = await evaluateSensorData(
            reading.pond_id,
            null,
            reading.type,
            reading.value,
          );
          if (alert) {
            console.log(
              `🚨 CẢNH BÁO (sync): ${reading.type} = ${reading.value} tại ao ${reading.pond_id} — ${alert.reason}`,
            );
          }
        } catch (err: any) {
          console.error(`❌ Lỗi kiểm tra ngưỡng (sync):`, err.message);
        }
      }
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
    console.log("⏰ Đến giờ đồng bộ định kỳ...");
    await syncAllDataFromAdafruit();
  }, SYNC_INTERVAL);
};

