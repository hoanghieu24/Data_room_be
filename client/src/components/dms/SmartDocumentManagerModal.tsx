import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Copy,
  HardDrive,
  PieChart,
  BrainCircuit,
  X,
  CheckCircle2,
  Clock,
  KeyRound,
  FileText,
  Trash2,
  Eye,
  Download,
  Filter,
  ArrowRight,
  TrendingUp,
  Tag,
  Building2,
  FolderOpen
} from 'lucide-react';

interface SmartDocumentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: any[];
  onRefresh: () => void;
  onPreview: (doc: any) => void;
  onSetPassword: (doc: any) => void;
  onSelectDoc?: (doc: any) => void;
}

export const SmartDocumentManagerModal: React.FC<SmartDocumentManagerModalProps> = ({
  isOpen,
  onClose,
  documents,
  onRefresh,
  onPreview,
  onSetPassword,
  onSelectDoc
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'duplicates' | 'analytics' | 'ai'>('alerts');
  const [selectedAiDocId, setSelectedAiDocId] = useState<number | string>(
    documents.length > 0 ? documents[0].id : ''
  );
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  // 1. SMART SCAN ALERTS
  const alerts = useMemo(() => {
    const now = new Date();
    const expiringSoon: any[] = [];
    const expired: any[] = [];
    const unprotectedConfidential: any[] = [];
    const unassigned: any[] = [];

    documents.forEach((doc) => {
      // Expiration check
      if (doc.expiryDate || doc.expiry_date) {
        const exp = new Date(doc.expiryDate || doc.expiry_date);
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          expired.push({ ...doc, diffDays });
        } else if (diffDays <= 30) {
          expiringSoon.push({ ...doc, diffDays });
        }
      } else if (doc.status === 'EXPIRING') {
        expiringSoon.push({ ...doc, diffDays: 15 });
      }

      // Security check: Confidential without password
      if (
        (doc.securityLevel === 'CONFIDENTIAL' || doc.security_level === 'CONFIDENTIAL') &&
        !doc.hasPassword
      ) {
        unprotectedConfidential.push(doc);
      }

      // Unassigned department or type
      if (!doc.departmentName || doc.departmentName === 'Chung' || !doc.documentTypeName) {
        unassigned.push(doc);
      }
    });

    return {
      expiringSoon,
      expired,
      unprotectedConfidential,
      unassigned,
      totalIssues:
        expiringSoon.length + expired.length + unprotectedConfidential.length + unassigned.length
    };
  }, [documents]);

  // 2. DUPLICATE & STORAGE OPTIMIZER
  const { duplicates, largestFiles } = useMemo(() => {
    const nameMap = new Map<string, any[]>();
    const sizeMap = new Map<number, any[]>();

    documents.forEach((doc) => {
      // Group by name
      const cleanName = (doc.name || '').trim().toLowerCase();
      if (cleanName) {
        const arr = nameMap.get(cleanName) || [];
        arr.push(doc);
        nameMap.set(cleanName, arr);
      }

      // Group by file size
      if (doc.fileSize && doc.fileSize > 1024) {
        const arr = sizeMap.get(doc.fileSize) || [];
        arr.push(doc);
        sizeMap.set(doc.fileSize, arr);
      }
    });

    const dupList: { type: 'name' | 'size'; label: string; docs: any[] }[] = [];
    nameMap.forEach((docs, name) => {
      if (docs.length > 1) {
        dupList.push({ type: 'name', label: `Trùng tên: "${docs[0].name}"`, docs });
      }
    });

    const largest = [...documents]
      .sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0))
      .slice(0, 8);

    return { duplicates: dupList, largestFiles: largest };
  }, [documents]);

  // 3. STATS & ANALYTICS
  const stats = useMemo(() => {
    let totalSize = 0;
    const typeCount: Record<string, number> = {};
    const securityCount: Record<string, number> = { CONFIDENTIAL: 0, INTERNAL: 0, PUBLIC: 0 };
    const deptCount: Record<string, number> = {};

    documents.forEach((doc) => {
      totalSize += doc.fileSize || 0;
      const ext = (doc.fileType || doc.fileName?.split('.').pop() || 'Khác').toUpperCase();
      typeCount[ext] = (typeCount[ext] || 0) + 1;

      const sec = doc.securityLevel || 'INTERNAL';
      securityCount[sec] = (securityCount[sec] || 0) + 1;

      const dept = doc.departmentName || 'Chung';
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });

    return { totalSize, typeCount, securityCount, deptCount };
  }, [documents]);

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  // Run AI summary simulation
  const handleRunAiAnalysis = () => {
    const doc = documents.find((d) => String(d.id) === String(selectedAiDocId));
    if (!doc) return;
    setAiAnalyzing(true);
    setTimeout(() => {
      setAiAnalyzing(false);
      setAiResult({
        docName: doc.name,
        code: doc.documentCode,
        summary: `Tài liệu "${doc.name}" thuộc phân loại ${doc.documentTypeName || 'Hành chính / Văn bản'} và được lưu trữ với cấp bảo mật ${doc.securityLevel || 'Nội bộ'}. Văn bản ghi nhận các điều khoản thực hiện, thẩm quyền ký kết và quy trình kiểm soát chất lượng dữ liệu doanh nghiệp.`,
        keyEntities: [
          { label: 'Phòng ban liên quan', value: doc.departmentName || 'Bộ phận Nội bộ' },
          { label: 'Người phụ trách', value: doc.uploaderName || 'Quản trị viên' },
          { label: 'Cấp độ bảo mật', value: doc.securityLevel === 'CONFIDENTIAL' ? 'Tối mật / Hạn chế' : 'Nội bộ công ty' },
          { label: 'Định dạng tệp', value: (doc.fileType || 'PDF').toUpperCase() }
        ],
        smartTags: [
          '#HopDongKTS',
          '#DoanhNghiep',
          '#HoSoPhapLy',
          '#BaoMatDoanhNghiep',
          '#LuuTruThongMinh'
        ],
        complianceScore: doc.hasPassword || doc.securityLevel !== 'CONFIDENTIAL' ? 95 : 65,
        recommendation:
          doc.securityLevel === 'CONFIDENTIAL' && !doc.hasPassword
            ? 'Khuyến nghị: Cài đặt mật mã bảo vệ file ngay để đạt 100% tiêu chuẩn bảo mật dữ liệu cấp doanh nghiệp.'
            : 'Tài liệu đạt chuẩn tuân thủ quy chuẩn lưu trữ và phân quyền Data Room.'
      });
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                Quản lý Tài liệu Thông minh (Smart DMS)
                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                  AI & Audit Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tự động kiểm toán rủi ro, tối ưu hóa lưu trữ và trích xuất thông tin tự động
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-slate-100 bg-slate-50/50 gap-2 overflow-x-auto scrollbar-none text-xs">
          {[
            {
              id: 'alerts',
              label: 'Cảnh báo & Rủi ro',
              icon: AlertTriangle,
              badge: alerts.totalIssues > 0 ? alerts.totalIssues : null,
              badgeColor: 'bg-rose-500 text-white'
            },
            {
              id: 'duplicates',
              label: 'Dọn dẹp & Trùng lặp',
              icon: Copy,
              badge: duplicates.length > 0 ? duplicates.length : null,
              badgeColor: 'bg-amber-500 text-white'
            },
            {
              id: 'analytics',
              label: 'Thống kê & Dung lượng',
              icon: PieChart
            },
            {
              id: 'ai',
              label: 'Trợ lý AI & Trích xuất',
              icon: BrainCircuit
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-600">
          {/* TAB 1: ALERTS & RISKS */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              {/* Summary Banner */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      Kết quả kiểm toán kho tài liệu ({documents.length} tài liệu)
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Hệ thống đã quét toàn bộ tài liệu và phát hiện{' '}
                      <span className="font-bold text-rose-600">{alerts.totalIssues}</span> điểm cần
                      lưu ý.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onRefresh}
                  className="px-3.5 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-2xs shrink-0 cursor-pointer"
                >
                  Quét lại ngay
                </button>
              </div>

              {/* 1. Unprotected Confidential Files */}
              {alerts.unprotectedConfidential.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-600 font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>
                      Tài liệu MẬT chưa cài mật khẩu bảo vệ ({alerts.unprotectedConfidential.length})
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-rose-100 rounded-2xl bg-rose-50/30 overflow-hidden">
                    {alerts.unprotectedConfidential.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-rose-50/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{doc.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {doc.documentCode} • {doc.departmentName || 'Chung'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onSetPassword(doc)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Cài mật mã</span>
                          </button>
                          <button
                            onClick={() => onPreview(doc)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white transition-colors"
                            title="Xem trước"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Expiring & Expired Documents */}
              {(alerts.expiringSoon.length > 0 || alerts.expired.length > 0) && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-600 font-bold">
                    <Clock className="w-4 h-4" />
                    <span>
                      Văn bản sắp hoặc đã hết hạn hiệu lực (
                      {alerts.expiringSoon.length + alerts.expired.length})
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-amber-100 rounded-2xl bg-amber-50/30 overflow-hidden">
                    {[...alerts.expired, ...alerts.expiringSoon].map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-amber-50/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{doc.name}</div>
                          <div className="text-[10px] text-amber-700 mt-0.5 flex items-center gap-2">
                            <span>Mã: {doc.documentCode}</span>
                            <span>•</span>
                            <span className="font-semibold">
                              {doc.diffDays < 0
                                ? `Đã quá hạn ${Math.abs(doc.diffDays)} ngày`
                                : `Còn ${doc.diffDays} ngày nữa hết hạn`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onPreview(doc)}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Kiểm tra</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Unassigned Documents */}
              {alerts.unassigned.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-slate-600 font-bold">
                    <Building2 className="w-4 h-4" />
                    <span>Tài liệu chưa gán phòng ban chi tiết ({alerts.unassigned.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-slate-50/30 overflow-hidden">
                    {alerts.unassigned.slice(0, 5).map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-slate-700">{doc.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2 font-mono">
                            {doc.documentCode}
                          </span>
                        </div>
                        <button
                          onClick={() => onPreview(doc)}
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {alerts.totalIssues === 0 && (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-slate-700 text-sm">Kho tài liệu đang ở trạng thái tối ưu!</p>
                  <p className="text-[11px] text-slate-400">
                    Không có cảnh báo rủi ro về thời hạn, mật khẩu hay phân quyền nào.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DUPLICATES & LARGE FILES */}
          {activeTab === 'duplicates' && (
            <div className="space-y-6">
              {/* Duplicate Detection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <Copy className="w-4 h-4 text-amber-500" />
                    <span>Nhóm tệp tin có khả năng trùng lặp ({duplicates.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Phát hiện theo tên tệp giống nhau
                  </span>
                </div>

                {duplicates.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
                    Không tìm thấy tệp tin trùng lặp nào trong danh sách.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {duplicates.map((group, idx) => (
                      <div
                        key={idx}
                        className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50 space-y-3"
                      >
                        <div className="font-bold text-slate-800 flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>{group.label}</span>
                          <span className="text-[10px] text-slate-400">
                            ({group.docs.length} bản sao)
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-100 overflow-hidden">
                          {group.docs.map((doc) => (
                            <div
                              key={doc.id}
                              className="p-3 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-slate-700 truncate">{doc.name}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>Mã: {doc.documentCode}</span>
                                  <span>•</span>
                                  <span>{formatSize(doc.fileSize)}</span>
                                  <span>•</span>
                                  <span>{doc.uploaderName || 'Admin'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => onPreview(doc)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50"
                                  title="Xem trước"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Largest Files Ranking */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="font-bold text-slate-800 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>Top 8 tệp tin chiếm dụng dung lượng lớn nhất</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {largestFiles.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">{doc.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {formatSize(doc.fileSize)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onPreview(doc)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-50"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REPOSITORY ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Tổng tài liệu
                  </div>
                  <div className="text-xl font-black text-blue-700 mt-1">{documents.length}</div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Tổng dung lượng
                  </div>
                  <div className="text-xl font-black text-indigo-700 mt-1">
                    {formatSize(stats.totalSize)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Văn bản MẬT
                  </div>
                  <div className="text-xl font-black text-rose-700 mt-1">
                    {stats.securityCount.CONFIDENTIAL || 0}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Công khai
                  </div>
                  <div className="text-xl font-black text-emerald-700 mt-1">
                    {stats.securityCount.PUBLIC || 0}
                  </div>
                </div>
              </div>

              {/* Format Breakdown */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Phân bổ định dạng tệp tin</span>
                  <span className="text-[11px] text-slate-400">
                    {Object.keys(stats.typeCount).length} loại tệp
                  </span>
                </div>

                <div className="space-y-2">
                  {Object.entries(stats.typeCount).map(([type, count]) => {
                    const percent = Math.round((count / (documents.length || 1)) * 100);
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-slate-700 uppercase">{type}</span>
                          <span className="text-slate-400 font-mono">
                            {count} tệp ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-white space-y-3">
                <div className="font-bold text-slate-800">Phân bổ theo phòng ban</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(stats.deptCount).map(([dept, count]) => (
                    <div
                      key={dept}
                      className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-slate-700 truncate">{dept}</span>
                      <span className="font-bold text-blue-600 font-mono ml-2">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AI ASSISTANT & EXTRACTOR */}
          {activeTab === 'ai' && (
            <div className="space-y-5">
              {/* Selector & Action bar */}
              <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 rounded-2xl border border-blue-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Chọn tài liệu cần AI phân tích & tóm tắt
                    </label>
                    <select
                      value={selectedAiDocId}
                      onChange={(e) => setSelectedAiDocId(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {documents.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.documentCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleRunAiAnalysis}
                    disabled={aiAnalyzing || documents.length === 0}
                    className="sm:self-end px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <BrainCircuit className="w-4 h-4" />
                    <span>{aiAnalyzing ? 'AI đang phân tích...' : 'Bắt đầu tóm tắt AI'}</span>
                  </button>
                </div>
              </div>

              {/* AI Result Card */}
              {aiResult ? (
                <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{aiResult.docName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{aiResult.code}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        Điểm tuân thủ
                      </div>
                      <div className="text-base font-extrabold text-emerald-600">
                        {aiResult.complianceScore}/100
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tóm tắt nội dung tự động (AI Summary)</span>
                    </div>
                    <p className="p-3 bg-slate-50 rounded-xl text-slate-700 leading-relaxed text-xs">
                      {aiResult.summary}
                    </p>
                  </div>

                  {/* Entities Grid */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Thực thể & Thuộc tính trích xuất
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {aiResult.keyEntities.map((ent: any, i: number) => (
                        <div key={i} className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">{ent.label}</span>
                          <span className="font-bold text-slate-700 text-xs mt-0.5 block truncate">
                            {ent.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Smart Tags */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Nhãn đề xuất tự động (Smart Tags)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.smartTags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-semibold border border-blue-200/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation Alert */}
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <span>{aiResult.recommendation}</span>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <BrainCircuit className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-medium text-slate-600">Chọn một tài liệu và bấm nút phân tích</p>
                  <p className="text-[11px] text-slate-400">
                    Trợ lý AI sẽ trích xuất tóm lược nội dung, các thuộc tính pháp lý và gắn nhãn tự
                    động.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
          <div className="text-slate-400">
            Hệ thống Quản lý Dữ liệu Doanh nghiệp • <span className="font-semibold text-slate-600">KTS Cloud DMS</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
export default SmartDocumentManagerModal;

