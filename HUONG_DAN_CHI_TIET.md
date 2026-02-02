#  PC Monitor Pro - Cloud Version

## HƯỚNG DẪN CÀI ĐẶT CHI TIẾT (Từng bước có hình)

---

# PHẦN 1: TẠO DATABASE TRÊN SUPABASE (10 phút)

## Bước 1.1: Đăng ký tài khoản Supabase

1. Mở trình duyệt, truy cập: **https://supabase.com**

2. Click nút **"Start your project"** (màu xanh lá)

3. Chọn cách đăng ký:
   - **Continue with GitHub** (nhanh nhất nếu có GitHub)
   - **Continue with Google** (dùng tài khoản Google)
   - Hoặc điền email + password

4. Xác nhận email nếu được yêu cầu

---

## Bước 1.2: Tạo Project mới

1. Sau khi đăng nhập, click **"New Project"**

2. Điền thông tin:
   ```
   Name:           pc-monitor
   Database Password:  [Đặt password mạnh, VD: MyPass123!@#]
   Region:         Southeast Asia (Singapore) - gần VN nhất
   ```
   
   ⚠️ **QUAN TRỌNG**: Lưu lại Database Password, sẽ cần sau này!

3. Click **"Create new project"**

4. Đợi 1-2 phút để Supabase tạo project (có thanh loading)

---

## Bước 1.3: Tạo bảng Database

1. Ở menu bên trái, click **"SQL Editor"** (icon hình code <>)

2. Click **"New Query"** (góc trên bên phải)

3. Mở file `docs/supabase_schema.sql` trong thư mục đã tải

4. Copy TOÀN BỘ nội dung file đó

5. Paste vào ô editor trong Supabase

6. Click nút **"Run"** (hoặc nhấn Ctrl + Enter)

7. Đợi vài giây, thấy thông báo **"Success. No rows returned"** là OK!

**Kiểm tra**: Vào **Table Editor** (menu trái) → Thấy bảng **metrics** là thành công!

---

## Bước 1.4: Lấy API Keys

1. Click **"Settings"** (icon bánh răng ⚙️ ở menu trái, gần cuối)

2. Click **"API"** trong submenu

3. Tìm và copy 2 thông tin sau:

### Project URL:
```
https://xxxxxxxxxxxxxxxx.supabase.co
```
(Copy cả dòng, bao gồm https://)

### anon public key:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im......
```
(Key rất dài, copy HẾT)

**Lưu 2 thông tin này vào Notepad để dùng sau!**

---

# PHẦN 2: CÀI ĐẶT COLLECTOR TRÊN MỖI MÁY (5 phút/máy)

## Bước 2.1: Chuẩn bị

1. Giải nén file `PC_MONITOR_CLOUD.zip`

2. Vào thư mục `collector`

3. Mở file `config.json` bằng Notepad

## Bước 2.2: Cấu hình Supabase

Thay đổi nội dung file `config.json`:

**TRƯỚC:**
```json
{
    "SUPABASE_URL": "https://YOUR_PROJECT_ID.supabase.co",
    "SUPABASE_KEY": "YOUR_ANON_PUBLIC_KEY",
    "COLLECT_INTERVAL": 30
}
```

**SAU (ví dụ):**
```json
{
    "SUPABASE_URL": "https://abcdefghijkl.supabase.co",
    "SUPABASE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwMDAwMDAwLCJleHAiOjE5NTAwMDAwMDB9.xxxxxxxxxxxx",
    "COLLECT_INTERVAL": 30
}
```

 **CHÚ Ý**:
- Giữ nguyên dấu ngoặc kép `""`
- Không thêm dấu phẩy sau dòng cuối
- COLLECT_INTERVAL = 30 nghĩa là gửi data mỗi 30 giây

4. Save file (Ctrl + S)

## Bước 2.3: Cài đặt lần đầu

1. Double-click file **`SETUP.bat`**

2. Đợi cài đặt xong (cài Python libraries)

3. Thấy "SETUP HOAN TAT!" là OK

## Bước 2.4: Chạy Collector

1. Double-click file **`START_COLLECTOR.bat`**

2. Cửa sổ CMD sẽ hiện ra và bắt đầu thu thập:
   ```
   ==================================================
     PC Monitor Pro - Cloud Collector
   ==================================================
     Computer: LAPTOP-ABC123
     Local IP: 192.168.1.100
     Interval: 30s
     Supabase: https://abcdefgh...
   ==================================================
   
   [OK] [2024-01-25T10:30:00Z] CPU: 25.0% | RAM: 45.0% | Health: 95
   [OK] [2024-01-25T10:30:30Z] CPU: 30.0% | RAM: 48.0% | Health: 92
   ```

3. Để cửa sổ này chạy ngầm (minimize)

## Bước 2.5: Lặp lại cho các máy khác

- Copy thư mục `collector` sang USB hoặc gửi qua mạng
- Cài đặt tương tự trên mỗi máy cần giám sát
- Mỗi máy sẽ tự động gửi data lên cùng 1 database

---

# PHẦN 3: XEM DASHBOARD (3 cách)

## Cách 1: Chạy Dashboard trên máy local

1. Vào thư mục `dashboard`

2. Mở CMD tại đây (gõ `cmd` vào thanh địa chỉ)

3. Chạy các lệnh:
   ```bash
   pip install flask
   python app.py
   ```

4. Trình duyệt tự động mở: http://127.0.0.1:5555

 Cách này chỉ xem được trên máy đang chạy Dashboard

---

## Cách 2: Xem trực tiếp trên Supabase (Đơn giản nhất!)

1. Đăng nhập Supabase Dashboard

2. Vào **Table Editor** → Click bảng **metrics**

3. Xem data real-time ở đây!

4. Dùng **Filter** để lọc theo máy:
   - Click "Filter"
   - Column: `computer_name`
   - Operator: `equals`
   - Value: `TEN-MAY-CUA-BAN`

---

## Cách 3: Deploy Dashboard lên Internet (Xem từ bất kỳ đâu)

### 3A. Deploy lên Render.com (Miễn phí)

**Bước 1: Chuẩn bị code**

Tạo file `render.yaml` trong thư mục `dashboard`:
```yaml
services:
  - type: web
    name: pc-monitor
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app
```

**Bước 2: Upload lên GitHub**

1. Tạo repo mới trên GitHub
2. Upload thư mục `dashboard` lên repo

**Bước 3: Deploy trên Render**

1. Truy cập https://render.com → Đăng ký/Đăng nhập

2. Click **"New +"** → **"Web Service"**

3. Connect GitHub repo vừa tạo

4. Cấu hình:
   ```
   Name:           pc-monitor-dashboard
   Region:         Singapore
   Branch:         main
   Runtime:        Python 3
   Build Command:  pip install -r requirements.txt
   Start Command:  gunicorn app:app
   ```

5. Thêm **Environment Variables**:
   - Click "Environment" 
   - Add:
     ```
     SUPABASE_URL = https://xxxxx.supabase.co
     SUPABASE_KEY = eyJhbGci...
     ```

6. Click **"Create Web Service"**

7. Đợi 3-5 phút deploy

8. Nhận URL dạng: `https://pc-monitor-dashboard.onrender.com`

**Xong!** Mở URL này trên bất kỳ thiết bị nào để xem Dashboard!

---

# PHẦN 4: TỰ ĐỘNG CHẠY KHI KHỞI ĐỘNG WINDOWS

## Cách 1: Thêm vào Startup folder

1. Nhấn `Win + R`

2. Gõ: `shell:startup` → Enter

3. Thư mục Startup mở ra

4. Tạo file `PC_Monitor.bat` trong thư mục này:
   ```batch
   @echo off
   start "" "C:\Path\To\collector\START_COLLECTOR.bat"
   ```
   (Thay path đúng với vị trí file của bạn)

## Cách 2: Dùng Task Scheduler

1. Nhấn `Win`, gõ "Task Scheduler" → Enter

2. Click **"Create Basic Task..."**

3. Điền:
   ```
   Name: PC Monitor Pro
   Description: Auto start PC monitoring
   ```

4. Trigger: **"When the computer starts"**

5. Action: **"Start a program"**

6. Browse đến file `START_COLLECTOR.bat`

7. Finish

---

# PHẦN 5: KIỂM TRA VÀ XỬ LÝ LỖI

## Kiểm tra data đã gửi thành công

1. Vào Supabase Dashboard

2. Click **Table Editor** → **metrics**

3. Nếu thấy data xuất hiện → OK!

4. Refresh trang sau 30 giây, thấy data mới → Collector hoạt động!

## Lỗi thường gặp

### Lỗi: "Could not connect to Supabase"
**Nguyên nhân**: Sai URL hoặc Key
**Cách sửa**: 
- Kiểm tra lại config.json
- Copy lại URL và Key từ Supabase

### Lỗi: "HTTP 401 Unauthorized"
**Nguyên nhân**: Key sai hoặc hết hạn
**Cách sửa**:
- Vào Supabase → Settings → API → Copy lại anon key

### Lỗi: "HTTP 404 Not Found"  
**Nguyên nhân**: Chưa tạo bảng metrics
**Cách sửa**:
- Vào SQL Editor chạy lại file supabase_schema.sql

### Lỗi: "Network error"
**Nguyên nhân**: Không có Internet hoặc bị firewall chặn
**Cách sửa**:
- Kiểm tra kết nối Internet
- Thử tắt firewall tạm thời để test

### Collector chạy nhưng Dashboard không hiện data
**Nguyên nhân**: Dashboard dùng config khác
**Cách sửa**:
- Đảm bảo SUPABASE_URL và SUPABASE_KEY giống nhau ở cả Collector và Dashboard

---

# PHẦN 6: CÁC CÂU HỎI THƯỜNG GẶP

## Q: Có giới hạn số máy không?
**A**: Không! Bạn có thể giám sát bao nhiêu máy tùy thích.

## Q: Free tier của Supabase đủ dùng không?
**A**: Đủ dùng cho:
- ~20 máy với interval 30 giây
- ~50 máy với interval 60 giây
- ~100 máy với interval 5 phút

## Q: Data lưu được bao lâu?
**A**: Mặc định 7 ngày. Sau đó tự động xóa data cũ.

## Q: Có cần mở port trên router không?
**A**: KHÔNG! Collector gửi data qua HTTPS (port 443) - luôn mở sẵn.

## Q: Có thể xem trên điện thoại không?
**A**: CÓ! Sau khi deploy Dashboard lên Render/Vercel, mở URL trên bất kỳ thiết bị nào.

## Q: Data có được mã hóa không?
**A**: CÓ! Tất cả data truyền qua HTTPS được mã hóa SSL/TLS.

---

# TÓM TẮT NHANH

```
1. Tạo tài khoản Supabase.com
2. Tạo project → Chạy SQL schema
3. Copy URL + Key vào config.json
4. Chạy SETUP.bat (1 lần)
5. Chạy START_COLLECTOR.bat (mỗi lần muốn giám sát)
6. Xem data trên Supabase hoặc deploy Dashboard
```

**XONG!** 

---

# LIÊN HỆ HỖ TRỢ

Nếu gặp vấn đề, cung cấp thông tin sau:
- Ảnh chụp màn hình lỗi
- Nội dung file config.json (ẩn key)
- Bạn đang ở bước nào

---

