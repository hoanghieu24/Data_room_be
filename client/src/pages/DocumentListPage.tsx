import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  Plus,
  Building2,
  Download,
  Printer,
  Trash2,
  History,
  Users,
  Eye,
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
  FolderOpen,
  LayoutGrid,
  List,
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
  Move,
  X,
  SlidersHorizontal,
  UploadCloud,
  ArrowUpLeft,
  Clock,
  Sparkles,
  Edit2,
  Check,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileImage,
  FileCode,
  File,
  Image as ImageIcon,
  Info,
  MoreHorizontal
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { FolderTree, TreeNode, FileMiniBadge, globalDragItem } from '../components/dataroom/FolderTree';
import { CreateFolderModal } from '../components/dataroom/CreateFolderModal';
import { MoveModal } from '../components/dataroom/MoveModal';
import { CreateDocumentModal } from '../components/dms/CreateDocumentModal';
import { DocumentVersionsModal } from '../components/dms/DocumentVersionsModal';
import { DocumentPermissionsModal } from '../components/dms/DocumentPermissionsModal';
import { FilePreviewModal } from '../components/dataroom/FilePreviewModal';
import { SetPasswordModal } from '../components/dataroom/SetPasswordModal';
import { SmartDocumentManagerModal } from '../components/dms/SmartDocumentManagerModal';

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
  const [rootFiles, setRootFiles] = useState<any[]>([]);
  const [folderData, setFolderData] = useState<any>({
    breadcrumbs: [{ id: null, name: 'Tất cả tài liệu' }],
    subfolders: [],
    currentFolderPermissions: {}
  });
  const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Inspector & selection state
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<any | null>(null);
  const [folderInspectFiles, setFolderInspectFiles] = useState<any[]>([]);
  const [loadingFolderInspect, setLoadingFolderInspect] = useState(false);
  const [isSmartManagerOpen, setIsSmartManagerOpen] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);

  // Drag & drop state for direct file upload from desktop
  const [isDraggingOverScreen, setIsDraggingOverScreen] = useState(false);
  const dragCounter = useRef(0);
  const quickFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingQuick, setUploadingQuick] = useState(false);

  // Quick Filter Chips: 'ALL' | 'PDF' | 'DOC' | 'XLS' | 'IMG' | 'EXPIRING' | 'MY_DOCS'
  const [quickFilter, setQuickFilter] = useState<string>('ALL');

  // Filter Bar Form States
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateType, setDateType] = useState<'published_date' | 'expiry_date'>('published_date');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [securityFilter, setSecurityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState(() => searchParams.get('department_id') || 'ALL');

  useEffect(() => {
    const deptId = searchParams.get('department_id');
    if (deptId) {
      setDepartmentFilter(deptId);
    }
  }, [searchParams]);

  // Sorting
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Dropdown categories
  const [types, setTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Tab điều hướng ở Sidebar bên trái: 'tree' (Cây thư mục) | 'department' (Phòng ban)
  const [sidebarTab, setSidebarTab] = useState<'tree' | 'department'>('tree');
  const [dragOverDeptId, setDragOverDeptId] = useState<number | null>(null);

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
  const [folderMenuOpenId, setFolderMenuOpenId] = useState<number | string | null>(null);

  // Drag & drop item state between folders
  const [dragItem, setDragItem] = useState<{ id: string; type: 'folder' | 'file'; name: string } | null>(null);
  const [dragOverFolderCardId, setDragOverFolderCardId] = useState<number | string | null>(null);

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
        setRootFiles(res.data.rootFiles || []);
      }
    } catch (e) {
      console.error('fetchTree error:', e);
    }
  };

  // Fetch Departments with document counts
  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments?limit=100');
      if (res.data.success) {
        setDepartments(res.data.data?.data || res.data.data || []);
      }
    } catch (e) {
      console.error('fetchDepartments error:', e);
    }
  };

  // Fetch Folder Contents (breadcrumbs & subfolders)
  const fetchFolderContents = async () => {
    try {
      const url = currentFolderId ? `/folders/${currentFolderId}/contents` : '/folders/contents';
      const res = await api.get(url);
      if (res.data.success) {
        setFolderData({
          ...res.data,
          subfolders: res.data.subfolders || res.data.folders || []
        });
      }
    } catch (err: any) {
      console.error('fetchFolderContents error:', err);
    }
  };

  // Fetch dropdown categories
  useEffect(() => {
    fetchTree();
    fetchDepartments();

    api
      .get('/document-types')
      .then((res) => {
        if (res.data.success) setTypes(res.data.types || []);
      })
      .catch(() => {});
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
      } else if (departmentFilter !== 'ALL') {
        params.folder_id = 'all';
      } else {
        params.folder_id = 'root';
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

        // Keep selectedDoc in sync if it exists in the fetched list
        if (selectedDoc) {
          const fresh = (res.data.documents || []).find((d: any) => d.id === selectedDoc.id);
          if (fresh) setSelectedDoc(fresh);
        }
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(1);
  }, [
    activeTab,
    currentFolderId,
    sortBy,
    sortOrder,
    limit,
    statusFilter,
    securityFilter,
    typeFilter,
    departmentFilter
  ]);

  // Click outside and Escape key listener
  useEffect(() => {
    const handleWindowClick = () => {
      setIsNewMenuOpen(false);
      setActionMenuOpenId(null);
      setFolderMenuOpenId(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dragCounter.current = 0;
        setIsDraggingOverScreen(false);
        setIsNewMenuOpen(false);
        setActionMenuOpenId(null);
        setFolderMenuOpenId(null);
      }
    };

    window.addEventListener('click', handleWindowClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleWindowClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setQuickFilter('ALL');
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

  // Helper to find folder node recursively in tree
  const findFolderInTree = (nodes: TreeNode[], targetId: string | number): TreeNode | null => {
    for (const n of nodes) {
      if (String(n.id) === String(targetId)) return n;
      if (n.children && n.children.length > 0) {
        const found = findFolderInTree(n.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleSelectFolder = (folderId: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (folderId) {
      newParams.set('folderId', folderId);
    } else {
      newParams.delete('folderId');
    }
    setSearchParams(newParams);
    setSelectedDoc(null);
    setSelectedDocIds([]);
    setIsInspectorOpen(true);
  };

  // Sync selectedFolder & folderInspectFiles whenever currentFolderId, tree or rootFiles change
  useEffect(() => {
    if (currentFolderId) {
      const node = findFolderInTree(tree, currentFolderId);
      if (node) {
        setSelectedFolder(node);
        setFolderInspectFiles(node.files || []);
      } else {
        handleInspectFolder({ id: currentFolderId });
      }
    } else {
      // Ở Root
      setSelectedFolder({
        id: 'root',
        name: 'Tất cả thư mục (Root)',
        path: '/',
        file_count: rootFiles.length,
        total_size: rootFiles.reduce((acc, f) => acc + (f.fileSize || f.size || 0), 0),
        creator_name: user?.fullName || (user as any)?.full_name || 'Hệ thống',
        created_at: '2025-05-12T10:24:00',
        description: 'Tài liệu lưu trữ tại thư mục gốc'
      });
      setFolderInspectFiles(rootFiles);
    }
  }, [currentFolderId, tree, rootFiles]);

  const handleInspectFolder = async (folder: any) => {
    setSelectedDoc(null);
    setSelectedFolder(folder);
    setIsInspectorOpen(true);
    setLoadingFolderInspect(true);
    try {
      const res = await api.get(`/folders/${folder.id}/contents`);
      if (res.data.success) {
        setFolderInspectFiles(res.data.files || []);
        setSelectedFolder((prev: any) => ({
          ...prev,
          file_count: res.data.files?.length || 0,
          total_size: (res.data.files || []).reduce((acc: number, f: any) => acc + (f.size || f.fileSize || 0), 0)
        }));
      }
    } catch (e) {
      console.error('Lỗi tải tệp trong thư mục:', e);
    } finally {
      setLoadingFolderInspect(false);
    }
  };

  const handleQuickUploadToFolder = async (files: FileList | File[], targetFolderId?: string | number) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setUploadingQuick(true);
    let successCount = 0;
    let lastErrorMsg = '';

    for (const file of fileArray) {
      if (file.size > 500 * 1024 * 1024) {
        lastErrorMsg = `Tệp "${file.name}" vượt quá 500MB.`;
        continue;
      }
      const formData = new FormData();
      formData.append('file', file);
      const folderTarget = targetFolderId || currentFolderId;
      if (folderTarget && folderTarget !== 'null' && folderTarget !== 'root') {
        formData.append('folder_id', String(folderTarget));
      }
      if (departmentFilter && departmentFilter !== 'ALL') {
        formData.append('department_id', String(departmentFilter));
      }
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
      try {
        const res = await api.post('/documents', formData);
        if (res.data.success) successCount++;
      } catch (err: any) {
        console.error('Lỗi khi tải file:', err);
        lastErrorMsg = err.response?.data?.message || err.message || '';
      }
    }

    setUploadingQuick(false);
    if (successCount > 0) {
      toast('success', `Đã tải lên thành công ${successCount} tệp!`);
      fetchDocuments(1);
      fetchFolderContents();
      fetchTree();
      if (selectedFolder && String(selectedFolder.id) === String(targetFolderId)) {
        handleInspectFolder(selectedFolder);
      }
    } else {
      toast('error', lastErrorMsg ? `Tải tệp thất bại: ${lastErrorMsg}` : 'Tải tệp thất bại. Vui lòng thử lại.');
    }
  };

  // Up 1 level parent navigation
  const handleGoUpOneLevel = () => {
    if (!folderData.breadcrumbs || folderData.breadcrumbs.length <= 1) return;
    const parentFolder = folderData.breadcrumbs[folderData.breadcrumbs.length - 2];
    handleSelectFolder(parentFolder?.id ? String(parentFolder.id) : null);
  };

  // Quick file upload (1-click upload or drop)
  const handleQuickUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setUploadingQuick(true);
    let successCount = 0;
    let lastErrorMsg = '';

    for (const file of fileArray) {
      if (file.size > 500 * 1024 * 1024) {
        lastErrorMsg = `Tệp "${file.name}" vượt quá 500MB.`;
        continue;
      }
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId && currentFolderId !== 'null' && currentFolderId !== 'root') {
        formData.append('folder_id', currentFolderId);
      }
      if (departmentFilter && departmentFilter !== 'ALL') {
        formData.append('department_id', String(departmentFilter));
      }
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
      try {
        const res = await api.post('/documents', formData);
        if (res.data.success) successCount++;
      } catch (err: any) {
        console.error('Lỗi khi tải file:', err);
        lastErrorMsg = err.response?.data?.message || err.message || '';
      }
    }

    setUploadingQuick(false);
    if (successCount > 0) {
      toast('success', `Đã tải lên thành công ${successCount} tệp!`);
      fetchDocuments(1);
      fetchFolderContents();
      fetchTree();
    } else {
      toast('error', lastErrorMsg ? `Tải tệp thất bại: ${lastErrorMsg}` : 'Tải tệp thất bại. Vui lòng thử lại.');
    }
  };

  // Rename folder
  const handleRenameFolder = async (folder: any) => {
    const newName = window.prompt(`Nhập tên mới cho thư mục "${folder.name}":`, folder.name);
    if (!newName || newName.trim() === '' || newName === folder.name) return;

    try {
      const res = await api.put(`/folders/${folder.id}/rename`, { name: newName.trim() });
      if (res.data.success) {
        toast('success', 'Đã đổi tên thư mục thành công');
        fetchTree();
        fetchFolderContents();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khi đổi tên thư mục');
    }
  };

  // Delete folder
  const handleDeleteFolder = async (folder: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thư mục "${folder.name}" và toàn bộ tệp bên trong?`)) {
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

  // Download document
  const handleDownload = async (doc: any) => {
    try {
      let passParam = '';
      if (doc.hasPassword || doc.has_password) {
        const pass = window.prompt(`Vui lòng nhập mật khẩu tài liệu "${doc.name}":`);
        if (!pass) return;
        passParam = pass;
      }

      const res = await api.get(`/documents/${doc.id}/download`, {
        params: passParam ? { password: passParam } : undefined,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      let downloadName = doc.fileName || doc.file_name || doc.name;
      const ext = doc.fileType || doc.file_type || (doc.fileName?.split('.').pop() || '');
      if (ext && !downloadName.toLowerCase().endsWith('.' + ext.toLowerCase())) {
        downloadName = `${downloadName}.${ext}`;
      }
      link.setAttribute('download', downloadName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast('success', `Tải tài liệu "${doc.name}" thành công`);
    } catch (err: any) {
      let errorMsg = 'Lỗi khi tải tài liệu';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errorMsg = json.message;
        } catch (_) {}
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      toast('error', errorMsg);
    }
  };

  // Print document
  const handlePrint = (doc: any) => {
    api.post(`/documents/${doc.id}/print`).catch(() => {});
    const printUrl = `/api/documents/${doc.id}/file`;
    const win = window.open(printUrl, '_blank');
    if (win) {
      win.focus();
    }
  };

  // Toggle liquidate
  const handleToggleLiquidate = async (doc: any) => {
    const isCurrentlyLiquidated = doc.status === 'LIQUIDATED';
    const actionText = isCurrentlyLiquidated ? 'hủy thanh lý' : 'nghiệm thu/thanh lý';
    if (!window.confirm(`Xác nhận ${actionText} tài liệu "${doc.name}"?`)) return;

    try {
      const res = await api.put(`/documents/${doc.id}`, {
        status: isCurrentlyLiquidated ? 'ACTIVE' : 'LIQUIDATED'
      });
      if (res.data.success) {
        toast('success', `Đã ${actionText} tài liệu thành công`);
        fetchDocuments(page);
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  // Delete document
  const handleDeleteDoc = async (doc: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển tài liệu "${doc.name}" vào thùng rác?`)) {
      return;
    }

    try {
      const res = await api.delete(`/documents/${doc.id}`);
      if (res.data.success) {
        toast('success', 'Đã chuyển tài liệu vào thùng rác');
        if (selectedDoc?.id === doc.id) setSelectedDoc(null);
        fetchDocuments(page);
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Không thể xóa tài liệu');
    }
  };

  // Bulk Actions
  const handleSelectAllToggle = () => {
    if (selectedDocIds.length === filteredDocuments.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocuments.map((d) => d.id));
    }
  };

  const handleToggleDocSelect = (id: number) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDownload = async () => {
    const docsToDownload = documents.filter((d) => selectedDocIds.includes(d.id));
    for (const doc of docsToDownload) {
      await handleDownload(doc);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Bạn có chắc muốn xóa ${selectedDocIds.length} tài liệu đã chọn?`)) return;
    for (const id of selectedDocIds) {
      try {
        await api.delete(`/documents/${id}`);
      } catch {}
    }
    toast('success', `Đã xóa ${selectedDocIds.length} tài liệu`);
    setSelectedDocIds([]);
    setSelectedDoc(null);
    fetchDocuments(page);
  };

  // Drag & drop dropzone on folders (hỗ trợ chuyển 1 file hoặc nhiều file đã chọn)
  const handleDropOnFolder = async (targetFolderId: string | null, droppedItem?: any) => {
    const itemToMove = droppedItem || globalDragItem.get() || dragItem;
    if (!itemToMove) return;

    try {
      if (itemToMove.type === 'file') {
        const destFolderId = (targetFolderId && targetFolderId !== 'root' && targetFolderId !== 'null')
          ? Number(targetFolderId)
          : null;
        
        // Nếu file đang kéo nằm trong danh sách các file đã tick chọn checkbox (selectedDocIds)
        // thì di chuyển toàn bộ các file đã chọn!
        const idsToMove = selectedDocIds.includes(Number(itemToMove.id))
          ? selectedDocIds
          : [Number(itemToMove.id)];

        let movedCount = 0;
        for (const id of idsToMove) {
          const res = await api.put(`/documents/${id}`, {
            folder_id: destFolderId
          });
          if (res.data.success) movedCount++;
        }

        const folderName = destFolderId
          ? (findFolderInTree(tree, String(destFolderId))?.name || 'thư mục')
          : 'Root (thư mục gốc)';

        if (movedCount === 1) {
          toast('success', `Đã chuyển "${itemToMove.name}" vào "${folderName}"`);
        } else {
          toast('success', `Đã chuyển ${movedCount} tài liệu vào "${folderName}"`);
        }

        setSelectedDocIds([]);
        await Promise.all([
          fetchDocuments(page),
          fetchTree(),
          fetchFolderContents()
        ]);
      } else if (itemToMove.type === 'folder') {
        const destParentId = (targetFolderId && targetFolderId !== 'root' && targetFolderId !== 'null')
          ? Number(targetFolderId)
          : null;
        if (String(itemToMove.id) === String(destParentId)) return;
        const res = await api.put(`/folders/${itemToMove.id}/move`, {
          targetParentId: destParentId
        });
        if (res.data.success) {
          toast('success', `Đã chuyển thư mục "${itemToMove.name}" thành công`);
          await Promise.all([
            fetchTree(),
            fetchFolderContents()
          ]);
        }
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khi di chuyển');
    } finally {
      globalDragItem.clearWithDelay();
      setDragItem(null);
    }
  };

  // Drag & drop file vào phòng ban
  const handleDropOnDepartment = async (departmentId: number | string, droppedItem?: any) => {
    const itemToMove = droppedItem || globalDragItem.get() || dragItem;
    if (!itemToMove) return;

    try {
      if (itemToMove.type === 'file') {
        const targetDeptId = Number(departmentId);
        const idsToMove = selectedDocIds.includes(Number(itemToMove.id))
          ? selectedDocIds
          : [Number(itemToMove.id)];

        let movedCount = 0;
        for (const id of idsToMove) {
          const res = await api.put(`/documents/${id}`, {
            department_id: targetDeptId
          });
          if (res.data.success) movedCount++;
        }

        const deptName = departments.find(d => String(d.id) === String(departmentId))?.name || 'phòng ban';
        if (movedCount === 1) {
          toast('success', `Đã gán "${itemToMove.name}" vào phòng ban "${deptName}"`);
        } else {
          toast('success', `Đã gán ${movedCount} tài liệu vào phòng ban "${deptName}"`);
        }

        setSelectedDocIds([]);
        await Promise.all([
          fetchDocuments(page),
          fetchTree(),
          fetchDepartments()
        ]);
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khi gán phòng ban');
    } finally {
      globalDragItem.clearWithDelay();
      setDragItem(null);
    }
  };

  // Handle dropping external desktop files directly into a specific folder or Root
  const handleDropExternalFiles = async (files: FileList | File[], targetFolderId: string | null) => {
    if (!files || files.length === 0) return;
    const destName = targetFolderId
      ? (findFolderInTree(tree, targetFolderId)?.name || 'thư mục')
      : 'Root (thư mục gốc)';

    toast('info', `Đang tải ${files.length} tệp vào "${destName}"...`);
    await handleQuickUploadToFolder(files, targetFolderId || undefined);
    fetchDocuments(page);
    fetchTree();
    fetchFolderContents();
  };

  // Check if dragged item is external file from OS
  const isExternalFileDrag = (e: React.DragEvent) => {
    if (dragItem) return false;
    if (!e.dataTransfer) return false;
    const types = Array.from(e.dataTransfer.types || []);
    return types.includes('Files') || types.includes('application/x-moz-file');
  };

  // Full window drag & drop upload handlers
  const handleScreenDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isExternalFileDrag(e)) return;
    dragCounter.current++;
    setIsDraggingOverScreen(true);
  };

  const handleScreenDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      setIsDraggingOverScreen(false);
      dragCounter.current = 0;
    }
  };

  const handleScreenDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isExternalFileDrag(e)) return;
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleScreenDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDraggingOverScreen(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleQuickUpload(e.dataTransfer.files);
    }
  };

  // File size format
  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  // Format datetime dd/mm/yyyy hh:mm
  const formatDateTime = (dateStr: any) => {
    if (!dateStr) return '12/05/2025 10:24';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${mins}`;
    } catch {
      return dateStr;
    }
  };

  // Get file type human label: 'Excel' | 'PDF' | 'Word' | 'PowerPoint' | 'Hình ảnh'
  const getFileTypeLabel = (file: any) => {
    const name = file?.name || file?.fileName || '';
    const ext = (file?.extension || file?.fileType || name.split('.').pop() || '').toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'Excel';
    if (ext === 'pdf') return 'PDF';
    if (['doc', 'docx'].includes(ext)) return 'Word';
    if (['ppt', 'pptx'].includes(ext)) return 'PowerPoint';
    if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext)) return 'Hình ảnh';
    return ext.toUpperCase() || 'Tệp';
  };

  // Format file icon based on file type matching exact photo reference
  const getFileIcon = (fileName = '', ext = '', sizeClass = 'w-8 h-8 rounded-lg text-xs') => {
    const extension = (ext || fileName.split('.').pop() || '').toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return (
        <div className={`${sizeClass} bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs`}>
          X
        </div>
      );
    }
    if (['pdf'].includes(extension)) {
      return (
        <div className={`${sizeClass} bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs tracking-tight ${sizeClass.includes('w-14') ? 'text-lg' : 'text-[11px]'}`}>
          pdf
        </div>
      );
    }
    if (['doc', 'docx'].includes(extension)) {
      return (
        <div className={`${sizeClass} bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs`}>
          W
        </div>
      );
    }
    if (['ppt', 'pptx'].includes(extension)) {
      return (
        <div className={`${sizeClass} bg-amber-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs`}>
          P
        </div>
      );
    }
    if (['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(extension)) {
      return (
        <div className={`${sizeClass} bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs`}>
          <ImageIcon className={sizeClass.includes('w-14') ? 'w-7 h-7' : 'w-4 h-4'} />
        </div>
      );
    }
    return (
      <div className={`${sizeClass} bg-slate-500 text-white flex items-center justify-center shrink-0 shadow-xs`}>
        <FileText className={sizeClass.includes('w-14') ? 'w-7 h-7' : 'w-4 h-4'} />
      </div>
    );
  };

  // Filter documents by quick filter chips
  const filteredDocuments = documents.filter((doc) => {
    if (quickFilter === 'ALL') return true;
    const ext = (doc.fileType || doc.fileName?.split('.').pop() || '').toLowerCase();
    if (quickFilter === 'PDF') return ext === 'pdf';
    if (quickFilter === 'DOC') return ['doc', 'docx'].includes(ext);
    if (quickFilter === 'XLS') return ['xls', 'xlsx', 'csv'].includes(ext);
    if (quickFilter === 'PPT') return ['ppt', 'pptx'].includes(ext);
    if (quickFilter === 'IMG') return ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
    if (quickFilter === 'EXPIRING') {
      return doc.status === 'EXPIRING' || (doc.daysUntilExpiry !== null && doc.daysUntilExpiry <= 30);
    }
    if (quickFilter === 'MY_DOCS') {
      return Number(doc.uploadedBy) === Number(user?.id);
    }
    return true;
  });

  // Current folder name from breadcrumbs
  const currentFolderName =
    folderData.breadcrumbs && folderData.breadcrumbs.length > 0
      ? folderData.breadcrumbs[folderData.breadcrumbs.length - 1]?.name
      : 'Tất cả tài liệu';

  const canGoUp = folderData.breadcrumbs && folderData.breadcrumbs.length > 1;

  return (
    <div
      onDragEnter={handleScreenDragEnter}
      onDragLeave={handleScreenDragLeave}
      onDragOver={handleScreenDragOver}
      onDrop={handleScreenDrop}
      className="flex h-[calc(100vh-4rem)] min-h-0 bg-slate-50 overflow-hidden relative select-none"
    >
      {/* Hidden File Input for 1-Click Quick Upload */}
      <input
        type="file"
        ref={quickFileInputRef}
        multiple
        onChange={(e) => {
          if (e.target.files) handleQuickUpload(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* FULL-SCREEN DRAG & DROP OVERLAY (Google Drive Style) */}
      {isDraggingOverScreen && (
        <div
          onClick={() => {
            dragCounter.current = 0;
            setIsDraggingOverScreen(false);
          }}
          onDragOver={handleScreenDragOver}
          onDrop={handleScreenDrop}
          className="absolute inset-0 z-50 bg-blue-600/15 backdrop-blur-xs border-4 border-dashed border-blue-500 rounded-2xl m-3 flex flex-col items-center justify-center animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-6 rounded-3xl bg-white shadow-2xl flex flex-col items-center gap-3 text-center border border-blue-100 max-w-sm relative cursor-default"
          >
            <button
              onClick={() => {
                dragCounter.current = 0;
                setIsDraggingOverScreen(false);
              }}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center animate-bounce">
              <UploadCloud className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Thả tệp vào đây để tải lên</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tệp sẽ được lưu vào thư mục <span className="font-semibold text-blue-600">"{currentFolderName}"</span>
              </p>
            </div>
            <button
              onClick={() => {
                dragCounter.current = 0;
                setIsDraggingOverScreen(false);
              }}
              className="mt-1 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy bỏ (Đóng)
            </button>
          </div>
        </div>
      )}

      {/* 1. LEFT PANEL: Enterprise Folder Tree & Department Navigator */}
      <aside
        className={`${
          isTreeCollapsed ? 'w-0 -ml-1 border-r-0' : 'w-64 border-r border-slate-200/80'
        } bg-white flex flex-col shrink-0 transition-all duration-300 overflow-hidden z-20`}
      >
        <div className="p-2.5 border-b border-slate-100 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-xl flex-1 max-w-[190px]">
            <button
              type="button"
              onClick={() => setSidebarTab('tree')}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sidebarTab === 'tree'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Thư mục</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('department')}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sidebarTab === 'department'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Phòng ban</span>
              {departments.length > 0 && (
                <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1 py-0.1 rounded-full font-bold">
                  {departments.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {sidebarTab === 'tree' && (
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
            )}
            <button
              onClick={() => setIsTreeCollapsed(true)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Thu gọn sidebar"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Folder Tree */}
        {sidebarTab === 'tree' ? (
          <div className="flex-1 overflow-y-auto p-2">
            <FolderTree
              tree={tree}
              selectedFolderId={currentFolderId}
              onSelectFolder={(id) => handleSelectFolder(id)}
              dragItem={dragItem}
              onDropItem={(targetId, droppedItem) => handleDropOnFolder(targetId, droppedItem)}
              onDropFiles={(files, targetId) => handleDropExternalFiles(files, targetId)}
              onDragStartItem={(item) => {
                globalDragItem.set(item);
                setDragItem(item);
              }}
              onDragEndItem={() => {
                globalDragItem.clearWithDelay();
                setDragItem(null);
              }}
              onDeleteFolder={(folder) => handleDeleteFolder(folder)}
              onCreateRootFolder={() => {
                setCreateFolderParentId(null);
                setIsCreateFolderOpen(true);
              }}
            />
          </div>
        ) : (
          /* Tab 2: Department List with Document Count & Drag-to-assign */
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* Tất cả phòng ban */}
            <div
              onClick={() => {
                setDepartmentFilter('ALL');
                setPage(1);
              }}
              className={`flex items-center gap-2 py-2 px-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                departmentFilter === 'ALL'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1">Tất cả phòng ban</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                departmentFilter === 'ALL' ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
              }`}>
                {departments.reduce((acc, curr) => acc + (Number(curr.document_count) || 0), 0)}
              </span>
            </div>

            <div className="pt-1 space-y-1">
              {departments.map((dept) => {
                const isSelected = String(departmentFilter) === String(dept.id);
                const isOver = dragOverDeptId === dept.id;
                const docCount = Number(dept.document_count) || 0;

                return (
                  <div
                    key={dept.id}
                    onClick={() => {
                      setDepartmentFilter(String(dept.id));
                      handleSelectFolder(null);
                      setSelectedFolder(null);
                      setPage(1);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverDeptId(dept.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverDeptId(dept.id);
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverDeptId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverDeptId(null);
                      handleDropOnDepartment(dept.id);
                    }}
                    className={`group flex items-center justify-between gap-2 py-2 px-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                      isOver
                        ? 'bg-blue-100 text-blue-800 font-bold ring-2 ring-blue-500 shadow-sm'
                        : isSelected
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                    title={`Xem tất cả tài liệu của ${dept.name} (Kéo tài liệu vào đây để gán)`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pointer-events-none">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                      }`}>
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold leading-tight">{dept.name}</p>
                        {dept.code && (
                          <span className="text-[10px] text-slate-400 uppercase font-mono">{dept.code}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pointer-events-none">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : docCount > 0
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {docCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* 2. MAIN CENTER CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 lg:p-5 space-y-4">
        {/* Top Header Bar: Clean Breadcrumb & Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            {isTreeCollapsed && (
              <button
                onClick={() => setIsTreeCollapsed(false)}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
                title="Mở cây thư mục"
              >
                <PanelLeft className="w-4 h-4 text-blue-600" />
              </button>
            )}

            {/* Up 1 Level Button */}
            {canGoUp && (
              <button
                onClick={handleGoUpOneLevel}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-colors shrink-0 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                title="Lên 1 cấp thư mục"
              >
                <ArrowUpLeft className="w-4 h-4" />
                <span className="hidden md:inline">Lên 1 cấp</span>
              </button>
            )}

            {/* Breadcrumb Navigation */}
            <div className="min-w-0 flex-1 flex items-center gap-2 overflow-x-auto">
              <Breadcrumb
                items={
                  departmentFilter !== 'ALL'
                    ? [
                        { id: null, name: 'Kho tài liệu' },
                        {
                          id: null,
                          name: `Phòng ban: ${departments.find((d) => String(d.id) === String(departmentFilter))?.name || departmentFilter}`
                        }
                      ]
                    : folderData.breadcrumbs || [{ id: null, name: 'Tất cả tài liệu' }]
                }
                onSelect={(id) => {
                  if (departmentFilter !== 'ALL') {
                    setDepartmentFilter('ALL');
                  }
                  handleSelectFolder(id);
                }}
                dragItem={dragItem}
                onDropItem={(id) => handleDropOnFolder(id)}
                onDropFiles={(files, id) => handleDropExternalFiles(files, id)}
              />

              {departmentFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    setDepartmentFilter('ALL');
                    setPage(1);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors cursor-pointer shrink-0"
                  title="Hủy lọc theo phòng ban (xem tất cả)"
                >
                  <Building2 className="w-3 h-3" />
                  <span>{departments.find((d) => String(d.id) === String(departmentFilter))?.name || 'Phòng ban'}</span>
                  <X className="w-3 h-3 hover:text-rose-600" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* DIRECT 1-CLICK UPLOAD BUTTON */}
            <button
              onClick={() => quickFileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Tải tệp từ máy tính lên thư mục hiện tại"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tải tệp lên</span>
            </button>

            {/* DIRECT NEW FOLDER BUTTON */}
            <button
              onClick={() => {
                setCreateFolderParentId(currentFolderId);
                setIsCreateFolderOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-xs cursor-pointer active:scale-95"
              title="Tạo thư mục mới tại đây"
            >
              <FolderPlus className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Thư mục mới</span>
            </button>

            {/* MORE OPTIONS DROPDOWN */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNewMenuOpen(!isNewMenuOpen);
                }}
                className="p-2 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
                title="Tùy chọn tạo thêm"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isNewMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 sm:left-0 mt-2 w-56 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-left"
                >
                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      setIsCreateDocOpen(true);
                    }}
                    className="w-full px-3 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-semibold">Hồ sơ / Văn bản chi tiết</div>
                      <div className="text-[10px] text-slate-400">Gắn loại văn bản, đối tác, hạn</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* REFRESH BUTTON */}
            <button
              onClick={() => {
                fetchDocuments(page);
                fetchFolderContents();
                fetchTree();
              }}
              className="p-2 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* SMART DOCUMENT MANAGEMENT BUTTON */}
            <button
              onClick={() => setIsSmartManagerOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white transition-all shadow-xs cursor-pointer group"
              title="Quản lý thông minh & Kiểm toán rủi ro"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span className="hidden md:inline text-xs">Quản lý thông minh</span>
            </button>

            {/* View Switcher: Table / Grid */}
            <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50 ml-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Chế độ xem Bảng"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Chế độ xem Lưới"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Toggle Inspector Panel */}
            <button
              onClick={() => setIsInspectorOpen(!isInspectorOpen)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isInspectorOpen
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
              title={isInspectorOpen ? 'Ẩn bảng chi tiết' : 'Hiện bảng chi tiết'}
            >
              <PanelRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* QUICK SEARCH & 1-TOUCH FILTER CHIPS (Notion / Google Drive Style) */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm nhanh theo tên tệp, loại tài liệu, mã..."
                className="w-full text-xs pl-8 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/60"
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

            {/* Quick 1-Touch Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'DOC', label: 'Word' },
                { id: 'XLS', label: 'Excel' },
                { id: 'PPT', label: 'PowerPoint (PPT)' },
                { id: 'PDF', label: 'PDF' },
                { id: 'IMG', label: 'Hình ảnh' },
                { id: 'EXPIRING', label: 'Sắp hết hạn' },
                { id: 'MY_DOCS', label: 'Của tôi' }
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setQuickFilter(chip.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    quickFilter === chip.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {chip.label}
                </button>
              ))}

              {/* Advanced Filter Button */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ml-1 ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Lọc nâng cao</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {activeFiltersCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0 ml-1"
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

        {/* SUBFOLDERS SECTION: Sleek Google Drive Style Folder Cards */}
        {folderData.subfolders && folderData.subfolders.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-amber-500" />
                <span>Thư mục ({folderData.subfolders.length})</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">Nhấp để mở hoặc kéo thả tệp vào</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {folderData.subfolders.map((folder: any) => {
                const isSelectedFolder = selectedFolder?.id === folder.id;
                const isDragOverCard = dragOverFolderCardId === folder.id;

                return (
                  <div
                    key={folder.id}
                    onClick={() => handleInspectFolder(folder)}
                    onDoubleClick={() => handleSelectFolder(String(folder.id))}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverFolderCardId(folder.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverFolderCardId !== folder.id) setDragOverFolderCardId(folder.id);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragOverFolderCardId === folder.id) setDragOverFolderCardId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverFolderCardId(null);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleDropExternalFiles(e.dataTransfer.files, String(folder.id));
                        return;
                      }
                      handleDropOnFolder(String(folder.id));
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between relative ${
                      isDragOverCard
                        ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500 scale-102 shadow-md'
                        : isSelectedFolder
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/40 shadow-xs'
                        : 'bg-white hover:bg-amber-50/30 border-slate-200/80 hover:border-amber-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform ${
                        isDragOverCard ? 'bg-blue-600 text-white animate-bounce' : 'bg-amber-50 text-amber-500 group-hover:scale-105'
                      }`}>
                        <Folder className={`w-5 h-5 ${isDragOverCard ? 'text-white' : 'fill-amber-400/30 text-amber-600'}`} />
                      </div>

                      {isDragOverCard && (
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                          Thả vào đây
                        </span>
                      )}

                      {/* 3-Dots Folder Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFolderMenuOpenId(folderMenuOpenId === folder.id ? null : folder.id);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {folderMenuOpenId === folder.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-left text-xs"
                          >
                            <button
                              onClick={() => {
                                setFolderMenuOpenId(null);
                                handleSelectFolder(String(folder.id));
                              }}
                              className="w-full px-3 py-1.5 text-blue-600 hover:bg-blue-50 flex items-center gap-2 cursor-pointer font-semibold"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>Mở thư mục</span>
                            </button>
                            <button
                              onClick={() => {
                                setFolderMenuOpenId(null);
                                handleInspectFolder(folder);
                              }}
                              className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Xem tệp tin</span>
                            </button>
                            <button
                              onClick={() => {
                                setFolderMenuOpenId(null);
                                handleRenameFolder(folder);
                              }}
                              className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Đổi tên</span>
                            </button>
                            <button
                              onClick={() => {
                                setFolderMenuOpenId(null);
                                setMoveItem({ item: folder, type: 'folder' });
                              }}
                              className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Move className="w-3.5 h-3.5 text-blue-600" />
                              <span>Di chuyển</span>
                            </button>
                            <button
                              onClick={() => {
                                setFolderMenuOpenId(null);
                                handleDeleteFolder(folder);
                              }}
                              className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa thư mục</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <div className="font-bold text-xs text-slate-800 truncate group-hover:text-amber-800 transition-colors" title={folder.name}>
                        {folder.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                        <span className="font-medium text-slate-500">
                          {folder.file_count || 0} tài liệu
                        </span>
                        {folder.total_size > 0 && (
                          <span className="text-[9px] text-slate-400 font-mono">
                            {formatSize(folder.total_size)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. DOCUMENTS LIST SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col flex-1">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2.5" />
              <span>Đang tải danh sách tài liệu...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500 space-y-3 px-4">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-7 h-7" />
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm">Chưa có tài liệu nào</div>
                <p className="text-slate-400 max-w-sm mx-auto mt-1">
                  Kéo thả tệp từ máy tính vào đây hoặc bấm nút <span className="font-semibold text-blue-600">Tải tệp lên</span> (Hỗ trợ Word, Excel, PowerPoint, PDF tối đa 500MB).
                </p>
              </div>
              <button
                onClick={() => quickFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Tải tệp lên ngay</span>
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* TABLE VIEW: Clean, modern, balanced columns */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        onClick={handleSelectAllToggle}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {selectedDocIds.length === filteredDocuments.length ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3 min-w-[240px]">TÊN TỆP</th>
                    <th className="py-3 px-3 min-w-[130px]">PHÂN LOẠI</th>
                    <th className="py-3 px-3 min-w-[110px]">DUNG LƯỢNG</th>
                    <th className="py-3 px-3 min-w-[130px]">THỜI HẠN & HIỆU LỰC</th>
                    <th className="py-3 px-3 min-w-[100px]">BẢO MẬT</th>
                    <th className="py-3 px-3 min-w-[110px]">NGƯỜI TẢI</th>
                    <th className="py-3 px-3 text-right w-12">-</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocuments.map((doc) => {
                    const isSelected = selectedDocIds.includes(doc.id);
                    const isCurrentInspector = selectedDoc?.id === doc.id;

                    return (
                      <tr
                        key={doc.id}
                        draggable
                        onDragStart={(e) => {
                          const item = { id: String(doc.id), type: 'file' as const, name: doc.name };
                          globalDragItem.set(item);
                          setDragItem(item);
                          e.dataTransfer.effectAllowed = 'all';
                          e.dataTransfer.setData('text/plain', JSON.stringify(item));
                          e.dataTransfer.setData('application/json', JSON.stringify(item));
                        }}
                        onDragEnd={() => {
                          globalDragItem.clearWithDelay();
                          setDragItem(null);
                        }}
                        onClick={() => {
                          setSelectedFolder(null);
                          setSelectedDoc(doc);
                          setIsInspectorOpen(true);
                        }}
                        className={`hover:bg-blue-50/30 transition-colors cursor-grab active:cursor-grabbing group ${
                          isCurrentInspector ? 'bg-blue-50/50' : isSelected ? 'bg-slate-50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDocSelect(doc.id);
                          }}
                        >
                          <button className="text-slate-400 hover:text-slate-600 cursor-pointer">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* TÊN TỆP + File icon */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            {getFileIcon(doc.fileName, doc.fileType)}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-800 text-xs truncate max-w-[240px]">
                                  {doc.name}
                                </span>
                                {doc.hasPassword && (
                                  <span title="Bảo vệ bằng mật mã">
                                    <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                                {doc.folder_name || (currentFolderId ? currentFolderName : 'hợp đồng') || 'Root'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* PHÂN LOẠI & Phòng ban */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800 text-xs">
                            {doc.documentTypeName || 'Hợp đồng'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                            {doc.departmentName || 'Kinh doanh'}
                          </div>
                        </td>

                        {/* DUNG LƯỢNG */}
                        <td className="py-3 px-3 text-xs text-slate-600 whitespace-nowrap">
                          {formatSize(doc.fileSize)}
                        </td>

                        {/* THỜI HẠN & HIỆU LỰC */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              doc.status === 'EXPIRED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : doc.status === 'EXPIRING'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {doc.status === 'EXPIRED'
                              ? 'Hết hạn'
                              : doc.status === 'EXPIRING'
                              ? 'Sắp hết hạn'
                              : doc.status === 'LIQUIDATED'
                              ? 'Đã thanh lý'
                              : 'Hiệu lực'}
                          </span>
                        </td>

                        {/* BẢO MẬT */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              doc.securityLevel === 'CONFIDENTIAL'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : doc.securityLevel === 'PUBLIC'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {doc.securityLevel === 'CONFIDENTIAL'
                              ? 'Mật'
                              : doc.securityLevel === 'PUBLIC'
                              ? 'Công khai'
                              : 'Nội bộ'}
                          </span>
                        </td>

                        {/* NGƯỜI TẢI */}
                        <td className="py-3 px-3 whitespace-nowrap text-slate-700 text-xs">
                          {doc.uploaderName || 'Hà Thị Quỳnh'}
                        </td>

                        {/* Thao tác trực tiếp */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
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
                              className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Xem tệp"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Xem</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownload(doc)}
                              className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Tải về máy"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Tải về</span>
                            </button>

                            <div className="relative">
                              <button
                                onClick={() => setActionMenuOpenId(actionMenuOpenId === doc.id ? null : doc.id)}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                                title="Thao tác khác"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {actionMenuOpenId === doc.id && (
                                <div
                                  onClick={() => setActionMenuOpenId(null)}
                                  className="absolute right-0 mt-1 w-48 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1 z-30 text-left divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100"
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleDownload(doc)}
                                      className="w-full px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer font-semibold"
                                    >
                                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Tải tệp về máy</span>
                                    </button>

                                    <button
                                      onClick={() => handlePrint(doc)}
                                      className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                                      <span>In ấn tài liệu</span>
                                    </button>

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

                                    <button
                                      onClick={() => setPermissionDoc(doc)}
                                      className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Phân quyền tài liệu</span>
                                    </button>

                                    <button
                                      onClick={() => setVersionDoc(doc)}
                                      className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <History className="w-3.5 h-3.5 text-purple-600" />
                                      <span>Lịch sử phiên bản</span>
                                    </button>

                                    <button
                                      onClick={() => setMoveItem({ item: doc, type: 'file' })}
                                      className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Move className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Di chuyển thư mục</span>
                                    </button>

                                    <button
                                      onClick={() => handleToggleLiquidate(doc)}
                                      className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Archive className="w-3.5 h-3.5 text-amber-600" />
                                      <span>
                                        {doc.status === 'LIQUIDATED' ? 'Hủy thanh lý' : 'Nghiệm thu / Thanh lý'}
                                      </span>
                                    </button>
                                  </div>

                                  <div className="py-1">
                                    <button
                                      onClick={() => handleDeleteDoc(doc)}
                                      className="w-full px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Xóa tài liệu</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* GRID VIEW: Clean modern document cards */
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredDocuments.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                const isCurrentInspector = selectedDoc?.id === doc.id;

                return (
                  <div
                    key={doc.id}
                    draggable
                    onDragStart={(e) => {
                      const item = { id: String(doc.id), type: 'file' as const, name: doc.name };
                      globalDragItem.set(item);
                      setDragItem(item);
                      e.dataTransfer.effectAllowed = 'all';
                      e.dataTransfer.setData('text/plain', JSON.stringify(item));
                      e.dataTransfer.setData('application/json', JSON.stringify(item));
                    }}
                    onDragEnd={() => {
                      globalDragItem.clearWithDelay();
                      setDragItem(null);
                    }}
                    onClick={() => {
                      setSelectedFolder(null);
                      setSelectedDoc(doc);
                      setIsInspectorOpen(true);
                    }}
                    className={`bg-white rounded-2xl border p-4 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between group cursor-grab active:cursor-grabbing ${
                      isCurrentInspector
                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                        : isSelected
                        ? 'border-blue-300 bg-blue-50/20'
                        : 'border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        {getFileIcon(doc.fileName, doc.fileType)}
                        <div className="flex items-center gap-1.5">
                          {doc.hasPassword && <Lock className="w-3.5 h-3.5 text-amber-600" />}
                          <span className="text-[10px] font-mono text-slate-400">{formatSize(doc.fileSize)}</span>
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
                          <span className="truncate">{doc.documentTypeName || 'Chung'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[10px] text-slate-400">
                        {doc.uploaderName || 'Admin'}
                      </div>
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded"
                          title="Tải về"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Bar */}
          <div className="p-3.5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 mt-auto">
            <div>
              Hiển thị <span className="font-semibold text-slate-700">{filteredDocuments.length}</span> /{' '}
              <span className="font-semibold text-slate-700">{total}</span> file
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => fetchDocuments(page - 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-xs">
                {page}
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchDocuments(page + 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 3. RIGHT PANEL: Multi-utility File Inspector (Google Drive / MacOS Finder Style) */}
      {isInspectorOpen && (
        <aside className="w-80 border-l border-slate-200/80 bg-white flex flex-col shrink-0 overflow-y-auto z-20">
          {/* Header Panel */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-xs text-slate-800">Thông tin & Tiện ích</span>
            </div>
            <button
              onClick={() => setIsInspectorOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Đóng bảng chi tiết"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedDoc ? (
            /* Khi người dùng click chọn 1 file cụ thể để xem tác vụ & chi tiết file */
            <div className="p-4 space-y-4 text-xs flex-1 overflow-y-auto">
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                ← Xem thông tin thư mục
              </button>

              {/* File Icon Preview & Big Name */}
              <div className="flex flex-col items-center text-center p-4 bg-slate-50/70 rounded-2xl border border-slate-100">
                {getFileIcon(selectedDoc.fileName, selectedDoc.fileType, 'w-12 h-12 text-sm')}
                <h3 className="font-bold text-sm text-slate-800 mt-2.5 line-clamp-2" title={selectedDoc.name}>
                  {selectedDoc.name}
                </h3>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {selectedDoc.documentCode}
                </div>
              </div>

              {/* Tác vụ nhanh */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Tác vụ nhanh
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setPreviewFile({
                        id: selectedDoc.id,
                        name: selectedDoc.name,
                        fileName: selectedDoc.fileName,
                        extension: selectedDoc.fileType,
                        url: `/api/documents/${selectedDoc.id}/file`,
                        previewUrl: `/api/documents/${selectedDoc.id}/file`,
                        hasPassword: selectedDoc.hasPassword,
                        isEncrypted: selectedDoc.hasPassword || selectedDoc.isEncrypted
                      });
                    }}
                    className="p-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Xem trước</span>
                  </button>

                  <button
                    onClick={() => handleDownload(selectedDoc)}
                    className="p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải về</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setPasswordDoc(selectedDoc);
                      setIsPasswordModalOpen(true);
                    }}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                    <span>{selectedDoc.hasPassword ? 'Gỡ mã khóa' : 'Cài mật mã'}</span>
                  </button>

                  <button
                    onClick={() => setPermissionDoc(selectedDoc)}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl font-medium text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Phân quyền</span>
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteDoc(selectedDoc)}
                  className="w-full mt-2 p-2 text-rose-600 hover:bg-rose-50 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa vào thùng rác</span>
                </button>
              </div>

              {/* Chi tiết file */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Chi tiết hồ sơ
                </div>

                <div className="space-y-1.5 text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Dung lượng:</span>
                    <span className="font-semibold text-slate-700">{formatSize(selectedDoc.fileSize)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Định dạng:</span>
                    <span className="font-semibold uppercase text-slate-700">{selectedDoc.fileType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Phân loại:</span>
                    <span className="font-semibold text-slate-700">{selectedDoc.documentTypeName || 'Hợp đồng'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-400">Người tải:</span>
                    <span className="font-semibold text-slate-700">{selectedDoc.uploaderName || 'Admin'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* GIAO DIỆN CHÍNH THỐNG THEO ẢNH: Thông tin thư mục + Danh sách file trong thư mục */
            <div className="p-4 space-y-6 text-xs flex-1 overflow-y-auto">
              {/* 1. KHỐI THÔNG TIN THƯ MỤC */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                    <Folder className="w-4 h-4 text-blue-600" />
                    <span>Thông tin thư mục</span>
                  </div>
                  <button
                    onClick={() => {
                      setCreateFolderParentId(currentFolderId);
                      setIsCreateFolderOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Tạo thư mục mới"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Bảng thuộc tính 2 cột căn dấu hai chấm */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-baseline">
                    <span className="w-24 text-slate-500 shrink-0">Tên thư mục</span>
                    <span className="text-slate-400 mr-2 shrink-0">:</span>
                    <span className="font-semibold text-blue-700 truncate">
                      {selectedFolder?.name || (currentFolderId ? currentFolderName : 'hợp đồng')}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-24 text-slate-500 shrink-0">Đường dẫn</span>
                    <span className="text-slate-400 mr-2 shrink-0">:</span>
                    <span className="font-semibold text-blue-700 truncate">
                      {selectedFolder?.path || (currentFolderId ? `/${currentFolderName}` : '/hợp đồng')}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-24 text-slate-500 shrink-0">Số lượng tệp</span>
                    <span className="text-slate-400 mr-2 shrink-0">:</span>
                    <span className="text-slate-700 font-medium">
                      {folderInspectFiles.length || selectedFolder?.file_count || filteredDocuments.length || 0}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-24 text-slate-500 shrink-0">Dung lượng</span>
                    <span className="text-slate-400 mr-2 shrink-0">:</span>
                    <span className="text-slate-700 font-medium">
                      {formatSize(
                        selectedFolder?.total_size ||
                        folderInspectFiles.reduce((acc, f) => acc + (f.size || f.fileSize || 0), 0) ||
                        filteredDocuments.reduce((acc, f) => acc + (f.fileSize || 0), 0)
                      )}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-24 text-slate-500 shrink-0">Người tạo</span>
                    <span className="text-slate-400 mr-2 shrink-0">:</span>
                    <span className="text-slate-700 font-medium">
                      {selectedFolder?.creator_name || selectedFolder?.uploaderName || user?.fullName || (user as any)?.full_name || 'Hà Thị Quỳnh'}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-24 text-slate-500 shrink-0">Ngày tạo</span>
                    <span className="text-slate-400 mr-2 shrink-0">:</span>
                    <span className="text-slate-700 font-medium">
                      {formatDateTime(selectedFolder?.created_at || selectedFolder?.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-24 text-slate-500 shrink-0">Mô tả</span>
                    <span className="text-slate-400 mr-2 shrink-0">:</span>
                    <span className="text-slate-700 font-medium">
                      {selectedFolder?.description || (currentFolderId ? 'Các file hợp đồng liên quan' : 'Các file hợp đồng liên quan')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. KHỐI DANH SÁCH FILE TRONG THƯ MỤC */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 pb-1 border-b border-slate-100">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Danh sách file trong thư mục</span>
                </div>

                {loadingFolderInspect ? (
                  <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-xs">Đang tải danh sách tệp...</span>
                  </div>
                ) : (folderInspectFiles.length === 0 && filteredDocuments.length === 0) ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Chưa có tệp tin nào trong thư mục này
                  </div>
                ) : (
                  <div className="space-y-1">
                    {(folderInspectFiles.length > 0 ? folderInspectFiles : filteredDocuments).map((file: any) => (
                      <div
                        key={file.id}
                        draggable
                        onDragStart={(e) => {
                          const item = { id: String(file.id), type: 'file' as const, name: file.name };
                          globalDragItem.set(item);
                          setDragItem(item);
                          e.dataTransfer.effectAllowed = 'all';
                          e.dataTransfer.setData('text/plain', JSON.stringify(item));
                          e.dataTransfer.setData('application/json', JSON.stringify(item));
                        }}
                        onDragEnd={() => {
                          globalDragItem.clearWithDelay();
                          setDragItem(null);
                        }}
                        onClick={() => {
                          setPreviewFile({
                            id: file.id,
                            name: file.name,
                            fileName: file.fileName,
                            extension: file.fileType || file.extension,
                            url: `/api/documents/${file.id}/file`,
                            previewUrl: `/api/documents/${file.id}/file`,
                            hasPassword: file.hasPassword,
                            isEncrypted: file.hasPassword || file.isEncrypted
                          });
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-grab active:cursor-grabbing group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <FileMiniBadge file={file} size="md" />
                          <div className="min-w-0 flex-1">
                            <div
                              className="font-bold text-xs text-slate-800 truncate group-hover:text-blue-600 transition-colors"
                              title={file.name}
                            >
                              {file.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {formatSize(file.size || file.fileSize)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 pl-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewFile({
                                id: file.id,
                                name: file.name,
                                fileName: file.fileName,
                                extension: file.fileType || file.extension,
                                url: `/api/documents/${file.id}/file`,
                                previewUrl: `/api/documents/${file.id}/file`,
                                hasPassword: file.hasPassword,
                                isEncrypted: file.hasPassword || file.isEncrypted
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Xem trước"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(file);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Tải về máy"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs text-slate-400 font-medium pl-1">
                            {getFileTypeLabel(file)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. THẺ THÔNG BÁO XANH DƯƠNG NHẠT */}
              <div className="mt-4 p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5 text-xs text-blue-700">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <div className="text-[11px] leading-relaxed">
                  Nhấn vào tệp để xem chi tiết, tải xuống hoặc chia sẻ.
                </div>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* FLOATING BULK ACTIONS BAR (When 1+ documents are selected) */}
      {selectedDocIds.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="text-xs font-bold flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
              {selectedDocIds.length}
            </span>
            <span>Đã chọn {selectedDocIds.length} tài liệu</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDownload}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải về</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>

            <button
              onClick={() => setSelectedDocIds([])}
              className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Bỏ chọn tất cả"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING QUICK UPLOAD PROGRESS NOTIFIER */}
      {uploadingQuick && (
        <div className="absolute bottom-6 right-6 z-40 bg-white border border-slate-200 p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
          <div className="text-xs">
            <div className="font-bold text-slate-800">Đang tải tệp lên...</div>
            <div className="text-slate-400 text-[11px]">Vui lòng đợi trong giây lát</div>
          </div>
        </div>
      )}

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
          initialDepartmentId={departmentFilter !== 'ALL' ? Number(departmentFilter) : undefined}
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
          canEdit={Boolean(versionDoc.canEdit || versionDoc.canAdmin)}
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
        />
      )}

      {previewFile && (
        <FilePreviewModal
          isOpen={Boolean(previewFile)}
          onClose={() => setPreviewFile(null)}
          file={previewFile}
          onDownload={() => handleDownload(previewFile)}
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

      {isSmartManagerOpen && (
        <SmartDocumentManagerModal
          isOpen={isSmartManagerOpen}
          onClose={() => setIsSmartManagerOpen(false)}
          documents={documents}
          onRefresh={() => fetchDocuments(page)}
          onPreview={(doc) => {
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
          onSetPassword={(doc) => {
            setPasswordDoc(doc);
            setIsPasswordModalOpen(true);
          }}
          onSelectDoc={(doc) => {
            setSelectedDoc(doc);
            setSelectedFolder(null);
            setIsInspectorOpen(true);
            setIsSmartManagerOpen(false);
          }}
        />
      )}
    </div>
  );
};
