# Hệ thống quản lý nghỉ phép

Website quản lý nghỉ phép với phân quyền nhân viên và quản lý.

## Tính năng

### Nhân viên
- Đăng nhập vào hệ thống
- Tạo đơn xin nghỉ phép (nghỉ phép, nghỉ ốm, nghỉ việc riêng, nghỉ không lương)
- Xem danh sách đơn nghỉ phép của mình
- Tạo yêu cầu ứng lương
- Xem thông tin lương của mình
- **Không thể sửa hoặc xóa đơn đã gửi** (đã được khóa)

### Quản lý
- Đăng nhập vào hệ thống
- Tạo tài khoản cho nhân viên mới
- Xem danh sách tất cả nhân viên
- Sửa/Xóa nhân viên
- Reset mật khẩu cho nhân viên
- Xem tất cả đơn nghỉ phép
- Duyệt hoặc từ chối đơn nghỉ phép
- Quản lý yêu cầu ứng lương
- Đặt lương theo tháng cho nhân viên

## Công nghệ sử dụng

- **Frontend**: React 18, React Router
- **Backend**: Node.js, Express
- **Authentication**: JWT (JSON Web Token)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Supabase JS Client

## Cài đặt

### Yêu cầu
- Node.js (phiên bản 14 trở lên)
- npm hoặc yarn
- Tài khoản Supabase (miễn phí tại [supabase.com](https://supabase.com))

### Các bước cài đặt

#### 1. Setup Supabase Database

1. **Tạo project trên Supabase:**
   - Truy cập [supabase.com](https://supabase.com)
   - Đăng ký/Đăng nhập tài khoản
   - Tạo project mới
   - Chờ database được khởi tạo (khoảng 1-2 phút)

2. **Chạy SQL Schema:**
   - Vào **SQL Editor** trong Supabase Dashboard
   - Copy nội dung file `server/schema.sql`
   - Paste vào SQL Editor và chạy (Run)
   - Schema sẽ tự động tạo các tables và dữ liệu mặc định

3. **Lấy API credentials:**
   - Vào **Settings** > **API**
   - Copy **Project URL** (dạng: `https://xxxxx.supabase.co`)
   - Copy **anon public** key

#### 2. Cài đặt Dependencies

```bash
npm run install-all
```

Hoặc cài đặt từng phần:
```bash
npm install
cd server && npm install
cd ../client && npm install
```

#### 3. Cấu hình Environment Variables

Tạo file `server/.env` từ template:

```bash
cd server
cp .env.example .env
```

Sau đó cập nhật `server/.env` với thông tin Supabase của bạn:

```env
# Server Configuration
PORT=5000
JWT_SECRET=your-secret-key-change-in-production

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Lưu ý:** Thay thế `SUPABASE_URL` và `SUPABASE_ANON_KEY` bằng thông tin thực tế từ Supabase Dashboard.

#### 4. Chạy ứng dụng

Chạy cả frontend và backend cùng lúc:
```bash
npm run dev
```

Hoặc chạy riêng biệt:
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

#### 5. Truy cập ứng dụng
- Frontend: http://localhost:3001
- Backend API: http://localhost:5000

**Lưu ý:** Nếu port 3001 bị chiếm, bạn có thể:
- Đóng ứng dụng đang chạy trên port 3000/3001
- Hoặc thay đổi port trong file `client/.env` (PORT=3002, 3003, ...)

## Tài khoản mặc định

- **Quản lý:**
  - Tên đăng nhập: `admin`
  - Mật khẩu: `admin123`

*(Tài khoản này được tạo tự động khi chạy schema.sql)*

## Cấu trúc dự án

```
HETHONGQUANLYNGHIPHEP/
├── client/                 # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/     # Các component React
│   │   ├── services/       # API services
│   │   └── App.js
│   └── package.json
├── server/                 # Backend Express
│   ├── index.js           # Server chính
│   ├── supabaseClient.js  # Supabase client config
│   ├── schema.sql         # Database schema
│   ├── .env               # Environment variables (không commit)
│   ├── .env.example       # Template cho .env
│   └── package.json
└── package.json           # Root package.json
```

## Database Schema

### Tables

1. **users** - Thông tin người dùng
   - id, username, password, name, email, role
   - salaries (JSONB) - lưu lương theo tháng

2. **leave_requests** - Đơn nghỉ phép
   - id, user_id, user_name, date, time_period
   - start_date, end_date (cho format cũ)
   - reason, type, status, can_edit

3. **advance_requests** - Yêu cầu ứng lương
   - id, user_id, user_name, amount, reason, status

Xem chi tiết trong file `server/schema.sql`

## API Endpoints

### Authentication
- `POST /api/login` - Đăng nhập
- `GET /api/me` - Lấy thông tin user hiện tại

### Users (Manager only)
- `GET /api/users` - Lấy danh sách users
- `POST /api/users` - Tạo user mới
- `PUT /api/users/:id` - Sửa thông tin user
- `DELETE /api/users/:id` - Xóa user
- `PATCH /api/users/change-password` - Đổi mật khẩu
- `PATCH /api/users/:id/reset-password` - Reset mật khẩu (Manager)

### Leave Requests
- `GET /api/leave-requests` - Lấy danh sách đơn nghỉ phép
- `POST /api/leave-requests` - Tạo đơn nghỉ phép mới
- `GET /api/leave-requests/:id` - Lấy chi tiết đơn
- `PUT /api/leave-requests/:id` - Cập nhật đơn (Manager only)
- `DELETE /api/leave-requests/:id` - Xóa đơn (Manager only)
- `PATCH /api/leave-requests/:id/status` - Duyệt/từ chối đơn (Manager only)

### Advance Requests (Ứng lương)
- `GET /api/advance-requests` - Lấy danh sách yêu cầu ứng lương
- `POST /api/advance-requests` - Tạo yêu cầu ứng lương
- `PUT /api/advance-requests/:id` - Sửa yêu cầu (Manager only)
- `DELETE /api/advance-requests/:id` - Xóa yêu cầu (Manager only)
- `PATCH /api/advance-requests/:id/status` - Duyệt/từ chối (Manager only)

### Salary
- `POST /api/users/:id/salary` - Đặt lương theo tháng (Manager only)
- `GET /api/users/:id/salary/:month` - Xem lương nhân viên (Manager only)
- `GET /api/users/me/salary/:month` - Xem lương của mình (Employee)
- `GET /api/users/:id/salaries` - Xem tất cả lương (Manager only)

## Lưu ý

### Bảo mật
- JWT secret key mặc định là `'your-secret-key-change-in-production'` - **BẮT BUỘC** thay đổi trong môi trường production
- File `.env` chứa thông tin nhạy cảm, không commit lên Git
- Supabase anon key là public key, có thể dùng trên client, được bảo vệ bởi RLS (Row Level Security)

### Database
- Database được host trên Supabase (PostgreSQL)
- Có Row Level Security (RLS) policies
- Auto backup và high availability
- Free tier: 500MB database, 2GB file storage

Đối với hệ thống quản lý nghỉ phép nhỏ (< 100 nhân viên), Free tier là quá đủ!

## Troubleshooting

### Lỗi "Missing Supabase credentials"
- Kiểm tra file `server/.env` đã được tạo chưa
- Kiểm tra `SUPABASE_URL` và `SUPABASE_ANON_KEY` đã điền đúng chưa

### Lỗi kết nối Supabase
- Kiểm tra project Supabase đã được khởi tạo xong chưa
- Kiểm tra API credentials có đúng không
- Kiểm tra kết nối internet

### Tables không tồn tại
- Chạy lại file `server/schema.sql` trong Supabase SQL Editor
- Kiểm tra có lỗi khi chạy SQL không

## Phát triển thêm

Có thể mở rộng thêm các tính năng:
- ✅ Phân quyền chi tiết với Supabase RLS
- Thống kê và báo cáo với Supabase Analytics
- Gửi email thông báo
- Lịch nghỉ phép
- Export dữ liệu ra Excel/PDF
- Real-time updates với Supabase Realtime
- File upload cho đơn nghỉ phép (Supabase Storage)

## License

MIT
