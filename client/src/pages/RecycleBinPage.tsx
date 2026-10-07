import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Folder, FileText, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const RecycleBinPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeleted = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recycle-bin');
      if (res.data.success) {
        setFolders(res.data.folders || []);
        setFiles(res.data.files || []);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, []);

  const handleRestore = async (type: 'folder' | 'file', id: string) => {
    try {
      const res = await api.post('/recycle-bin/restore', { type, id });
      if (res.data.success) {
        toast('success', 'Khôi phục thành công!');
        fetchDeleted();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khôi phục');
    }
  };

  const handlePermanentDelete = async (type: 'folder' | 'file', id: string) => {
    if (!window.confirm('CẢNH BÁO: Thao tác này sẽ xóa vĩnh viễn và không thể khôi phục. Tiếp tục?')) return;
    try {
      const res = await api.delete('/recycle-bin/permanent', { data: { type, id } });
      if (res.data.success) {
        toast('success', 'Đã xóa vĩnh viễn và giải phóng bộ nhớ!');
        fetchDeleted();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi xóa');
    }
  };

  const handleEmptyBin = async () => {
    if (!window.confirm('CẢNH BÁO: Dọn sạch thùng rác sẽ xóa vĩnh viễn toàn bộ file và folder?')) return;
    try {
      const res = await api.delete('/recycle-bin/empty');
      if (res.data.success) {
        toast('success', 'Đã dọn sạch thùng rác!');
        fetchDeleted();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi');
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" /> Thùng Rác (Recycle Bin)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Các thư mục và tài liệu bị xóa được lưu trữ an toàn tại đây để phục hồi khi cần.
          </p>
        </div>

        {user?.role?.toUpperCase() === 'ADMIN' && (folders.length > 0 || files.length > 0) && (
          <button
            onClick={handleEmptyBin}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Dọn sạch thùng rác</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-xs">Đang tải dữ liệu thùng rác...</div>
      ) : folders.length === 0 && files.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <Trash2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <div className="font-semibold text-slate-700 text-sm">Thùng rác hiện đang trống</div>
          <p className="text-xs text-slate-400 mt-1">Không có thư mục hay tài liệu nào bị xóa.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Folders in bin */}
          {folders.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="font-semibold text-xs text-slate-700 uppercase tracking-wider mb-3">
                Thư mục đã xóa ({folders.length})
              </div>
              <div className="divide-y divide-slate-100">
                {folders.map((f) => (
                  <div key={f.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-amber-500" />
                      <div>
                        <div className="font-semibold text-xs text-slate-800">{f.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Xóa bởi: {f.deletedBy?.fullName || 'Hệ thống'} • {new Date(f.deletedAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore('folder', f.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Khôi phục
                      </button>
                      <button
                        onClick={() => handlePermanentDelete('folder', f.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files in bin */}
          {files.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
              <div className="font-semibold text-xs text-slate-700 uppercase tracking-wider mb-3">
                Tài liệu đã xóa ({files.length})
              </div>
              <div className="divide-y divide-slate-100">
                {files.map((file) => (
                  <div key={file.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-semibold text-xs text-slate-800">{file.name}</div>
                        <div className="text-[11px] text-slate-400">
                          Chủ sở hữu: {file.owner?.fullName || 'Hệ thống'} • Xóa bởi: {file.deletedBy?.fullName || 'Người dùng'} •{' '}
                          {new Date(file.deletedAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore('file', file.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Khôi phục
                      </button>
                      <button
                        onClick={() => handlePermanentDelete('file', file.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
