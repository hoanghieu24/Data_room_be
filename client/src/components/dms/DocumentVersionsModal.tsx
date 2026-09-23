import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  History,
  UploadCloud,
  Download,
  FileCheck,
  Calendar,
  User,
  Sparkles,
  ArrowUpCircle,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface DocumentVersionsModalProps {
  documentId: number | null;
  documentTitle: string;
  canEdit: boolean;
  isOpen: boolean;
  onClose: () => void;
  onVersionUploaded?: () => void;
}

export const DocumentVersionsModal: React.FC<DocumentVersionsModalProps> = ({
  documentId,
  documentTitle,
  canEdit,
  isOpen,
  onClose,
  onVersionUploaded
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [versions, setVersions] = useState<any[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Upload new version state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [changeNotes, setChangeNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchVersions = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await api.get(`/documents/${documentId}/versions`);
      if (res.data.success) {
        setVersions(res.data.versions || []);
        setCurrentVersion(res.data.currentVersion || 1);
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Không thể lấy lịch sử phiên bản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && documentId) {
      fetchVersions();
      setShowUploadForm(false);
      setNewFile(null);
      setChangeNotes('');
    }
  }, [isOpen, documentId]);

  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId || !newFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', newFile);
      formData.append('changeNotes', changeNotes.trim() || `Cập nhật phiên bản V${currentVersion + 1}`);

      const res = await api.post(`/documents/${documentId}/versions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast('success', `Đã cập nhật thành công lên phiên bản V${res.data.version}!`);
        setShowUploadForm(false);
        setNewFile(null);
        setChangeNotes('');
        fetchVersions();
        if (onVersionUploaded) onVersionUploaded();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khi tải lên phiên bản mới');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadVersion = async (verNumber: number, fileName: string) => {
    if (!documentId) return;
    try {
      const res = await api.get(`/documents/${documentId}/download?version=${verNumber}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast('success', `Bắt đầu tải phiên bản V${verNumber}`);
    } catch (err: any) {
      toast('error', 'Lỗi khi tải xuống phiên bản này');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Lịch sử Phiên bản Tài liệu</h2>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Action to show new version form */}
          {canEdit && !showUploadForm && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowUploadForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowUpCircle className="w-4 h-4" /> Tải lên phiên bản mới (V{currentVersion + 1})
              </button>
            </div>
          )}

          {/* New version upload form */}
          {showUploadForm && (
            <form onSubmit={handleUploadNewVersion} className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Tải lên phiên bản V{currentVersion + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Đóng
                </button>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  required
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewFile(e.target.files[0]);
                    }
                  }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl p-3 text-center cursor-pointer bg-white"
                >
                  {newFile ? (
                    <div className="text-xs font-bold text-purple-950 flex items-center justify-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>{newFile.name} ({(newFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    </div>
                  ) : (
                    <span className="text-xs text-purple-700 font-semibold">
                      Nhấn vào đây để chọn tệp tài liệu mới
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú thay đổi (Changelog):
                </label>
                <input
                  type="text"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  placeholder="VD: Cập nhật điều khoản thanh toán mục 3.2 theo phản hồi đối tác"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-white rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading || !newFile}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {uploading ? 'Đang lưu...' : 'Xác nhận tải lên'}
                </button>
              </div>
            </form>
          )}

          {/* Versions timeline */}
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Đang tải lịch sử phiên bản...</div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">Chưa có lịch sử phiên bản.</div>
          ) : (
            <div className="space-y-3">
              {versions.map((ver) => (
                <div
                  key={ver.id || ver.versionNumber}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    ver.isCurrent
                      ? 'border-purple-300 bg-purple-50/40 shadow-xs ring-1 ring-purple-400/30'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          ver.isCurrent
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        V{ver.versionNumber}
                      </span>
                      {ver.isCurrent && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">
                          Phiên bản hiện tại
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-800">{ver.fileName}</span>
                    </div>

                    <p className="text-xs text-slate-600 italic">
                      "{ver.changeNotes || 'Không có ghi chú thay đổi'}"
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {ver.uploaderName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(ver.createdAt).toLocaleString('vi-VN')}
                      </span>
                      <span>{(ver.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadVersion(ver.versionNumber, ver.fileName)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title={`Tải xuống bản V${ver.versionNumber}`}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
