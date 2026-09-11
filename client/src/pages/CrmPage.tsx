import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, Plus, FolderLock, DollarSign, Mail, Phone, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const CrmPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<'clients' | 'deals'>('clients');
  const [clients, setClients] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Client Modal
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // New Deal Modal
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState<number>(100000000);
  const [dealClientId, setDealClientId] = useState('');
  const [dealStage, setDealStage] = useState('DISCOVERY');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([api.get('/crm/clients'), api.get('/crm/deals')]);
      if (cRes.data.success) setClients(cRes.data.clients);
      if (dRes.data.success) setDeals(dRes.data.deals);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/crm/clients', {
        name: clientName,
        company: clientCompany,
        email: clientEmail,
        phone: clientPhone,
      });
      if (res.data.success) {
        toast('success', 'Đã thêm khách hàng và tự động tạo thư mục Data Room riêng!');
        setShowAddClient(false);
        setClientName('');
        setClientCompany('');
        setClientEmail('');
        setClientPhone('');
        fetchData();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi tạo khách hàng');
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealClientId) {
      toast('error', 'Vui lòng chọn khách hàng cho Deal');
      return;
    }
    try {
      const res = await api.post('/crm/deals', {
        title: dealTitle,
        value: Number(dealValue),
        clientId: dealClientId,
        stage: dealStage,
      });
      if (res.data.success) {
        toast('success', 'Đã tạo Deal thương vụ và liên kết Data Room đàm phán!');
        setShowAddDeal(false);
        setDealTitle('');
        fetchData();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi tạo Deal');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Khách Hàng & Deals CRM</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi khách hàng hoặc thương vụ tự động tích hợp Data Room riêng để quản lý hồ sơ thẩm định & hợp đồng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tab === 'clients' ? (
            <button
              onClick={() => setShowAddClient(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Thêm Khách hàng
            </button>
          ) : (
            <button
              onClick={() => setShowAddDeal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Tạo Cơ hội / Deal Mới
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('clients')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            tab === 'clients'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" /> Danh sách Khách hàng ({clients.length})
        </button>
        <button
          onClick={() => setTab('deals')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            tab === 'deals'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Đường ống Thương vụ / Deals ({deals.length})
        </button>
      </div>

      {/* Tab 1: Clients */}
      {tab === 'clients' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {c.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div className="font-bold text-sm text-slate-800">{c.name}</div>
                <div className="text-xs text-slate-500 font-medium">{c.company || 'Cá nhân'}</div>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {c.email && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {c.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">
                  {c.deals?.length || 0} Deals đang chạy
                </span>

                {c.folderId && (
                  <button
                    onClick={() => navigate('/dataroom?folderId=' + c.folderId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition-colors"
                  >
                    <FolderLock className="w-3.5 h-3.5" /> Mở Data Room
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Deals */}
      {tab === 'deals' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    {d.stage}
                  </span>
                  <div className="font-black text-slate-800 text-sm flex items-center">
                    {Number(d.value).toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>

                <div className="font-bold text-sm text-slate-800 leading-snug">{d.title}</div>
                <div className="text-xs text-blue-600 font-medium mt-1">Khách hàng: {d.client?.name}</div>

                <div className="mt-2 text-[11px] text-slate-500">
                  Phụ trách: {d.assignedTo?.fullName || 'Chưa gán'}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {new Date(d.updatedAt).toLocaleDateString('vi-VN')}
                </span>

                {d.folderId && (
                  <button
                    onClick={() => navigate('/dataroom?folderId=' + d.folderId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold border border-purple-200 transition-colors"
                  >
                    <FolderLock className="w-3.5 h-3.5" /> Hồ sơ Deal Data Room
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Client */}
      {showAddClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <h3 className="font-bold text-sm text-slate-800">Thêm Khách Hàng CRM Mới</h3>
            <form onSubmit={handleCreateClient} className="space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Tên khách hàng / Đại diện *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Anh Hoàng Long"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Công ty / Tổ chức</label>
                <input
                  type="text"
                  placeholder="VD: VinaTech Global"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="contact@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="0912345678"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddClient(false)} className="px-3 py-1.5 rounded-lg">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg">
                  Lưu khách hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Deal */}
      {showAddDeal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <h3 className="font-bold text-sm text-slate-800">Tạo Cơ Hội / Deal Mới</h3>
            <form onSubmit={handleCreateDeal} className="space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Tên thương vụ *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hợp đồng Cung ứng Phần mềm 2025"
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Giá trị thương vụ (VNĐ)</label>
                <input
                  type="number"
                  required
                  value={dealValue}
                  onChange={(e) => setDealValue(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Khách hàng đối tác *</label>
                <select
                  required
                  value={dealClientId}
                  onChange={(e) => setDealClientId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company || 'Doanh nghiệp'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Giai đoạn</label>
                <select
                  value={dealStage}
                  onChange={(e) => setDealStage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="DISCOVERY">Khám phá / Tiếp cận</option>
                  <option value="PROPOSAL">Gửi Báo giá / Hồ sơ</option>
                  <option value="NEGOTIATION">Đàm phán Hợp đồng</option>
                  <option value="WON">Thành công (Won)</option>
                  <option value="LOST">Thất bại (Lost)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddDeal(false)} className="px-3 py-1.5 rounded-lg">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-1.5 bg-purple-600 text-white font-bold rounded-lg">
                  Tạo Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
