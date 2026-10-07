import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Calendar,
  Building2,
  Download,
  Printer,
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
  Lock,
  KeyRound,
  Tag,
  Folder,
  FolderPlus,
  LayoutGrid,
  List,
  PanelLeft,
  PanelLeftClose,
  Layers,
  Move,
  X,
  FileSpreadsheet,
  FileCode,
  FileImage,
  File,
  SlidersHorizontal
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  // Drag & drop item state
  const [dragItem, setDragItem] = useState<{ id: string; type: 'folder' | 'file'; name: string } | null>(null);

  // Active filters count
  const activeFiltersCount = [
    statusFilter !== 'ALL',
    securityFilter !== 'ALL',
    typeFilter !== 'ALL',
    departmentFilter !== 'ALL',
    Boolean(startDate),
    Boolean(endDate)
  ].filter(Boolean).length;

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
  }, [activeTab, currentFolderId, sortBy, sortOrder, limit, statusFilter, securityFilter, typeFilter, departmentFilter]);

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
    try {
      if (doc.hasPassword) {
        const pass = window.prompt(`Vui lòng nhập mật khẩu tài liệu "${doc.name}":`);
        if (!pass) return;

        const res = await api.get(`/documents/${doc.id}/download`, {
          params: { password: pass },
          responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', doc.fileName || doc.name);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast('success', 'Tải tài liệu thành công');
        return;
      }

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
      toast('success', 'Tải tài liệu thành công');
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Không thể tải file (Kiểm tra quyền hạn hoặc mật khẩu)');
    }
  };

  const handlePrint = async (doc: any) => {
    try {
      let url = `/api/documents/${doc.id}/file`;
      if (doc.hasPassword) {
        const pass = window.prompt(`Vui lòng nhập mật khẩu tài liệu "${doc.name}" để in:`);
        if (!pass) return;
        url += `?password=${encodeURIComponent(pass)}`;
      }

      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.focus();
      } else {
        toast('warning', 'Trình duyệt đang chặn cửa sổ pop-up in ấn');
      }
    } catch (err: any) {
      toast('error', 'Lỗi khi mở giao diện in ấn');
    }
  };

  const handleToggleLiquidate = async (doc: any) => {
    const isCurrentlyLiquidated = doc.status === 'LIQUIDATED';
    const actionText = isCurrentlyLiquidated ? 'hủy thanh lý' : 'nghiệm thu / thanh lý';
    if (!window.confirm(`Bạn có chắc muốn ${actionText} tài liệu "${doc.name}"?`)) return;

    try {
      const res = await api.put(`/documents/${doc.id}/status`, {
        status: isCurrentlyLiquidated ? 'ACTIVE' : 'LIQUIDATED'
      });
      if (res.data.success) {
        toast('success', `Đã cập nhật trạng thái thành công`);
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

  // Helper file icon renderer
  const getFileIcon = (fileName = '', ext = '') => {
    const extension = (ext || fileName.split('.').pop() || '').toLowerCase();
    if (['pdf'].includes(extension)) {
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-rose-100">
          PDF
        </div>
      );
    }
    if (['doc', 'docx'].includes(extension)) {
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-blue-100">
          DOC
        </div>
      );
    }
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-emerald-100">
          XLS
        </div>
      );
    }
    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      return (
        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-purple-100">
          IMG
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200">
        FILE
      </div>
    );
  };

  // Status badge with clean soft design
  const getStatusBadge = (status: string, daysLeft: number | null) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Hiệu lực
          </span>
        );
      case 'EXPIRING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Sắp hết hạn
            {daysLeft !== null && daysLeft >= 0 && (
              <span className="text-[10px] font-mono font-bold">({daysLeft}d)</span>
            )}
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Hết hạn
          </span>
        );
      case 'LIQUIDATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
            Mật
          </span>
        );
      case 'INTERNAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
            Nội bộ
          </span>
        );
      case 'PUBLIC':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Công khai
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
            {level}
          </span>
        );
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 bg-slate-50 overflow-hidden relative">
      {/* 1. LEFT PANEL: Enterprise Folder Tree */}
      <aside
        className={`${
          isTreeCollapsed ? 'w-0 -ml-1 border-r-0' : 'w-64 border-r border-slate-200/80'
        } bg-white flex flex-col shrink-0 transition-all duration-300 overflow-hidden z-20`}
      >
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-xs text-slate-800">Thư mục</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setCreateFolderParentId(null);
                setIsCreateFolderOpen(true);
              }}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
              title="Tạo thư mục mới ở Root"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsTreeCollapsed(true)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Thu gọn cây thư mục"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
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
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 lg:p-6 space-y-4">
        {/* Top Header Bar: Clean Breadcrumb & Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {isTreeCollapsed && (
              <button
                onClick={() => setIsTreeCollapsed(false)}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
            >
              <FolderPlus className="w-3.5 h-3.5 text-slate-500" />
              <span>Thư mục mới</span>
            </button>

            <button
              onClick={() => setIsCreateDocOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tải tài liệu</span>
            </button>

            <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50 ml-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Chế độ xem Bảng"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Chế độ xem Lưới"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Unified Controls: Segmented Tabs on Left + Search & Filter on Right */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Segmented Status Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl overflow-x-auto shrink-0">
              <button
                onClick={() => handleSelectTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>

              <button
                onClick={() => handleSelectTab('my_docs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'my_docs'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Của tôi
              </button>

              <button
                onClick={() => handleSelectTab('expiring')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'expiring'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                <span>Sắp hết hạn</span>
              </button>

              <button
                onClick={() => handleSelectTab('liquidated')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'liquidated'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đã thanh lý
              </button>
            </div>

            {/* Search Input & Advanced Filter Toggle */}
            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Tìm theo tên, mã hợp đồng, đối tác..."
                  className="w-full text-xs pl-8 pr-8 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchKeyword('');
                      setTimeout(() => fetchDocuments(1), 0);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Filter Button with Count Badge */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Bộ lọc</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                  title="Xóa tất cả bộ lọc"
                >
                  Đặt lại
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Advanced Filters Drawer */}
          {isFilterOpen && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs animate-in fade-in duration-150">
              {/* Trạng thái */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  Bảo mật
                </label>
                <select
                  value={securityFilter}
                  onChange={(e) => setSecurityFilter(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  Loại tài liệu
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả loại</option>
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
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Tất cả phòng ban</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Từ ngày */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Từ ngày
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-2 py-1 rounded-xl border border-slate-200 bg-white focus:outline-none"
                />
              </div>

              {/* Đến ngày */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Đến ngày
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-2 py-1 rounded-xl border border-slate-200 bg-white focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Subfolders Section: Clean minimal pills */}
        {folderData.subfolders && folderData.subfolders.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              <span>Thư mục con ({folderData.subfolders.length})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {folderData.subfolders.map((folder: any) => (
                <div
                  key={folder.id}
                  onClick={() => handleSelectFolder(String(folder.id))}
                  className="p-2.5 bg-white hover:bg-blue-50/40 rounded-xl border border-slate-200/80 hover:border-blue-300 shadow-2xs transition-all cursor-pointer group flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Folder className="w-5 h-5 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                        {folder.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {folder.file_count || 0} tệp
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1"
                    title="Xóa thư mục"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. DOCUMENTS LIST SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mb-2" />
              <span>Đang tải danh sách tài liệu...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-semibold text-slate-700">Chưa có tài liệu nào</div>
              <p className="text-slate-400 max-w-sm mx-auto">
                Thư mục hiện tại chưa có tài liệu. Bấm nút "Tải tài liệu" ở góc trên để thêm hồ sơ mới.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW: Clean, modern, balanced 6 columns */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 min-w-[260px]">Tài liệu / Văn bản</th>
                    <th className="py-3 px-3.5 min-w-[150px]">Phân loại & Đơn vị</th>
                    <th className="py-3 px-3.5 min-w-[140px]">Thời hạn & Hiệu lực</th>
                    <th className="py-3 px-3.5 min-w-[110px]">Bảo mật</th>
                    <th className="py-3 px-3.5 min-w-[120px]">Người lưu</th>
                    <th className="py-3 px-4 text-right min-w-[130px]">Thao tác</th>
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
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Cột 1: Tên văn bản + File icon + Mã + Version */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.fileName, doc.fileType)}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs truncate max-w-[280px]">
                                {doc.name}
                              </span>
                              {doc.hasPassword && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0"
                                  title="Được bảo vệ bằng mật khẩu"
                                >
                                  <Lock className="w-2.5 h-2.5 text-amber-600" /> Khóa mã
                                </span>
                              )}
                              {doc.version > 1 && (
                                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded shrink-0 border border-purple-200">
                                  v{doc.version}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-slate-600 font-semibold">{doc.documentCode}</span>
                              <span className="truncate max-w-[180px]">{doc.fileName}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Phân loại & Đơn vị */}
                      <td className="py-3 px-3.5">
                        <div className="font-medium text-slate-800 text-[11px]">
                          {doc.documentTypeName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate max-w-[140px]">{doc.departmentName}</span>
                        </div>
                      </td>

                      {/* Cột 3: Thời hạn & Hiệu lực */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="mb-1">{getStatusBadge(doc.status, doc.daysUntilExpiry)}</div>
                        <div className="text-[10px] text-slate-400">
                          {doc.expiryDate ? `Hạn: ${new Date(doc.expiryDate).toLocaleDateString('vi-VN')}` : 'Vô thời hạn'}
                        </div>
                      </td>

                      {/* Cột 4: Mức độ bảo mật */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {getSecurityBadge(doc.securityLevel)}
                      </td>

                      {/* Cột 5: Người lưu */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-medium text-slate-700 text-xs">{doc.uploaderName}</div>
                      </td>

                      {/* Cột 6: Thao tác trực tiếp */}
                      <td className="py-3 px-4 text-right whitespace-nowrap relative">
                        <div className="flex items-center justify-end gap-1">
                          {/* Preview button */}
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
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Xem trước tài liệu"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Download button */}
                          {doc.canDownload && (
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Tải về máy"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}

                          {/* Version history */}
                          <button
                            onClick={() => setVersionDoc(doc)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Lịch sử phiên bản"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* More dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuOpenId(actionMenuOpenId === doc.id ? null : doc.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {actionMenuOpenId === doc.id && (
                              <div
                                onClick={() => setActionMenuOpenId(null)}
                                className="absolute right-0 mt-1 w-48 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1 z-30 text-left divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
                              >
                                <div className="py-1">
                                  {doc.canDownload && (
                                    <button
                                      onClick={() => handlePrint(doc)}
                                      className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                                      <span>In ấn tài liệu</span>
                                    </button>
                                  )}

                                  {(doc.canAdmin || Number(doc.uploadedBy) === Number(user?.id) || user?.role === 'ADMIN') && (
                                    <button
                                      onClick={() => {
                                        setPasswordDoc(doc);
                                        setIsPasswordModalOpen(true);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                                      <span>{doc.hasPassword ? 'Đổi / Gỡ mật khẩu' : 'Cài mật khẩu'}</span>
                                    </button>
                                  )}

                                  {doc.canAdmin && (
                                    <button
                                      onClick={() => setPermissionDoc(doc)}
                                      className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Phân quyền tài liệu</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setMoveItem({ item: doc, type: 'file' })}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Move className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Di chuyển thư mục</span>
                                  </button>

                                  {doc.canEdit && (
                                    <button
                                      onClick={() => handleToggleLiquidate(doc)}
                                      className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Archive className="w-3.5 h-3.5 text-amber-600" />
                                      <span>
                                        {doc.status === 'LIQUIDATED' ? 'Hủy thanh lý' : 'Nghiệm thu / Thanh lý'}
                                      </span>
                                    </button>
                                  )}
                                </div>

                                {doc.canAdmin && (
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleDeleteDoc(doc)}
                                      className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
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
            /* GRID VIEW: Clean document cards */
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      {getFileIcon(doc.fileName, doc.fileType)}
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
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Xem trước"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {doc.canDownload && (
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded"
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
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Hiển thị <span className="font-bold text-slate-700">{documents.length}</span> /{' '}
              <span className="font-bold text-slate-700">{total}</span> tài liệu
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => fetchDocuments(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-slate-700">
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchDocuments(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* MODALS */}
      {isCreateFolderOpen && (
        <CreateFolderModal
          isOpen={isCreateFolderOpen}
          onClose={() => setIsCreateFolderOpen(false)}
          parentId={createFolderParentId}
          tree={tree}
          onSuccess={() => {
            fetchTree();
            fetchFolderContents();
          }}
        />
      )}

      {isCreateDocOpen && (
        <CreateDocumentModal
          isOpen={isCreateDocOpen}
          onClose={() => setIsCreateDocOpen(false)}
          initialFolderId={currentFolderId}
          onSuccess={() => {
            fetchDocuments(1);
            fetchFolderContents();
            fetchTree();
          }}
        />
      )}

      {moveItem && (
        <MoveModal
          isOpen={Boolean(moveItem)}
          onClose={() => setMoveItem(null)}
          item={moveItem.item}
          type={moveItem.type}
          onSuccess={() => {
            fetchTree();
            fetchFolderContents();
            fetchDocuments(page);
          }}
        />
      )}

      {versionDoc && (
        <DocumentVersionsModal
          isOpen={Boolean(versionDoc)}
          onClose={() => setVersionDoc(null)}
          documentId={versionDoc.id}
          documentTitle={versionDoc.name}
          canEdit={Boolean(versionDoc.canEdit)}
          onVersionUploaded={() => {
            fetchDocuments(page);
          }}
        />
      )}

      {permissionDoc && (
        <DocumentPermissionsModal
          isOpen={Boolean(permissionDoc)}
          onClose={() => setPermissionDoc(null)}
          documentId={permissionDoc.id}
          documentTitle={permissionDoc.name}
          onPermissionsUpdated={() => {
            fetchDocuments(page);
          }}
        />
      )}

      {isPasswordModalOpen && passwordDoc && (
        <SetPasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setPasswordDoc(null);
          }}
          file={passwordDoc}
          onSuccess={() => {
            fetchDocuments(page);
          }}
        />
      )}

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          isOpen={Boolean(previewFile)}
          onClose={() => setPreviewFile(null)}
          onDownload={(file, password) => handleDownload({ ...file, password })}
        />
      )}
    </div>
  );
};
