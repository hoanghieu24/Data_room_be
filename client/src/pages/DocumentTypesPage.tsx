import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const DocumentTypesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/document-types');
      if (res.data.success) {
        setTypes(res.data.types || []);
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Không thể tải danh sách loại tài liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleOpenCreate = () => {
    setEditingType(null);
    setCode('');
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingType(t);
    setCode(t.code);
    setName(t.name);
    setDescription(t.description || '');
    setIsModalOpen(true);
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingType) {
        const res = await api.put(`/document-types/${editingType.id}`, {
          name: name.trim(),
          description: description.trim()
        });
        if (res.data.success) {
          toast('success', 'Cập nhật loại tài liệu thành công');
          setIsModalOpen(false);
          fetchTypes();
        }
      } else {
        const res = await api.post('/document-types', {
          code: code.trim(),
          name: name.trim(),
          description: description.trim()
        });
        if (res.data.success) {
          toast('success', 'Thêm loại tài liệu mới thành công');
          setIsModalOpen(false);
          fetchTypes();
        }
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khi lưu loại tài liệu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteType = async (t: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa loại tài liệu "${t.name}" (${t.code})?`)) {
      return;
    }

    try {
      const res = await api.delete(`/document-types/${t.id}`);
      if (res.data.success) {
        toast('success', 'Xóa loại tài liệu thành công');
        fetchTypes();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Không thể xóa loại tài liệu');
    }
  };

  const filtered = types.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            Loại Tài Liệu & Phân Loại
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh mục các loại văn bản, hồ sơ hợp đồng và quy tắc phân loại trong hệ thống
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm loại tài liệu</span>
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
            placeholder="Tìm theo mã hoặc tên loại tài liệu..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Đang tải danh mục...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">Không tìm thấy loại tài liệu nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Mã phân loại</th>
                  <th className="py-3 px-4">Tên loại tài liệu</th>
                  <th className="py-3 px-4">Mô tả</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                      {t.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {t.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-md">
                      {t.description || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {t.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Đang áp dụng
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Ngưng áp dụng
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteType(t)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa loại tài liệu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                {editingType ? 'Cập nhật Loại tài liệu' : 'Thêm mới Loại tài liệu'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveType} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã phân loại <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingType)}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VD: HOP_DONG, BIEN_BAN, DE_XUAT..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên loại tài liệu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Hợp đồng kinh tế, Biên bản nghiệm thu..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả mục đích và tính chất loại tài liệu..."
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
                  {submitting ? 'Đang lưu...' : editingType ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
