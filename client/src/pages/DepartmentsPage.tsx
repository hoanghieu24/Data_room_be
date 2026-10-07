import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Users,
  Edit2,
  Trash2,
  X,
  Search,
  CheckCircle2,
  Shield,
  UserCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // View members modal state
  const [viewingMembersDept, setViewingMembersDept] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data?.data || res.data.data || []);
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Không thể tải danh sách phòng ban');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setCode('');
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: any) => {
    setEditingDept(dept);
    setCode(dept.code);
    setName(dept.name);
    setDescription(dept.description || '');
    setIsModalOpen(true);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingDept) {
        const res = await api.put(`/departments/${editingDept.id}`, {
          code: code.trim(),
          name: name.trim(),
          description: description.trim()
        });
        if (res.data.success) {
          toast('success', 'Cập nhật phòng ban thành công');
          setIsModalOpen(false);
          fetchDepartments();
        }
      } else {
        const res = await api.post('/departments', {
          code: code.trim(),
          name: name.trim(),
          description: description.trim()
        });
        if (res.data.success) {
          toast('success', 'Thêm phòng ban mới thành công');
          setIsModalOpen(false);
          fetchDepartments();
        }
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khi lưu phòng ban');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (dept: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phòng ban "${dept.name}" (${dept.code})?`)) {
      return;
    }

    try {
      const res = await api.delete(`/departments/${dept.id}`);
      if (res.data.success) {
        toast('success', 'Xóa phòng ban thành công');
        fetchDepartments();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Không thể xóa phòng ban');
    }
  };

  const handleViewMembers = async (dept: any) => {
    setViewingMembersDept(dept);
    setLoadingMembers(true);
    try {
      const res = await api.get(`/departments/${dept.id}/members`);
      if (res.data.success) {
        setMembers(res.data.members || []);
      }
    } catch (err: any) {
      toast('error', 'Không thể tải danh sách thành viên');
    } finally {
      setLoadingMembers(false);
    }
  };

  const filtered = departments.filter(
    (d) =>
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Quản Lý Phòng Ban
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cơ cấu tổ chức phòng ban và nhân sự trực thuộc trong doanh nghiệp
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm phòng ban</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã hoặc tên phòng ban..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Đang tải danh sách phòng ban...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-xs text-slate-400">
          Không tìm thấy phòng ban nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dept) => (
            <div
              key={dept.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{dept.name}</h3>
                      <span className="font-mono text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/60">
                        {dept.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(dept)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDepartment(dept)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa phòng ban"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mt-2">
                  {dept.description || 'Chưa có thông tin mô tả chi tiết cho phòng ban này.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dept.member_count !== undefined ? dept.member_count : 0} thành viên</span>
                </span>

                <button
                  onClick={() => handleViewMembers(dept)}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  Xem thành viên
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                {editingDept ? 'Chỉnh Sửa Phòng Ban' : 'Thêm Phòng Ban Mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã phòng ban <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: KT, HCNS, KD, IT..."
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên phòng ban <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phòng Kế Toán, Ban Giám Đốc..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả chức năng
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả chức năng, nhiệm vụ phòng ban..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingDept ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Members Modal */}
      {viewingMembersDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Thành viên: {viewingMembersDept.name}
                </h3>
                <p className="text-[11px] text-slate-400">Danh sách nhân sự thuộc phòng ban</p>
              </div>
              <button
                onClick={() => setViewingMembersDept(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-80 overflow-y-auto">
              {loadingMembers ? (
                <div className="py-8 text-center text-xs text-slate-400">Đang tải thành viên...</div>
              ) : members.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Chưa có thành viên nào được gán vào phòng ban này.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {members.map((m: any) => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{m.fullName || m.username}</div>
                        <div className="text-[11px] text-slate-400">{m.email}</div>
                      </div>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingMembersDept(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
