@echo off
chcp 65001 > nul
echo ======================================================
echo   CRM & DATA ROOM ENTERPRISE SYSTEM v2 (Cloudinary)
echo ======================================================
echo.
echo Đang khởi động Backend API (Port 5000)...
start "Backend Server (Port 5000)" cmd /k "cd server && npm run dev"

timeout /t 3 /nobreak > nul

echo Đang khởi động Frontend UI (Port 5173)...
start "Frontend Client (Port 5173)" cmd /k "cd client && npm run dev"

echo.
echo ======================================================
echo   Hệ thống đã sẵn sàng!
echo   - Giao diện Web: http://localhost:5173
echo   - API Backend:   http://localhost:5000
echo.
echo   Tài khoản đăng nhập kiểm thử:
echo   - Admin (Quản trị):      admin@dataroom.local   / Admin@123
echo   - Staff (Nhân viên):     staff@dataroom.local   / Staff@123
echo   - Manager (Trưởng phòng): manager@dataroom.local / Staff@123
echo ======================================================
pause
