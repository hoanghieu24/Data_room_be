import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileCheck,
  Shield,
  Calendar,
  Building2,
  FileText,
  Sparkles,
  UserCheck,
  Plus,
  Trash2,
  AlertCircle,
  Lock,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface CreateDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDocumentModal: React.FC<CreateDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState<number | ''>('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [contractNumber, setContractNumber] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [publishedDate, setPublishedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [securityLevel, setSecurityLevel] = useState<'CONFIDENTIAL' | 'INTERNAL' | 'PUBLIC'>('INTERNAL');
  const [description, setDescription] = useState('');

  // Mật khẩu bảo vệ tài liệu
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Quy tắc đặt tên file
  const [customFileName, setCustomFileName] = useState('');
  const [suggestedFileName, setSuggestedFileName] = useState('');
  const [isManualFileName, setIsManualFileName] = useState(false);

  // Phân quyền ban đầu
  const [permissions, setPermissions] = useState<
    Array<{ target_type: 'USER' | 'DEPARTMENT'; target_id: number; permission_level: 'VIEW' | 'DOWNLOAD' | 'EDIT' | 'ADMIN' }>
  >([]);

  // Metadata dropdowns
  const [types, setTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Target select state for permission form
  const [permTargetType, setPermTargetType] = useState<'USER' | 'DEPARTMENT'>('DEPARTMENT');
  const [permTargetId, setPermTargetId] = useState<number | ''>('');
  const [permLevel, setPermLevel] = useState<'VIEW' | 'DOWNLOAD' | 'EDIT' | 'ADMIN'>('VIEW');

  const [loading, setLoading] = useState(false);

  // Tải danh mục loại tài liệu, phòng ban và users
  useEffect(() => {
    if (isOpen) {
      api.get('/document-types').then(res => {
        if (res.data.success) setTypes(res.data.types.filter((t: any) => t.is_active));
      }).catch(() => {});

      api.get('/departments').then(res => {
        if (res.data.success) setDepartments(res.data.data?.data || res.data.data || []);
      }).catch(() => {});

      api.get('/users').then(res => {
        if (res.data.success) setUsers(res.data.users || []);
      }).catch(() => {});
    }
  }, [isOpen]);

  // Tự động sinh tên file chuẩn theo quy tắc: [Ngày/Năm]_[Loại_Tài_Liệu]_[Tên_Đối_Tác/Nội_Dung]_[Phiên_Bản]
  useEffect(() => {
    if (!file) return;

    const ext = file.name.split('.').pop() || 'pdf';
    
    // Ngày tháng: DD-MM-YYYY
    let datePart = 'NGAY';
    if (publishedDate) {
      const [yyyy, mm, dd] = publishedDate.split('-');
      datePart = `${dd}-${mm}-${yyyy}`;
    }

    // Mã loại văn bản
    let typePart = 'TAI-LIEU';
    const foundType = types.find(t => t.id === Number(documentTypeId));
    if (foundType) {
      typePart = foundType.code.replace(/_/g, '-');
    }

    // Tên đối tác hoặc trích yếu nội dung
    let contentPart = 'Noi-Dung';
    if (partnerName && partnerName.trim()) {
      contentPart = partnerName
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-');
    } else if (title && title.trim()) {
      contentPart = title
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-');
    }

    const standardName = `${datePart}_${typePart}_${contentPart}_V1.${ext}`;
    setSuggestedFileName(standardName);

    if (!isManualFileName) {
      setCustomFileName(standardName);
    }
  }, [file, publishedDate, documentTypeId, partnerName, title, types, isManualFileName]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      if (!title) {
        setTitle(f.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleApplySuggestedName = () => {
    setCustomFileName(suggestedFileName);
    setIsManualFileName(false);
  };

  const handleAddPermission = () => {
    if (!permTargetId) {
      toast('error', 'Vui lòng chọn đối tượng cần phân quyền');
      return;
    }
    const targetIdNum = Number(permTargetId);
    // Kiểm tra trùng
    const exists = permissions.some(
      p => p.target_type === permTargetType && p.target_id === targetIdNum
    );
    if (exists) {
      toast('error', 'Đối tượng này đã có trong danh sách phân quyền');
      return;
    }

    setPermissions([...permissions, {
      target_type: permTargetType,
      target_id: targetIdNum,
      permission_level: permLevel
    }]);
    setPermTargetId('');
  };

  const handleRemovePermission = (index: number) => {
    setPermissions(permissions.filter((_, idx) => idx !== index));
  };

  const getTargetName = (type: 'USER' | 'DEPARTMENT', id: number) => {
    if (type === 'USER') {
      const u = users.find(x => x.id === id);
      return u ? `${u.full_name} (${u.email})` : `User #${id}`;
    } else {
      const d = departments.find(x => x.id === id);
      return d ? `${d.name} (${d.code})` : `Phòng ban #${id}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast('error', 'Vui lòng chọn tệp tin cần tải lên');
      return;
    }
    if (!title.trim()) {
      toast('error', 'Vui lòng nhập tên tài liệu / văn bản');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', title.trim());
      formData.append('customFileName', customFileName.trim() || file.name);
      if (documentTypeId) formData.append('document_type_id', String(documentTypeId));
      if (departmentId) formData.append('department_id', String(departmentId));
      if (contractNumber) formData.append('contract_number', contractNumber.trim());
      if (partnerName) formData.append('partner_name', partnerName.trim());
      if (publishedDate) formData.append('published_date', publishedDate);
      if (expiryDate) formData.append('expiry_date', expiryDate);
      formData.append('security_level', securityLevel);
      if (description) formData.append('description', description.trim());
      if (enablePassword && password.trim()) {
        formData.append('password', password.trim());
      }
      if (permissions.length > 0) {
        formData.append('initial_permissions', JSON.stringify(permissions));
      }

      const res = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast('success', `Lưu trữ tài liệu [${res.data.documentCode}] thành công!`);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast('error', err.response?.data?.message || 'Lỗi khi tải lên tài liệu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Thêm mới & Lưu trữ Tài liệu</h2>
              <p className="text-xs text-slate-500">Tải lên tài liệu, gán metadata và phân quyền bảo mật</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* File Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tệp tài liệu đính kèm <span className="text-rose-500">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                file ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt"
                onChange={handleFileSelect}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileCheck className="w-8 h-8 text-emerald-600" />
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-800">{file.name}</div>
                    <div className="text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Tệp tài liệu'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-xs font-semibold text-slate-700">
                    Nhấn vào đây hoặc kéo thả tệp tin vào để tải lên
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Hỗ trợ PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG (tối đa 50MB)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quy tắc đặt tên file tự động (Mục 8) */}
          {file && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Quy tắc đặt tên chuẩn:
                </span>
                <button
                  type="button"
                  onClick={handleApplySuggestedName}
                  className="text-[11px] text-blue-700 hover:underline font-semibold"
                >
                  Áp dụng tên gợi ý
                </button>
              </div>
              <div className="text-xs font-mono text-amber-900/80 bg-white px-2.5 py-1.5 rounded-lg border border-amber-200 truncate">
                {suggestedFileName}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tên file lưu chính thức:
                </label>
                <input
                  type="text"
                  value={customFileName}
                  onChange={(e) => {
                    setCustomFileName(e.target.value);
                    setIsManualFileName(true);
                  }}
                  className="w-full text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tên tài liệu / Văn bản */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên tài liệu / Văn bản <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Hợp đồng cung cấp dịch vụ CNTT 2026"
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Loại tài liệu */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phân loại tài liệu
              </label>
              <select
                value={documentTypeId}
                onChange={(e) => setDocumentTypeId(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Chọn loại tài liệu --</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Phòng ban phụ trách */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phòng ban lưu trữ
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">-- Toàn công ty (Chung) --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Số hợp đồng */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số hợp đồng (nếu có)
              </label>
              <input
                type="text"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="VD: HD-2026/KTS-01"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Tên đối tác */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên đối tác / Khách hàng
              </label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="VD: Công ty Cổ phần ABC"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Ngày ban hành */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày ban hành
              </label>
              <input
                type="date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Ngày hết hạn */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày hết hạn
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Mức độ bảo mật (Mật, Nội bộ, Công khai) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mức độ bảo mật tài liệu
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    securityLevel === 'CONFIDENTIAL'
                      ? 'border-rose-500 bg-rose-50/50 text-rose-800 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="secLevel"
                    value="CONFIDENTIAL"
                    checked={securityLevel === 'CONFIDENTIAL'}
                    onChange={() => setSecurityLevel('CONFIDENTIAL')}
                    className="hidden"
                  />
                  <Shield className="w-4 h-4 text-rose-500" />
                  <span className="text-xs">Mật (Confidential)</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    securityLevel === 'INTERNAL'
                      ? 'border-blue-500 bg-blue-50/50 text-blue-800 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="secLevel"
                    value="INTERNAL"
                    checked={securityLevel === 'INTERNAL'}
                    onChange={() => setSecurityLevel('INTERNAL')}
                    className="hidden"
                  />
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span className="text-xs">Nội bộ (Internal)</span>
                </label>

                <label
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                    securityLevel === 'PUBLIC'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="secLevel"
                    value="PUBLIC"
                    checked={securityLevel === 'PUBLIC'}
                    onChange={() => setSecurityLevel('PUBLIC')}
                    className="hidden"
                  />
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs">Công khai (Public)</span>
                </label>
              </div>
            </div>

            {/* Trích yếu / Mô tả */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Trích yếu nội dung / Ghi chú
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập tóm tắt nội dung văn bản..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Cài đặt Mật khẩu bảo vệ */}
            <div className="md:col-span-2 p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enablePassword}
                    onChange={(e) => setEnablePassword(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Bảo vệ tài liệu bằng mật mã truy cập (Password Protection)</span>
                  </div>
                </label>
                {enablePassword && (
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300">
                    Đang bật khóa mã
                  </span>
                )}
              </div>

              {enablePassword && (
                <div className="mt-3 pt-3 border-t border-amber-200/80">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật mã để khóa tài liệu..."
                        className="w-full text-xs px-3 py-2 pr-9 rounded-xl border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-amber-700">
                    * Bất kỳ ai muốn xem trước, in hoặc tải tệp đều bắt buộc phải nhập đúng mật mã này (trừ Quản trị viên và người tạo tài liệu).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Phân quyền chi tiết khởi tạo */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" /> Phân quyền truy cập cho User / Phòng ban
              </label>
            </div>

            {/* Add permission bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <select
                value={permTargetType}
                onChange={(e) => {
                  setPermTargetType(e.target.value as any);
                  setPermTargetId('');
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="DEPARTMENT">Phòng ban</option>
                <option value="USER">Người dùng cá nhân</option>
              </select>

              <select
                value={permTargetId}
                onChange={(e) => setPermTargetId(e.target.value ? Number(e.target.value) : '')}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white flex-1 min-w-[150px]"
              >
                <option value="">-- Chọn đối tượng --</option>
                {permTargetType === 'DEPARTMENT'
                  ? departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))
                  : users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </option>
                    ))}
              </select>

              <select
                value={permLevel}
                onChange={(e) => setPermLevel(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold"
              >
                <option value="VIEW">VIEW (Chỉ xem)</option>
                <option value="DOWNLOAD">DOWNLOAD (Xem & Tải)</option>
                <option value="EDIT">EDIT (Xem, Tải & Sửa)</option>
                <option value="ADMIN">ADMIN (Toàn quyền)</option>
              </select>

              <button
                type="button"
                onClick={handleAddPermission}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm
              </button>
            </div>

            {/* Permissions list */}
            {permissions.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {permissions.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          p.target_type === 'DEPARTMENT'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {p.target_type === 'DEPARTMENT' ? 'PHÒNG BAN' : 'USER'}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {getTargetName(p.target_type, p.target_id)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {p.permission_level}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePermission(idx)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Xóa quyền"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xử lý tải lên...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Lưu trữ tài liệu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
