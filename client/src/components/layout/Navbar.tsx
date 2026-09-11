import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Network,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

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

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">KTS CRM</h1>
        <span className="text-xs text-slate-400 hidden sm:inline">•</span>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">Hệ thống Quản lý Dữ liệu Doanh nghiệp</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Nút chuyển nhanh đến Xem Tổng Quát (Tech Map) */}
        <Link
          to="/system-overview"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          title="Xem sơ đồ cấu trúc tổng quát hệ thống"
        >
          <Network className="w-3.5 h-3.5" />
          <span>Xem tổng quát (Tech Map)</span>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-800">Thông báo hoạt động</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-blue-600 hover:underline font-medium"
                  >
                    Đã đọc tất cả
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-600">Không có thông báo mới</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs hover:bg-slate-50 transition-colors ${
                        !n.isRead ? 'bg-blue-50/50 font-medium' : ''
                      }`}
                    >
                      <div className="text-slate-800 font-semibold">{n.title}</div>
                      <div className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</div>
                      <div className="text-[10px] text-slate-600 mt-1">
                        {new Date(n.createdAt).toLocaleTimeString('vi-VN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* Current User Info */}
        <div className="flex items-center gap-2.5">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-300"
          />
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold text-slate-800 leading-tight">{user?.fullName}</div>
            <div className="text-[11px] text-slate-600 font-medium">{user?.role}</div>
          </div>
          <button
            onClick={logout}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
