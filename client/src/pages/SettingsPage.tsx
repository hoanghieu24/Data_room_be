import React, { useState, useEffect } from 'react';
import { Settings, Cloud, Shield, Key, RefreshCw, CheckCircle2 } from 'lucide-react';
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
    if (user?.role?.toUpperCase() !== 'ADMIN') {
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
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" /> Cài Đặt Hệ Thống & Lưu Trữ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình bộ nhớ đám mây Cloudinary và các quy tắc thời hạn hồ sơ doanh nghiệp.
          </p>
        </div>
      </div>

      {/* Storage Mode Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
          isConfigured
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            : 'bg-amber-50/70 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isConfigured ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}
          >
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-xs flex items-center gap-2">
              <span>Trạng thái lưu trữ:</span>
              <span className="font-bold">
                {isConfigured ? 'Đang kích hoạt Cloudinary Cloud Storage' : 'Đang dùng Local Storage (Cục bộ)'}
              </span>
            </div>
            <p className="text-[11px] opacity-80 mt-0.5">
              {isConfigured
                ? 'Toàn bộ file tải lên được mã hóa và lưu trữ tự động trên Cloudinary DataRoom container.'
                : 'Hệ thống tự động lưu cục bộ trong thư mục uploads/ an toàn. Điền thông tin bên dưới để kích hoạt Cloudinary.'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchCloudinaryStatus}
          className="p-2 hover:bg-white/60 rounded-xl transition-colors cursor-pointer text-slate-600"
          title="Kiểm tra lại kết nối"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" /> Cấu hình API Cloudinary
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lấy các thông số trong bảng điều khiển Cloudinary Console (Dashboard &gt; Product Environment Credentials).
          </p>
        </div>

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
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
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
              className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              * Dữ liệu API Secret được bảo vệ mã hóa trên máy chủ
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Đang lưu...' : 'Lưu cấu hình Cloudinary'}
            </button>
          </div>
        </form>
      </div>

      {/* DMS Configuration Card */}
      <DmsSettingsSection user={user} />
    </div>
  );
};

const DmsSettingsSection: React.FC<{ user: any }> = ({ user }) => {
  const { toast } = useToast();
  const [warningDays, setWarningDays] = useState(30);
  const [namingRule, setNamingRule] = useState('[DATE]_[TYPE]_[PARTNER]_[VERSION]');
  const [savingDms, setSavingDms] = useState(false);

  useEffect(() => {
    api.get('/settings/dms').then(res => {
      if (res.data.success) {
        setWarningDays(res.data.settings.expiryWarningDays || 30);
        setNamingRule(res.data.settings.fileNamingRule || '[DATE]_[TYPE]_[PARTNER]_[VERSION]');
      }
    }).catch(() => {});
  }, []);

  const handleSaveDms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role?.toUpperCase() !== 'ADMIN') {
      toast('error', 'Chỉ Quản trị viên mới được điều chỉnh cấu hình hệ thống');
      return;
    }

    setSavingDms(true);
    try {
      const res = await api.put('/settings/dms', {
        expiryWarningDays: Number(warningDays),
        fileNamingRule: namingRule.trim()
      });
      if (res.data.success) {
        toast('success', 'Đã lưu cấu hình DMS thành công');
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khi lưu cấu hình DMS');
    } finally {
      setSavingDms(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Cấu Hình Nghiệp Vụ Tài Liệu & Cảnh Báo</h3>
          <p className="text-xs text-slate-400">Điều chỉnh chu kỳ cảnh báo tài liệu sắp hết hạn và quy tắc chuẩn hóa</p>
        </div>
      </div>

      <form onSubmit={handleSaveDms} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Số ngày cảnh báo "Sắp hết hạn"
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={365}
              required
              value={warningDays}
              onChange={(e) => setWarningDays(Number(e.target.value))}
              className="w-32 px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-800 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <span className="text-slate-500 font-medium">ngày trước khi tài liệu hết hiệu lực</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Tất cả tài liệu có thời hạn nằm trong khoảng này sẽ tự động hiển thị trạng thái "Sắp hết hạn".
          </p>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Mẫu quy tắc đặt tên tệp tin (File Naming Template)
          </label>
          <input
            type="text"
            required
            value={namingRule}
            onChange={(e) => setNamingRule(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-700 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Các thẻ hợp lệ: [DATE], [TYPE], [PARTNER], [VERSION] (VD: 23-09-2026_HOP-DONG_Cong-Ty-ABC_V1.pdf)
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={savingDms}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {savingDms ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </form>
    </div>
  );
};
