import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Globe, Folder } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TreeNode } from './FolderTree';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string | null;
  onSuccess: () => void;
  tree?: TreeNode[];
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  parentId,
  onSuccess,
  tree = [],
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(parentId);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSelectedParentId(parentId);
    }
  }, [isOpen, parentId]);

  if (!isOpen) return null;

  // Flatten tree for dropdown
  const flattenFolders = (nodes: TreeNode[], depth = 0): { id: string; name: string; depth: number }[] => {
    let result: { id: string; name: string; depth: number }[] = [];
    for (const node of nodes) {
      result.push({ id: String(node.id), name: node.name, depth });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenFolders(node.children, depth + 1));
      }
    }
    return result;
  };

  const flatList = flattenFolders(tree);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/folders', {
        name: name.trim(),
        description: description.trim(),
        parentId: selectedParentId ? Number(selectedParentId) : null,
      });

      if (res.data.success) {
        toast('success', selectedParentId ? 'Đã tạo thư mục con thành công!' : 'Đã tạo thư mục gốc (cùng cấp Data Room) thành công!');
        setName('');
        setDescription('');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khi tạo thư mục');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <FolderPlus className="w-5 h-5 text-blue-600" />
            <span>Tạo thư mục mới</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Vị trí lưu (Thư mục cha) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Vị trí lưu thư mục
            </label>

            {/* Quick toggle buttons */}
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setSelectedParentId(null)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedParentId === null
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs ring-1 ring-blue-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>🌐 Thư mục gốc (Root)</span>
              </button>

              {parentId && (
                <button
                  type="button"
                  onClick={() => setSelectedParentId(parentId)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer truncate ${
                    selectedParentId === parentId
                      ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs ring-1 ring-amber-300'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Thư mục hiện tại</span>
                </button>
              )}
            </div>

            {/* Full Folder Select Dropdown */}
            <select
              value={selectedParentId || ''}
              onChange={(e) => setSelectedParentId(e.target.value ? e.target.value : null)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white text-slate-800 font-medium cursor-pointer"
            >
              <option value="">🌐 Thư mục gốc (Root - Cùng cấp với Data Room)</option>
              {flatList.map((f) => (
                <option key={f.id} value={f.id}>
                  {'　'.repeat(f.depth)}📁 {f.name}
                </option>
              ))}
            </select>

            <div className="text-[11px] text-slate-500 mt-1.5">
              {selectedParentId === null ? (
                <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-medium">
                  ✓ Thư mục sẽ nằm ở ngoài cùng (Root), cùng cấp với Data Room
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-600">
                  📁 Sẽ được tạo bên trong thư mục: <strong>{flatList.find((f) => f.id === String(selectedParentId))?.name || selectedParentId}</strong>
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên thư mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Dự án mới, Tài liệu chung, ..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả (tùy chọn)</label>
            <textarea
              rows={2}
              placeholder="Ghi chú về nội dung bên trong thư mục này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Đang tạo...' : 'Tạo thư mục'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
