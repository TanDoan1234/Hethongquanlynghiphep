# Hướng dẫn Deploy lên Vercel

## Chuẩn bị

Dự án này có 2 phần:

- **Backend (server/)** - Express API
- **Frontend (client/)** - React App

## Cách 1: Deploy Full-stack trên Vercel (Khuyến nghị)

### Bước 1: Setup Vercel CLI

```bash
npm install -g vercel
vercel login
```

### Bước 2: Tạo file `vercel.json` ở root

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "client/$1"
    }
  ],
  "env": {
    "PORT": "5000"
  }
}
```

### Bước 3: Thêm build script

Cập nhật `package.json` ở root:

```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build",
    "vercel-build": "npm run build"
  }
}
```

### Bước 4: Deploy

```bash
vercel
```

### Bước 5: Set Environment Variables

Trong Vercel Dashboard:

1. Vào project > Settings > Environment Variables
2. Thêm:
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_ANON_KEY` = `your-anon-key`
   - `PORT` = `5000`

### Bước 6: Redeploy

```bash
vercel --prod
```

---

## Cách 2: Deploy riêng biệt

### Backend trên Vercel

1. **Tạo project mới cho backend:**

   ```bash
   cd server
   vercel
   ```

2. **Thêm `vercel.json` trong `server/`:**

   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "index.js"
       }
     ]
   }
   ```

3. **Set Environment Variables** trong Vercel Dashboard

4. **Deploy:**

   ```bash
   vercel --prod
   ```

5. **Lấy API URL:** `https://your-backend.vercel.app`

### Frontend trên Vercel

1. **Update API endpoint trong client:**

   Tạo `client/.env.production`:

   ```env
   REACT_APP_API_URL=https://your-backend.vercel.app
   ```

   Update `client/src/services/auth.js`:

   ```javascript
   const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
   ```

2. **Deploy frontend:**
   ```bash
   cd client
   vercel
   vercel --prod
   ```

---

## Cách 3: Backend trên Railway/Render, Frontend trên Vercel

### Backend trên Railway (Khuyến nghị cho Express)

1. **Tạo tài khoản:** https://railway.app
2. **New Project** > **Deploy from GitHub**
3. **Chọn repo** và branch
4. **Root Directory:** `server`
5. **Environment Variables:**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `PORT` (Railway tự set)
6. **Deploy** - Railway tự động detect Node.js

### Frontend trên Vercel

Same as Cách 2, nhưng dùng Railway URL làm `REACT_APP_API_URL`

---

## Environment Variables Security

### ✅ An toàn để public:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `PORT`

### ⚠️ PHẢI giữ bí mật:

- `SUPABASE_SERVICE_ROLE_KEY` (nếu có)
- Database credentials
- JWT secrets khác

---

## Troubleshooting

### Lỗi 404 trên API routes

**Nguyên nhân:** Routes không được config đúng

**Fix:** Kiểm tra `vercel.json` routes, đảm bảo API routes được map đúng

### Lỗi "Missing environment variables"

**Nguyên nhân:** Env vars chưa set trong Vercel

**Fix:**

1. Vercel Dashboard > Project > Settings > Environment Variables
2. Add all variables từ `.env`
3. Redeploy

### CORS errors

**Nguyên nhân:** Backend không accept requests từ frontend domain

**Fix:** Update `server/index.js`:

```javascript
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://your-frontend.vercel.app",
    ],
    credentials: true,
  })
);
```

### Cold starts (serverless)

**Nguyên nhân:** Vercel serverless functions sleep khi không dùng

**Solution:**

- Nâng cấp Vercel Pro (faster cold starts)
- Hoặc deploy backend lên Railway/Render (always-on)

---

## Production Checklist

- [ ] Set tất cả environment variables trên Vercel
- [ ] Update CORS origins
- [ ] Change `JWT_SECRET` thành giá trị random mạnh
- [ ] Enable Supabase RLS policies
- [ ] Test đăng nhập production
- [ ] Test tạo user mới
- [ ] Test CRUD operations
- [ ] Check Supabase logs
- [ ] Setup monitoring (Sentry, LogRocket, etc.)

---

## Useful Commands

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# Check logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]
```

---

## Recommended Stack

**Cho project này:**

- ✅ **Backend:** Railway hoặc Render (always-on, tốt cho Express)
- ✅ **Frontend:** Vercel (tối ưu cho React)
- ✅ **Database:** Supabase (đã có)

**Hoặc all-in-one:**

- ✅ Vercel (cả frontend + backend)
- ⚠️ Lưu ý: Serverless functions có cold start

---

## Links

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
