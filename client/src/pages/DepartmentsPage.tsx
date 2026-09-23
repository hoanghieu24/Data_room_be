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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Quản Lý Phòng Ban Doanh Nghiệp
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý cơ cấu tổ chức, phòng ban chuyên trách và nhân sự trực thuộc
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Thêm phòng ban mới
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo mã hoặc tên phòng ban..."
            className="w-full text-xs pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Đang tải danh sách phòng ban...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">Không tìm thấy phòng ban nào.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dept) => (
            <div
              key={dept.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{dept.name}</h3>
                      <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {dept.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(dept)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{dept.member_count !== undefined ? dept.member_count : 0} thành viên</span>
                </span>

                <button
                  onClick={() => handleViewMembers(dept)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingDept ? 'Cập nhật Phòng ban' : 'Thêm mới Phòng ban'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã phòng ban <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: SALES, IT, HR, LEGAL"
                  className="w-full text-xs font-mono uppercase px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên phòng ban <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Phòng Kinh Doanh & Tiếp Thị"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả chức năng nhiệm vụ
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chức năng hoạt động..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu phòng ban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Members Modal */}
      {viewingMembersDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Thành viên: {viewingMembersDept.name}
                </h2>
                <span className="text-xs text-slate-400">Mã: {viewingMembersDept.code}</span>
              </div>
              <button
                onClick={() => setViewingMembersDept(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingMembers ? (
                <div className="py-8 text-center text-xs text-slate-400">Đang tải danh sách thành viên...</div>
              ) : members.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Phòng ban này hiện chưa có nhân viên trực thuộc.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {m.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{m.full_name}</div>
                          <div className="text-[11px] text-slate-400">{m.email}</div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                        {m.role_name || m.role_code || 'STAFF'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 flex justify-end bg-slate-50/50">
              <button
                type="button"
                onClick={() => setViewingMembersDept(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl"
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
