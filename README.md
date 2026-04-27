# PC Monitor Pro - Cloud Version v3.0

**Giám sát máy tính từ xa qua Internet**

---

## Tổng quan

Phiên bản Cloud cho phép giám sát nhiều máy tính từ các địa điểm khác nhau:
- Giám sát từ khác mạng LAN
- Truy cập dashboard từ mọi thiết bị
- Sử dụng hoàn toàn miễn phí (Supabase free tier)
- Không cần tự dựng server

---

## Kiến trúc hệ thống

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
        │   (Xem từ điện      │
        │    thoại/máy tính)  │
        └─────────────────────┘
```

---

## Hướng dẫn cài đặt

### 1. Tạo tài khoản Supabase

Truy cập https://supabase.com và tạo project mới:

- Đăng ký bằng GitHub hoặc Google
- Tạo project với tên tùy chọn (ví dụ: `pc-monitor`)
- Chọn region gần nhất (khuyến nghị Singapore cho VN)
- Lưu lại database password

Thời gian: khoảng 5 phút

### 2. Tạo database schema

Trong Supabase Dashboard:

1. Mở **SQL Editor** từ menu bên trái
2. Tạo query mới
3. Copy nội dung file `docs/supabase_schema.sql` vào editor
4. Chạy query (Ctrl+Enter)

### 3. Lấy API credentials

Vào **Settings** → **API** và copy:
- Project URL: `https://xxxxx.supabase.co`
- anon public key: chuỗi token bắt đầu bằng `eyJhbGci...`

### 4. Cấu hình Collector

Sửa file `collector/config.json`:

```json
{
    "SUPABASE_URL": "https://xxxxx.supabase.co",
    "SUPABASE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "COLLECT_INTERVAL": 30
}
```

### 5. Cài đặt Collector trên từng máy

Copy thư mục `collector` vào máy cần giám sát, sau đó:

1. Chạy `SETUP.bat` (chỉ lần đầu)
2. Chạy `START_COLLECTOR.bat`

### 6. Chạy Dashboard

**Local:**
```bash
cd dashboard
pip install flask
python app.py
```
Truy cập: http://127.0.0.1:5555

**Production:** xem phần Deploy bên dưới

---

## Deploy Dashboard

### Deploy lên Render

1. Đăng ký tài khoản tại https://render.com
2. Tạo Web Service mới:
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
3. Thêm Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
4. Deploy và nhận URL dạng: `https://pc-monitor-dashboard.onrender.com`

### Deploy lên Vercel

Tạo file `vercel.json`:
```json
{
  "builds": [{"src": "app.py", "use": "@vercel/python"}],
  "routes": [{"src": "/(.*)", "dest": "app.py"}]
}
```

Sau đó:
```bash
npm i -g vercel
cd dashboard
vercel --prod
```

Cấu hình Environment Variables trên Vercel Dashboard.

---

## Truy cập trên mobile

Sau khi deploy, mở URL dashboard trên trình duyệt mobile và thêm vào Home Screen để truy cập nhanh.

---

## Cấu hình nâng cao

### Điều chỉnh tần suất thu thập

Sửa `config.json`:
```json
{
    "COLLECT_INTERVAL": 60  
}
```

Khuyến nghị:
- 30 giây: real-time
- 60 giây: cân bằng
- 300 giây: tiết kiệm quota

### Giới hạn Supabase Free Tier

| Tài nguyên | Giới hạn | Ghi chú |
|----------|----------|--------|
| Database | 500MB | ~10 triệu records |
| API requests | 50K/tháng | ~23 máy với interval 30s |
| Bandwidth | 2GB/tháng | Đủ cho hầu hết use case |

---

## Xử lý lỗi thường gặp

**Không kết nối được Supabase:**
- Kiểm tra URL và Key trong config.json
- Đảm bảo đã chạy SQL schema
- Xác nhận kết nối Internet

**Permission denied:**
- Vào Supabase → Table Editor → metrics
- Tạm thời disable RLS để test

**Collector không gửi data:**
- Chạy `python cloud_collector.py` để xem log chi tiết
- Kiểm tra firewall

---

## Cấu trúc thư mục

```
PC_MONITOR_CLOUD/
├── collector/
│   ├── cloud_collector.py
│   ├── config.json
│   ├── SETUP.bat
│   └── START_COLLECTOR.bat
│
├── dashboard/
│   ├── app.py
│   ├── requirements.txt
│   ├── templates/
│   └── static/
│
└── docs/
    └── supabase_schema.sql
```

---

## Hỗ trợ

Nếu gặp vấn đề:
1. Xem console log của collector
2. Kiểm tra data trong Supabase Table Editor
3. Xác nhận config.json đúng format JSON