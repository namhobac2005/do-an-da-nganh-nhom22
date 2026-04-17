import dotenv from "dotenv";
import express from "express";
import cors from "cors";

import pool from "./db.js";
import {
  initMQTT,
  syncAllDataFromAdafruit,
  startSensorPolling,
} from "./services/mqtt.service.js";
// Import router
import deviceRoutes from "./routes/device.route.js";
import sensorRoutes from "./routes/sensor.route.js";
import scheduleRoutes from "./routes/schedule.route.js";
import reportRoutes from "./routes/report.route.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================= TEST SERVER =================
app.get("/", (req, res) => {
  res.send("API Hệ thống ao nuôi chạy ngon lành 🚀");
});

// ================= API THIẾT BỊ (CORE) =================
// Toàn bộ request gọi vào /devices sẽ được đẩy sang device.routes.js xử lý
app.use("/devices", deviceRoutes);
app.use("/sensors", sensorRoutes);
app.use("/schedules", scheduleRoutes);
app.use("/reports", reportRoutes);

// ================= START =================
initMQTT();
import("./services/schedule.service.js").then(({ loadSchedules }) => {
  loadSchedules();
});
await syncAllDataFromAdafruit();
startSensorPolling();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
