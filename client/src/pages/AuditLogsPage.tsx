import React, { useState, useEffect } from 'react';
import { History, Shield, Filter, Search, User } from 'lucide-react';
import api from '../services/api';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: { action: actionFilter || undefined, limit: 50 },
      });
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const getBadgeColor = (action: string) => {
    if (action.includes('DELETE')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (action.includes('RESTORE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('UPLOAD') || action.includes('CREATE'))
      return 'bg-blue-50 text-blue-700 border-blue-200';
    if (action.includes('PERMISSION')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" /> Nhật Ký Hoạt Động (Audit Log)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận thời gian thực mọi thao tác tạo, sửa, xóa, di chuyển, upload, download và phân quyền.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
          >
            <option value="">Tất cả loại hành động</option>
            <option value="FILE_UPLOAD">FILE_UPLOAD (Tải lên)</option>
            <option value="FILE_DOWNLOAD">FILE_DOWNLOAD (Tải về)</option>
            <option value="FILE_PREVIEW">FILE_PREVIEW (Xem trực tiếp)</option>
            <option value="FILE_VERSION_NEW">FILE_VERSION_NEW (Phiên bản mới)</option>
            <option value="FILE_RESTORE_VERSION">FILE_RESTORE_VERSION (Hoàn tác)</option>
            <option value="FILE_DELETE">FILE_DELETE (Xóa file)</option>
            <option value="FOLDER_CREATE">FOLDER_CREATE (Tạo folder)</option>
            <option value="FOLDER_MOVE">FOLDER_MOVE (Di chuyển)</option>
            <option value="FOLDER_DELETE">FOLDER_DELETE (Xóa folder)</option>
            <option value="PERMISSION_GRANT">PERMISSION_GRANT (Cấp quyền)</option>
            <option value="PERMISSION_REVOKE">PERMISSION_REVOKE (Thu hồi quyền)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-3">Người thực hiện</th>
                <th className="py-3 px-3">Hành động</th>
                <th className="py-3 px-3">Đối tượng</th>
                <th className="py-3 px-4">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-bold text-slate-800">{log.user?.fullName || 'Hệ thống'}</div>
                    <div className="text-[11px] text-slate-400">{log.user?.role}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getBadgeColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-800">
                      {log.file?.name || log.folder?.name || '-'}
                    </div>
                    {log.folder && (
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{log.folder.path}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px] max-w-md truncate">
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
