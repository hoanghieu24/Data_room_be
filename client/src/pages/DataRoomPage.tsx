import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FolderPlus,
  UploadCloud,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  Folder,
  FolderOpen,
  Shield,
  Trash2,
  Edit2,
  Move,
  Lock,
  Network,
  X,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { FolderTree, TreeNode } from '../components/dataroom/FolderTree';
import { FileTable } from '../components/dataroom/FileTable';
import { FileGrid } from '../components/dataroom/FileGrid';
import { CreateFolderModal } from '../components/dataroom/CreateFolderModal';
import { UploadModal } from '../components/dataroom/UploadModal';
import { FilePreviewModal } from '../components/dataroom/FilePreviewModal';
import { VersionHistoryModal } from '../components/dataroom/VersionHistoryModal';
import { ShareModal } from '../components/dataroom/ShareModal';
import { MoveModal } from '../components/dataroom/MoveModal';
import { SetPasswordModal } from '../components/dataroom/SetPasswordModal';

export const DataRoomPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFolderId = searchParams.get('folderId') || null;

  const { user } = useAuth();
  const { toast } = useToast();

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [folderData, setFolderData] = useState<any>({
    breadcrumbs: [{ id: null, name: 'Root' }],
    subfolders: [],
    files: [],
    currentFolderPermissions: {},
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [versionsFile, setVersionsFile] = useState<any | null>(null);
  const [shareItem, setShareItem] = useState<{ item: any; type: 'folder' | 'file' } | null>(null);
  const [moveItem, setMoveItem] = useState<{ item: any; type: 'folder' | 'file' } | null>(null);
  const [passwordFile, setPasswordFile] = useState<any | null>(null);
  const [isMobileFolderTreeOpen, setIsMobileFolderTreeOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[] | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dragItem, setDragItem] = useState<{ id: string; type: 'folder' | 'file'; name: string } | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const fetchTree = async () => {
    try {
      const res = await api.get('/folders/tree');
      if (res.data.success) {
        setTree(res.data.tree || []);
      }
    } catch (e) {}
  };

  const fetchContents = async () => {
    setLoading(true);
    try {
      const url = currentFolderId
        ? '/folders/' + currentFolderId + '/contents'
        : '/folders/contents';

      const res = await api.get(url, {
        params: {
          search: searchQuery || undefined,
          sortBy,
          sortOrder,
        },
      });

      if (res.data.success) {
        setFolderData(res.data);
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Không thể truy cập thư mục này (chặn quyền)');
      // If error, reset to root
      if (currentFolderId) {
        setSearchParams({});
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  useEffect(() => {
    fetchContents();
  }, [currentFolderId, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dragItem) {
        setDragItem(null);
        setDragOverFolderId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dragItem]);

  const handleSelectFolder = (fId: string | null) => {
    setIsMobileFolderTreeOpen(false);
    if (fId) {
      setSearchParams({ folderId: fId });
    } else {
      setSearchParams({});
    }
  };

  const handleDownload = (file: any) => {
    window.open('/api/files/' + file.id + '/download', '_blank');
  };

  const handleLockToggle = async (file: any) => {
    try {
      if (file.isLocked) {
        const res = await api.post('/files/' + file.id + '/unlock');
        if (res.data.success) {
          toast('success', 'Đã mở khóa (Check-in) tài liệu');
          fetchContents();
        }
      } else {
        const res = await api.post('/files/' + file.id + '/lock');
        if (res.data.success) {
          toast('success', 'Đã khóa (Check-out) tài liệu cho bạn');
          fetchContents();
        }
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Thao tác khóa thất bại');
    }
  };

  const handleRenameFolder = async (folder: any) => {
    const newName = window.prompt('Nhập tên thư mục mới:', folder.name);
    if (!newName || newName === folder.name) return;
    try {
      const res = await api.put('/folders/' + folder.id + '/rename', { name: newName });
      if (res.data.success) {
        toast('success', 'Đổi tên thư mục thành công');
        fetchContents();
        fetchTree();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi đổi tên');
    }
  };

  const handleDeleteFolder = async (folder: any) => {
    try {
      // Check impact
      const impactRes = await api.get('/folders/' + folder.id + '/impact');
      const { subfolderCount, fileCount } = impactRes.data.impact;
      const msg =
        'Bạn có chắc muốn chuyển thư mục \'' +
        folder.name +
        '\' vào Thùng rác?\n\nBên trong gồm:\n• ' +
        subfolderCount +
        ' thư mục con\n• ' +
        fileCount +
        ' tài liệu';

      if (!window.confirm(msg)) return;

      const res = await api.delete('/folders/' + folder.id);
      if (res.data.success) {
        toast('success', 'Đã chuyển thư mục vào Thùng rác');
        fetchContents();
        fetchTree();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi xóa thư mục');
    }
  };

  const handleRenameFile = async (file: any) => {
    const newName = window.prompt('Nhập tên file mới:', file.name);
    if (!newName || newName === file.name) return;
    try {
      const res = await api.put('/files/' + file.id + '/rename', { name: newName });
      if (res.data.success) {
        toast('success', 'Đổi tên file thành công');
        fetchContents();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi đổi tên');
    }
  };

  const handleDeleteFile = async (file: any) => {
    if (!window.confirm('Chuyển tài liệu \'' + file.name + '\' vào Thùng rác?')) return;
    try {
      const res = await api.delete('/files/' + file.id);
      if (res.data.success) {
        toast('success', 'Đã chuyển tệp vào Thùng rác');
        fetchContents();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi xóa tệp');
    }
  };

  const handleDropMove = async (targetFolderId: string | null) => {
    if (!dragItem) return;
    if (dragItem.type === 'folder' && String(dragItem.id) === String(targetFolderId)) return;

    try {
      if (dragItem.type === 'folder') {
        const res = await api.put('/folders/' + dragItem.id + '/move', { targetParentId: targetFolderId });
        if (res.data.success) {
          toast('success', 'Đã di chuyển thư mục "' + dragItem.name + '"');
          fetchContents();
          fetchTree();
        }
      } else {
        const res = await api.put('/files/' + dragItem.id + '/move', { folderId: targetFolderId });
        if (res.data.success) {
          toast('success', 'Đã di chuyển tệp "' + dragItem.name + '"');
          fetchContents();
        }
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Di chuyển thất bại');
    } finally {
      setDragItem(null);
      setDragOverFolderId(null);
    }
  };



  const perms = folderData.currentFolderPermissions || {};

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden relative">
      {/* Mobile Folder Tree Backdrop & Drawer */}
      {isMobileFolderTreeOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={() => setIsMobileFolderTreeOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-blue-600" /> Cây Thư Mục
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setIsMobileFolderTreeOpen(false);
                    setIsCreateFolderOpen(true);
                  }}
                  className="p-1 hover:bg-slate-100 text-blue-600 rounded-lg transition-colors cursor-pointer"
                  title="Tạo thư mục mới"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMobileFolderTreeOpen(false)}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <FolderTree
                tree={tree}
                selectedFolderId={currentFolderId}
                onSelectFolder={handleSelectFolder}
                dragItem={dragItem}
                onDropItem={(id) => handleDropMove(id)}
                onDragStartItem={(item) => setDragItem(item)}
                onDragEndItem={() => {
                  setDragItem(null);
                  setDragOverFolderId(null);
                }}
                onDeleteFolder={handleDeleteFolder}
              />
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar: Folder Tree (Desktop) — collapsible */}
      <div
        className={`hidden lg:flex flex-col h-full overflow-hidden flex-shrink-0 bg-white border-r border-slate-200 transition-all duration-200 ${
          isSidebarCollapsed ? 'w-0 border-r-0' : 'w-64'
        }`}
      >
        <div className="p-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider truncate">
            Cây Thư Mục Data Room
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCreateFolderOpen(true)}
              className="p-1 hover:bg-slate-100 text-blue-600 rounded-lg transition-colors cursor-pointer"
              title="Tạo thư mục mới"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Đóng tab trái (Thu gọn)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <FolderTree
            tree={tree}
            selectedFolderId={currentFolderId}
            onSelectFolder={handleSelectFolder}
            dragItem={dragItem}
            onDropItem={(id) => handleDropMove(id)}
            onDragStartItem={(item) => setDragItem(item)}
            onDragEndItem={() => {
              setDragItem(null);
              setDragOverFolderId(null);
            }}
            onDeleteFolder={handleDeleteFolder}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 min-w-0">
        {/* Top Control Toolbar */}
        <div className="p-3 sm:p-4 bg-white border-b border-slate-200 flex flex-col gap-3 shadow-xs">
          {/* Row 1: Breadcrumbs + Folder Tree Mobile button + Desktop Tab Close/Open Button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 overflow-x-auto min-w-0">
              {/* Desktop toggle button for left tree */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer shrink-0"
                title={isSidebarCollapsed ? 'Mở cây thư mục (tab trái)' : 'Đóng cây thư mục (tab trái)'}
              >
                {isSidebarCollapsed ? (
                  <>
                    <PanelLeft className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mở tab trái</span>
                  </>
                ) : (
                  <>
                    <PanelLeftClose className="w-3.5 h-3.5 text-slate-500" />
                    <span>Đóng tab trái</span>
                  </>
                )}
              </button>

              <Breadcrumb
                items={folderData.breadcrumbs || []}
                onSelect={handleSelectFolder}
                dragItem={dragItem}
                onDropItem={(id) => handleDropMove(id)}
              />
            </div>
            <button
              onClick={() => setIsMobileFolderTreeOpen(true)}
              className="lg:hidden shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-colors cursor-pointer"
              title="Mở cây thư mục"
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Cây thư mục</span>
            </button>
          </div>

          {/* Row 2: Search, Sort, View, Tech Map, and Actions */}
          <div className="flex items-center justify-between gap-2.5 flex-wrap">
            {/* Search, Sort, and View mode group */}
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[240px]">
              {/* Search Input */}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm file hoặc thư mục..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl outline-hidden w-full sm:w-44 md:w-56 transition-all"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 text-xs shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent px-2 py-1 outline-hidden text-slate-700 font-medium cursor-pointer"
                >
                  <option value="name">Tên</option>
                  <option value="updatedAt">Ngày sửa</option>
                  <option value="size">Dung lượng</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  title="Đảo chiều sắp xếp"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 shrink-0">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Dạng bảng"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Dạng lưới"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions group */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Xem tổng quát (Tech Map) Button */}
              <Link
                to="/system-overview"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                title="Xem sơ đồ cấu trúc tổng quát hệ thống"
              >
                <Network className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Xem tổng quát (Tech Map)</span>
                <span className="sm:hidden">Tech Map</span>
              </Link>

              {perms.canEdit !== false && (
                <>
                  <button
                    onClick={() => setIsCreateFolderOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition-colors cursor-pointer shrink-0"
                  >
                    <FolderPlus className="w-4 h-4 text-amber-600" />
                    <span className="hidden sm:inline">Thư mục mới</span>
                    <span className="sm:hidden">Thư mục</span>
                  </button>

                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer shrink-0"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span className="hidden sm:inline">Tải lên tài liệu</span>
                    <span className="sm:hidden">Tải lên</span>
                  </button>
                </>
              )}

              {currentFolderId && perms.canShare !== false && (
                <button
                  onClick={() =>
                    setShareItem({
                      item: { id: currentFolderId, name: folderData.breadcrumbs?.slice(-1)[0]?.name || 'Thư mục' },
                      type: 'folder',
                    })
                  }
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Phân quyền Folder</span>
                  <span className="sm:hidden">Phân quyền</span>
                </button>
              )}

              {currentFolderId && perms.canDelete !== false && (
                <button
                  onClick={() => {
                    const currentFolder = {
                      id: currentFolderId,
                      name: folderData.breadcrumbs?.slice(-1)[0]?.name || 'Thư mục này'
                    };
                    handleDeleteFolder(currentFolder);
                  }}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
                  title="Xóa thư mục này vào Thùng rác"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span className="hidden sm:inline">Xóa thư mục</span>
                  <span className="sm:hidden">Xóa</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contents Area — supports drag & drop to upload */}
        <div
          className={`flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 relative transition-all ${
            isDraggingOver ? 'bg-blue-50/60 ring-2 ring-inset ring-blue-400' : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isDraggingOver) setIsDraggingOver(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={(e) => {
            // Only clear if leaving the content area entirely
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDraggingOver(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingOver(false);
            // If it's an internal drag-item (folder/file move), handle move to current folder
            if (dragItem) {
              handleDropMove(currentFolderId);
              return;
            }
            // Otherwise treat as OS file drop → upload
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
              setDroppedFiles(files);
              setIsUploadOpen(true);
            }
          }}
        >
          {/* Drop overlay hint */}
          {isDraggingOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-blue-600/90 text-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl backdrop-blur-sm">
                <UploadCloud className="w-12 h-12 animate-bounce" />
                <div className="font-bold text-lg">Thả file vào đây để tải lên</div>
                <div className="text-sm text-blue-100 opacity-80">
                  Vào thư mục: {folderData.breadcrumbs?.slice(-1)[0]?.name || 'Root'}
                </div>
              </div>
            </div>
          )}

          {/* Subfolders Section */}
          {folderData.subfolders?.length > 0 && (
            <div>
              <div className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                <span>Thư mục con ({folderData.subfolders.length})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {folderData.subfolders.map((folder: any) => (
                  <div
                    key={folder.id}
                    draggable
                    onDragStart={(e) => {
                      setDragItem({ id: folder.id, type: 'folder', name: folder.name });
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => { setDragItem(null); setDragOverFolderId(null); }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragItem && String(dragItem.id) !== String(folder.id)) {
                        setDragOverFolderId(folder.id);
                        e.dataTransfer.dropEffect = 'move';
                      }
                    }}
                    onDragLeave={() => setDragOverFolderId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragItem && String(dragItem.id) !== String(folder.id)) {
                        handleDropMove(folder.id);
                      }
                      setDragOverFolderId(null);
                    }}
                    className={`p-3 bg-white rounded-xl border transition-all flex items-center justify-between group cursor-grab active:cursor-grabbing ${
                      dragOverFolderId === folder.id
                        ? 'border-blue-500 ring-2 ring-blue-300 bg-blue-50 shadow-md scale-[1.02]'
                        : dragItem
                        ? 'border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/50'
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div
                      onClick={() => handleSelectFolder(folder.id)}
                      className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1"
                    >
                      <div className="p-2 bg-amber-50 text-amber-500 rounded-lg group-hover:scale-105 transition-transform">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-xs text-slate-800 truncate group-hover:text-blue-600">
                          {folder.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {folder.fileCount} file • {folder.subfolderCount} thư mục
                        </div>
                      </div>
                    </div>

                    {/* Folder actions */}
                    {perms.canEdit !== false && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRenameFolder(folder)}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-amber-600 rounded"
                          title="Đổi tên"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setMoveItem({ item: folder, type: 'folder' })}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded"
                          title="Di chuyển"
                        >
                          <Move className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFolder(folder)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                          title="Xóa vào thùng rác"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          <div>
            <div className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider flex items-center justify-between">
              <span>Tài liệu trong thư mục ({folderData.files?.length || 0})</span>
            </div>

            {loading ? (
              <div className="text-center p-12 text-slate-400 text-xs">Đang tải tài liệu...</div>
            ) : folderData.files?.length === 0 && folderData.subfolders?.length === 0 ? (
              <div className="text-center p-16 bg-white rounded-2xl border border-dashed border-slate-300">
                <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <div className="font-bold text-slate-700 text-sm">Thư mục hiện đang trống</div>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Bắt đầu lưu trữ bằng cách tải lên tài liệu mới hoặc tạo thư mục con.
                </p>
                {perms.canEdit !== false && (
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                  >
                    <UploadCloud className="w-4 h-4" /> Tải lên tài liệu ngay
                  </button>
                )}
              </div>
            ) : viewMode === 'table' ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
                <FileTable
                  files={folderData.files || []}
                  onPreview={(f) => setPreviewFile(f)}
                  onDownload={handleDownload}
                  onShare={(f) => setShareItem({ item: f, type: 'file' })}
                  onVersions={(f) => setVersionsFile(f)}
                  onLockToggle={handleLockToggle}
                  onRename={handleRenameFile}
                  onMove={(f) => setMoveItem({ item: f, type: 'file' })}
                  onDelete={handleDeleteFile}
                  onSetPassword={(f) => setPasswordFile(f)}
                  onDragStartItem={(item) => setDragItem(item)}
                  onDragEndItem={() => {
                    setDragItem(null);
                    setDragOverFolderId(null);
                  }}
                />
              </div>
            ) : (
              <FileGrid
                files={folderData.files || []}
                onPreview={(f) => setPreviewFile(f)}
                onDownload={handleDownload}
                onShare={(f) => setShareItem({ item: f, type: 'file' })}
                onVersions={(f) => setVersionsFile(f)}
                onSetPassword={(f) => setPasswordFile(f)}
                onDelete={handleDeleteFile}
                onDragStartItem={(item) => setDragItem(item)}
                onDragEndItem={() => {
                  setDragItem(null);
                  setDragOverFolderId(null);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        parentId={currentFolderId}
        onSuccess={() => {
          fetchContents();
          fetchTree();
        }}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setDroppedFiles(null);
        }}
        folderId={currentFolderId}
        onSuccess={fetchContents}
        initialFiles={droppedFiles}
      />

      <FilePreviewModal
        isOpen={!!previewFile}
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
      />

      <VersionHistoryModal
        isOpen={!!versionsFile}
        file={versionsFile}
        onClose={() => setVersionsFile(null)}
        onSuccess={fetchContents}
      />

      {shareItem && (
        <ShareModal
          isOpen={!!shareItem}
          item={shareItem.item}
          type={shareItem.type}
          onClose={() => setShareItem(null)}
        />
      )}

      {moveItem && (
        <MoveModal
          isOpen={!!moveItem}
          item={moveItem.item}
          type={moveItem.type}
          onClose={() => setMoveItem(null)}
          onSuccess={() => {
            fetchContents();
            fetchTree();
          }}
        />
      )}

      {passwordFile && (
        <SetPasswordModal
          isOpen={!!passwordFile}
          file={passwordFile}
          onClose={() => setPasswordFile(null)}
          onSuccess={fetchContents}
        />
      )}

      {/* Floating Drag-and-Drop Helper */}
      {dragItem && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-blue-500/50 backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
            <Move className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-xs">
            <span className="text-slate-300">Đang kéo {dragItem.type === 'folder' ? 'thư mục' : 'tệp'}: </span>
            <span className="font-bold text-white">"{dragItem.name}"</span>
            <span className="text-blue-300 ml-2">→ Thả vào thư mục bất kỳ để gộp / chuyển</span>
          </div>
          <button
            onClick={() => {
              setDragItem(null);
              setDragOverFolderId(null);
            }}
            className="ml-2 px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            Hủy (Esc)
          </button>
        </div>
      )}
    </div>
  );
};
