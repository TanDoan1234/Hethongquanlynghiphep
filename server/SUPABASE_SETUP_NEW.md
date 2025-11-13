# Hướng dẫn Setup Supabase với Supabase Auth

## Bước 1: Tạo Project Supabase

1. Truy cập [supabase.com](https://supabase.com)
2. Đăng ký/Đăng nhập (có thể dùng GitHub)
3. Click **"New Project"**
4. Điền thông tin:
   - **Name**: `leave-management` (hoặc tên tùy thích)
   - **Database Password**: Tạo password mạnh (lưu lại)
   - **Region**: Chọn gần nhất (ví dụ: Southeast Asia)
   - **Pricing Plan**: Free (đủ dùng)
5. Click **"Create new project"**
6. Chờ 1-2 phút để database được khởi tạo

## Bước 2: Chạy SQL Schema

1. Trong Supabase Dashboard, vào **SQL Editor** (biểu tượng </> ở sidebar)
2. Click **"New query"**
3. Copy toàn bộ nội dung file `schema.sql` (trong thư mục server)
4. Paste vào SQL Editor
5. Click **"Run"** (hoặc Ctrl/Cmd + Enter)
6. Kiểm tra kết quả:
   - Nếu thành công sẽ thấy: `Success. No rows returned`
   - Nếu có lỗi, đọc message và fix

## Bước 3: Kiểm tra Tables

1. **Mở Table Editor:**
   - Click biểu tượng **📊 Table Editor** ở sidebar
2. **Verify 3 tables:**
   - ✅ `profiles` - Rỗng ban đầu (sẽ tự động tạo khi user đăng ký)
   - ✅ `leave_requests` - Rỗng (0 rows)
   - ✅ `advance_requests` - Rỗng (0 rows)

## Bước 4: Tạo Admin User

**Quan trọng:** Hệ thống sử dụng **Supabase Auth**, không tự quản lý password nữa!

1. **Vào Authentication:**

   - Click biểu tượng **👤 Authentication** ở sidebar bên trái
   - Click tab **Users**
   - Click **"Add User"** > **"Create new user"**

2. **Điền thông tin admin:**

   ```
   Email: admin@company.com
   Password: admin123
   Confirm Password: admin123
   ```

   - ✅ Check: **Auto Confirm User**

3. **Thêm User Metadata:**

   - Expand phần **"User Metadata"**
   - Paste JSON này:

   ```json
   {
     "username": "admin",
     "name": "Quản lý",
     "role": "manager"
   }
   ```

4. **Click "Create user"**

5. **Verify profile tự động tạo:**
   - Quay lại **Table Editor** > bảng `profiles`
   - Phải thấy 1 row vừa tự động tạo:
     ```
     username: admin
     name: Quản lý
     role: manager
     email: admin@company.com
     ```
   - Nếu chưa thấy, đợi vài giây và refresh

## Bước 5: Lấy API Credentials

1. **Vào Settings:**

   - Click biểu tượng ⚙️ **Settings** ở sidebar
   - Chọn **API** trong menu Settings

2. **Copy 2 thông tin quan trọng:**

   **A. Project URL:**

   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **B. anon public key:** (trong phần "Project API keys")

   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz........(rất dài)
   ```

   ⚠️ **Không cần service_role key** - chỉ dùng anon key!

## Bước 6: Cấu hình .env File

1. **Tạo file .env:**

   ```bash
   cd server
   ```

2. **Tạo file `.env` với nội dung:**

   ```env
   # Server Configuration
   PORT=5000

   # Supabase Configuration
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.....
   ```

3. **Thay thế giá trị:**
   - Thay `SUPABASE_URL` bằng Project URL từ Bước 5
   - Thay `SUPABASE_ANON_KEY` bằng anon key từ Bước 5

## Bước 7: Test Kết Nối

1. **Chạy server:**

   ```bash
   cd server
   npm start
   ```

2. **Kiểm tra console:**

   ```
   ✅ Supabase client initialized
   🚀 Server is running on http://localhost:5000
   🔐 Using Supabase Auth for authentication
   📊 Database: Supabase
   ```

3. **Nếu thấy lỗi:**
   - ❌ `Missing Supabase credentials` → Kiểm tra file `.env`
   - ❌ `Invalid API key` → Copy lại ANON_KEY
   - ❌ Connection error → Kiểm tra internet

## Bước 8: Test Đăng Nhập

1. **Chạy frontend** (terminal mới):

   ```bash
   cd client
   npm start
   ```

2. **Mở browser:**

   - Vào http://localhost:3001

3. **Đăng nhập:**

   ```
   Username: admin
   Password: admin123
   ```

4. **Nếu thành công:**
   - ✅ Vào được Manager Dashboard
   - ✅ Setup hoàn tất! 🎉

---

## 🔐 Ưu điểm Supabase Auth

So với tự quản lý password:

✅ **Bảo mật cao hơn** - Password được hash tự động bởi Supabase  
✅ **Tính năng sẵn có:**

- Email verification
- Password reset via email
- Social login (Google, GitHub, etc.)
- Magic links
- Multi-factor authentication (MFA)

✅ **Quản lý dễ dàng** - Xem users trong Supabase Dashboard  
✅ **Audit logs** - Track login history  
✅ **Rate limiting** - Chống brute force tự động

---

## 🔍 Troubleshooting

### Lỗi "relation does not exist"

- Schema chưa được chạy hoặc chạy lỗi
- Vào SQL Editor và chạy lại file `schema.sql`

### Lỗi "Invalid API key"

- SUPABASE_ANON_KEY không đúng
- Copy lại từ Settings > API > anon public key
- **Lưu ý:** Dùng anon key, KHÔNG dùng service_role key

### Lỗi "Failed to fetch"

- SUPABASE_URL không đúng
- Kiểm tra lại Project URL
- Kiểm tra kết nối internet

### Lỗi "Invalid username or password"

**Nguyên nhân:** User admin chưa được tạo trong Supabase Auth

**Cách fix:**

1. Vào **Authentication** > **Users**
2. Check xem có user `admin@company.com` chưa
3. Nếu chưa có, làm lại **Bước 4**
4. Nếu đã có nhưng vẫn lỗi:
   - Click vào user đó
   - Check **Email Confirmed** phải là ✅
   - Check **User Metadata** phải có `username`, `name`, `role`

### Profile không tự động tạo

**Nguyên nhân:** Trigger chưa chạy hoặc bị lỗi

**Cách fix:**

1. Kiểm tra trigger trong SQL Editor:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```
2. Nếu không có, chạy lại phần trigger trong `schema.sql`
3. Hoặc tạo profile thủ công:
   ```sql
   INSERT INTO profiles (id, username, name, email, role)
   SELECT
     id,
     raw_user_meta_data->>'username',
     raw_user_meta_data->>'name',
     email,
     raw_user_meta_data->>'role'
   FROM auth.users
   WHERE email = 'admin@company.com';
   ```

### Không tạo được user mới từ Manager Dashboard

**Nguyên nhân:** Cần `service_role` key để tạo user

**Cách fix:**

1. Vào Settings > API
2. Copy **service_role key** (ở phần Project API keys)
3. Thêm vào `server/.env`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbG.......
   ```
4. Update `server/supabaseClient.js`:
   ```javascript
   const supabaseAdmin = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY
   );
   module.exports = { supabase, supabaseAdmin };
   ```
5. Trong `server/index.js`, dùng `supabaseAdmin` cho admin operations

⚠️ **Service role key rất mạnh, giữ bí mật tuyệt đối!**

---

## 📚 Quản lý Database

### Xem users

- **Authentication** > **Users** - Xem auth users
- **Table Editor** > **profiles** - Xem thông tin bổ sung

### Xem dữ liệu

- **Table Editor** - Browse và edit trực tiếp
- **SQL Editor** - Query SQL tự do

### Backup

- Free plan có auto backup hàng ngày
- Export manual: Table Editor > ... > Download as CSV

### Xóa user

```sql
-- Cách 1: Qua Supabase Auth (khuyến nghị)
-- Vào Authentication > Users > Click user > Delete

-- Cách 2: Qua SQL (cascade delete profile)
DELETE FROM auth.users WHERE email = 'user@example.com';
```

### Reset về ban đầu

```sql
-- Xóa tất cả dữ liệu (giữ lại tables)
DELETE FROM advance_requests;
DELETE FROM leave_requests;
DELETE FROM profiles WHERE role = 'employee';

-- Xóa auth users (trừ admin)
-- Làm qua Dashboard: Authentication > Users > chọn users > Delete
```

---

## 🎓 Next Steps

Sau khi setup xong, bạn có thể:

- ✅ Tạo thêm nhân viên từ Manager Dashboard
- ✅ Thử tạo đơn nghỉ phép
- ✅ Xem Supabase Dashboard để theo dõi dữ liệu real-time
- 🚀 Enable email notifications cho password reset
- 🚀 Add social login (Google, GitHub)
- 🚀 Enable Supabase Realtime cho live updates

## 📖 Tài liệu tham khảo

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
