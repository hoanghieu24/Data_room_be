import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Archive,
  ArrowRight,
  Clock,
  HardDrive,
  Plus,
  Shield,
  FolderLock
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dmsStats, setDmsStats] = useState<any>({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    liquidated: 0,
    warningDays: 30
  });
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [folderStats, setFolderStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dmsRes, folderRes] = await Promise.allSettled([
          api.get('/documents/dashboard-stats'),
          api.get('/folders/dashboard')
        ]);

        if (dmsRes.status === 'fulfilled' && dmsRes.value.data.success) {
          setDmsStats(dmsRes.value.data.stats);
          setExpiringDocs(dmsRes.value.data.expiringDocuments || []);
          setRecentActivities(dmsRes.value.data.recentActivities || []);
        }

        if (folderRes.status === 'fulfilled' && folderRes.value.data.success) {
          setFolderStats(folderRes.value.data.stats);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  const getActionText = (action: string) => {
    const map: any = {
      VIEW: 'xem tài liệu',
      DOWNLOAD: 'tải xuống tài liệu',
      PRINT: 'in ấn tài liệu',
      CREATE: 'tạo mới tài liệu',
      EDIT: 'chỉnh sửa tài liệu',
      DELETE: 'xóa tài liệu',
      SHARE: 'chia sẻ tài liệu',
      CHANGE_PERMISSION: 'cập nhật phân quyền',
      UPLOAD_VERSION: 'tải lên phiên bản mới',
      LOGIN: 'đăng nhập hệ thống'
    };
    return map[action] || action.toLowerCase();
  };

  const getActionBadge = (action: string) => {
    if (action === 'DOWNLOAD') return 'bg-blue-50 text-blue-700';
    if (action === 'CREATE') return 'bg-emerald-50 text-emerald-700';
    if (action === 'EDIT' || action === 'UPLOAD_VERSION') return 'bg-amber-50 text-amber-700';
    if (action === 'DELETE') return 'bg-rose-50 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Đang tải dữ liệu tổng quan...
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Clean Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Xin chào, {user?.fullName || 'Người dùng'} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng quan dữ liệu kho Data Room và tình trạng thời hạn tài liệu doanh nghiệp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/documents')}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Kho tài liệu</span>
          </button>
        </div>
      </div>

      {/* 5 Clean Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Tổng tài liệu */}
        <div
          onClick={() => navigate('/documents')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tổng tài liệu</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{dmsStats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">Toàn bộ hồ sơ</div>
        </div>

        {/* Tài liệu hiệu lực */}
        <div
          onClick={() => navigate('/documents?status=ACTIVE')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Đang hiệu lực</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{dmsStats.active}</div>
          <div className="text-[11px] text-emerald-700/80 mt-1">Đang áp dụng</div>
        </div>

        {/* Tài liệu sắp hết hạn */}
        <div
          onClick={() => navigate('/documents?tab=expiring')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Sắp hết hạn</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{dmsStats.expiring}</div>
          <div className="text-[11px] text-amber-700/80 mt-1">Trong {dmsStats.warningDays || 30} ngày</div>
        </div>

        {/* Tài liệu hết hiệu lực */}
        <div
          onClick={() => navigate('/documents?status=EXPIRED')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Hết hiệu lực</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{dmsStats.expired}</div>
          <div className="text-[11px] text-rose-700/80 mt-1">Quá hạn hiệu lực</div>
        </div>

        {/* Tài liệu đã thanh lý */}
        <div
          onClick={() => navigate('/documents?tab=liquidated')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Đã thanh lý</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-700 mt-2">{dmsStats.liquidated}</div>
          <div className="text-[11px] text-slate-400 mt-1">Nghiệm thu / Lưu kho</div>
        </div>
      </div>

      {/* Main Two Columns: Tài liệu sắp hết hạn & Hoạt động gần đây */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Widget 1: Tài liệu sắp hết hạn */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Tài liệu cần chú ý (Sắp hết hạn)</span>
              </div>
              <button
                onClick={() => navigate('/documents?tab=expiring')}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            {expiringDocs.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
                <div className="font-bold text-slate-700">Tất cả tài liệu đều an toàn</div>
                <p>Không có tài liệu nào sắp hết hạn trong {dmsStats.warningDays || 30} ngày tới.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expiringDocs.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/documents?search=${doc.documentCode}`)}
                    className="py-2.5 px-2 rounded-xl hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                          {doc.documentCode}
                        </span>
                        <div className="font-semibold text-xs text-slate-800 truncate">{doc.name}</div>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        Đối tác: {doc.partnerName || 'Chưa có'} • Phụ trách: {doc.personInCharge || 'Chưa gán'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Còn {doc.daysLeft} ngày
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Widget 2: Hoạt động gần đây */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Hoạt động gần đây</span>
              </div>
              <button
                onClick={() => navigate('/audit-logs')}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Nhật ký chi tiết
              </button>
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Chưa ghi nhận hoạt động gần đây
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentActivities.slice(0, 5).map((act, index) => (
                  <div key={index} className="py-2.5 px-2 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-slate-800">{act.user?.fullName || act.userName || 'Hệ thống'}</span>
                        <span className="text-slate-500">{getActionText(act.action)}</span>
                        {act.documentName && (
                          <span className="font-medium text-blue-600 truncate max-w-[140px]">"{act.documentName}"</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {act.createdAt ? new Date(act.createdAt).toLocaleString('vi-VN') : ''}
                      </span>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${getActionBadge(act.action)}`}>
                      {act.action}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Storage & System Status Bar */}
      {folderStats && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-800">Dung lượng Data Room: </span>
              <span className="font-bold text-blue-600">{formatSize(folderStats.totalStorageBytes)}</span>
              <span className="text-slate-400"> ({folderStats.totalFiles || 0} tệp tin, {folderStats.totalFolders || 0} thư mục)</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Cloud Storage Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Phân quyền RBAC & ACL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
