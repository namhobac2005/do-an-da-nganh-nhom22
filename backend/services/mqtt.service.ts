import axios from "axios";
import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Kiểm tra biến môi trường
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;
const aioUsername = process.env.AIO_USERNAME!;
const aioKey = process.env.AIO_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Danh sách feed key dùng chung cho toàn bộ service
const FEEDS = [
  "temperature",
  "water-level",
  "light",
  "pump",
  "fan",
  "servo",
  "brightness",
];

const client = mqtt.connect("mqtts://io.adafruit.com", {
  username: aioUsername,
  password: aioKey,
});

/**
 * KHỞI TẠO LẮNG NGHE MQTT (REAL-TIME)
 */
export const initMQTT = () => {
  client.on("connect", () => {
    console.log("MQTT Connected to Adafruit IO!");

    FEEDS.forEach((feed) => {
      client.subscribe(`${aioUsername}/feeds/${feed}`);
    });
  });

  client.on("message", async (topic, message) => {
    const value = message.toString();
    const feedKey = topic.split("/").pop() || "";

    try {
      // 1. Tìm Actuator - Dùng maybeSingle() để không bị văng lỗi nếu không có
      const { data: actuator, error: actErr } = await supabase
        .from("actuators")
        .select("id, mode")
        .eq("type", feedKey)
        .maybeSingle(); // Trả về null nếu không tìm thấy, không báo lỗi

      if (actuator) {
        const newStatus =
          value === "0" || value.toLowerCase() === "off" ? "OFF" : "ON";

        await supabase
          .from("actuators")
          .update({ status: newStatus })
          .eq("id", actuator.id);

        await supabase.from("actuator_logs").insert([
          {
            actuator_id: actuator.id,
            action: `MQTT: ${value}`,
            status: newStatus,
            mode: actuator.mode || "auto",
          },
        ]);
        console.log(`[Actuator] ${feedKey} updated.`);
        return;
      }

      // 2. Tìm Sensor - Tương tự dùng maybeSingle()
      const { data: sensor, error: senErr } = await supabase
        .from("sensors")
        .select("id")
        .eq("type", feedKey)
        .maybeSingle();

      if (sensor) {
        await supabase.from("sensor_data").insert([
          {
            sensor_id: sensor.id,
            value: parseFloat(value),
          },
        ]);
        console.log(`[Sensor] ${feedKey} recorded.`);
      } else {
        // Nếu Adafruit bắn về mà DB không có, chỉ log ra để biết chứ không dừng app
        console.log(
          `ℹFeed [${feedKey}] nhận dữ liệu nhưng không có ID tương ứng trong DB.`,
        );
      }
    } catch (err: any) {
      console.error("Lỗi logic MQTT:", err.message);
    }
  });

  client.on("error", (err) => {
    console.error("Lỗi kết nối MQTT:", err);
  });
};

/**
 * ĐỒNG BỘ DỮ LIỆU CŨ/CÓ SẴN (HTTP API)
 */
export const syncAllDataFromAdafruit = async () => {
  console.log("Bắt đầu quét Adafruit để khởi tạo Database...");

  for (const feedKey of FEEDS) {
    try {
      // 1. Lấy dữ liệu cuối cùng từ Adafruit
      const response = await axios.get(
        `https://io.adafruit.com/api/v2/${aioUsername}/feeds/${feedKey}/data/last`,
        { headers: { "X-AIO-Key": aioKey } },
      );

      const lastValue = response.data.value;
      const feedName = feedKey.charAt(0).toUpperCase() + feedKey.slice(1); // Tự tạo tên (VD: Temperature)

      // 2. PHÂN LOẠI: Cái nào là Actuator (thiết bị), cái nào là Sensor (cảm biến)
      const isActuator = ["light", "pump", "fan", "servo"].includes(feedKey);

      if (isActuator) {
        // 1. Kiểm tra xem đã có trong DB chưa
        let { data: actuator, error: fetchError } = await supabase
          .from("actuators")
          .select("id")
          .eq("type", feedKey)
          .maybeSingle();

        const statusValue =
          lastValue === "0" || lastValue.toLowerCase() === "off" ? "OFF" : "ON";

        if (!actuator) {
          console.log(`Đang thử tạo mới Actuator: ${feedKey}`);

          // 2. Thêm mới nếu chưa có
          const { data: newAct, error: insertError } = await supabase
            .from("actuators")
            .insert([
              {
                name: feedName,
                type: feedKey,
                status: statusValue,
                mode: "manual",
                // Tuyệt đối không điền pond_id ở đây nếu chưa có ao
              },
            ])
            .select()
            .single();

          if (insertError) {
            // ĐÂY LÀ DÒNG QUAN TRỌNG: Nó sẽ báo tại sao không ghi được
            console.error(
              `Lỗi Insert Actuator [${feedKey}]:`,
              insertError.message,
            );
          } else {
            console.log(`Đã tạo mới Actuator [${feedKey}] thành công!`);
            actuator = newAct;
          }
        } else {
          // 3. Nếu đã có thì cập nhật trạng thái
          const { error: updateError } = await supabase
            .from("actuators")
            .update({ status: statusValue })
            .eq("id", actuator.id);

          if (updateError)
            console.error(
              `Lỗi Update Actuator [${feedKey}]:`,
              updateError.message,
            );
          else
            console.log(
              `Đã cập nhật trạng thái Actuator [${feedKey}] -> ${statusValue}`,
            );
        }

        // 4. Ghi log (Chỉ ghi nếu có actuator ID)
        if (actuator) {
          const { error: logError } = await supabase
            .from("actuator_logs")
            .insert([
              {
                actuator_id: actuator.id,
                action: `Initial Sync: ${lastValue}`,
                status: statusValue,
                mode: "manual",
              },
            ]);
          if (logError)
            console.error(`Lỗi Ghi Log [${feedKey}]:`, logError.message);
        }
      } else {
        // LÀ CẢM BIẾN (Sensor)
        let { data: sensor } = await supabase
          .from("sensors")
          .select("id")
          .eq("type", feedKey)
          .maybeSingle();

        if (!sensor) {
          console.log(`Tạo mới Sensor: ${feedKey}`);
          const { data: newSen, error } = await supabase
            .from("sensors")
            .insert([
              {
                name: feedName,
                type: feedKey,
                status: "active",
                unit: feedKey === "temperature" ? "°C" : "%",
              },
            ])
            .select()
            .single();
          sensor = newSen;
        }

        // Sau khi đã có Sensor ID (dù mới tạo hay đã có), ghi dữ liệu vào sensor_data
        if (sensor && lastValue !== undefined) {
          await supabase.from("sensor_data").insert([
            {
              sensor_id: sensor.id,
              value: parseFloat(lastValue),
            },
          ]);
          console.log(`Đã ghi dữ liệu cho ${feedKey}: ${lastValue}`);
        }
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error(`Lỗi đồng bộ feed [${feedKey}]:`, err.message);
      }
    }
  }
  console.log("Hệ thống đã sẵn sàng với dữ liệu từ Adafruit!");
};

export const startSensorPolling = () => {
  setInterval(async () => {
    for (const feedKey of FEEDS) {
      try {
        const res = await axios.get(
          `https://io.adafruit.com/api/v2/${aioUsername}/feeds/${feedKey}/data/last`,
          { headers: { "X-AIO-Key": aioKey } },
        );

        const value = res.data.value;

        // chỉ xử lý sensor
        const isSensor = ["temperature", "water-level", "brightness"].includes(
          feedKey,
        );

        if (!isSensor) continue;

        const { data: sensor } = await supabase
          .from("sensors")
          .select("id")
          .eq("type", feedKey)
          .maybeSingle();

        if (sensor) {
          await supabase.from("sensor_data").insert([
            {
              sensor_id: sensor.id,
              value: parseFloat(value),
            },
          ]);

          console.log(`[Polling] ${feedKey}: ${value}`);
        }
      } catch (err: any) {
        console.error(`Polling lỗi ${feedKey}:`, err.message);
      }
    }
  }, 5000); // 5 giây
};
