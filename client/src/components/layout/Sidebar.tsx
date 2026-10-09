import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderLock,
  Trash2,
  Building2,
  Tag,
  Briefcase,
  Users,
  History,
  Settings,
  Network,
  HardDrive,
  X,
  FileText
} from 'lucide-react';
import api from '../../services/api';

interface SidebarProps {
  isOpen?: boolean;
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen: propIsOpen, isMobileOpen = false, onClose }) => {
  const isOpen = propIsOpen !== undefined ? propIsOpen : isMobileOpen;
  const location = useLocation();
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

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white font-semibold shadow-xs'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800/80 z-50 select-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FolderLock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-tight tracking-tight flex items-center gap-1.5">
                KTS Data Room
                <span className="text-[10px] bg-blue-500/15 text-blue-400 font-semibold px-1.5 py-0.2 rounded border border-blue-500/30">
                  v2
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Quản lý Dữ liệu Doanh nghiệp
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng / Thu gọn menu bên trái"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {/* Group 1: Tổng quan */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Tổng quan
            </div>
            <div className="space-y-1">
              <NavLink
                to="/"
                onClick={onClose}
                className={({ isActive }) => navItemClass(isActive && location.pathname === '/')}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
            </div>
          </div>

          {/* Group 2: Dữ liệu & Tài liệu */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Kho tài liệu
            </div>
            <div className="space-y-1">
              <NavLink
                to="/documents"
                onClick={onClose}
                className={({ isActive }) => navItemClass(isActive || location.pathname.startsWith('/documents'))}
              >
                <FileText className="w-4 h-4" />
                <span>Kho tài liệu & Thư mục</span>
              </NavLink>

              <NavLink
                to="/recycle-bin"
                onClick={onClose}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <Trash2 className="w-4 h-4" />
                <span>Thùng rác</span>
              </NavLink>
            </div>
          </div>

          {/* Group 3: Tổ chức & CRM */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Tổ chức & Đối tác
            </div>
            <div className="space-y-1">
              <NavLink
                to="/departments"
                onClick={onClose}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <Building2 className="w-4 h-4" />
                <span>Phòng ban</span>
              </NavLink>

              <NavLink
                to="/document-types"
                onClick={onClose}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <Tag className="w-4 h-4" />
                <span>Loại tài liệu</span>
              </NavLink>

              <NavLink
                to="/crm"
                onClick={onClose}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <Briefcase className="w-4 h-4" />
                <span>Khách hàng & Deals</span>
              </NavLink>
            </div>
          </div>

          {/* Group 4: Quản trị hệ thống */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Hệ thống & Cấu hình
            </div>
            <div className="space-y-1">
              <NavLink
                to="/users"
                onClick={onClose}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <Users className="w-4 h-4" />
                <span>Người dùng</span>
              </NavLink>

              <NavLink
                to="/audit-logs"
                onClick={onClose}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <History className="w-4 h-4" />
                <span>Nhật ký Audit Log</span>
              </NavLink>

              <NavLink
                to="/settings"
                onClick={onClose}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <Settings className="w-4 h-4" />
                <span>Cấu hình lưu trữ</span>
              </NavLink>

              <NavLink
                to="/system-overview"
                onClick={onClose}
                className={({ isActive }) => navItemClass(isActive)}
              >
                <Network className="w-4 h-4" />
                <span>Sơ đồ hệ thống</span>
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Storage Meter Widget */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center justify-between text-xs mb-2 text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Lưu trữ
            </span>
            <span className="text-blue-400 font-semibold">{formatSize(stats.totalStorageBytes)}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: Math.min(100, Math.max(8, (stats.totalStorageBytes / (1024 * 1024 * 50)) * 100)) + '%' }}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{stats.totalFiles} tệp tin</span>
            <span className="text-emerald-400 font-medium">Cloud Secure</span>
          </div>
        </div>
      </aside>
    </>
  );
};
