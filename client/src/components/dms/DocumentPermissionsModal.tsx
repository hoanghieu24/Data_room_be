import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Building2,
  UserCheck,
  Plus,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface DocumentPermissionsModalProps {
  documentId: number | null;
  documentTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onPermissionsUpdated?: () => void;
}

export const DocumentPermissionsModal: React.FC<DocumentPermissionsModalProps> = ({
  documentId,
  documentTitle,
  isOpen,
  onClose,
  onPermissionsUpdated
}) => {
  const { toast } = useToast();

  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lists for dropdown
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Form states
  const [targetType, setTargetType] = useState<'USER' | 'DEPARTMENT'>('DEPARTMENT');
  const [targetId, setTargetId] = useState<number | ''>('');
  const [permissionLevel, setPermissionLevel] = useState<'VIEW' | 'DOWNLOAD' | 'EDIT' | 'ADMIN'>('VIEW');
  const [submitting, setSubmitting] = useState(false);

  const fetchPermissions = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await api.get(`/documents/${documentId}/permissions`);
      if (res.data.success) {
        setPermissions(res.data.permissions || []);
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Không thể lấy danh sách phân quyền');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && documentId) {
      fetchPermissions();

      api.get('/departments').then(res => {
        if (res.data.success) setDepartments(res.data.data?.data || res.data.data || []);
      }).catch(() => {});

      api.get('/users').then(res => {
        if (res.data.success) setUsers(res.data.users || []);
      }).catch(() => {});
    }
  }, [isOpen, documentId]);

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId || !targetId) {
      toast('error', 'Vui lòng chọn đối tượng được cấp quyền');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/documents/${documentId}/permissions`, {
        target_type: targetType,
        target_id: Number(targetId),
        permission_level: permissionLevel
      });

      if (res.data.success) {
        toast('success', 'Phân quyền thành công!');
        setTargetId('');
        fetchPermissions();
        if (onPermissionsUpdated) onPermissionsUpdated();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khi cấp quyền');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokePermission = async (permissionId: number) => {
    if (!documentId) return;
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi quyền này?')) return;

    try {
      const res = await api.delete(`/documents/${documentId}/permissions/${permissionId}`);
      if (res.data.success) {
        toast('success', 'Đã thu hồi quyền thành công');
        fetchPermissions();
        if (onPermissionsUpdated) onPermissionsUpdated();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khi thu hồi quyền');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Phân Quyền Truy Cập Tài Liệu</h2>
              <p className="text-xs text-slate-500 truncate max-w-md">{documentTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Cấp quyền mới Form */}
          <form onSubmit={handleGrantPermission} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" /> Cấp quyền mới cho User hoặc Phòng ban
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Đối tượng:</label>
                <select
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value as any);
                    setTargetId('');
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="DEPARTMENT">Phòng ban</option>
                  <option value="USER">Người dùng cá nhân</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chọn đích danh:</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  required
                >
                  <option value="">-- Chọn đối tượng --</option>
                  {targetType === 'DEPARTMENT'
                    ? departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))
                    : users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.email})
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cấp độ quyền:</label>
                <select
                  value={permissionLevel}
                  onChange={(e) => setPermissionLevel(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                >
                  <option value="VIEW">VIEW (Chỉ xem)</option>
                  <option value="DOWNLOAD">DOWNLOAD (Xem & Tải)</option>
                  <option value="EDIT">EDIT (Xem, Tải & Sửa)</option>
                  <option value="ADMIN">ADMIN (Toàn quyền)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting || !targetId}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? 'Đang cấp...' : 'Xác nhận cấp quyền'}
              </button>
            </div>
          </form>

          {/* Current permissions list */}
          <div>
            <div className="text-xs font-bold text-slate-800 mb-2.5">
              Danh sách quyền đã cấp ({permissions.length})
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">Đang tải phân quyền...</div>
            ) : permissions.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Chưa có phân quyền đích danh nào. Quyền truy cập hiện tại đang tuân theo Mức độ bảo mật của tài liệu.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {permissions.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          p.targetType === 'DEPARTMENT'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {p.targetType === 'DEPARTMENT' ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-900">{p.targetName}</div>
                        <div className="text-[11px] text-slate-400">
                          {p.targetType === 'DEPARTMENT' ? 'Toàn bộ phòng ban' : p.targetSub || 'Tài khoản cá nhân'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          p.permissionLevel === 'ADMIN'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : p.permissionLevel === 'EDIT'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : p.permissionLevel === 'DOWNLOAD'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {p.permissionLevel}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRevokePermission(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Thu hồi quyền này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
