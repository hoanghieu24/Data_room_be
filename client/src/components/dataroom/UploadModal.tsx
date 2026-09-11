import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileCheck, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string | null;
  onSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  folderId,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useChunked, setUseChunked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [enablePassword, setEnablePassword] = useState(false);
  const [filePassword, setFilePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto enable chunked upload for files > 50MB
      if (file.size > 50 * 1024 * 1024) {
        setUseChunked(true);
      }
    }
  };

  const uploadDirect = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    if (enablePassword && filePassword.trim()) {
      formData.append('password', filePassword.trim());
    }

    await api.post('/files/upload', formData, {
      onUploadProgress: (progressEvent) => {
        const pct = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 50;
        setProgress(pct);
      },
    });
  };

  const uploadChunked = async (file: File) => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB per chunk
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // 1. Init
    const initRes = await api.post('/files/chunk/init', {
      filename: file.name,
      totalChunks,
      fileSize: file.size,
    });
    const uploadId = initRes.data.uploadId;

    // 2. Upload each chunk
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunkBlob = file.slice(start, end);

      const chunkForm = new FormData();
      chunkForm.append('uploadId', uploadId);
      chunkForm.append('chunkIndex', i.toString());
      chunkForm.append('chunk', chunkBlob, 'part_' + i);

      await api.post('/files/chunk/upload', chunkForm);
      setProgress(Math.round(((i + 1) * 100) / totalChunks));
    }

    // 3. Complete and Assemble
    await api.post('/files/chunk/complete', {
      uploadId,
      filename: file.name,
      mimeType: file.type,
      totalChunks,
      folderId,
      password: enablePassword && filePassword.trim() ? filePassword.trim() : undefined,
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (enablePassword && !filePassword.trim()) {
      toast('error', 'Vui lòng nhập mật mã bảo vệ hoặc bỏ chọn đặt mật mã');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      if (useChunked) {
        await uploadChunked(selectedFile);
      } else {
        await uploadDirect(selectedFile);
      }

      toast('success', 'Tải lên tài liệu thành công!');
      setSelectedFile(null);
      setEnablePassword(false);
      setFilePassword('');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Tải lên thất bại');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <span>Tải lên tài liệu mới</span>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Drag & Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50/50"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-700">
              Nhấn để chọn file hoặc kéo thả file vào đây
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Hỗ trợ DOCX, XLSX, PDF, Ảnh, Video, ZIP... Tự động lưu trữ đám mây an toàn
            </div>
          </div>

          {/* Selected File Details */}
          {selectedFile && (
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="truncate text-xs">
                  <div className="font-semibold text-slate-800 truncate">{selectedFile.name}</div>
                  <div className="text-slate-600 font-medium">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useChunked}
                    onChange={(e) => setUseChunked(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Chunked upload</span>
                </label>
              </div>
            </div>
          )}

          {/* Password Protection Option */}
          {selectedFile && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cài mật mã bảo vệ (Mã hóa tài liệu)</span>
                </div>
              </label>

              {enablePassword && (
                <div className="pt-2 space-y-2">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={filePassword}
                      onChange={(e) => setFilePassword(e.target.value)}
                      placeholder="Nhập mật mã khóa file..."
                      className="w-full px-3 py-2 pr-9 text-xs border border-slate-300 rounded-xl bg-white outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    🔒 Tài liệu sẽ được bảo vệ. Người dùng khác muốn xem trực tiếp (DOCX, Excel, PDF...) hoặc tải về đều phải nhập mật mã này.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Tiến trình tải lên...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                  style={{ width: progress + '%' }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!selectedFile || uploading}
              onClick={handleUpload}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {uploading ? 'Đang tải lên...' : 'Bắt đầu Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
