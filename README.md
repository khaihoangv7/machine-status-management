# 🌐 PC Monitor Pro - Cloud Version

**Giám sát máy tính từ bất kỳ đâu qua Internet!**

---

## 🎯 Tổng quan

Phiên bản Cloud cho phép:
- ✅ Giám sát máy tính từ **khác mạng LAN**
- ✅ Xem dashboard từ **bất kỳ đâu** (điện thoại, máy tính khác)
- ✅ **Miễn phí** hoàn toàn (sử dụng Supabase free tier)
- ✅ **Không cần server** riêng

---

## 📊 Kiến trúc

```
┌─────────────────┐                    ┌─────────────────┐
│  PC Văn phòng   │ ──── Internet ───▶│                 │
│  (Collector)    │                    │    SUPABASE     │
├─────────────────┤                    │    (Cloud DB)   │
│  PC Nhà riêng   │ ──── Internet ───▶│                 │
│  (Collector)    │                    │  - Free 500MB   │
├─────────────────┤                    │  - Realtime     │
│  PC Khách hàng  │ ──── Internet ───▶│                 │
│  (Collector)    │                    └────────┬────────┘
└─────────────────┘                             │
                                                │
                    ┌───────────────────────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │   Dashboard Web     │
        │   (Xem tu dien      │
        │    thoai/may tinh)  │
        └─────────────────────┘
```

---

## 🚀 Hướng dẫn cài đặt

### Bước 1: Tạo tài khoản Supabase (5 phút)

1. Truy cập: https://supabase.com
2. Click **Start your project** → Đăng ký bằng GitHub/Google
3. Click **New Project**
   - Đặt tên: `pc-monitor`
   - Đặt password database (lưu lại)
   - Chọn region gần nhất (Singapore)
4. Đợi 1-2 phút để tạo project

### Bước 2: Tạo database table (2 phút)

1. Trong Supabase Dashboard, vào **SQL Editor** (menu bên trái)
2. Click **New Query**
3. Copy toàn bộ nội dung file `docs/supabase_schema.sql`
4. Paste vào editor
5. Click **Run** (hoặc Ctrl+Enter)
6. Thấy "Success" là OK!

### Bước 3: Lấy API keys

1. Vào **Settings** (icon bánh răng) → **API**
2. Copy 2 thông tin:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: `eyJhbGci...` (key dài)

### Bước 4: Cấu hình Collector

1. Mở file `collector/config.json`
2. Dán thông tin vừa copy:

```json
{
    "SUPABASE_URL": "https://xxxxx.supabase.co",
    "SUPABASE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "COLLECT_INTERVAL": 30
}
```

3. Save file

### Bước 5: Chạy Collector trên mỗi máy

1. Copy thư mục `collector` vào mỗi máy cần giám sát
2. Chạy `SETUP.bat` (lần đầu)
3. Chạy `START_COLLECTOR.bat`

### Bước 6: Xem Dashboard

**Cách 1: Chạy local**
```bash
cd dashboard
pip install flask
python app.py
# Mở http://127.0.0.1:5555
```

**Cách 2: Deploy lên Vercel/Render (xem bên dưới)**

---

## 🌍 Deploy Dashboard lên Internet

### Option A: Deploy lên Render (Khuyên dùng)

1. Tạo tài khoản: https://render.com

2. Click **New** → **Web Service**

3. Connect GitHub repo (hoặc upload code)

4. Cấu hình:
   - **Name**: `pc-monitor-dashboard`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

5. Thêm **Environment Variables**:
   - `SUPABASE_URL` = your URL
   - `SUPABASE_KEY` = your key

6. Click **Create Web Service**

7. Đợi deploy xong → Có URL dạng: `https://pc-monitor-dashboard.onrender.com`

### Option B: Deploy lên Vercel

1. Tạo file `vercel.json` trong thư mục `dashboard`:
```json
{
  "builds": [{"src": "app.py", "use": "@vercel/python"}],
  "routes": [{"src": "/(.*)", "dest": "app.py"}]
}
```

2. Cài Vercel CLI: `npm i -g vercel`

3. Deploy:
```bash
cd dashboard
vercel --prod
```

4. Thêm Environment Variables trên Vercel Dashboard

---

## 📱 Xem trên điện thoại

Sau khi deploy, bạn có thể:
1. Mở URL dashboard trên trình duyệt điện thoại
2. Add to Home Screen để truy cập nhanh
3. Xem real-time từ bất kỳ đâu!

---

## ⚙️ Cấu hình nâng cao

### Thay đổi tần suất thu thập

Sửa `config.json`:
```json
{
    "COLLECT_INTERVAL": 60  // Thu thập mỗi 60 giây
}
```

**Khuyến nghị:**
- 30s: Giám sát real-time
- 60s: Cân bằng
- 300s (5 phút): Tiết kiệm quota

### Giới hạn Supabase Free Tier

| Resource | Giới hạn | Đủ cho |
|----------|----------|--------|
| Database | 500MB | ~10 triệu records |
| API requests | 50K/tháng | ~23 máy x 30s interval |
| Bandwidth | 2GB/tháng | Đủ dùng |

---

## 🔧 Troubleshooting

### "Could not connect to Supabase"
- Kiểm tra URL và Key trong config.json
- Đảm bảo đã chạy SQL schema
- Kiểm tra kết nối Internet

### "Permission denied"
- Vào Supabase → Table Editor → metrics
- Click ⋮ → Edit table → Disable RLS (tạm thời để test)

### Collector không gửi được data
- Chạy `python cloud_collector.py` thủ công để xem lỗi
- Kiểm tra firewall có chặn HTTPS không

---

## 📁 Cấu trúc thư mục

```
PC_MONITOR_CLOUD/
├── collector/              # Cài trên mỗi máy cần giám sát
│   ├── cloud_collector.py  # Thu thập và gửi data
│   ├── config.json         # Cấu hình Supabase
│   ├── SETUP.bat          # Cài đặt lần đầu
│   └── START_COLLECTOR.bat # Chạy collector
│
├── dashboard/              # Dashboard web
│   ├── app.py             # Flask server
│   ├── requirements.txt   # Dependencies
│   ├── templates/         # HTML
│   └── static/            # CSS, JS
│
└── docs/
    └── supabase_schema.sql # SQL tạo database
```

---

## 🆘 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console log của collector
2. Kiểm tra Supabase Dashboard → Table Editor → metrics
3. Đảm bảo config.json đúng format JSON

---

**Made with ❤️ by Claude AI**
