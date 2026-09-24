import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Clock,
  AlertTriangle,
  Archive,
  Building2,
  Tag,
  Bell,
  History,
  UserCog,
  Shield,
  Settings,
  ChevronDown,
  ChevronRight,
  HardDrive,
  FolderLock,
  Briefcase,
  Trash2,
  Network,
  X,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onClose }) => {
  const location = useLocation();
  const [stats, setStats] = useState<{ totalStorageBytes: number; totalFiles: number }>({
    totalStorageBytes: 0,
    totalFiles: 0,
  });

  // Collapsible submenus
  const [docMenuOpen, setDocMenuOpen] = useState(true);
  const [adminMenuOpen, setAdminMenuOpen] = useState(true);
  const [crmMenuOpen, setCrmMenuOpen] = useState(false);

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

  const isDocActive = location.pathname.startsWith('/documents');

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
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-base leading-tight tracking-tight flex items-center gap-1.5">
                KTS DMS
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-1.5 py-0.5 rounded border border-blue-500/30">
                  CRM
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" /> Quản Lý Tài Liệu
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto text-xs">
          {/* Dashboard */}
          <NavLink
            to="/"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-colors ${
                isActive && location.pathname === '/'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard (Tổng quan)</span>
          </NavLink>

          {/* Module 1: Quản lý Tài liệu & Data Room */}
          <div className="pt-2">
            <div
              onClick={() => setDocMenuOpen(!docMenuOpen)}
              className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer rounded-lg hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Tài liệu & Data Room</span>
              </div>
              {docMenuOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>

            {docMenuOpen && (
              <div className="pl-3 mt-1 space-y-0.5 border-l border-slate-800 ml-3">
                <NavLink
                  to="/documents"
                  end
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${
                      isActive && !location.search
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <FolderLock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tất cả tài liệu & Thư mục</span>
                </NavLink>

                <NavLink
                  to="/documents?tab=my_docs"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${
                      location.search.includes('tab=my_docs')
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span>Tài liệu của tôi</span>
                </NavLink>

                <NavLink
                  to="/documents?tab=expiring"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${
                      location.search.includes('tab=expiring')
                        ? 'bg-amber-600 text-white font-bold shadow-xs'
                        : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sắp hết hạn</span>
                </NavLink>

                <NavLink
                  to="/documents?tab=liquidated"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${
                      location.search.includes('tab=liquidated')
                        ? 'bg-slate-700 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Đã nghiệm thu / Thanh lý</span>
                </NavLink>

                <NavLink
                  to="/recycle-bin"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-rose-600 text-white font-bold shadow-xs'
                        : 'text-rose-400/90 hover:text-rose-300 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Thùng rác</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Module: Danh mục & Phân loại */}
          <div className="pt-2">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Phân loại & Tổ chức
            </div>
            <NavLink
              to="/departments"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>Phòng ban</span>
            </NavLink>

            <NavLink
              to="/document-types"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Loại tài liệu</span>
            </NavLink>
          </div>

          {/* Module: Quản trị & Bảo mật */}
          <div className="pt-2">
            <div
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
              className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer rounded-lg hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Quản trị & Bảo mật</span>
              </div>
              {adminMenuOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>

            {adminMenuOpen && (
              <div className="pl-3 mt-1 space-y-0.5 border-l border-slate-800 ml-3">
                <NavLink
                  to="/users"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <UserCog className="w-3.5 h-3.5 text-purple-400" />
                  <span>Quản lý Người dùng</span>
                </NavLink>

                <NavLink
                  to="/audit-logs"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nhật ký Audit Log</span>
                </NavLink>

                <NavLink
                  to="/settings"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cấu hình & Cảnh báo</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Module: CRM Khách hàng */}
          <div className="pt-2">
            <div
              onClick={() => setCrmMenuOpen(!crmMenuOpen)}
              className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 cursor-pointer rounded-lg hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-cyan-500" />
                <span>Khách hàng CRM</span>
              </div>
              {crmMenuOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>

            {crmMenuOpen && (
              <div className="pl-3 mt-1 space-y-0.5 border-l border-slate-800 ml-3">
                <NavLink
                  to="/crm"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Khách hàng & Deals</span>
                </NavLink>

                <NavLink
                  to="/system-overview"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Network className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sơ đồ hệ thống</span>
                </NavLink>
              </div>
            )}
          </div>
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
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{stats.totalFiles} tệp đã lưu trữ</span>
            <span className="text-emerald-400">DMS Bảo mật</span>
          </div>
        </div>
      </aside>
    </>
  );
};
