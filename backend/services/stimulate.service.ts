import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

const aioUsername = process.env.AIO_USERNAME!;
const aioKey = process.env.AIO_KEY!;

const client = mqtt.connect('mqtts://io.adafruit.com', {
  username: aioUsername,
  password: aioKey,
});

// Danh sách các feed_key bạn muốn giả lập dữ liệu
const sensorFeeds = ['temperature', 'water-level', 'brightness'];

client.on('connect', () => {
  console.log('🤖 Simulator đã chạy! Đang gửi dữ liệu giả lên Adafruit...');

  setInterval(() => {
    sensorFeeds.forEach((feed) => {
      // Tạo giá trị ngẫu nhiên
      let value = 0;
      if (feed === 'temperature')
        value = parseFloat((Math.random() * 5 + 28).toFixed(2)); // 28-33 độ
      if (feed === 'water-level')
        value = parseFloat((Math.random() * 20 + 70).toFixed(2)); // 70-90 %
      if (feed === 'brightness')
        value = parseFloat((Math.random() * 20 + 70).toFixed(2)); // 70-90 %;

      // Bắn dữ liệu lên Adafruit
      const topic = `${aioUsername}/feeds/${feed}`;
      client.publish(topic, value.toString());

      console.log(`📡 Sent to ${feed}: ${value}`);
    });
  }, 10000); // Gửi mỗi 10 giây
});
