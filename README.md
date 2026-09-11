# CRM & Data Room Management System (v2 Cloudinary Phân Quyền)

Hệ thống quản lý thư mục và tài liệu Data Room bảo mật cao, tích hợp phân hệ CRM Khách hàng & Cơ hội thương vụ, xây dựng chuẩn theo tài liệu đặc tả `Yeu_cau_he_thong_quan_ly_Folder_Data_Room_v2_Cloudinary_Phan_quyen.docx`.

## 1. Cấu trúc Công nghệ

- **Backend**: Node.js, Express, TypeScript, Prisma ORM (SQLite `dev.db`), Cloudinary SDK, Multer, JWT, bcryptjs.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Axios, React Router v6.
- **Lưu trữ**: Hybrid Storage Engine (Cloudinary Cloud Storage + Local Storage Fallback).
- **Phân quyền**: RBAC (Admin, Staff) kết hợp ACL đa cấp theo vai trò (Owner, Manager, Editor, Downloader, Viewer) và cờ quyền chi tiết (`can_view`, `can_download`, `can_edit`, `can_delete`, `can_share`) có kế thừa thư mục cha -> con và chống vòng lặp (cycle prevention).

## 2. Tài khoản Đăng nhập Kiểm thử

| Vai trò | Email | Mật khẩu | Quyền hạn mô tả |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@dataroom.local` | `Admin@123` | Toàn quyền quản trị hệ thống, cấu hình Cloudinary, xem Audit Log, xóa vĩnh viễn |
| **Nhân viên (Staff)** | `staff@dataroom.local` | `Staff@123` | Quyền Viewer (chỉ xem trực tiếp, không được tải về đối với các tài liệu nội bộ bảo mật) |
| **Trưởng phòng (Manager)** | `manager@dataroom.local` | `Staff@123` | Quyền Editor (chỉnh sửa, tải lên phiên bản mới, khóa check-out tài liệu) |

> 💡 **Mẹo**: Trên thanh điều hướng Navbar có nút **"Đổi User test"** cho phép chuyển đổi tức thì giữa Admin, Staff và Manager để bạn kiểm tra phân quyền thực tế chỉ trong 1 cú click!

## 3. Cách khởi chạy hệ thống

### Cách 1: Chạy bằng file `start.bat`
Click đúp chuột vào file `start.bat` trong thư mục gốc. Script sẽ tự động bật cả Backend API (port 5000) và Frontend Client (port 5173).

### Cách 2: Khởi chạy thủ công từ terminal
1. **Backend**:
   ```bash
   cd server
   npm run dev
   ```
2. **Frontend**:
   ```bash
   cd client
   npm run dev
   ```
3. Mở trình duyệt tại: `http://localhost:5173`

## 4. Các tính năng nổi bật hoàn chỉnh

1. **Dashboard Data Room & CRM**: Thống kê số lượng folder, file, dung lượng lưu trữ, phân bổ theo định dạng file, thư mục gần đây.
2. **Cây thư mục đa cấp**: Xem cây thư mục không giới hạn cấp, kiểm tra trùng tên, chống di chuyển tạo vòng lặp, hiển thị đường dẫn Breadcrumb.
3. **Upload file & Chunked upload**: Upload file trực tiếp hoặc upload theo chunk (chia nhỏ) có thanh tiến trình cho file lớn, tự động đổi tên chống ghi đè nhầm.
4. **Xem trực tiếp (Preview)**: Hỗ trợ xem trực tiếp Ảnh, Video, Âm thanh, PDF, Văn bản Text/CSV/JSON, tài liệu Office DOCX/XLSX.
5. **Quản lý Phiên bản (Versioning)**: Tự động lưu lịch sử các phiên bản `v1`, `v2`, changelog, cho phép xem và hoàn tác (restore) về phiên bản cũ.
6. **Khóa tài liệu (Check-out / Check-in)**: Khóa file khi đang chỉnh sửa để ngăn người khác ghi đè xung đột.
7. **Phân quyền truy cập & Kế thừa**: Cấp quyền cho từng người dùng, chọn role preset (Viewer/Downloader/Editor/Manager/Owner) hoặc tùy chỉnh cờ quyền, hỗ trợ kế thừa quyền xuống thư mục con.
8. **Thùng rác (Recycle Bin)**: Xóa mềm file/folder, kiểm tra thống kê ảnh hưởng trước khi xóa, khôi phục hoặc xóa vĩnh viễn giải phóng dung lượng.
9. **Nhật ký Audit Log**: Ghi nhận toàn bộ thao tác hệ thống với actor, target, timestamp, chi tiết JSON và IP.
10. **Tích hợp CRM**: Quản lý Khách hàng và Deals, tự động tạo Data Room riêng biệt cho từng khách hàng & thương vụ.
11. **Cấu hình Cloudinary**: Giao diện cài đặt Cloud Name, API Key, API Secret trực tiếp trong Settings của Admin.
