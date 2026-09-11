import React, { useState, useEffect } from 'react';
import { X, History, RotateCcw, Upload, FileCheck } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface VersionHistoryModalProps {
  file: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  file,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadNew, setShowUploadNew] = useState(false);
  const [changeNote, setChangeNote] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchVersions = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await api.get('/files/' + file.id + '/versions');
      if (res.data.success) {
        setVersions(res.data.versions);
      }
    } catch (err: any) {
      toast('error', 'Lỗi tải lịch sử phiên bản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && file) {
      fetchVersions();
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const handleRestore = async (versionNumber: number) => {
    if (!window.confirm('Bạn có chắc muốn khôi phục về phiên bản v' + versionNumber + '?')) return;
    try {
      const res = await api.post('/files/' + file.id + '/restore-version', { versionNumber });
      if (res.data.success) {
        toast('success', 'Đã hoàn tác về phiên bản v' + versionNumber);
        onSuccess();
        fetchVersions();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khôi phục');
    }
  };

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', newFile);
      formData.append('changeNote', changeNote);

      const res = await api.post('/files/' + file.id + '/version', formData);
      if (res.data.success) {
        toast('success', 'Đã tải lên phiên bản mới thành công!');
        setNewFile(null);
        setChangeNote('');
        setShowUploadNew(false);
        onSuccess();
        fetchVersions();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi cập nhật phiên bản');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <History className="w-5 h-5 text-blue-600" />
            <span>Lịch sử phiên bản: {file.name}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Quick upload new version banner */}
          {file.permissions?.canEdit !== false && (
            <div>
              {!showUploadNew ? (
                <button
                  onClick={() => setShowUploadNew(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors w-full justify-center"
                >
                  <Upload className="w-4 h-4" /> Tải lên phiên bản mới (v{file.currentVersion + 1})
                </button>
              ) : (
                <form onSubmit={handleUploadVersion} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="font-semibold text-xs text-slate-800">Cập nhật phiên bản mới</div>
                  <input
                    type="file"
                    required
                    onChange={(e) => e.target.files && setNewFile(e.target.files[0])}
                    className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    placeholder="Ghi chú thay đổi (changelog)..."
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadNew(false)}
                      className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={!newFile || uploading}
                      className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploading ? 'Đang tải...' : 'Lưu phiên bản'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3">
            {versions.map((ver) => {
              const isCurrent = ver.versionNumber === file.currentVersion;
              return (
                <div
                  key={ver.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                    isCurrent ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      v{ver.versionNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-800">{ver.name}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                            Hiện tại
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {ver.changeNote || 'Không có ghi chú'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Bởi {ver.createdBy?.fullName} • {new Date(ver.createdAt).toLocaleString('vi-VN')} •{' '}
                        {(ver.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>

                  {!isCurrent && file.permissions?.canEdit !== false && (
                    <button
                      onClick={() => handleRestore(ver.versionNumber)}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
                      title="Khôi phục tệp về phiên bản này"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Hoàn tác
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
