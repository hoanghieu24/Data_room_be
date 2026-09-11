import React, { useState, useEffect } from 'react';
import { X, Move, Folder, Layers } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface MoveModalProps {
  item: any | null;
  type: 'folder' | 'file';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MoveModal: React.FC<MoveModalProps> = ({
  item,
  type,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [tree, setTree] = useState<any[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchTree = async () => {
        try {
          const res = await api.get('/folders/tree');
          if (res.data.success) {
            setTree(res.data.tree || []);
          }
        } catch (e) {}
      };
      fetchTree();
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handleMove = async () => {
    setLoading(true);
    try {
      if (type === 'folder') {
        const res = await api.put('/folders/' + item.id + '/move', { targetParentId: targetFolderId });
        if (res.data.success) {
          toast('success', 'Di chuyển thư mục thành công!');
          onSuccess();
          onClose();
        }
      } else {
        const res = await api.put('/files/' + item.id + '/move', { targetFolderId });
        if (res.data.success) {
          toast('success', 'Di chuyển tệp thành công!');
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Không thể di chuyển (Phát hiện vòng lặp hoặc lỗi)');
    } finally {
      setLoading(false);
    }
  };

  const renderOptions = (nodes: any[], depth: number = 0): JSX.Element[] => {
    let elements: JSX.Element[] = [];
    nodes.forEach((node) => {
      // If moving folder, disable moving into itself
      const isSelf = type === 'folder' && node.id === item.id;
      elements.push(
        <option key={node.id} value={node.id} disabled={isSelf}>
          {' '.repeat(depth * 3)}📁 {node.name} {isSelf ? '(Thư mục hiện tại)' : ''}
        </option>
      );
      if (node.children && node.children.length > 0) {
        elements = elements.concat(renderOptions(node.children, depth + 1));
      }
    });
    return elements;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <Move className="w-5 h-5 text-blue-600" />
            <span>Di chuyển {type === 'folder' ? 'thư mục' : 'tài liệu'}: {item.name}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-xs text-slate-600">
            Chọn thư mục đích để di chuyển. Hệ thống tự động kiểm tra ngăn chặn vòng lặp cha - con.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Thư mục đích</label>
            <select
              value={targetFolderId || ''}
              onChange={(e) => setTargetFolderId(e.target.value ? e.target.value : null)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-hidden"
            >
              <option value="">📁 [Thư mục gốc - Root]</option>
              {renderOptions(tree)}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleMove}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Đang di chuyển...' : 'Xác nhận di chuyển'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
