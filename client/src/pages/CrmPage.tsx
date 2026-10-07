import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, Plus, FolderLock, Mail, Phone, X } from 'lucide-react';
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
      if (cRes.data.success) setClients(cRes.data.clients || []);
      if (dRes.data.success) setDeals(dRes.data.deals || []);
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
        toast('success', 'Đã thêm khách hàng và tạo thư mục Data Room riêng');
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
        toast('success', 'Đã tạo Deal thương vụ và liên kết Data Room');
        setShowAddDeal(false);
        setDealTitle('');
        fetchData();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi tạo Deal');
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Khách Hàng & Deals CRM</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi khách hàng hoặc thương vụ tự động tích hợp Data Room riêng để quản lý hồ sơ thẩm định và hợp đồng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tab === 'clients' ? (
            <button
              onClick={() => setShowAddClient(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Khách hàng</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddDeal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Deal Mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit">
        <button
          onClick={() => setTab('clients')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            tab === 'clients'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Khách hàng ({clients.length})</span>
        </button>
        <button
          onClick={() => setTab('deals')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            tab === 'deals'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Thương vụ / Deals ({deals.length})</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Đang tải dữ liệu CRM...</div>
      ) : tab === 'clients' ? (
        /* Tab 1: Clients */
        clients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-xs text-slate-400">
            Chưa có khách hàng nào. Nhấn "+ Thêm Khách hàng" để bắt đầu.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      {c.status || 'ACTIVE'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <div className="font-bold text-sm text-slate-900">{c.name}</div>
                  <div className="text-xs text-slate-500 font-medium">{c.company || 'Cá nhân'}</div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    {c.email && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {c.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {c.deals?.length || 0} Deals
                  </span>

                  {c.folderId && (
                    <button
                      onClick={() => navigate('/documents?folderId=' + c.folderId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <FolderLock className="w-3.5 h-3.5" /> Mở Data Room
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Tab 2: Deals */
        deals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-xs text-slate-400">
            Chưa có deal thương vụ nào. Nhấn "+ Tạo Deal Mới" để bắt đầu.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700">
                      {d.stage}
                    </span>
                    <div className="font-bold text-slate-900 text-sm">
                      {Number(d.value).toLocaleString('vi-VN')} đ
                    </div>
                  </div>

                  <div className="font-bold text-sm text-slate-900 leading-snug">{d.title}</div>
                  <div className="text-xs text-blue-600 font-medium mt-1">Khách hàng: {d.client?.name}</div>

                  <div className="mt-2 text-[11px] text-slate-400">
                    Phụ trách: {d.assignedTo?.fullName || 'Chưa gán'}
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {new Date(d.updatedAt).toLocaleDateString('vi-VN')}
                  </span>

                  {d.folderId && (
                    <button
                      onClick={() => navigate('/documents?folderId=' + d.folderId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <FolderLock className="w-3.5 h-3.5" /> Data Room
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal Add Client */}
      {showAddClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200/80 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Thêm Khách Hàng Mới</h3>
              <button onClick={() => setShowAddClient(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên khách hàng / Đại diện *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Anh Hoàng Long"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Công ty / Doanh nghiệp</label>
                <input
                  type="text"
                  placeholder="VD: VinaTech Global"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="contact@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="0912345678"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer"
                >
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
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200/80 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800">Tạo Cơ Hội / Deal Mới</h3>
              <button onClick={() => setShowAddDeal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateDeal} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiêu đề Deal / Dự án *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hợp đồng triển khai phần mềm ERP"
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khách hàng trực thuộc *</label>
                <select
                  required
                  value={dealClientId}
                  onChange={(e) => setDealClientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company || 'Cá nhân'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giá trị thương vụ (VNĐ)</label>
                <input
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giai đoạn hiện tại</label>
                <select
                  value={dealStage}
                  onChange={(e) => setDealStage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="DISCOVERY">Thăm dò nhu cầu (Discovery)</option>
                  <option value="PROPOSAL">Gửi đề xuất (Proposal)</option>
                  <option value="NEGOTIATION">Thương lượng (Negotiation)</option>
                  <option value="DUE_DILIGENCE">Thẩm định Data Room (Due Diligence)</option>
                  <option value="WON">Thành công (Won)</option>
                  <option value="LOST">Thất bại (Lost)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDeal(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl cursor-pointer"
                >
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
