import React, { useState, useEffect } from 'react';
import { X, Lock, KeyRound, Unlock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface SetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: any | null;
  onSuccess: () => void;
}

export const SetPasswordModal: React.FC<SetPasswordModalProps> = ({
  isOpen,
  onClose,
  file,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setShowPassword(false);
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const isProtected = !!file.hasPassword || !!file.isEncrypted;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Vui lòng nhập mật mã bảo vệ');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật mã xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/files/' + file.id + '/password', {
        password: password.trim(),
      });
      if (res.data.success) {
        toast('success', res.data.message || 'Đã cài đặt mật mã bảo vệ thành công');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cài đặt mật mã');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn gỡ bỏ mật mã bảo vệ của tệp này? Mọi người có quyền truy cập sẽ có thể xem mà không cần mật mã.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/files/' + file.id + '/password', { password: '' });
      if (res.data.success) {
        toast('success', 'Đã gỡ bỏ mật mã bảo vệ tài liệu');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi gỡ bỏ mật mã');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <Lock className="w-5 h-5 text-amber-600" />
            <span>{isProtected ? 'Quản lý mật mã bảo vệ tài liệu' : 'Cài đặt mật mã bảo vệ tài liệu'}</span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Tài liệu áp dụng
            </div>
            <div className="font-bold text-xs text-slate-800 truncate">{file.name}</div>
            <div className="flex items-center gap-2 mt-2">
              {isProtected ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-md">
                  <Lock className="w-3 h-3 text-amber-600" /> Đang có mật mã bảo vệ
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-200/60 px-2 py-0.5 rounded-md">
                  <Unlock className="w-3 h-3 text-slate-500" /> Chưa cài mật mã
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isProtected ? 'Mật mã mới (hoặc đổi mật mã)' : 'Mật mã bảo vệ'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật mã..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Xác nhận mật mã
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật mã..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            {error && (
              <div className="text-xs text-rose-600 font-medium flex items-center gap-1.5 p-2 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 text-[11px] text-slate-500 flex items-start gap-2 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                Khi bật mật mã, bất kỳ người dùng nào khác muốn xem trực tiếp (Preview) hoặc tải xuống tệp tin này đều phải nhập đúng mật mã.
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {isProtected ? (
                <button
                  type="button"
                  onClick={handleRemovePassword}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                >
                  Gỡ bỏ mật mã
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{loading ? 'Đang lưu...' : 'Lưu mật mã'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

