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
  Tag
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CreateDocumentModal } from '../components/dms/CreateDocumentModal';
import { DocumentVersionsModal } from '../components/dms/DocumentVersionsModal';
import { DocumentPermissionsModal } from '../components/dms/DocumentPermissionsModal';
import { FilePreviewModal } from '../components/dataroom/FilePreviewModal';

export const DocumentListPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab: 'all' | 'my_docs' | 'expiring' | 'liquidated'
  const activeTab = searchParams.get('tab') || 'all';

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Bộ lọc Form States
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [versionDoc, setVersionDoc] = useState<any | null>(null);
  const [permissionDoc, setPermissionDoc] = useState<any | null>(null);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);

  // Dropdown action row
  const [actionMenuOpenId, setActionMenuOpenId] = useState<number | null>(null);

  // Fetch dropdown categories
  useEffect(() => {
    api.get('/document-types').then(res => {
      if (res.data.success) setTypes(res.data.types || []);
    }).catch(() => {});

    api.get('/departments').then(res => {
      if (res.data.success) setDepartments(res.data.data?.data || res.data.data || []);
    }).catch(() => {});
  }, []);

  // Fetch documents with multi-filter
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
  }, [activeTab, sortBy, sortOrder, limit]);

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

  const handleDownload = async (doc: any) => {
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
      toast('error', err.response?.data?.message || 'Lỗi khi tải xuống tài liệu');
    }
  };

  const handlePrint = async (doc: any) => {
    try {
      await api.post(`/documents/${doc.id}/print`);
      // Open preview with print
      setPreviewFile({
        id: doc.id,
        name: doc.name,
        fileName: doc.fileName,
        extension: doc.fileType,
        url: `/api/documents/${doc.id}/file`,
        previewUrl: `/api/documents/${doc.id}/file`
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

  const handleDelete = async (doc: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu [${doc.documentCode}] "${doc.name}"?`)) {
      return;
    }

    try {
      const res = await api.delete(`/documents/${doc.id}`);
      if (res.data.success) {
        toast('success', 'Đã chuyển tài liệu vào thùng rác');
        fetchDocuments(page);
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khi xóa tài liệu');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string, daysUntilExpiry: number | null) => {
    if (status === 'LIQUIDATED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
          <Archive className="w-3 h-3 text-slate-500" /> Đã nghiệm thu/Thanh lý
        </span>
      );
    }
    if (status === 'EXPIRED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-500" /> Hết hiệu lực
        </span>
      );
    }
    if (status === 'EXPIRING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-500" /> Sắp hết hạn ({daysUntilExpiry !== null ? `${daysUntilExpiry} ngày` : ''})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Hiệu lực
      </span>
    );
  };

  const getSecurityBadge = (secLevel: string) => {
    if (secLevel === 'CONFIDENTIAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <Shield className="w-3 h-3 text-rose-600" /> Mật
        </span>
      );
    }
    if (secLevel === 'INTERNAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <Building2 className="w-3 h-3 text-blue-600" /> Nội bộ
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <FileText className="w-3 h-3 text-emerald-600" /> Công khai
      </span>
    );
  };

  const getPermissionBadge = (perm: string) => {
    const map: any = {
      ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
      EDIT: 'bg-amber-50 text-amber-700 border-amber-200',
      DOWNLOAD: 'bg-blue-50 text-blue-700 border-blue-200',
      VIEW: 'bg-slate-100 text-slate-700 border-slate-200',
      NONE: 'bg-slate-50 text-slate-400 border-slate-200'
    };
    return (
      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${map[perm] || map.VIEW}`}>
        {perm}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Quản Lý & Lưu Trữ Tài Liệu (DMS)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống quản lý văn bản, hợp đồng, hồ sơ và kiểm soát phân quyền bảo mật doanh nghiệp
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Thêm tài liệu mới
        </button>
      </div>

      {/* Tabs Menu (Section 2) */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setSearchParams({})}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tất cả tài liệu
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'my_docs' })}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'my_docs'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tài liệu của tôi
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'expiring' })}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'expiring'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Sắp hết hạn
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'liquidated' })}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'liquidated'
              ? 'border-slate-600 text-slate-800 bg-slate-100 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Archive className="w-3.5 h-3.5 text-slate-500" />
          Đã nghiệm thu / Thanh lý
        </button>
      </div>

      {/* Bộ lọc đa năng (Section 4) */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Keyword search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm theo tiêu đề, số hợp đồng, tên đối tác..."
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5" /> Tìm kiếm
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Row 2: Advance filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100">
          {/* Trạng thái */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
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
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Mức độ bảo mật
            </label>
            <select
              value={securityFilter}
              onChange={(e) => setSecurityFilter(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="ALL">Tất cả bảo mật</option>
              <option value="CONFIDENTIAL">Mật (Confidential)</option>
              <option value="INTERNAL">Nội bộ (Internal)</option>
              <option value="PUBLIC">Công khai (Public)</option>
            </select>
          </div>

          {/* Loại tài liệu */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Phân loại
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
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
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Phòng ban
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="ALL">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Khoảng thời gian: Chọn Ngày ban hành hay Hết hạn */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Theo ngày
            </label>
            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value as any)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              <option value="published_date">Ngày ban hành</option>
              <option value="expiry_date">Ngày hết hạn</option>
            </select>
          </div>

          {/* Từ ngày -> Đến ngày */}
          <div className="flex items-center gap-1.5">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-2 py-1 rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-2 py-1 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Bảng Danh Sách Tài Liệu (Section 3) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Đang tải danh sách tài liệu...
          </div>
        ) : documents.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="font-semibold text-slate-700">Không tìm thấy tài liệu phù hợp</div>
            <p className="text-slate-400">Hãy thử điều chỉnh bộ lọc hoặc tải lên tài liệu mới</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Mã tài liệu</th>
                  <th className="py-3 px-3.5">Tên tài liệu / Văn bản</th>
                  <th className="py-3 px-3.5">Phân loại</th>
                  <th className="py-3 px-3.5">Phòng ban</th>
                  <th className="py-3 px-3.5">Ngày ban hành</th>
                  <th className="py-3 px-3.5">Ngày hết hạn</th>
                  <th className="py-3 px-3.5">Trạng thái</th>
                  <th className="py-3 px-3.5">Người lưu</th>
                  <th className="py-3 px-3.5">Bảo mật</th>
                  <th className="py-3 px-3.5">Quyền</th>
                  <th className="py-3 px-3.5 text-center">Xem file</th>
                  <th className="py-3 px-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Mã tài liệu */}
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {doc.documentCode}
                    </td>

                    {/* Tên tài liệu / Văn bản */}
                    <td className="py-3 px-3.5 min-w-[220px]">
                      <div className="font-bold text-slate-900 line-clamp-1">{doc.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-500">{doc.fileName}</span>
                        {doc.version > 1 && (
                          <span className="text-[10px] font-extrabold bg-purple-100 text-purple-700 px-1 py-0.2 rounded">
                            V{doc.version}
                          </span>
                        )}
                        {doc.partnerName && (
                          <span className="text-slate-500 truncate max-w-[120px]">
                            • {doc.partnerName}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phân loại */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {doc.documentTypeName}
                      </span>
                    </td>

                    {/* Phòng ban */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{doc.departmentName}</div>
                    </td>

                    {/* Ngày ban hành */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                      {doc.publishedDate
                        ? new Date(doc.publishedDate).toLocaleDateString('vi-VN')
                        : '—'}
                    </td>

                    {/* Ngày hết hạn */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-600">
                      {doc.expiryDate
                        ? new Date(doc.expiryDate).toLocaleDateString('vi-VN')
                        : 'Vô thời hạn'}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {getStatusBadge(doc.status, doc.daysUntilExpiry)}
                    </td>

                    {/* Người lưu */}
                    <td className="py-3 px-3.5 whitespace-nowrap font-medium text-slate-700">
                      {doc.uploaderName}
                    </td>

                    {/* Mức độ bảo mật */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {getSecurityBadge(doc.securityLevel)}
                    </td>

                    {/* Quyền */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {getPermissionBadge(doc.userPermission)}
                    </td>

                    {/* Xem file button */}
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => {
                          setPreviewFile({
                            id: doc.id,
                            name: doc.name,
                            fileName: doc.fileName,
                            extension: doc.fileType,
                            url: `/api/documents/${doc.id}/file`,
                            previewUrl: `/api/documents/${doc.id}/file`
                          });
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Xem trước tài liệu"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Thao tác Menu */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap relative">
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
                                {doc.canAdmin && (
                                  <button
                                    onClick={() => setPermissionDoc(doc)}
                                    className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Phân quyền tài liệu</span>
                                  </button>
                                )}

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
                                    onClick={() => handleDelete(doc)}
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
        )}

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 text-xs text-slate-500">
          <div>
            Hiển thị <span className="font-bold text-slate-800">{documents.length}</span> trên tổng số{' '}
            <span className="font-bold text-slate-800">{total}</span> tài liệu
          </div>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="text-xs px-2 py-1 rounded-lg border border-slate-300 bg-white"
            >
              <option value="10">10 dòng / trang</option>
              <option value="25">25 dòng / trang</option>
              <option value="50">50 dòng / trang</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => fetchDocuments(page - 1)}
                className="p-1 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold text-slate-800">
                {page} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => fetchDocuments(page + 1)}
                className="p-1 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Upload mới */}
      <CreateDocumentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchDocuments(1)}
      />

      {/* Modal Phiên bản */}
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

      {/* Modal Phân quyền */}
      {permissionDoc && (
        <DocumentPermissionsModal
          isOpen={!!permissionDoc}
          documentId={permissionDoc.id}
          documentTitle={permissionDoc.name}
          onClose={() => setPermissionDoc(null)}
          onPermissionsUpdated={() => fetchDocuments(page)}
        />
      )}

      {/* Modal Xem file trực tiếp */}
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
