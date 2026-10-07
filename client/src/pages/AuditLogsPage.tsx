import React, { useState, useEffect } from 'react';
import {
  History,
  Filter,
  RefreshCw,
  Search,
  FileText,
  User,
  Shield,
  Eye,
  Download,
  Edit3,
  Trash2,
  KeyRound,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Code2,
  X,
  UploadCloud,
  RotateCcw,
  Activity,
  Users
} from 'lucide-react';
import api from '../services/api';

interface AuditLogItem {
  id: number;
  userId?: number;
  userName?: string;
  action: string;
  documentId?: number;
  documentName?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: string;
  details?: any;
  timestamp?: string;
  createdAt?: string;
}

interface StatsData {
  totalLogs: number;
  todayLogs: number;
  activeUsers: number;
}

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({ totalLogs: 0, todayLogs: 0, activeUsers: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/audit-logs/stats');
      if (res.data?.success && res.data.stats) {
        setStats(res.data.stats);
      }
    } catch {
      // Bỏ qua nếu lỗi stats phụ
    }
  };

  const fetchLogs = async (currentPage = page) => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: {
          page: currentPage,
          limit: 20,
          action: actionFilter || undefined,
          status: statusFilter || undefined,
          search: search.trim() || undefined
        }
      });
      if (res.data?.success) {
        setLogs(res.data.logs || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchLogs(1);
  }, [actionFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPage(newPage);
    fetchLogs(newPage);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('DELETE')) {
      return {
        icon: <Trash2 className="w-3 h-3" />,
        label: 'Xóa dữ liệu',
        className: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }
    if (act.includes('RESTORE')) {
      return {
        icon: <RotateCcw className="w-3 h-3" />,
        label: 'Khôi phục',
        className: 'bg-teal-50 text-teal-700 border-teal-200'
      };
    }
    if (act.includes('UPLOAD') || act.includes('CREATE')) {
      return {
        icon: <UploadCloud className="w-3 h-3" />,
        label: act.includes('VERSION') ? 'Tải phiên bản mới' : 'Tạo mới',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (act.includes('PERMISSION')) {
      return {
        icon: <KeyRound className="w-3 h-3" />,
        label: 'Phân quyền',
        className: 'bg-purple-50 text-purple-700 border-purple-200'
      };
    }
    if (act.includes('EDIT') || act.includes('UPDATE')) {
      return {
        icon: <Edit3 className="w-3 h-3" />,
        label: 'Chỉnh sửa',
        className: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    if (act.includes('DOWNLOAD')) {
      return {
        icon: <Download className="w-3 h-3" />,
        label: 'Tải về',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200'
      };
    }
    if (act.includes('VIEW') || act.includes('PREVIEW')) {
      return {
        icon: <Eye className="w-3 h-3" />,
        label: 'Xem văn bản',
        className: 'bg-sky-50 text-sky-700 border-sky-200'
      };
    }
    return {
      icon: <Activity className="w-3 h-3" />,
      label: act,
      className: 'bg-slate-100 text-slate-700 border-slate-200'
    };
  };

  const renderDetailsSummary = (details: any) => {
    if (!details) return <span className="text-slate-400 italic">Không có tham số</span>;
    if (typeof details === 'string') {
      return <span className="text-slate-700 line-clamp-1">{details}</span>;
    }
    if (typeof details === 'object') {
      if (details.changes && typeof details.changes === 'object') {
        const changesText = Object.entries(details.changes)
          .map(([k, v]) => `${k}: ${String(v)}`)
          .join(', ');
        return <span className="text-slate-700 line-clamp-1">Thay đổi: {changesText}</span>;
      }
      if (details.action) {
        return <span className="text-slate-700">Thao tác: {String(details.action)}</span>;
      }
      if (details.fileName || details.docCode) {
        return (
          <span className="text-slate-700 line-clamp-1">
            {details.docCode ? `[${details.docCode}] ` : ''}
            {details.fileName || ''}
          </span>
        );
      }
      const keys = Object.keys(details);
      if (keys.length === 0) return <span className="text-slate-400 italic">-</span>;
      const text = keys
        .slice(0, 2)
        .map((k) => `${k}: ${typeof details[k] === 'object' ? '...' : details[k]}`)
        .join(' | ');
      return <span className="text-slate-700 line-clamp-1">{text}</span>;
    }
    return <span className="text-slate-700 line-clamp-1">{String(details)}</span>;
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Tổng số nhật ký</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{stats.totalLogs.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Thao tác hôm nay</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{stats.todayLogs.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Tài khoản thao tác</div>
            <div className="text-2xl font-bold text-slate-800 mt-0.5">{stats.activeUsers.toLocaleString()}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Card Header & Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-blue-600" />
              Nhật Ký Kiểm Toán (Audit Log)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Ghi nhận minh bạch lịch sử ai thao tác, nội dung thay đổi, thời gian và địa chỉ IP kết nối.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm user, tài liệu, IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white w-48 transition-all"
              />
            </form>

            {/* Action Filter */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="">Tất cả hành động</option>
                <option value="CREATE">Tạo mới (CREATE)</option>
                <option value="EDIT">Chỉnh sửa (EDIT)</option>
                <option value="VIEW">Xem (VIEW)</option>
                <option value="DOWNLOAD">Tải về (DOWNLOAD)</option>
                <option value="UPLOAD_VERSION">Tải phiên bản mới</option>
                <option value="CHANGE_PERMISSION">Đổi quyền / Mật khẩu</option>
                <option value="DELETE">Xóa (DELETE)</option>
                <option value="RESTORE">Khôi phục (RESTORE)</option>
                <option value="LOGIN">Đăng nhập</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="SUCCESS">Thành công</option>
              <option value="FAILED">Thất bại</option>
            </select>

            {/* Refresh */}
            <button
              onClick={() => {
                fetchStats();
                fetchLogs(page);
              }}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Đang tải danh sách nhật ký kiểm toán...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Không tìm thấy bản ghi hoạt động nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-3.5">Người thực hiện</th>
                  <th className="py-3 px-3.5">Hành động</th>
                  <th className="py-3 px-3.5">Văn bản / Đối tượng</th>
                  <th className="py-3 px-4">Chi tiết thao tác</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const isSuccess = (log.status || 'SUCCESS').toUpperCase() === 'SUCCESS';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Thời gian */}
                      <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-500">
                        {formatDate(log.timestamp || log.createdAt)}
                      </td>

                      {/* Người thực hiện & IP */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                            {(log.userName || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{log.userName || 'Hệ thống'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.ipAddress || '127.0.0.1'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Hành động */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badge.className}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>

                      {/* Đối tượng */}
                      <td className="py-3 px-3.5 max-w-xs">
                        {log.documentName && log.documentName !== 'N/A' ? (
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate" title={log.documentName}>
                              {log.documentName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Hệ thống chung</span>
                        )}
                      </td>

                      {/* Chi tiết thao tác */}
                      <td className="py-3 px-4 text-[11px] max-w-sm">
                        {renderDetailsSummary(log.details)}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Thành công
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Thất bại
                          </span>
                        )}
                      </td>

                      {/* Xem chi tiết JSON */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Xem dữ liệu gốc"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-semibold text-slate-700">{logs.length}</span> /{' '}
            <span className="font-semibold text-slate-700">{pagination.total}</span> bản ghi
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 text-xs font-medium text-slate-700">
              Trang {pagination.page} / {pagination.totalPages || 1}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON / Chi tiết Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Chi Tiết Bản Ghi Kiểm Toán #{selectedLog.id}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400">Thời gian:</span>
                  <p className="font-semibold text-slate-700">
                    {formatDate(selectedLog.timestamp || selectedLog.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Người thực hiện:</span>
                  <p className="font-semibold text-slate-700">{selectedLog.userName || 'Hệ thống'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Hành động:</span>
                  <p className="font-semibold text-slate-700">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-400">Địa chỉ IP:</span>
                  <p className="font-semibold font-mono text-slate-700">{selectedLog.ipAddress || '127.0.0.1'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Đối tượng:</span>
                  <p className="font-semibold text-slate-700">{selectedLog.documentName || 'N/A'}</p>
                </div>
                {selectedLog.userAgent && (
                  <div className="col-span-2">
                    <span className="text-slate-400">Trình duyệt / Ứng dụng:</span>
                    <p className="text-[11px] text-slate-600 truncate">{selectedLog.userAgent}</p>
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-500 font-semibold block mb-1">Dữ liệu chi tiết (Payload / Details):</span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto max-h-56">
                  {selectedLog.details
                    ? JSON.stringify(selectedLog.details, null, 2)
                    : 'Không có dữ liệu chi tiết'}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
