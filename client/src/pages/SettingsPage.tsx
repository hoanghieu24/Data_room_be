import React, { useState, useEffect } from 'react';
import { Settings, Cloud, CheckCircle, Shield, Key, Database, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [cloudName, setCloudName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCloudinaryStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/cloudinary');
      if (res.data.success) {
        setIsConfigured(res.data.configured);
        setCloudName(res.data.cloudName || '');
        setApiKey(res.data.apiKey || '');
        if (res.data.hasSecret) setApiSecret('********');
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudinaryStatus();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'ADMIN') {
      toast('error', 'Chỉ Quản trị viên mới được cấu hình Cloudinary');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/settings/cloudinary', {
        cloudName,
        apiKey,
        apiSecret,
      });
      if (res.data.success) {
        toast('success', res.data.message);
        setIsConfigured(res.data.configured);
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi lưu cấu hình Cloudinary');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" /> Cài Đặt Hệ Thống & Cloudinary
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý khóa tích hợp Cloudinary Storage SDK và cơ chế lưu trữ tài nguyên vật lý.
        </p>
      </div>

      {/* Storage Mode Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between ${
          isConfigured
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isConfigured ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}
          >
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs">
              Trạng thái lưu trữ:{' '}
              {isConfigured ? 'Đang kích hoạt Cloudinary Cloud Storage' : 'Đang dùng Local Storage Fallback Driver'}
            </div>
            <p className="text-[11px] opacity-80 mt-0.5">
              {isConfigured
                ? 'Toàn bộ file tải lên được mã hóa và lưu trữ tự động trên Cloudinary DataRoom container.'
                : 'Hệ thống tự động lưu cục bộ trong thư mục uploads/ bảo mật. Điền thông tin bên dưới để đồng bộ lên Cloudinary.'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchCloudinaryStatus}
          className="p-2 hover:bg-white/50 rounded-xl transition-colors"
          title="Kiểm tra lại kết nối"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="font-bold text-sm text-slate-800 mb-1 flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-600" /> Cấu hình API Cloudinary
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Lấy các thông số trong bảng điều khiển Cloudinary Console (Dashboard &gt; Product Environment Credentials).
        </p>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Cloud Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: dxyz12345"
              value={cloudName}
              onChange={(e) => setCloudName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              API Key <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: 123456789012345"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              API Secret <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              placeholder="••••••••••••••••••••••••"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              * Dữ liệu được mã hóa an toàn trong cơ sở dữ liệu hệ thống
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Đang lưu & Kiểm tra...' : 'Lưu & Kích hoạt Cloudinary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
