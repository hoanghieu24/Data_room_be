import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  Archive,
  Download,
  Eye,
  Lock,
  History,
  KeyRound,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FileGridProps {
  files: any[];
  onPreview: (file: any) => void;
  onDownload: (file: any) => void;
  onShare: (file: any) => void;
  onVersions: (file: any) => void;
  onSetPassword?: (file: any) => void;
  onDelete?: (file: any) => void;
  onDragStartItem?: (item: { id: string; type: 'file'; name: string }) => void;
  onDragEndItem?: () => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  onPreview,
  onDownload,
  onShare,
  onVersions,
  onSetPassword,
  onDelete,
  onDragStartItem,
  onDragEndItem,
}) => {
  const { user } = useAuth();
  const getFileExt = (file: any) => {
    const raw =
      file.extension ||
      file.fileType ||
      file.fileName?.split('.').pop() ||
      file.name?.split('.').pop() ||
      '';
    return raw.toLowerCase().replace('.', '');
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((file) => {
        const perms = file.permissions || {};
        const ext = getFileExt(file);
        const mime = file.mimeType?.toLowerCase() || '';
        const isImage = mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
        const isEncrypted = !!file.hasPassword || !!file.isEncrypted;

        return (
          <div
            key={file.id}
            draggable
            onDragStart={(e) => {
              onDragStartItem?.({ id: String(file.id), type: 'file', name: file.name });
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', JSON.stringify({ id: file.id, type: 'file', name: file.name }));
            }}
            onDragEnd={() => onDragEndItem?.()}
            className="group bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col overflow-hidden cursor-grab active:cursor-grabbing"
          >
            {/* Thumbnail / Header Area */}
            <div
              onClick={() => perms.canView !== false && onPreview(file)}
              className="h-36 bg-slate-50 flex items-center justify-center relative cursor-pointer border-b border-slate-100 overflow-hidden"
            >
              {isImage ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : ext === 'docx' || ext === 'doc' ? (
                <div className="p-4 rounded-2xl bg-blue-50/80 shadow-xs border border-blue-100">
                  <FileText className="w-10 h-10 text-blue-600" />
                </div>
              ) : ext === 'xlsx' || ext === 'xls' || ext === 'csv' ? (
                <div className="p-4 rounded-2xl bg-emerald-50/80 shadow-xs border border-emerald-100">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-600" />
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white shadow-xs border border-slate-100">
                  <FileText className="w-10 h-10 text-slate-500" />
                </div>
              )}

              {/* Version badge */}
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-blue-700 shadow-xs backdrop-blur-xs border border-blue-200">
                v{file.currentVersion || file.version || 1}
              </span>

              {/* Security / Lock Badge */}
              {file.isLocked ? (
                <span className="absolute top-2 right-2 p-1 rounded-md bg-rose-500 text-white shadow-xs" title="Đang check-out bởi người dùng">
                  <Lock className="w-3.5 h-3.5" />
                </span>
              ) : isEncrypted ? (
                <span className="absolute top-2 right-2 p-1 rounded-md bg-amber-500 text-white shadow-xs" title="Được bảo vệ bằng mật mã">
                  <Lock className="w-3.5 h-3.5" />
                </span>
              ) : null}
            </div>

            {/* Card Content */}
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <div
                  onClick={() => perms.canView !== false && onPreview(file)}
                  className="font-semibold text-xs text-slate-800 hover:text-blue-600 line-clamp-1 cursor-pointer"
                  title={file.name}
                >
                  {file.name}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1 font-medium">
                  <span>{formatSize(file.size)}</span>
                  <span className="uppercase font-bold text-slate-500 text-[10px]">{ext || 'FILE'}</span>
                </div>
              </div>

              {/* Quick Actions footer */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                <button
                  onClick={() => onVersions(file)}
                  className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <History className="w-3 h-3" /> Lịch sử
                </button>

                <div className="flex items-center gap-1">
                  {onSetPassword &&
                    (Number(user?.id) === Number(file.uploadedBy || file.uploader?.id) ||
                      (user?.role || '').toUpperCase() === 'ADMIN') && (
                      <button
                        onClick={() => onSetPassword(file)}
                        className="p-1 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded transition-colors cursor-pointer"
                        title={isEncrypted ? 'Đổi / Gỡ mật mã' : 'Cài mật mã bảo vệ'}
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                    )}
                  {perms.canView !== false && (
                    <button
                      onClick={() => onPreview(file)}
                      className="p-1 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded transition-colors cursor-pointer"
                      title="Xem trực tiếp"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {perms.canDownload !== false && (
                    <button
                      onClick={() => onDownload(file)}
                      className="p-1 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded transition-colors cursor-pointer"
                      title="Tải về"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {perms.canDelete !== false && onDelete && (
                    <button
                      onClick={() => onDelete(file)}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      title="Xóa tài liệu vào Thùng rác"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
