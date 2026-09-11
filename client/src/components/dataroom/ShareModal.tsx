import React, { useState, useEffect } from 'react';
import { X, Share2, Shield, Trash2, Check } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface ShareModalProps {
  item: any | null; // folder or file
  type: 'folder' | 'file';
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  item,
  type,
  isOpen,
  onClose,
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [roleLevel, setRoleLevel] = useState('VIEWER');
  const [canView, setCanView] = useState(true);
  const [canDownload, setCanDownload] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [inheritFromParent, setInheritFromParent] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = (role: string) => {
    setRoleLevel(role);
    switch (role) {
      case 'OWNER':
      case 'MANAGER':
        setCanView(true); setCanDownload(true); setCanEdit(true); setCanDelete(true); setCanShare(true);
        break;
      case 'EDITOR':
        setCanView(true); setCanDownload(true); setCanEdit(true); setCanDelete(false); setCanShare(false);
        break;
      case 'DOWNLOADER':
        setCanView(true); setCanDownload(true); setCanEdit(false); setCanDelete(false); setCanShare(false);
        break;
      case 'VIEWER':
      default:
        setCanView(true); setCanDownload(false); setCanEdit(false); setCanDelete(false); setCanShare(false);
        break;
    }
  };

  const fetchUsersAndPerms = async () => {
    if (!item) return;
    try {
      const [uRes, pRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/permissions?' + (type === 'folder' ? 'folderId=' : 'fileId=') + item.id),
      ]);
      if (uRes.data.success) setUsers(uRes.data.users);
      if (pRes.data.success) setPermissions(pRes.data.permissions);
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen && item) {
      fetchUsersAndPerms();
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast('error', 'Vui lòng chọn người dùng để cấp quyền');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/permissions/share', {
        folderId: type === 'folder' ? item.id : undefined,
        fileId: type === 'file' ? item.id : undefined,
        userId: selectedUserId,
        roleLevel,
        canView,
        canDownload,
        canEdit,
        canDelete,
        canShare,
        inheritFromParent,
      });

      if (res.data.success) {
        toast('success', 'Đã cấp quyền thành công!');
        fetchUsersAndPerms();
        setSelectedUserId('');
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi cấp quyền');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (permId: string) => {
    try {
      await api.delete('/permissions/' + permId);
      toast('success', 'Đã thu hồi quyền');
      fetchUsersAndPerms();
    } catch (err: any) {
      toast('error', 'Lỗi thu hồi quyền');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <Share2 className="w-5 h-5 text-purple-600" />
            <span>Phân quyền truy cập: {item.name}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Share Form */}
          <form onSubmit={handleShare} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="font-semibold text-xs text-slate-800">Thêm người dùng hoặc nhóm</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chọn người dùng</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- Chọn thành viên --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mức quyền (Role Level)</label>
                <select
                  value={roleLevel}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="VIEWER">Viewer (Chỉ xem trực tiếp)</option>
                  <option value="DOWNLOADER">Downloader (Xem & Tải về)</option>
                  <option value="EDITOR">Editor (Chỉnh sửa / Tạo version)</option>
                  <option value="MANAGER">Manager (Quản lý nội dung & Quyền)</option>
                  <option value="OWNER">Owner (Toàn quyền)</option>
                </select>
              </div>
            </div>

            {/* Granular Flags */}
            <div className="pt-2 border-t border-slate-200">
              <div className="text-[11px] font-semibold text-slate-600 mb-1.5">Tùy chỉnh cờ quyền chi tiết:</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={canView} onChange={(e) => setCanView(e.target.checked)} />
                  <span>Xem file</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={canDownload} onChange={(e) => setCanDownload(e.target.checked)} />
                  <span>Tải về file</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={canEdit} onChange={(e) => setCanEdit(e.target.checked)} />
                  <span>Sửa / Version</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={canDelete} onChange={(e) => setCanDelete(e.target.checked)} />
                  <span>Xóa file</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={canShare} onChange={(e) => setCanShare(e.target.checked)} />
                  <span>Chia sẻ tiếp</span>
                </label>
                {type === 'folder' && (
                  <label className="flex items-center gap-1.5 cursor-pointer text-blue-600 font-semibold">
                    <input type="checkbox" checked={inheritFromParent} onChange={(e) => setInheritFromParent(e.target.checked)} />
                    <span>Kế thừa xuống con</span>
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                {loading ? 'Đang lưu...' : 'Xác nhận cấp quyền'}
              </button>
            </div>
          </form>

          {/* Current permissions list */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800">Danh sách người dùng đã được cấp quyền:</div>
            {permissions.length === 0 ? (
              <div className="text-xs text-slate-600 italic p-3 text-center bg-slate-50 rounded-xl">
                Chưa có phân quyền riêng lẻ nào. Quyền hiện tại áp dụng theo người tạo (Owner) và Admin.
              </div>
            ) : (
              permissions.map((p) => (
                <div key={p.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      {p.user?.fullName}
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                        {p.roleLevel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 flex gap-2">
                      {p.canView && <span>✔ Xem</span>}
                      {p.canDownload && <span>✔ Tải về</span>}
                      {p.canEdit && <span>✔ Chỉnh sửa</span>}
                      {p.canDelete && <span>✔ Xóa</span>}
                      {p.canShare && <span>✔ Chia sẻ</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(p.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Thu hồi quyền"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
