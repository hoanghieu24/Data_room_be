import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderLock, ArrowRight, ShieldCheck } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Brand Header */}
        <div className="bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-600 p-8 text-white text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-lg">
            <FolderLock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">KTS CRM</h2>
          <p className="text-blue-100 text-xs mt-1">
            Hệ thống Quản lý Dữ liệu & Khách hàng Doanh nghiệp
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Tài khoản Email</label>
              <input
                type="email"
                required
                placeholder="tennguoidung@ktscrm.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden font-medium text-slate-800"
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
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden font-medium text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
            >
              <span>{loading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Bảo mật dữ liệu doanh nghiệp & mã hóa đa tầng</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
