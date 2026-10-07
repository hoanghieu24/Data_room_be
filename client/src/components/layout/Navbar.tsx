import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Menu,
  Shield,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout, login } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAsRead = async (id?: number) => {
    try {
      await api.put('/notifications/read', { id });
      fetchNotifs();
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      fetchNotifs();
    } catch (e) {}
  };

  // Quick switch test accounts
  const handleQuickSwitchUser = async (email: string, pass: string) => {
    try {
      await login(email, pass);
      setShowUserMenu(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      {/* Left side: Hamburger button + Breadcrumbs / Title */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 text-sm tracking-tight">
            KTS Cloud Data Room
          </span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Hệ thống Quản lý Hồ sơ & Phân quyền Doanh nghiệp
          </span>
        </div>
      </div>

      {/* Right side: Notifications, Quick Role Switcher, User profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative transition-colors cursor-pointer"
            title="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">Thông báo hoạt động</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Đã đọc tất cả
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Không có thông báo mới</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs hover:bg-slate-50 transition-colors ${
                        !n.isRead ? 'bg-blue-50/40 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-slate-800 leading-snug">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="text-[10px] text-blue-600 hover:underline shrink-0"
                          >
                            Đã đọc
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-slate-200 mx-1"></div>

        {/* User Profile Dropdown & Quick Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-left"
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
            />
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.fullName || 'Người dùng'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {user?.role === 'ADMIN' ? 'Quản trị viên' : user?.role === 'MANAGER' ? 'Trưởng phòng' : 'Nhân viên'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="font-semibold text-xs text-slate-900">{user?.fullName}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    <Shield className="w-3 h-3 text-blue-500" /> Vai trò: {user?.role}
                  </span>
                </div>
              </div>

              {/* Quick switch test accounts */}
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Đổi User kiểm thử:
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px]">
                  <button
                    onClick={() => handleQuickSwitchUser('admin@dataroom.local', 'Admin@123')}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium text-center transition-colors cursor-pointer"
                    title="Đổi sang tài khoản Admin"
                  >
                    Admin
                  </button>
                  <button
                    onClick={() => handleQuickSwitchUser('manager@dataroom.local', 'Staff@123')}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium text-center transition-colors cursor-pointer"
                    title="Đổi sang tài khoản Manager"
                  >
                    Manager
                  </button>
                  <button
                    onClick={() => handleQuickSwitchUser('staff@dataroom.local', 'Staff@123')}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium text-center transition-colors cursor-pointer"
                    title="Đổi sang tài khoản Staff"
                  >
                    Staff
                  </button>
                </div>
              </div>

              {/* Action Links */}
              <div className="pt-1">
                <Link
                  to="/system-overview"
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                >
                  <span>Sơ đồ hệ thống (Tech Map)</span>
                </Link>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
