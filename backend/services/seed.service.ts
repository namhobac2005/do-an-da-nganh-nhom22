import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker/locale/vi"; // Sử dụng locale Tiếng Việt
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!,
);

async function seedVietnamData() {
  console.log("🇻🇳 Đang khởi tạo dữ liệu mẫu phong cách Việt Nam...");

  const rawPassword = "password123";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  // 1. Danh sách Users (Nhiều user hơn để test phân quyền)
  const usersToSeed = [
    {
      username: "nguyen_van_admin",
      email: "admin@aquaculture.vn",
      password: hashedPassword,
      role: "admin",
    },
    {
      username: "tran_thi_chuho",
      email: "thanh.tran@gmail.com",
      password: hashedPassword,
      role: "user",
    },
    {
      username: "le_van_nuoi",
      email: "nuoitom.mientay@gmail.com",
      password: hashedPassword,
      role: "user",
    },
    {
      username: "pham_minh_ao",
      email: "minhao88@gmail.com",
      password: hashedPassword,
      role: "user",
    },
    {
      username: "hoang_gia_farm",
      email: "contact@hoanggiafarm.vn",
      password: hashedPassword,
      role: "user",
    },
  ];

  const tinhThanh = [
    "Tiền Giang",
    "Bến Tre",
    "Trà Vinh",
    "Sóc Trăng",
    "Bạc Liêu",
    "Cà Mau",
    "Đồng Tháp",
  ];
  const loaiThuySan = [
    "Tôm Thẻ Chân Trắng",
    "Tôm Sú",
    "Cá Tra",
    "Cá Rô Phi",
    "Cá Điêu Hồng",
    "Cua Cà Mau",
  ];

  try {
    // INSERT USERS
    const { data: createdUsers, error: userError } = await supabase
      .from("users")
      .insert(usersToSeed)
      .select();

    if (userError) throw userError;
    console.log(`✅ Đã tạo ${createdUsers.length} Users.`);

    for (const user of createdUsers) {
      const numZones = 2;
      for (let i = 1; i <= numZones; i++) {
        const tinh = faker.helpers.arrayElement(tinhThanh);

        // TẠO ZONE
        const { data: zone, error: zoneError } = await supabase
          .from("zones")
          .insert([
            {
              name: `Trang trại ${tinh} - Phân khu ${i}`,
              location: `${faker.location.streetAddress()}, ${tinh}`,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (zoneError) {
          console.error(
            `❌ Lỗi tạo Zone cho user ${user.username}:`,
            zoneError.message,
          );
          continue;
        }

        // TẠO POND (Quan trọng: Kiểm tra biến 'zone')
        const numPonds = 3;
        for (let j = 1; j <= numPonds; j++) {
          console.log(`⏳ Đang thử tạo Pond ${j} cho Zone ${zone.id}...`);

          const { data: pond, error: pondError } = await supabase
            .from("ponds")
            .insert([
              {
                zone_id: zone.id, // Đảm bảo ID này tồn tại
                name: `Ao nuôi ${j} - ${faker.helpers.arrayElement(["Khu A", "Khu B"])}`,
                area: faker.number.int({ min: 500, max: 2000 }),
                species: faker.helpers.arrayElement(loaiThuySan),
                start_date: new Date(),
              },
            ])
            .select()
            .single();

          if (pondError) {
            console.error(`   ❌ Lỗi tạo Pond ${j}:`, pondError.message);
          } else {
            console.log(`   🐟 [Pond] ${pond.name} đã được tạo thành công.`);
          }
        }
      }
    }

    console.log(' Chúc mừng! Toàn bộ hệ thống "Farm Miền Tây" đã sẵn sàng.');
    console.log(
      "Dữ liệu đã bao gồm: Users, địa chỉ Việt Nam, các loại thủy sản bản địa.",
    );
  } catch (error: any) {
    console.error("❌ Lỗi Seed:", error.message);
  }
}

seedVietnamData();
