import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderLock, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast('success', 'Đăng nhập thành công!');
      navigate('/');
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-lg border border-slate-200/80 overflow-hidden">
        {/* Brand Header */}
        <div className="p-6 sm:p-8 text-center border-b border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-3 text-white shadow-md shadow-blue-500/20">
            <FolderLock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">KTS Data Room</h2>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống Quản lý Hồ sơ & Phân quyền Doanh nghiệp
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Email tài khoản</label>
              <input
                type="email"
                required
                placeholder="tennguoidung@dataroom.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800 bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              <span>{loading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick test accounts */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-500" /> Chọn tài khoản mẫu:
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@dataroom.local', 'Admin@123')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs rounded-lg font-medium transition-colors cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('manager@dataroom.local', 'Staff@123')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs rounded-lg font-medium transition-colors cursor-pointer"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff@dataroom.local', 'Staff@123')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs rounded-lg font-medium transition-colors cursor-pointer"
              >
                Staff
              </button>
            </div>
          </div>

          <div className="pt-2 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Bảo mật dữ liệu Cloud & mã hóa đa tầng</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
