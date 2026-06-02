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
  console.log("🇲🇳 Đang khởi tạo dữ liệu mẫu phong cách Việt Nam...");

  const rawPassword = "password123";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  // 1. Danh sách Users (Giữ nguyên phân quyền)
  const usersToSeed = [
    {
      username: "nguyen_van_admin",
      email: "admin@aquaculture.vn",
      password: hashedPassword,
      role: "admin",
      status: "active",
    },
    {
      username: "tran_thi_chuho",
      email: "thanh.tran@gmail.com",
      password: hashedPassword,
      role: "user",
      status: "active",
    },
    {
      username: "le_van_nuoi",
      email: "nuoitom.mientay@gmail.com",
      password: hashedPassword,
      role: "user",
      status: "active",
    },
    {
      username: "pham_minh_ao",
      email: "minhao88@gmail.com",
      password: hashedPassword,
      role: "user",
      status: "active",
    },
    {
      username: "hoang_gia_farm",
      email: "contact@hoanggiafarm.vn",
      password: hashedPassword,
      role: "user",
      status: "active",
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

  // Mapping loài thủy sản vào cột farming_type của bảng ponds trong DB
  const loaiThuySan = [
    "Tôm Thẻ Chân Trắng",
    "Tôm Sú",
    "Cá Tra",
    "Cá Rô Phi",
    "Cá Điêu Hồng",
    "Cua Cà Mau",
  ];

  try {
    // 1. INSERT USERS
    const { data: createdUsers, error: userError } = await supabase
      .from("users")
      .insert(usersToSeed)
      .select();

    if (userError) throw userError;
    console.log(`✅ Đã tạo ${createdUsers.length} Users.`);

    // Duyệt qua từng User để tạo dữ liệu liên quan
    for (const user of createdUsers) {
      // Mỗi user quản lý khoảng 2 Zone (Phân khu)
      const numZones = 2;
      for (let i = 1; i <= numZones; i++) {
        const tinh = faker.helpers.arrayElement(tinhThanh);

        // 2. TẠO ZONE (Sửa lỗi: Bảng zones không có user_id trong schema)
        const { data: zone, error: zoneError } = await supabase
          .from("zones")
          .insert([
            {
              name: `Trang trại ${tinh} - Phân khu ${i}`,
              location: `${faker.location.streetAddress()}, ${tinh}`,
              status: "active",
              description: `Vùng nuôi thủy sản chất lượng cao tại ${tinh}`,
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

        // 3. TẠO POND (Sửa lỗi: Cập nhật đúng các trường có trong schema: location, farming_type)
        const numPonds = 3;
        for (let j = 1; j <= numPonds; j++) {
          const species = faker.helpers.arrayElement(loaiThuySan);

          const { data: pond, error: pondError } = await supabase
            .from("ponds")
            .insert([
              {
                zone_id: zone.id,
                name: `Ao nuôi ${j} - ${faker.helpers.arrayElement(["Khu A", "Khu B"])}`,
                location: `Tọa độ ao số ${j}, hàng ${faker.number.int({ min: 1, max: 5 })}`,
                farming_type: species, // Đưa loài thủy sản vào cột farming_type tương ứng trong DB
                status: "active",
              },
            ])
            .select()
            .single();

          if (pondError) {
            console.error(`   ❌ Lỗi tạo Pond ${j}:`, pondError.message);
            continue;
          }

          console.log(`   🐟 [Pond] ${pond.name} đã được tạo thành công.`);

          // 4. LIÊN KẾT USER VỚI POND (Thêm mới: Điền dữ liệu vào bảng trung gian user_ponds)
          const { error: userPondError } = await supabase
            .from("user_ponds")
            .insert([
              {
                user_id: user.id,
                pond_id: pond.id,
              },
            ]);

          if (userPondError) {
            console.error(
              `   ❌ Lỗi liên kết User - Pond:`,
              userPondError.message,
            );
          } else {
            console.log(
              `   🔗 Đã liên kết thành công User [${user.username}] với [${pond.name}]`,
            );
          }
        }
      }
    }

    console.log(
      '\n🎉 Chúc mừng! Toàn bộ hệ thống "Farm Miền Tây" đã sẵn sàng.',
    );
    console.log(
      "Dữ liệu đã bao gồm: Users, Zones, Ponds cấu trúc chuẩn và bảng trung gian user_ponds.",
    );
  } catch (error: any) {
    console.error("❌ Lỗi Seed tổng thể:", error.message);
  }
}

seedVietnamData();
