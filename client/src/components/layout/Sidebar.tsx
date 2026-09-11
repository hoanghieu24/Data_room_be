import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderLock,
  UserCog,
  Briefcase,
  Trash2,
  History,
  Settings,
  HardDrive,
  ShieldCheck,
  Network,
  X,
} from 'lucide-react';
import api from '../../services/api';

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onClose }) => {
  const [stats, setStats] = useState<{ totalStorageBytes: number; totalFiles: number }>({
    totalStorageBytes: 0,
    totalFiles: 0,
  });

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const res = await api.get('/folders/dashboard');
        if (res.data.success) {
          setStats({
            totalStorageBytes: res.data.stats.totalStorageBytes || 0,
            totalFiles: res.data.stats.totalFiles || 0,
          });
        }
      } catch (e) {}
    };
    fetchStorage();
  }, []);

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  const navItems = [
    { to: '/', label: 'Bảng điều khiển', icon: LayoutDashboard },
    { to: '/system-overview', label: 'Xem tổng quát (Tech Map)', icon: Network, isTech: true },
    { to: '/dataroom', label: 'Data Room / Thư mục', icon: FolderLock },
    { to: '/users', label: 'Quản lý người dùng', icon: UserCog },
    { to: '/crm', label: 'Khách hàng & Deals', icon: Briefcase },
    { to: '/recycle-bin', label: 'Thùng rác', icon: Trash2 },
    { to: '/audit-logs', label: 'Nhật ký hoạt động', icon: History },
    { to: '/settings', label: 'Cài đặt Cloudinary', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-50 select-none transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-base leading-tight tracking-tight flex items-center gap-1.5">
                KTS CRM
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-1.5 py-0.5 rounded border border-blue-500/30">
                  PRO
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" /> Hệ thống Dữ liệu
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Hệ thống Quản lý
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <div className="flex items-center justify-between flex-1">
                  <span>{item.label}</span>
                  {item.isTech && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 tracking-wider">
                      Map
                    </span>
                  )}
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Storage Meter Widget */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs mb-1.5 text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Dung lượng lưu trữ
            </span>
            <span className="text-blue-400 font-semibold">{formatSize(stats.totalStorageBytes)}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full"
              style={{ width: Math.min(100, Math.max(8, (stats.totalStorageBytes / (1024 * 1024 * 50)) * 100)) + '%' }}
            ></div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{stats.totalFiles} tài liệu lưu trữ</span>
            <span className="text-emerald-400">An toàn & mã hóa</span>
          </div>
        </div>
      </aside>
    </>
  );
};
