import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderLock,
  Files,
  HardDrive,
  FolderPlus,
  UploadCloud,
  History,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  Folder,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/folders/dashboard');
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải dữ liệu tổng quan...</div>;
  }

  const breakdown = stats?.typeBreakdown || {};

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xl font-extrabold tracking-tight">
            Xin chào, {user?.fullName}! 👋
          </div>
          <p className="text-blue-100 text-xs mt-1 max-w-xl leading-relaxed">
            Hệ thống CRM & Data Room bảo mật cao. Quản lý cây thư mục đa cấp, phân quyền chi tiết,
            lịch sử phiên bản và lưu trữ đám mây Cloudinary an toàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dataroom')}
            className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <FolderLock className="w-4 h-4" /> Mở Data Room
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold">Tổng số Thư mục</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{stats?.totalFolders || 0}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Đa cấp không giới hạn
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <FolderLock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold">Tổng số Tài liệu</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{stats?.totalFiles || 0}</div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">
              Phiên bản & Check-out lock
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Files className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold">Dung lượng sử dụng</div>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {formatSize(stats?.totalStorageBytes || 0)}
            </div>
            <div className="text-[11px] text-purple-600 font-medium mt-0.5">
              Cloudinary / Tối ưu hóa
            </div>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-xs font-semibold">Quyền truy cập</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{user?.role}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> ACL Kế thừa & Xác thực
            </div>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Storage Breakdown & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Types Breakdown */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="font-bold text-sm text-slate-800 mb-3 flex items-center justify-between">
            <span>Phân bổ Dung lượng theo Định dạng</span>
            <span className="text-xs text-slate-400 font-normal">Tự động nhận diện</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">Tài liệu & PDF</div>
              <div className="font-bold text-slate-800 text-base mt-0.5">
                {breakdown.documents?.count || 0} tệp
              </div>
              <div className="text-[11px] text-slate-400">{formatSize(breakdown.documents?.bytes || 0)}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">Bảng tính Excel/CSV</div>
              <div className="font-bold text-slate-800 text-base mt-0.5">
                {breakdown.spreadsheets?.count || 0} tệp
              </div>
              <div className="text-[11px] text-slate-400">{formatSize(breakdown.spreadsheets?.bytes || 0)}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">Hình ảnh Media</div>
              <div className="font-bold text-slate-800 text-base mt-0.5">
                {breakdown.images?.count || 0} tệp
              </div>
              <div className="text-[11px] text-slate-400">{formatSize(breakdown.images?.bytes || 0)}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">Video & Âm thanh</div>
              <div className="font-bold text-slate-800 text-base mt-0.5">
                {breakdown.videos?.count || 0} tệp
              </div>
              <div className="text-[11px] text-slate-400">{formatSize(breakdown.videos?.bytes || 0)}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">Tệp nén ZIP/RAR</div>
              <div className="font-bold text-slate-800 text-base mt-0.5">
                {breakdown.archives?.count || 0} tệp
              </div>
              <div className="text-[11px] text-slate-400">{formatSize(breakdown.archives?.bytes || 0)}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500">Định dạng khác</div>
              <div className="font-bold text-slate-800 text-base mt-0.5">
                {breakdown.others?.count || 0} tệp
              </div>
              <div className="text-[11px] text-slate-400">{formatSize(breakdown.others?.bytes || 0)}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="font-bold text-sm text-slate-800 mb-2">Thao tác Nhanh</div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Truy cập nhanh các nghiệp vụ cốt lõi của Data Room và Khách hàng CRM.
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => navigate('/dataroom')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors border border-blue-200"
            >
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4" /> Quản lý Cây Thư mục
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/crm')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors border border-purple-200"
            >
              <div className="flex items-center gap-2">
                <Files className="w-4 h-4" /> Hồ sơ Khách hàng & Deals
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/audit-logs')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors border border-slate-200"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4" /> Xem Nhật ký Audit Log
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Folders & Recent Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Folders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="font-bold text-sm text-slate-800 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Thư mục sử dụng gần đây</span>
            </div>
            <button
              onClick={() => navigate('/dataroom')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Xem tất cả
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recentFolders?.map((f: any) => (
              <div
                key={f.id}
                onClick={() => navigate('/dataroom?folderId=' + f.id)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-lg px-2 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-semibold text-xs text-slate-800">{f.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {f._count?.files || 0} tài liệu • Bởi {f.createdBy?.fullName}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(f.updatedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Files */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="font-bold text-sm text-slate-800 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Files className="w-4 h-4 text-emerald-600" />
              <span>Tài liệu cập nhật gần đây</span>
            </div>
            <button
              onClick={() => navigate('/dataroom')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Xem tất cả
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recentFiles?.map((file: any) => (
              <div
                key={file.id}
                onClick={() => navigate('/dataroom?folderId=' + (file.folder?.id || ''))}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-lg px-2 transition-colors"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Files className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-semibold text-xs text-slate-800 truncate">{file.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Tại: {file.folder?.name || 'Root'} • {formatSize(file.size)}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">
                  {new Date(file.updatedAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
