import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Calendar,
  Clock,
  Shield,
  Building2,
  Download,
  Printer,
  Edit2,
  Trash2,
  History,
  Users,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Archive,
  RefreshCw,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Lock,
  KeyRound,
  Tag,
  Folder,
  FolderOpen,
  FolderPlus,
  LayoutGrid,
  List,
  PanelLeft,
  PanelLeftClose,
  Layers,
  Move,
  Home
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { FolderTree, TreeNode } from '../components/dataroom/FolderTree';
import { CreateFolderModal } from '../components/dataroom/CreateFolderModal';
import { MoveModal } from '../components/dataroom/MoveModal';
import { CreateDocumentModal } from '../components/dms/CreateDocumentModal';
import { DocumentVersionsModal } from '../components/dms/DocumentVersionsModal';
import { DocumentPermissionsModal } from '../components/dms/DocumentPermissionsModal';
import { FilePreviewModal } from '../components/dataroom/FilePreviewModal';
import { SetPasswordModal } from '../components/dataroom/SetPasswordModal';

export const DocumentListPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab: 'all' | 'my_docs' | 'expiring' | 'liquidated'
  const activeTab = searchParams.get('tab') || 'all';
  // Folder ID from URL param
  const currentFolderId = searchParams.get('folderId') || null;

  // Folder Tree & Folder Contents
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [folderData, setFolderData] = useState<any>({
    breadcrumbs: [{ id: null, name: 'Tất cả tài liệu' }],
    subfolders: [],
    currentFolderPermissions: {}
  });
  const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Documents state
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filter Bar Form States
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateType, setDateType] = useState<'published_date' | 'expiry_date'>('published_date');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [securityFilter, setSecurityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Dropdown categories
  const [types, setTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Modals state
  const [isCreateDocOpen, setIsCreateDocOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [versionDoc, setVersionDoc] = useState<any | null>(null);
  const [permissionDoc, setPermissionDoc] = useState<any | null>(null);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [passwordDoc, setPasswordDoc] = useState<any | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [moveItem, setMoveItem] = useState<{ item: any; type: 'folder' | 'file' } | null>(null);

  // Dropdown action row
  const [actionMenuOpenId, setActionMenuOpenId] = useState<number | string | null>(null);
  const [folderActionMenuId, setFolderActionMenuId] = useState<number | string | null>(null);

  // Drag & drop item state
  const [dragItem, setDragItem] = useState<{ id: string; type: 'folder' | 'file'; name: string } | null>(null);

  // Fetch Folder Tree
  const fetchTree = async () => {
    try {
      const res = await api.get('/folders/tree');
      if (res.data.success) {
        setTree(res.data.tree || []);
      }
    } catch (e) {
      console.error('fetchTree error:', e);
    }
  };

  // Fetch Folder Contents (breadcrumbs & subfolders)
  const fetchFolderContents = async () => {
    try {
      const url = currentFolderId ? `/folders/${currentFolderId}/contents` : '/folders/contents';
      const res = await api.get(url);
      if (res.data.success) {
        setFolderData(res.data);
      }
    } catch (err: any) {
      console.error('fetchFolderContents error:', err);
    }
  };

  // Fetch dropdown categories
  useEffect(() => {
    fetchTree();

    api.get('/document-types').then(res => {
      if (res.data.success) setTypes(res.data.types || []);
    }).catch(() => {});

    api.get('/departments').then(res => {
      if (res.data.success) setDepartments(res.data.data?.data || res.data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchFolderContents();
  }, [currentFolderId]);

  // Fetch documents with multi-filter and folder
  const fetchDocuments = async (customPage = page) => {
    setLoading(true);
    try {
      const params: any = {
        page: customPage,
        limit,
        tab: activeTab,
        sortBy,
        sortOrder
      };

      if (currentFolderId) {
        params.folder_id = currentFolderId;
      }

      if (searchKeyword.trim()) params.search = searchKeyword.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (securityFilter !== 'ALL') params.security_level = securityFilter;
      if (typeFilter !== 'ALL') params.document_type_id = typeFilter;
      if (departmentFilter !== 'ALL') params.department_id = departmentFilter;
      if (startDate) {
        params.startDate = startDate;
        params.dateType = dateType;
      }
      if (endDate) {
        params.endDate = endDate;
        params.dateType = dateType;
      }

      const res = await api.get('/documents', { params });
      if (res.data.success) {
        setDocuments(res.data.documents || []);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.totalPages || 1);
        setPage(res.data.pagination.page);
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(1);
  }, [activeTab, currentFolderId, sortBy, sortOrder, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setDateType('published_date');
    setStartDate('');
    setEndDate('');
    setStatusFilter('ALL');
    setSecurityFilter('ALL');
    setTypeFilter('ALL');
    setDepartmentFilter('ALL');
    setTimeout(() => {
      fetchDocuments(1);
    }, 0);
  };

  const handleSelectFolder = (folderId: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (folderId) {
      newParams.set('folderId', folderId);
    } else {
      newParams.delete('folderId');
    }
    setSearchParams(newParams);
  };

  const handleSelectTab = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'all') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams);
  };

  const handleDeleteFolder = async (folder: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thư mục "${folder.name}" và các thư mục/tệp bên trong?`)) {
      return;
    }

    try {
      const res = await api.delete(`/folders/${folder.id}`);
      if (res.data.success) {
        toast('success', 'Đã xóa thư mục thành công');
        fetchTree();
        fetchFolderContents();
        if (currentFolderId === String(folder.id)) {
          handleSelectFolder(null);
        }
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khi xóa thư mục');
    }
  };

  const handleDownload = async (doc: any) => {
    const isOwner = Number(doc.uploadedBy) === Number(user?.id);
    const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

    // Nếu tài liệu có mật mã bảo vệ và không phải tác giả/admin, mở Preview Modal để nhập mật mã tải tệp
    if (doc.hasPassword && !isOwner && !isAdmin) {
      setPreviewFile({
        id: doc.id,
        name: doc.name,
        fileName: doc.fileName,
        extension: doc.fileType,
        url: `/api/documents/${doc.id}/file`,
        previewUrl: `/api/documents/${doc.id}/file`,
        hasPassword: true,
        isEncrypted: true
      });
      return;
    }

    try {
      const res = await api.get(`/documents/${doc.id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName || doc.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast('success', `Đang tải xuống: ${doc.fileName || doc.name}`);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.data?.code === 'PASSWORD_REQUIRED') {
        setPreviewFile({
          id: doc.id,
          name: doc.name,
          fileName: doc.fileName,
          extension: doc.fileType,
          url: `/api/documents/${doc.id}/file`,
          previewUrl: `/api/documents/${doc.id}/file`,
          hasPassword: true,
          isEncrypted: true
        });
      } else {
        toast('error', err.response?.data?.message || 'Lỗi khi tải xuống tài liệu');
      }
    }
  };

  const handlePrint = async (doc: any) => {
    try {
      await api.post(`/documents/${doc.id}/print`);
      setPreviewFile({
        id: doc.id,
        name: doc.name,
        fileName: doc.fileName,
        extension: doc.fileType,
        url: `/api/documents/${doc.id}/file`,
        previewUrl: `/api/documents/${doc.id}/file`,
        hasPassword: doc.hasPassword,
        isEncrypted: doc.hasPassword || doc.isEncrypted
      });
    } catch (err: any) {
      toast('error', 'Lỗi khi chuẩn bị in tài liệu');
    }
  };

  const handleToggleLiquidate = async (doc: any) => {
    const isLiquidated = doc.status === 'LIQUIDATED';
    const newStatus = isLiquidated ? 'ACTIVE' : 'LIQUIDATED';
    const confirmMsg = isLiquidated
      ? 'Khôi phục tài liệu về trạng thái Hiệu lực?'
      : 'Xác nhận chuyển tài liệu sang trạng thái Đã nghiệm thu / Thanh lý?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.put(`/documents/${doc.id}`, { status: newStatus });
      if (res.data.success) {
        toast('success', isLiquidated ? 'Đã kích hoạt lại tài liệu' : 'Đã thanh lý tài liệu');
        fetchDocuments(page);
      }
    } catch (err: any) {
      toast('error', 'Không thể cập nhật trạng thái tài liệu');
    }
  };

  const handleDeleteDoc = async (doc: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu [${doc.documentCode}] "${doc.name}"?`)) {
      return;
    }

    try {
      const res = await api.delete(`/documents/${doc.id}`);
      if (res.data.success) {
        toast('success', 'Đã chuyển tài liệu vào thùng rác');
        fetchDocuments(page);
        fetchFolderContents();
      }
    } catch (err: any) {
      toast('error', 'Lỗi khi xóa tài liệu');
    }
  };

  // Drag & drop drop handler on folder tree node
  const handleDropOnFolder = async (targetFolderId: string | null) => {
    if (!dragItem) return;

    try {
      if (dragItem.type === 'folder') {
        const res = await api.put(`/folders/${dragItem.id}/move`, { targetParentId: targetFolderId });
        if (res.data.success) {
          toast('success', 'Đã di chuyển thư mục');
          fetchTree();
          fetchFolderContents();
        }
      } else {
        const res = await api.put(`/documents/${dragItem.id}`, { folder_id: targetFolderId ? Number(targetFolderId) : 1 });
        if (res.data.success) {
          toast('success', 'Đã di chuyển tài liệu vào thư mục');
          fetchDocuments(page);
          fetchFolderContents();
        }
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Không thể di chuyển đối tượng');
    } finally {
      setDragItem(null);
    }
  };

  // Helper render badges
  const getStatusBadge = (status: string, daysLeft: number | null) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Hiệu lực
          </span>
        );
      case 'EXPIRING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Sắp hết hạn
            {daysLeft !== null && daysLeft >= 0 && (
              <span className="font-mono text-[10px]">({daysLeft}d)</span>
            )}
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" /> Hết hiệu lực
          </span>
        );
      case 'LIQUIDATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Archive className="w-3 h-3 text-slate-400" /> Đã thanh lý
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const getSecurityBadge = (level: string) => {
    switch (level) {
      case 'CONFIDENTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Shield className="w-3 h-3 text-rose-500" /> Mật
          </span>
        );
      case 'INTERNAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Building2 className="w-3 h-3 text-blue-500" /> Nội bộ
          </span>
        );
      case 'PUBLIC':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileText className="w-3 h-3 text-emerald-500" /> Công khai
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
            {level}
          </span>
        );
    }
  };

  const getPermissionBadge = (perm: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-purple-50 text-purple-700 border-purple-200 font-bold',
      EDIT: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
      DOWNLOAD: 'bg-sky-50 text-sky-700 border-sky-200 font-semibold',
      VIEW: 'bg-slate-100 text-slate-600 border-slate-200',
      NONE: 'bg-slate-50 text-slate-400 border-slate-200'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] border ${styles[perm] || styles.VIEW}`}>
        {perm}
      </span>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 bg-slate-50 overflow-hidden relative">
      {/* 1. LEFT PANEL: Enterprise Folder Tree */}
      <aside
        className={`${
          isTreeCollapsed ? 'w-0 -ml-1 border-r-0' : 'w-72 border-r border-slate-200'
        } bg-white flex flex-col shrink-0 transition-all duration-300 overflow-hidden z-20`}
      >
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 leading-tight">Cây Thư Mục</div>
              <div className="text-[10px] text-slate-500">Kho dữ liệu Data Room</div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setCreateFolderParentId(null);
                setIsCreateFolderOpen(true);
              }}
              className="p-1 rounded-lg hover:bg-slate-200/80 text-blue-600 hover:text-blue-700 transition-colors"
              title="Tạo thư mục mới ở Root"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsTreeCollapsed(true)}
              className="p-1 rounded-lg hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 transition-colors"
              title="Thu gọn cây thư mục"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Root Button */}
        <div className="p-2 border-b border-slate-100">
          <button
            onClick={() => handleSelectFolder(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              currentFolderId === null
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building2 className={`w-4 h-4 ${currentFolderId === null ? 'text-white' : 'text-blue-600'}`} />
            <span className="flex-1 text-left">Tất cả tài liệu công ty</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                currentFolderId === null ? 'bg-blue-500 text-white' : 'bg-slate-200/70 text-slate-600'
              }`}
            >
              Root
            </span>
          </button>
        </div>

        {/* Folder Tree Scrollable List */}
        <div className="flex-1 overflow-y-auto p-2">
          <FolderTree
            tree={tree}
            selectedFolderId={currentFolderId}
            onSelectFolder={(id) => handleSelectFolder(id)}
            dragItem={dragItem}
            onDropItem={(targetId) => handleDropOnFolder(targetId)}
            onDragStartItem={(item) => setDragItem(item)}
            onDragEndItem={() => setDragItem(null)}
            onDeleteFolder={(folder) => handleDeleteFolder(folder)}
            onCreateRootFolder={() => {
              setCreateFolderParentId(null);
              setIsCreateFolderOpen(true);
            }}
          />
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50/60 p-4 lg:p-6 space-y-4">
        {/* Top Header Bar: Breadcrumbs & Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {isTreeCollapsed && (
              <button
                onClick={() => setIsTreeCollapsed(false)}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                title="Mở cây thư mục"
              >
                <PanelLeft className="w-4 h-4 text-blue-600" />
              </button>
            )}

            {/* Breadcrumb Navigation */}
            <div className="min-w-0 flex-1">
              <Breadcrumb
                items={folderData.breadcrumbs || [{ id: null, name: 'Tất cả tài liệu' }]}
                onSelect={(id) => handleSelectFolder(id)}
                dragItem={dragItem}
                onDropItem={(id) => handleDropOnFolder(id)}
              />
            </div>
          </div>

          {/* Quick Actions & View Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setCreateFolderParentId(currentFolderId);
                setIsCreateFolderOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
            >
              <FolderPlus className="w-4 h-4 text-amber-500" />
              <span>Thư mục mới</span>
            </button>

            <button
              onClick={() => setIsCreateDocOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tải tài liệu mới</span>
            </button>

            <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50 ml-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Chế độ xem Bảng"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Chế độ xem Lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 4 DMS Status Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => handleSelectTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tất cả tài liệu</span>
          </button>

          <button
            onClick={() => handleSelectTab('my_docs')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my_docs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tài liệu của tôi</span>
          </button>

          <button
            onClick={() => handleSelectTab('expiring')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'expiring'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Sắp hết hạn</span>
          </button>

          <button
            onClick={() => handleSelectTab('liquidated')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'liquidated'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Đã nghiệm thu / Thanh lý</span>
          </button>
        </div>

        {/* Multi-filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          {/* Row 1: Search keyword */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm tài liệu theo tiêu đề, số hợp đồng, đối tác, trích yếu, mã văn bản..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tìm kiếm</span>
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </form>

          {/* Row 2: Metadata dropdown filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {/* Trạng thái */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Hiệu lực</option>
                <option value="EXPIRING">Sắp hết hạn</option>
                <option value="EXPIRED">Hết hiệu lực</option>
                <option value="LIQUIDATED">Đã thanh lý</option>
              </select>
            </div>

            {/* Mức độ bảo mật */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Mức độ bảo mật
              </label>
              <select
                value={securityFilter}
                onChange={(e) => setSecurityFilter(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả bảo mật</option>
                <option value="CONFIDENTIAL">Mật (Confidential)</option>
                <option value="INTERNAL">Nội bộ (Internal)</option>
                <option value="PUBLIC">Công khai (Public)</option>
              </select>
            </div>

            {/* Phân loại văn bản */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Phân loại
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả loại văn bản</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Phòng ban */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Phòng ban
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tất cả phòng ban</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Ngày áp dụng */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Theo ngày
              </label>
              <select
                value={dateType}
                onChange={(e: any) => setDateType(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="published_date">Ngày ban hành</option>
                <option value="expiry_date">Ngày hết hạn</option>
              </select>
            </div>

            {/* Khoảng ngày */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Khoảng ngày
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 text-[11px] px-1.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                  title="Từ ngày"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 text-[11px] px-1.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
                  title="Đến ngày"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subfolders Grid Section (if current folder has subfolders) */}
        {folderData.subfolders && folderData.subfolders.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-amber-500" />
              <span>Thư mục con ({folderData.subfolders.length})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {folderData.subfolders.map((folder: any) => (
                <div
                  key={folder.id}
                  onClick={() => handleSelectFolder(String(folder.id))}
                  className="p-3 bg-white hover:bg-blue-50/50 rounded-2xl border border-slate-200/80 hover:border-blue-300 shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Folder className="w-7 h-7 text-amber-500 fill-amber-400/30 group-hover:scale-105 transition-transform" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1"
                      title="Xóa thư mục"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-2">
                    <div className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {folder.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {folder.file_count || 0} tệp tin
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. DOCUMENTS LIST SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
              <span>Đang tải danh sách tài liệu...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-semibold text-slate-700">Không tìm thấy tài liệu phù hợp</div>
              <p className="text-slate-400">Hãy thử điều chỉnh bộ lọc hoặc bấm "Tải tài liệu mới" để thêm tài liệu</p>
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW: Responsive, Balanced 6-Column Layout - Won't break or overflow */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 min-w-[260px] w-2/5">Văn bản & Tài liệu</th>
                    <th className="py-3 px-3.5 min-w-[150px]">Phân loại & Đơn vị</th>
                    <th className="py-3 px-3.5 min-w-[140px]">Thời hạn</th>
                    <th className="py-3 px-3.5 min-w-[140px]">Trạng thái & Bảo mật</th>
                    <th className="py-3 px-3.5 min-w-[120px]">Người lưu</th>
                    <th className="py-3 px-2 text-center w-[60px]">Xem file</th>
                    <th className="py-3 px-4 text-right min-w-[140px]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      draggable
                      onDragStart={(e) => {
                        setDragItem({ id: String(doc.id), type: 'file', name: doc.name });
                        e.dataTransfer.setData('text/plain', JSON.stringify({ id: doc.id, type: 'file', name: doc.name }));
                      }}
                      onDragEnd={() => setDragItem(null)}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Cột 1: Văn bản & Tài liệu */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs line-clamp-1">{doc.name}</span>
                          {doc.hasPassword && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0"
                              title="Tài liệu được bảo vệ bằng mật khẩu"
                            >
                              <Lock className="w-2.5 h-2.5 text-amber-600" />
                              Khóa mã
                            </span>
                          )}
                          {doc.version > 1 && (
                            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-700 px-1 py-0.2 rounded shrink-0">
                              V{doc.version}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded text-[10px] font-semibold">
                            {doc.documentCode}
                          </span>
                          <span className="font-mono text-slate-500 truncate max-w-[180px]">
                            {doc.fileName}
                          </span>
                          {doc.partnerName && (
                            <span className="text-slate-500 truncate max-w-[140px]">
                              • ĐT: {doc.partnerName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 2: Phân loại & Đơn vị */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {doc.documentTypeName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[130px]">{doc.departmentName}</span>
                        </div>
                        {doc.folderName && (
                          <div className="text-[10px] text-amber-700 flex items-center gap-1 mt-0.5">
                            <Folder className="w-3 h-3 text-amber-500" />
                            <span className="truncate max-w-[130px]">{doc.folderName}</span>
                          </div>
                        )}
                      </td>

                      {/* Cột 3: Thời hạn */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="text-[11px] text-slate-700">
                          Ban hành: {doc.publishedDate ? new Date(doc.publishedDate).toLocaleDateString('vi-VN') : '—'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Hết hạn: {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                        </div>
                      </td>

                      {/* Cột 4: Trạng thái & Bảo mật */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(doc.status, doc.daysUntilExpiry)}
                          {getSecurityBadge(doc.securityLevel)}
                        </div>
                      </td>

                      {/* Cột 5: Người lưu & Quyền */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <div className="font-medium text-slate-800 text-xs">{doc.uploaderName}</div>
                        <div className="mt-1">{getPermissionBadge(doc.userPermission)}</div>
                      </td>

                      {/* Cột 6: Xem file button */}
                      <td className="py-3.5 px-2 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setPreviewFile({
                              id: doc.id,
                              name: doc.name,
                              fileName: doc.fileName,
                              extension: doc.fileType,
                              url: `/api/documents/${doc.id}/file`,
                              previewUrl: `/api/documents/${doc.id}/file`,
                              hasPassword: doc.hasPassword,
                              isEncrypted: doc.hasPassword || doc.isEncrypted
                            });
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-100/70 rounded-lg transition-colors cursor-pointer"
                          title="Xem trước văn bản"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap relative">
                        <div className="flex items-center justify-end gap-1">
                          {/* Download button if permitted */}
                          {doc.canDownload && (
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Tải về máy"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Print button if permitted */}
                          {doc.canDownload && (
                            <button
                              onClick={() => handlePrint(doc)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="In tài liệu"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Version history */}
                          <button
                            onClick={() => setVersionDoc(doc)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Lịch sử phiên bản"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {/* More dropdown button */}
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuOpenId(actionMenuOpenId === doc.id ? null : doc.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Popover Action Menu */}
                            {actionMenuOpenId === doc.id && (
                              <div
                                onClick={() => setActionMenuOpenId(null)}
                                className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-left divide-y divide-slate-100"
                              >
                                <div className="py-1">
                                  {(doc.canAdmin || Number(doc.uploadedBy) === Number(user?.id) || user?.role === 'ADMIN') && (
                                    <button
                                      onClick={() => {
                                        setPasswordDoc(doc);
                                        setIsPasswordModalOpen(true);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                                    >
                                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                                      <span>{doc.hasPassword ? 'Đổi / Gỡ mật khẩu' : 'Cài đặt mật khẩu'}</span>
                                    </button>
                                  )}

                                  {doc.canAdmin && (
                                    <button
                                      onClick={() => setPermissionDoc(doc)}
                                      className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Phân quyền tài liệu</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setMoveItem({ item: doc, type: 'file' })}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Move className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Di chuyển thư mục</span>
                                  </button>

                                  {doc.canEdit && (
                                    <button
                                      onClick={() => handleToggleLiquidate(doc)}
                                      className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <Archive className="w-3.5 h-3.5 text-amber-600" />
                                      <span>
                                        {doc.status === 'LIQUIDATED' ? 'Hủy thanh lý' : 'Thanh lý / Nghiệm thu'}
                                      </span>
                                    </button>
                                  )}
                                </div>

                                {doc.canAdmin && (
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleDeleteDoc(doc)}
                                      className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Xóa tài liệu</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRID VIEW: Responsive Cards */
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-mono font-bold text-xs uppercase">
                        {doc.fileType || 'DOC'}
                      </div>
                      <div className="flex items-center gap-1">
                        {doc.hasPassword && <Lock className="w-3.5 h-3.5 text-amber-600" />}
                        {getSecurityBadge(doc.securityLevel)}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {doc.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {doc.documentCode}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-2 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>{doc.documentTypeName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{doc.departmentName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>{getStatusBadge(doc.status, doc.daysUntilExpiry)}</div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setPreviewFile({
                            id: doc.id,
                            name: doc.name,
                            fileName: doc.fileName,
                            extension: doc.fileType,
                            url: `/api/documents/${doc.id}/file`,
                            previewUrl: `/api/documents/${doc.id}/file`,
                            hasPassword: doc.hasPassword,
                            isEncrypted: doc.hasPassword || doc.isEncrypted
                          });
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Xem trước"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {doc.canDownload && (
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded"
                          title="Tải về"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Bar */}
          <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Hiển thị <span className="font-bold text-slate-700">{documents.length}</span> trên tổng số{' '}
              <span className="font-bold text-slate-700">{total}</span> tài liệu
            </div>

            <div className="flex items-center gap-2">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="text-xs px-2 py-1 rounded-lg border border-slate-200 bg-white"
              >
                <option value={10}>10 dòng / trang</option>
                <option value={20}>20 dòng / trang</option>
                <option value={50}>50 dòng / trang</option>
              </select>

              <button
                disabled={page <= 1}
                onClick={() => fetchDocuments(page - 1)}
                className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-slate-700 px-1">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchDocuments(page + 1)}
                className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ALL MODALS INTEGRATED */}

      {/* 1. Modal Upload tài liệu mới (Hỗ trợ folderId, metadata, naming rule, mật khẩu) */}
      <CreateDocumentModal
        isOpen={isCreateDocOpen}
        initialFolderId={currentFolderId}
        onClose={() => setIsCreateDocOpen(false)}
        onSuccess={() => {
          fetchDocuments(1);
          fetchFolderContents();
        }}
      />

      {/* 2. Modal Tạo Thư mục mới */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        parentId={createFolderParentId}
        tree={tree}
        onClose={() => setIsCreateFolderOpen(false)}
        onSuccess={() => {
          fetchTree();
          fetchFolderContents();
        }}
      />

      {/* 3. Modal Di chuyển (Move file or folder) */}
      {moveItem && (
        <MoveModal
          isOpen={!!moveItem}
          item={moveItem.item}
          type={moveItem.type}
          onClose={() => setMoveItem(null)}
          onSuccess={() => {
            fetchTree();
            fetchFolderContents();
            fetchDocuments(page);
          }}
        />
      )}

      {/* 4. Modal Phiên bản */}
      {versionDoc && (
        <DocumentVersionsModal
          isOpen={!!versionDoc}
          documentId={versionDoc.id}
          documentTitle={versionDoc.name}
          canEdit={versionDoc.canEdit}
          onClose={() => setVersionDoc(null)}
          onVersionUploaded={() => fetchDocuments(page)}
        />
      )}

      {/* 5. Modal Phân quyền */}
      {permissionDoc && (
        <DocumentPermissionsModal
          isOpen={!!permissionDoc}
          documentId={permissionDoc.id}
          documentTitle={permissionDoc.name}
          onClose={() => setPermissionDoc(null)}
          onPermissionsUpdated={() => fetchDocuments(page)}
        />
      )}

      {/* 6. Modal Cài đặt / Đổi mật mã bảo vệ */}
      {isPasswordModalOpen && passwordDoc && (
        <SetPasswordModal
          isOpen={isPasswordModalOpen}
          file={passwordDoc}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setPasswordDoc(null);
          }}
          onSuccess={() => fetchDocuments(page)}
        />
      )}

      {/* 7. Modal Xem file trực tiếp (Preview, Print, Password Unlock) */}
      {previewFile && (
        <FilePreviewModal
          isOpen={!!previewFile}
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
};
