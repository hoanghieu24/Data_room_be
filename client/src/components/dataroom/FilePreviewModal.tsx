import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  ShieldCheck,
  FileText,
  Table,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { renderAsync as renderDocx } from 'docx-preview';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface FilePreviewModalProps {
  file: any | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (file: any, password?: string) => void;
}

// Dedicated Docx Viewer component with its own lifecycle
const DocxViewer: React.FC<{ buffer: ArrayBuffer }> = ({ buffer }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (containerRef.current && buffer) {
      containerRef.current.innerHTML = '';
      setRendering(true);
      setError(null);

      renderDocx(buffer, containerRef.current, undefined, {
        inWrapper: false,
        ignoreWidth: false,
        ignoreHeight: false,
        renderHeaders: true,
        renderFooters: true,
      })
        .then(() => {
          if (isMounted) setRendering(false);
        })
        .catch((err: any) => {
          console.error('Docx render error:', err);
          if (isMounted) {
            setError('Lỗi hiển thị Word DOCX: ' + (err.message || 'Lỗi'));
            setRendering(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [buffer]);

  return (
    <div className="w-full h-full bg-slate-200 rounded-xl overflow-auto p-4 flex flex-col items-center relative">
      {rendering && (
        <div className="absolute top-8 px-4 py-2 bg-slate-900/90 text-white text-xs rounded-xl shadow-lg backdrop-blur-xs flex items-center gap-2 z-10 border border-slate-700">
          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Đang render tài liệu Word DOCX...</span>
        </div>
      )}
      {error ? (
        <div className="p-8 bg-white rounded-xl text-xs text-rose-600 font-semibold shadow-md">{error}</div>
      ) : (
        <div
          ref={containerRef}
          className="bg-white text-slate-900 shadow-2xl p-8 sm:p-12 rounded-xl max-w-4xl w-full min-h-full overflow-auto leading-relaxed docx"
        />
      )}
    </div>
  );
};

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
}) => {
  const [loading, setLoading] = useState(false);
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLegacyDoc, setIsLegacyDoc] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Excel state
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [currentWorkbook, setCurrentWorkbook] = useState<any | null>(null);

  // Password Lock state
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [unlockedPassword, setUnlockedPassword] = useState<string>('');

  const { toast } = useToast();

  // Robust extension and mime detection
  const rawExt =
    file?.extension ||
    file?.fileType ||
    file?.name?.split('.').pop() ||
    file?.fileName?.split('.').pop() ||
    '';
  const ext = rawExt.toLowerCase().replace('.', '');
  const mime = (file?.mimeType || '').toLowerCase();

  const isDocx =
    ext === 'docx' ||
    ext === 'doc' ||
    mime.includes('word') ||
    mime.includes('officedocument.wordprocessingml');
  const isExcel =
    ext === 'xlsx' ||
    ext === 'xls' ||
    ext === 'csv' ||
    mime.includes('excel') ||
    mime.includes('spreadsheetml');
  const isImage =
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
  const isVideo =
    mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext);
  const isAudio =
    mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac'].includes(ext);
  const isPdf = ext === 'pdf' || mime.includes('pdf');
  const isText =
    mime.startsWith('text/') ||
    ['txt', 'json', 'md', 'xml', 'sql', 'js', 'ts', 'css', 'html'].includes(ext);

  const cleanupBlob = () => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
  };

  const loadContent = async (providedPassword?: string) => {
    if (!file) return;

    setLoading(true);
    setPasswordError(null);
    setLoadError(null);
    setIsLegacyDoc(false);
    cleanupBlob();
    setDocxBuffer(null);
    setTextContent(null);
    setExcelSheets([]);
    setSheetData([]);
    setCurrentWorkbook(null);

    const headers: Record<string, string> = {};
    if (providedPassword) {
      headers['x-document-password'] = providedPassword;
    }

    try {
      // 1. Verify preview authorization
      const res = await api.get('/files/' + file.id + '/preview', { headers });

      if (res.data.success) {
        setPasswordRequired(false);
        if (providedPassword) {
          setUnlockedPassword(providedPassword);
        }

        let rawDownloadUrl = res.data.file.previewUrl || '/files/' + file.id + '/raw';
        if (rawDownloadUrl.startsWith('/api/')) {
          rawDownloadUrl = rawDownloadUrl.substring(4);
        }

        // 2. Fetch raw ArrayBuffer securely with authorization header
        const fileRes = await api.get(rawDownloadUrl, {
          headers,
          responseType: 'arraybuffer',
        });
        const arrayBuffer: ArrayBuffer = fileRes.data;

        // Render based on file type
        if (isDocx) {
          // Check if file is OpenXML ZIP (magic bytes PK\x03\x04 = 0x50, 0x4B, 0x03, 0x04)
          const header = new Uint8Array(arrayBuffer.slice(0, 4));
          const isZip = header[0] === 0x50 && header[1] === 0x4B && header[2] === 0x03 && header[3] === 0x04;
          if (isZip) {
            setDocxBuffer(arrayBuffer);
          } else {
            // Binary .doc format (Word 97-2003)
            setIsLegacyDoc(true);
          }
        } else if (isExcel) {
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          setCurrentWorkbook(workbook);
          const sheets = workbook.SheetNames;
          setExcelSheets(sheets);

          if (sheets.length > 0) {
            const firstSheet = sheets[0];
            setActiveSheet(firstSheet);
            const data: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {
              header: 1,
            });
            setSheetData(data);
          }
        } else if (isImage || isVideo || isAudio || isPdf) {
          const contentType = mime || (isPdf ? 'application/pdf' : 'application/octet-stream');
          const blob = new Blob([arrayBuffer], { type: contentType });
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        } else if (isText) {
          const text = new TextDecoder('utf-8').decode(arrayBuffer);
          setTextContent(text);
        }
      }
    } catch (err: any) {
      const code = err.response?.data?.code;
      const isProtected = err.response?.data?.isProtected;
      const status = err.response?.status;

      if (code === 'PASSWORD_REQUIRED' || isProtected || status === 401 || status === 403) {
        setPasswordRequired(true);
        if (providedPassword) {
          setPasswordError('Mật mã không chính xác. Vui lòng nhập lại!');
        }
      } else {
        console.error('File preview error:', err);
        setLoadError(err.response?.data?.message || err.message || 'Không thể tải nội dung xem trước');
      }
    } finally {
      setLoading(false);
      setIsSubmittingPassword(false);
    }
  };

  useEffect(() => {
    if (file && isOpen) {
      setPasswordRequired(false);
      setInputPassword('');
      setPasswordError(null);
      setLoadError(null);
      setIsLegacyDoc(false);
      setUnlockedPassword('');
      loadContent();
    }

    return () => {
      cleanupBlob();
    };
  }, [file, isOpen]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim()) {
      setPasswordError('Vui lòng nhập mật mã');
      return;
    }
    setIsSubmittingPassword(true);
    loadContent(inputPassword.trim());
  };

  const handleSwitchSheet = (sheetName: string) => {
    setActiveSheet(sheetName);
    if (!currentWorkbook) return;
    const data: any[][] = XLSX.utils.sheet_to_json(currentWorkbook.Sheets[sheetName], { header: 1 });
    setSheetData(data);
  };

  const handleDownloadAction = () => {
    if (blobUrl) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file.fileName || file.name || 'document';
      a.click();
      return;
    }

    if (docxBuffer) {
      const blob = new Blob([docxBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName || file.name || 'document.docx';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (onDownload) {
      onDownload(file, unlockedPassword);
    } else {
      let downloadUrl = '/api/files/' + file.id + '/download';
      if (unlockedPassword) {
        downloadUrl += '?password=' + encodeURIComponent(unlockedPassword);
      }
      window.open(downloadUrl, '_blank');
    }
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3.5 px-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="font-bold text-sm text-slate-800 line-clamp-1">{file.name}</div>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
              v{file.currentVersion || file.version || 1}
            </span>
            {file.hasPassword || file.isEncrypted ? (
              <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-semibold">
                <Lock className="w-3.5 h-3.5 text-amber-600" /> Được bảo vệ bằng mật mã
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Quyền truy cập hợp lệ
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!passwordRequired && file.permissions?.canDownload !== false && (
              <button
                onClick={handleDownloadAction}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" /> Tải về
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Excel Tab Switcher Bar if Excel */}
        {isExcel && excelSheets.length > 0 && !passwordRequired && (
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1 mr-2">
              <Table className="w-3.5 h-3.5 text-green-600" /> Trang tính (Sheets):
            </span>
            {excelSheets.map((s) => (
              <button
                key={s}
                onClick={() => handleSwitchSheet(s)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeSheet === s
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center p-4 relative">
          {loading ? (
            <div className="text-white text-xs flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang tải và giải mã tệp tin từ kho lưu trữ...</span>
            </div>
          ) : passwordRequired ? (
            /* Password Unlock Card */
            <div className="flex flex-col items-center justify-center p-8 max-w-md w-full mx-auto bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Tài liệu đã được mã hóa bảo vệ</h3>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Tài liệu <span className="font-semibold text-white">"{file.name}"</span> yêu cầu mật mã bảo mật để xem trực tiếp hoặc tải về.
              </p>
              <form onSubmit={handlePasswordSubmit} className="w-full space-y-3">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    placeholder="Nhập mật mã mở khóa..."
                    className="w-full px-4 py-2.5 pr-10 text-xs bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <div className="text-xs text-rose-400 font-medium text-left flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!inputPassword.trim() || isSubmittingPassword}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingPassword ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Mở khóa tài liệu</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : loadError ? (
            /* Inline Error View with Retry & Download */
            <div className="flex flex-col items-center justify-center p-8 max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl text-center border border-slate-200">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-3">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Không thể hiển thị xem trước</h3>
              <p className="text-xs text-slate-500 mb-4">{loadError}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadContent(unlockedPassword || undefined)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Thử lại
                </button>
                <button
                  onClick={handleDownloadAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải về máy</span>
                </button>
              </div>
            </div>
          ) : isLegacyDoc ? (
            /* Legacy .doc format notification */
            <div className="flex flex-col items-center justify-center p-8 max-w-lg w-full mx-auto bg-white rounded-2xl shadow-2xl text-center border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-xs">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Tài liệu Microsoft Word (.doc)</h3>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full mb-3 inline-block border border-blue-200">
                Định dạng Word 97-2003
              </span>
              <p className="text-xs text-slate-600 mb-6 leading-relaxed max-w-md">
                Tệp tin <b>"{file.name}"</b> được lưu ở định dạng Word nhị phân cũ (.doc). Trình duyệt chỉ hỗ trợ xem trực tiếp các tệp Word chuẩn OpenXML (.docx). Bạn có thể tải tệp về để mở trực tiếp trong Word hoặc WPS Office trên máy tính.
              </p>
              <button
                onClick={handleDownloadAction}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải tệp về máy ngay</span>
              </button>
            </div>
          ) : isDocx && docxBuffer ? (
            /* Dedicated Word DOCX Viewer */
            <DocxViewer buffer={docxBuffer} />
          ) : isExcel ? (
            /* Excel Viewer */
            <div className="w-full h-full bg-white rounded-xl overflow-auto p-4 shadow-lg border border-slate-200">
              {sheetData.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">Trang tính trống hoặc không có dữ liệu</div>
              ) : (
                <table className="w-full border-collapse text-xs font-mono text-slate-800">
                  <tbody>
                    {sheetData.map((row, rIdx) => (
                      <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-100 font-bold' : 'hover:bg-blue-50/40'}>
                        <td className="border border-slate-200 px-2 py-1 bg-slate-50 text-slate-400 text-center select-none w-10 font-sans text-[10px]">
                          {rIdx + 1}
                        </td>
                        {row.map((cell: any, cIdx: number) => (
                          <td
                            key={cIdx}
                            className={`border border-slate-200 px-3 py-1.5 whitespace-nowrap ${
                              rIdx === 0 ? 'bg-slate-50 font-bold text-slate-800 font-sans' : ''
                            }`}
                          >
                            {cell !== undefined && cell !== null ? String(cell) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : isImage && blobUrl ? (
            <img
              src={blobUrl}
              alt={file.name}
              className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
            />
          ) : isVideo && blobUrl ? (
            <video controls src={blobUrl} className="max-h-full max-w-full rounded-lg" />
          ) : isAudio && blobUrl ? (
            <audio controls src={blobUrl} className="w-96" />
          ) : isPdf && blobUrl ? (
            <iframe
              src={blobUrl}
              className="w-full h-full rounded-lg bg-white shadow-lg"
              title="PDF Viewer"
            />
          ) : textContent ? (
            <div className="w-full h-full bg-white rounded-lg p-6 overflow-auto text-xs font-mono text-slate-800 leading-relaxed">
              <pre className="whitespace-pre-wrap">{textContent}</pre>
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-2xl max-w-md shadow-lg">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
              <div className="font-bold text-slate-800 text-sm mb-1">Định dạng {ext ? ext.toUpperCase() : 'Tài liệu'}</div>
              <div className="text-xs text-slate-500 mb-4">
                Tệp này không hỗ trợ hiển thị trực tiếp trên trình duyệt. Vui lòng tải về máy để mở.
              </div>
              <button
                onClick={handleDownloadAction}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Tải tệp về máy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
