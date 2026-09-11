import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Image,
  Video,
  FileSpreadsheet,
  Archive,
  Download,
  Eye,
  Lock,
  Unlock,
  Share2,
  History,
  MoreVertical,
  Trash2,
  Move,
  Edit2,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FileTableProps {
  files: any[];
  onPreview: (file: any) => void;
  onDownload: (file: any) => void;
  onShare: (file: any) => void;
  onVersions: (file: any) => void;
  onLockToggle: (file: any) => void;
  onRename: (file: any) => void;
  onMove: (file: any) => void;
  onDelete: (file: any) => void;
  onSetPassword?: (file: any) => void;
  onDragStartItem?: (item: { id: string; type: 'file'; name: string }) => void;
  onDragEndItem?: () => void;
}

interface MenuState {
  file: any;
  top: number;
  right: number;
  openUpward: boolean;
}

export const FileTable: React.FC<FileTableProps> = ({
  files,
  onPreview,
  onDownload,
  onShare,
  onVersions,
  onLockToggle,
  onRename,
  onMove,
  onDelete,
  onSetPassword,
  onDragStartItem,
  onDragEndItem,
}) => {
  const { user } = useAuth();
  const [menuState, setMenuState] = useState<MenuState | null>(null);

  useEffect(() => {
    const handleClose = () => setMenuState(null);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, []);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, file: any) => {
    e.stopPropagation();
    if (menuState?.file?.id === file.id) {
      setMenuState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < 260;

    setMenuState({
      file,
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      right: window.innerWidth - rect.right,
      openUpward,
    });
  };

  const getFileExt = (file: any) => {
    const raw =
      file.extension ||
      file.fileType ||
      file.fileName?.split('.').pop() ||
      file.name?.split('.').pop() ||
      '';
    return raw.toLowerCase().replace('.', '');
  };

  const getFileIcon = (file: any) => {
    const ext = getFileExt(file);
    const mime = file.mimeType?.toLowerCase() || '';

    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <Image className="w-5 h-5 text-emerald-500" />;
    }
    if (mime.startsWith('video/') || mime.startsWith('audio/') || ['mp4', 'mp3', 'wav', 'mov'].includes(ext)) {
      return <Video className="w-5 h-5 text-purple-500" />;
    }
    if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    }
    if (ext === 'zip' || ext === 'rar' || ext === 'tar' || ext === '7z') {
      return <Archive className="w-5 h-5 text-amber-600" />;
    }
    if (ext === 'docx' || ext === 'doc') {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  return (
    <div className="w-full overflow-x-auto min-h-[140px]">
      <table className="w-full text-left text-xs text-slate-600 border-collapse min-w-[500px] sm:min-w-[700px]">
        <thead>
          <tr className="bg-slate-50/90 text-slate-700 font-semibold border-b border-slate-200 select-none">
            <th className="py-3 px-3 sm:px-4 min-w-[180px] sm:min-w-[260px]">Tên tài liệu</th>
            <th className="py-3 px-2 sm:px-3 w-24 text-center hidden md:table-cell">Phiên bản</th>
            <th className="py-3 px-2 sm:px-3 w-32 hidden sm:table-cell">Bảo mật / Khóa</th>
            <th className="py-3 px-2 sm:px-3 w-24">Dung lượng</th>
            <th className="py-3 px-2 sm:px-3 w-28 hidden lg:table-cell">Người tải lên</th>
            <th className="py-3 px-2 sm:px-3 w-24 hidden md:table-cell">Cập nhật</th>
            <th className="py-3 px-3 sm:px-4 w-32 sm:w-40 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {files.map((file) => {
            const perms = file.permissions || {};
            const ext = getFileExt(file);
            const isEncrypted = !!file.hasPassword || !!file.isEncrypted;
            const uploaderName = file.uploader?.name || file.owner?.fullName || 'Hệ thống';

            // Chỉ người tải lên hoặc Admin mới có quyền cài đặt / đổi mật mã
            const isOwner = Number(user?.id) === Number(file.uploadedBy || file.uploader?.id);
            const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';
            const canManagePassword = isOwner || isAdmin;

            return (
              <tr
                key={file.id}
                draggable
                onDragStart={(e) => {
                  onDragStartItem?.({ id: String(file.id), type: 'file', name: file.name });
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', JSON.stringify({ id: file.id, type: 'file', name: file.name }));
                }}
                onDragEnd={() => onDragEndItem?.()}
                className="hover:bg-blue-50/30 transition-colors group cursor-grab active:cursor-grabbing"
              >
                <td className="py-3 px-3 sm:px-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-2 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                      {getFileIcon(file)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        onClick={() => perms.canView !== false && onPreview(file)}
                        className={`font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate block ${
                          perms.canView !== false ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
                        }`}
                        title={file.name}
                      >
                        {file.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider bg-slate-100 px-1.5 py-0.2 rounded">
                          {ext || 'FILE'}
                        </span>
                        {isEncrypted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.2 rounded">
                            <Lock className="w-2.5 h-2.5 text-amber-600" /> Đã cài mật mã
                          </span>
                        )}
                        {file.documentCode && (
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            {file.documentCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-3 px-2 sm:px-3 text-center hidden md:table-cell">
                  <button
                    onClick={() => onVersions(file)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer"
                    title="Xem lịch sử phiên bản"
                  >
                    <History className="w-3 h-3" /> v{file.currentVersion || file.version || 1}
                  </button>
                </td>

                <td className="py-3 px-2 sm:px-3 hidden sm:table-cell">
                  {file.isLocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                      <Lock className="w-3 h-3 text-rose-500" />
                      {file.lockedBy?.fullName || 'Đang check-out'}
                    </span>
                  ) : isEncrypted ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 text-[11px] font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      <KeyRound className="w-3 h-3 text-amber-600" /> Khóa mật mã
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                      <Unlock className="w-3 h-3 text-slate-400" /> Sẵn sàng
                    </span>
                  )}
                </td>

                <td className="py-3 px-2 sm:px-3 font-medium text-slate-700 whitespace-nowrap">{formatSize(file.size)}</td>
                <td className="py-3 px-2 sm:px-3 text-slate-700 truncate max-w-[120px] hidden lg:table-cell" title={uploaderName}>
                  {uploaderName}
                </td>
                <td className="py-3 px-2 sm:px-3 text-slate-500 whitespace-nowrap hidden md:table-cell">
                  {file.updatedAt || file.createdAt
                    ? new Date(file.updatedAt || file.createdAt).toLocaleDateString('vi-VN')
                    : '-'}
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {perms.canView !== false && (
                      <button
                        onClick={() => onPreview(file)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Xem trực tiếp (Preview)"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    {perms.canDownload !== false && (
                      <button
                        onClick={() => onDownload(file)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Tải về (Download)"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}

                    {/* Chỉ người upload hoặc Admin mới thấy nút cài/đổi mật mã */}
                    {canManagePassword && onSetPassword && (
                      <button
                        onClick={() => onSetPassword(file)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title={isEncrypted ? 'Đổi / Gỡ mật mã bảo vệ' : 'Cài mật mã bảo vệ'}
                      >
                        <KeyRound className="w-4 h-4 text-amber-600" />
                      </button>
                    )}

                    {/* Nút xóa nhanh tài liệu */}
                    {perms.canDelete !== false && (
                      <button
                        onClick={() => onDelete(file)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa tài liệu vào Thùng rác"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Nút 3 chấm mở menu tùy chọn nổi (Portal) */}
                    <button
                      onClick={(e) => handleOpenMenu(e, file)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        menuState?.file?.id === file.id
                          ? 'bg-slate-200 text-slate-800'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title="Tùy chọn khác"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* PORTAL DROPDOWN MENU: Render trực tiếp vào document.body để không bao giờ bị ẩn hoặc cắt xén trong ô */}
      {menuState &&
        createPortal(
          <>
            {/* Lớp nền trong suốt bắt sự kiện click ra ngoài để đóng menu */}
            <div
              className="fixed inset-0 z-[9998] bg-transparent"
              onClick={() => setMenuState(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenuState(null);
              }}
            />

            {/* Khung menu nổi độc lập */}
            <div
              className="fixed z-[9999] w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 text-left text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 select-none"
              style={{
                ...(menuState.openUpward
                  ? { bottom: `${window.innerHeight - menuState.top}px` }
                  : { top: `${menuState.top}px` }),
                right: `${menuState.right}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Nhóm 1: Xem, lịch sử, mật mã, chia sẻ */}
              <div className="py-1">
                <button
                  onClick={() => {
                    onVersions(menuState.file);
                    setMenuState(null);
                  }}
                  className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <History className="w-4 h-4 text-blue-500" />
                  <span>Lịch sử phiên bản</span>
                </button>

                {/* Cài / Đổi mật mã: Chỉ hiển thị cho người upload hoặc Admin */}
                {onSetPassword &&
                  (Number(user?.id) === Number(menuState.file.uploadedBy || menuState.file.uploader?.id) ||
                    (user?.role || '').toUpperCase() === 'ADMIN') && (
                    <button
                      onClick={() => {
                        onSetPassword(menuState.file);
                        setMenuState(null);
                      }}
                      className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-amber-50 text-slate-700 hover:text-amber-700 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-amber-600" />
                      <span>
                        {menuState.file.isEncrypted || menuState.file.hasPassword
                          ? 'Đổi / Gỡ mật mã'
                          : 'Cài mật mã bảo vệ'}
                      </span>
                    </button>
                  )}

                {menuState.file.permissions?.canShare !== false && (
                  <button
                    onClick={() => {
                      onShare(menuState.file);
                      setMenuState(null);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-purple-500" />
                    <span>Chia sẻ & Quyền</span>
                  </button>
                )}
              </div>

              {/* Nhóm 2: Khóa, đổi tên, di chuyển */}
              {menuState.file.permissions?.canEdit !== false && (
                <div className="py-1">
                  <button
                    onClick={() => {
                      onLockToggle(menuState.file);
                      setMenuState(null);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    {menuState.file.isLocked ? (
                      <>
                        <Unlock className="w-4 h-4 text-emerald-500" />
                        <span>Mở khóa (Check-in)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-rose-500" />
                        <span>Khóa (Check-out)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onRename(menuState.file);
                      setMenuState(null);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 text-amber-500" />
                    <span>Đổi tên tài liệu</span>
                  </button>

                  <button
                    onClick={() => {
                      onMove(menuState.file);
                      setMenuState(null);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    <Move className="w-4 h-4 text-slate-500" />
                    <span>Di chuyển thư mục</span>
                  </button>
                </div>
              )}

              {/* Nhóm 3: Xóa */}
              {menuState.file.permissions?.canDelete !== false && (
                <div className="py-1">
                  <button
                    onClick={() => {
                      onDelete(menuState.file);
                      setMenuState(null);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>Xóa vào thùng rác</span>
                  </button>
                </div>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
