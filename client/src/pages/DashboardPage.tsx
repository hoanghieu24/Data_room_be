import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Archive,
  History,
  FolderLock,
  ArrowRight,
  TrendingUp,
  Clock,
  User,
  Shield,
  Download,
  Printer,
  Edit2,
  HardDrive
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
      VIEW: 'đã xem tài liệu',
      DOWNLOAD: 'đã tải xuống tài liệu',
      PRINT: 'đã in ấn tài liệu',
      CREATE: 'đã tạo mới tài liệu',
      EDIT: 'đã chỉnh sửa tài liệu',
      DELETE: 'đã xóa tài liệu',
      SHARE: 'đã chia sẻ tài liệu',
      CHANGE_PERMISSION: 'đã cập nhật phân quyền',
      UPLOAD_VERSION: 'đã tải lên phiên bản mới',
      LOGIN: 'đã đăng nhập hệ thống'
    };
    return map[action] || action.toLowerCase();
  };

  const getActionBadge = (action: string) => {
    if (action === 'DOWNLOAD') return 'bg-blue-100 text-blue-700';
    if (action === 'PRINT') return 'bg-indigo-100 text-indigo-700';
    if (action === 'CREATE') return 'bg-emerald-100 text-emerald-700';
    if (action === 'EDIT' || action === 'UPLOAD_VERSION') return 'bg-amber-100 text-amber-700';
    if (action === 'DELETE') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Đang tải dữ liệu tổng quan...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xl font-extrabold tracking-tight">
            Xin chào, {user?.fullName}! 👋
          </div>
          <p className="text-blue-100 text-xs mt-1 max-w-xl leading-relaxed">
            Hệ thống Quản lý & Lưu trữ Tài liệu (DMS) tích hợp CRM. Theo dõi hiệu lực văn bản, nhắc nhở sắp hết hạn và quản lý phân quyền bảo mật.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/documents')}
            className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Danh sách tài liệu
          </button>
        </div>
      </div>

      {/* 5 DMS Status Metric Cards (Section 15) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Tổng tài liệu */}
        <div
          onClick={() => navigate('/documents')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tổng tài liệu</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{dmsStats.total}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Tất cả văn bản
          </div>
        </div>

        {/* Tài liệu hiệu lực */}
        <div
          onClick={() => navigate('/documents?status=ACTIVE')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Hiệu lực</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{dmsStats.active}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Đang áp dụng
          </div>
        </div>

        {/* Tài liệu sắp hết hạn */}
        <div
          onClick={() => navigate('/documents?tab=expiring')}
          className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
            <span>Sắp hết hạn</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{dmsStats.expiring}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Trong vòng {dmsStats.warningDays || 30} ngày
          </div>
        </div>

        {/* Tài liệu hết hiệu lực */}
        <div
          onClick={() => navigate('/documents?status=EXPIRED')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Hết hiệu lực</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{dmsStats.expired}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Đã quá thời hạn
          </div>
        </div>

        {/* Tài liệu đã thanh lý */}
        <div
          onClick={() => navigate('/documents?tab=liquidated')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-400 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Đã thanh lý</span>
            <Archive className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-700 mt-2">{dmsStats.liquidated}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Đã nghiệm thu / Lưu kho
          </div>
        </div>
      </div>

      {/* Main Two Columns: Tài liệu sắp hết hạn & Hoạt động gần đây (Section 15) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Tài liệu sắp hết hạn (5-10 tài liệu gần hết hạn nhất) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Tài liệu sắp hết hạn (Cần chú ý)</span>
              </div>
              <button
                onClick={() => navigate('/documents?tab=expiring')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Xem tất cả
              </button>
            </div>

            {expiringDocs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <div className="font-bold text-slate-700">Tuyệt vời!</div>
                <p>Không có tài liệu nào sắp hết hạn trong {dmsStats.warningDays || 30} ngày tới.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expiringDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/documents?search=${doc.documentCode}`)}
                    className="py-2.5 px-2 rounded-xl hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {doc.documentCode}
                        </span>
                        <div className="font-bold text-xs text-slate-900 truncate">{doc.name}</div>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 truncate">
                        <span>Đối tác: {doc.partnerName}</span>
                        <span>• Phụ trách: {doc.personInCharge}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Còn {doc.daysLeft} ngày
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(doc.expiryDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Widget 2: Hoạt động gần đây (Section 15: Ví dụ: 09:32 Nguyễn Văn A tải Hợp đồng ABC) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>Hoạt động gần đây (Audit Log)</span>
              </div>
              <button
                onClick={() => navigate('/audit-logs')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Nhật ký đầy đủ
              </button>
            </div>

            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Chưa ghi nhận hoạt động nào gần đây.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentActivities.map((act) => (
                  <div key={act.id} className="py-2.5 px-2 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                        {act.userName.charAt(0)}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-slate-800">{act.userName} </span>
                        <span className="text-slate-600">{getActionText(act.action)} </span>
                        {act.documentTitle && (
                          <span className="font-bold text-slate-900 italic truncate">
                            "{act.documentTitle}"
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getActionBadge(act.action)}`}>
                        {act.action}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(act.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CRM & Storage Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/crm')}
          className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl hover:bg-purple-100/70 transition-colors cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-purple-900">Module CRM: Khách hàng & Deals</div>
            <div className="text-[11px] text-purple-700 mt-0.5">Theo dõi hồ sơ thương vụ & Data Room riêng</div>
          </div>
          <ArrowRight className="w-4 h-4 text-purple-600" />
        </div>

        <div
          onClick={() => navigate('/dataroom')}
          className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl hover:bg-blue-100/70 transition-colors cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-blue-900">Cây Thư Mục Data Room</div>
            <div className="text-[11px] text-blue-700 mt-0.5">Khám phá cấu trúc thư mục phân cấp</div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-600" />
        </div>

        <div
          onClick={() => navigate('/settings')}
          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-bold text-slate-800">Cấu hình Hệ thống & Cảnh báo</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Điều chỉnh số ngày sắp hết hạn ({dmsStats.warningDays} ngày)</div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600" />
        </div>
      </div>
    </div>
  );
};
