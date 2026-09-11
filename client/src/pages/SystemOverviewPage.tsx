import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Folder,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  Image,
  Video,
  Archive,
  Code,
  Eye,
  ArrowRight,
  RefreshCw,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronDown,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Lock,
  Sparkles,
  HardDrive,
  CheckCircle2,
  Move,
} from 'lucide-react';
import api from '../services/api';
import { FilePreviewModal } from '../components/dataroom/FilePreviewModal';

interface FileItem {
  id: string | number;
  name: string;
  fileName?: string;
  type: string;
  extension: string;
  size: string;
  bytes?: number;
  date?: string;
  url?: string;
  previewUrl?: string;
  downloadUrl?: string;
  isEncrypted?: boolean;
  uploader?: string;
}

interface FolderItem {
  id: string | number;
  name: string;
  code?: string;
  description?: string;
  subfolders?: FolderItem[];
  files?: FileItem[];
}

export const SystemOverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  // 100% Real Database State
  const [rootFolder, setRootFolder] = useState<FolderItem | null>(null);
  const [unclassifiedFiles, setUnclassifiedFiles] = useState<FileItem[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // 2D Pan + Zoom State
  const [transform, setTransform] = useState({ x: 40, y: 40, scale: 1 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch real data from MySQL
  const fetchRealData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/folders/full-overview');
      if (res.data && res.data.success) {
        setRootFolder(res.data.root || null);
        setUnclassifiedFiles(res.data.unclassifiedFiles || []);
        setLastRefreshed(new Date().toLocaleTimeString('vi-VN'));
      }
    } catch (e) {
      console.error('Error fetching real data for SystemOverview:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  // ── Pan handlers ──────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest('[data-no-pan]')) return;
      if (e.button === 0 || e.button === 1) {
        isPanning.current = true;
        panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
        e.preventDefault();
      }
    },
    [transform]
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning.current) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // ── Wheel zoom toward cursor ──────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setTransform((prev) => {
      const newScale = Math.min(3, Math.max(0.25, prev.scale + delta));
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return { ...prev, scale: newScale };
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const scaleRatio = newScale / prev.scale;
      const newX = mouseX - scaleRatio * (mouseX - prev.x);
      const newY = mouseY - scaleRatio * (mouseY - prev.y);
      return { x: newX, y: newY, scale: newScale };
    });
  }, []);

  const resetView = () => setTransform({ x: 40, y: 40, scale: 1 });

  const toggleFolder = (folderId: string | number) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [String(folderId)]: !prev[String(folderId)],
    }));
  };

  const expandAll = () => setCollapsedFolders({});
  const collapseAll = () => {
    const collapsed: Record<string, boolean> = {};
    const traverse = (node: FolderItem) => {
      collapsed[String(node.id)] = true;
      node.subfolders?.forEach(traverse);
    };
    if (rootFolder) traverse(rootFolder);
    setCollapsedFolders(collapsed);
  };

  // Icon helper according to file extension/type
  const getFileIcon = (ext: string = '', type: string = '') => {
    const cleanExt = (ext || '').toLowerCase().replace('.', '');
    const cleanType = (type || '').toLowerCase();

    if (['pdf'].includes(cleanExt) || cleanType.includes('pdf')) {
      return {
        icon: <FileText className="w-4 h-4 text-rose-400" />,
        bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
        label: 'PDF',
      };
    }
    if (['doc', 'docx'].includes(cleanExt) || cleanType.includes('word') || cleanType.includes('officedocument')) {
      return {
        icon: <FileText className="w-4 h-4 text-blue-400" />,
        bg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
        label: 'DOCX',
      };
    }
    if (['xls', 'xlsx', 'csv'].includes(cleanExt) || cleanType.includes('excel') || cleanType.includes('sheet')) {
      return {
        icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />,
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
        label: 'EXCEL',
      };
    }
    if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(cleanExt) || cleanType.includes('image')) {
      return {
        icon: <Image className="w-4 h-4 text-purple-400" />,
        bg: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
        label: 'IMAGE',
      };
    }
    if (['mp4', 'mov', 'avi', 'mkv'].includes(cleanExt) || cleanType.includes('video')) {
      return {
        icon: <Video className="w-4 h-4 text-pink-400" />,
        bg: 'bg-pink-500/10 border-pink-500/30 text-pink-300',
        label: 'VIDEO',
      };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(cleanExt) || cleanType.includes('zip')) {
      return {
        icon: <Archive className="w-4 h-4 text-amber-400" />,
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        label: 'ARCHIVE',
      };
    }
    if (['js', 'ts', 'py', 'html', 'css', 'json', 'sql', 'java', 'yml'].includes(cleanExt)) {
      return {
        icon: <Code className="w-4 h-4 text-cyan-400" />,
        bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
        label: cleanExt.toUpperCase(),
      };
    }
    return {
      icon: <FileText className="w-4 h-4 text-slate-400" />,
      bg: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
      label: cleanExt ? cleanExt.toUpperCase() : 'FILE',
    };
  };

  // Filter matching
  const doesFolderMatch = (folder: FolderItem, query: string): boolean => {
    if (!query) return true;
    const q = query.toLowerCase();
    if (folder.name.toLowerCase().includes(q)) return true;
    if (folder.files?.some((f) => f.name.toLowerCase().includes(q) || f.fileName?.toLowerCase().includes(q))) return true;
    if (folder.subfolders?.some((sub) => doesFolderMatch(sub, query))) return true;
    return false;
  };

  // Total counts
  const totalStats = useMemo(() => {
    let folderCount = 0;
    let fileCount = unclassifiedFiles.length;

    const countNodes = (f: FolderItem) => {
      folderCount += 1;
      fileCount += f.files?.length || 0;
      f.subfolders?.forEach(countNodes);
    };

    if (rootFolder?.subfolders) {
      rootFolder.subfolders.forEach(countNodes);
    }

    return { folderCount, fileCount };
  }, [rootFolder, unclassifiedFiles]);

  const scalePercent = Math.round(transform.scale * 100);

  // Count all files recursively in a folder
  const countAllFiles = (f: FolderItem): number => {
    let count = f.files?.length || 0;
    f.subfolders?.forEach((sub) => {
      count += countAllFiles(sub);
    });
    return count;
  };

  // ── Recursive Folder Node ─────────────────────────────────────────────────
  const FolderNode: React.FC<{ folder: FolderItem; depth?: number }> = ({ folder, depth = 0 }) => {
    const isCollapsed = !!collapsedFolders[String(folder.id)];
    const directFiles = folder.files?.length || 0;
    const subCount = folder.subfolders?.length || 0;
    const totalNestedFiles = countAllFiles(folder);
    const hasContent = directFiles + subCount > 0;
    const indentColor = depth === 0 ? 'border-cyan-600/50' : depth === 1 ? 'border-indigo-500/50' : 'border-purple-500/40';

    return (
      <div className={`relative flex items-start gap-6 ${depth > 0 ? 'ml-8' : ''}`}>
        {/* Connector line */}
        <div className={`absolute -left-${depth > 0 ? '6' : '8'} top-6 w-${depth > 0 ? '6' : '8'} h-0.5 bg-cyan-400/80`}
          style={{ left: depth > 0 ? '-24px' : '-32px', width: depth > 0 ? '24px' : '32px' }}
        />

        {/* Folder Card */}
        <div
          className={`w-64 p-3.5 rounded-2xl bg-[#0D1B36] border ${indentColor} hover:border-cyan-400 shadow-lg transition-all shrink-0`}
          data-no-pan
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 rounded-xl ${depth === 0 ? 'bg-blue-500/20 text-cyan-400 border border-blue-500/40' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'} shrink-0`}>
                <Folder className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm text-white truncate" title={folder.name}>{folder.name}</div>
                <div className="text-[10px] text-cyan-300/80 font-medium">
                  {subCount > 0
                    ? directFiles > 0
                      ? `${directFiles} file (${totalNestedFiles} tổng) · ${subCount} thư mục con`
                      : `${totalNestedFiles} file trong ${subCount} thư mục con`
                    : `${directFiles} tài liệu`}
                </div>
              </div>
            </div>
            {hasContent && (
              <button
                onClick={() => toggleFolder(folder.id)}
                className="p-1 text-cyan-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
          {folder.description && (
            <p className="mt-1.5 text-[10px] text-slate-400 line-clamp-1">{folder.description}</p>
          )}
        </div>

        {/* Files + nested subfolders */}
        {!isCollapsed && (
          hasContent ? (
          <div className="flex-1 space-y-4 pt-1" data-no-pan>
            {/* Direct files */}
            {folder.files && folder.files.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {folder.files.map((file) => {
                  const isMatch = !searchQuery ||
                    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (file.fileName && file.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
                  if (searchQuery && !isMatch) return null;
                  const iconInfo = getFileIcon(file.extension, file.type);
                  return (
                    <div
                      key={file.id}
                      onClick={() => setPreviewFile(file)}
                      className="group relative flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#0b162c] border border-cyan-800/50 hover:border-cyan-400 hover:bg-[#122347] transition-all cursor-pointer shadow-md w-64"
                    >
                      <div className={`p-1.5 rounded-lg border ${iconInfo.bg} shrink-0`}>{iconInfo.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 truncate" title={file.name}>{file.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-mono">{file.size}</span>
                          {file.isEncrypted && (
                            <span className="inline-flex items-center gap-0.5 text-amber-400">
                              <Lock className="w-2.5 h-2.5" /> Mã hóa
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-1 rounded-md text-slate-400 group-hover:text-cyan-400 shrink-0">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Nested subfolders — rendered recursively */}
            {folder.subfolders && folder.subfolders.length > 0 && (
              <div className="space-y-4 relative before:absolute before:-left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-indigo-500/40">
                {folder.subfolders.map((sub) => {
                  if (searchQuery && !doesFolderMatch(sub, searchQuery)) return null;
                  return <FolderNode key={sub.id} folder={sub} depth={depth + 1} />;
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic py-2">(Thư mục trống)</div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`min-h-screen bg-[#070D1B] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white ${
        isFullScreen ? 'fixed inset-0 z-[9999]' : ''
      }`}
    >
      {/* 1. TOP HEADER & CONTROLS */}
      <header className="sticky top-0 z-40 bg-[#0A1428]/95 backdrop-blur-md border-b border-cyan-900/50 px-6 py-3.5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Breadcrumbs */}
          <div className="flex items-center gap-4">
            <Link
              to="/dataroom"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 hover:bg-cyan-900/50 hover:text-white transition-all text-sm font-medium shadow-sm"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Quay lại Data Room</span>
            </Link>

            <div className="h-5 w-px bg-cyan-800/60 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-md shadow-cyan-500/20 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <span>KTS CRM</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                    Tech Map
                  </span>
                </h1>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Dữ liệu thực từ MySQL
                  </span>
                  <span>•</span>
                  <span>{totalStats.folderCount} thư mục</span>
                  <span>•</span>
                  <span>{totalStats.fileCount} tệp tin</span>
                  {lastRefreshed && (
                    <>
                      <span>•</span>
                      <span className="text-slate-500">Cập nhật lúc: {lastRefreshed}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls: Search, Zoom, Expand/Collapse, Fullscreen */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm thư mục, tệp tin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-900/90 border border-cyan-800/60 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all w-48 sm:w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Expand / Collapse All */}
            <div className="flex items-center bg-slate-900/80 border border-cyan-900/60 rounded-lg p-0.5">
              <button
                onClick={expandAll}
                className="px-2.5 py-1 text-xs text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/50 rounded transition-colors font-medium"
                title="Mở rộng tất cả"
              >
                Mở rộng
              </button>
              <div className="h-3.5 w-px bg-cyan-900/60"></div>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 text-xs text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/50 rounded transition-colors font-medium"
                title="Thu gọn tất cả"
              >
                Thu gọn
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-900/80 border border-cyan-900/60 rounded-lg p-0.5" data-no-pan>
              <button
                onClick={() => setTransform((p) => ({ ...p, scale: Math.max(0.25, Number((p.scale - 0.1).toFixed(2))) }))}
                className="p-1 text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/50 rounded transition-colors"
                title="Thu nhỏ (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-2 text-cyan-300 font-semibold select-none">
                {Math.round(transform.scale * 100)}%
              </span>
              <button
                onClick={() => setTransform((p) => ({ ...p, scale: Math.min(3, Number((p.scale + 0.1).toFixed(2))) }))}
                className="p-1 text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/50 rounded transition-colors"
                title="Phóng to (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={resetView}
                className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/50 rounded transition-colors border-l border-cyan-900/60"
                title="Đặt lại view (100%)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Pan hint */}
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 border border-cyan-900/40 rounded-lg px-2 py-1">
              <Move className="w-3 h-3 text-cyan-700" />
              <span>Kéo nền · Cuộn để zoom</span>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullScreen((f) => !f)}
              className="p-1.5 rounded-lg bg-slate-900/80 border border-cyan-900/60 text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/50 transition-colors"
              title={isFullScreen ? 'Thu nhỏ cửa sổ' : 'Toàn màn hình'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchRealData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium text-xs shadow-md shadow-cyan-900/50 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới dữ liệu</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN PANORAMIC CANVAS — 2D Pan + Zoom */}
      <main
        ref={canvasRef}
        className="flex-1 overflow-hidden relative bg-[radial-gradient(#162447_1px,transparent_1px)] [background-size:24px_24px] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ userSelect: 'none', touchAction: 'none' }}
      >
        {loading && !rootFolder ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-sm text-cyan-300">Đang tải dữ liệu thực tế từ cơ sở dữ liệu MySQL...</p>
          </div>
        ) : (
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, willChange: 'transform' }}
          >
            <div className="flex items-start gap-12 p-4">
              {/* === ROOT NODE (DATA ROOM) === */}
              <div className="sticky left-0 z-20 shrink-0">
                <div className="w-64 p-5 rounded-2xl bg-gradient-to-br from-[#0F1E36] to-[#0A1428] border-2 border-cyan-500 shadow-xl shadow-cyan-950/80">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-inner">
                      <FolderOpen className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-base tracking-wide">
                        {rootFolder?.name || 'Data Room'}
                      </div>
                      <div className="text-[11px] text-cyan-300 font-semibold uppercase tracking-wider">
                        Thư mục gốc (Root)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-cyan-900/60 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Thư mục nhánh:</span>
                      <span className="font-bold text-cyan-300">{rootFolder?.subfolders?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tài liệu tại Root:</span>
                      <span className="font-bold text-cyan-300">{unclassifiedFiles.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Trạng thái:</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Sẵn sàng
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* === SUBFOLDERS & FILES (TECH TREE) === */}
              <div className="flex-1 space-y-8 relative before:absolute before:-left-8 before:top-8 before:bottom-8 before:w-0.5 before:bg-gradient-to-b before:from-cyan-400 before:via-blue-500 before:to-indigo-500">
                {/* 1. Branch: Real Subfolders — uses recursive FolderNode */}
                {rootFolder?.subfolders && rootFolder.subfolders.length > 0 ? (
                  rootFolder.subfolders.map((folder) => {
                    if (searchQuery && !doesFolderMatch(folder, searchQuery)) return null;
                    return <FolderNode key={folder.id} folder={folder} depth={0} />;
                  })
                ) : (
                  <div className="text-xs text-slate-400 italic">Chưa có thư mục con nào.</div>
                )}

                {/* 2. Branch: Unclassified Root Files */}
                {unclassifiedFiles && unclassifiedFiles.length > 0 && (
                  <div className="relative flex items-start gap-8">
                    {/* Horizontal connector line */}
                    <div className="absolute -left-8 top-6 w-8 h-0.5 bg-cyan-400/80"></div>

                    {/* Root files card */}
                    <div className="w-72 p-4 rounded-2xl bg-[#0D1B36] border border-amber-500/50 hover:border-amber-400 shadow-lg shadow-amber-950/30 transition-all shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                          <HardDrive className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-white truncate">
                            Tài liệu tại Thư mục gốc
                          </div>
                          <div className="text-[11px] text-amber-300 font-medium">
                            {unclassifiedFiles.length} tệp tin ở Root
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* List of root files */}
                    <div className="flex-1 flex flex-wrap gap-3 pt-1">
                      {unclassifiedFiles.map((file) => {
                        const isFileMatch =
                          !searchQuery ||
                          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (file.fileName && file.fileName.toLowerCase().includes(searchQuery.toLowerCase()));

                        if (searchQuery && !isFileMatch) return null;

                        const iconInfo = getFileIcon(file.extension, file.type);

                        return (
                          <div
                            key={file.id}
                            onClick={() => setPreviewFile(file)}
                            className="group relative flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#0b162c] border border-amber-800/40 hover:border-amber-400 hover:bg-[#18233d] transition-all cursor-pointer shadow-md hover:shadow-amber-950/40 w-72"
                          >
                            <div className={`p-1.5 rounded-lg border ${iconInfo.bg} shrink-0`}>
                              {iconInfo.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-xs font-semibold text-slate-100 group-hover:text-amber-300 truncate"
                                title={file.name}
                              >
                                {file.name}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="font-mono">{file.size}</span>
                                {file.isEncrypted && (
                                  <span className="inline-flex items-center gap-0.5 text-amber-400">
                                    <Lock className="w-2.5 h-2.5" /> Mã hóa
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="p-1 rounded-md text-slate-400 group-hover:text-amber-400 hover:bg-amber-950/60 shrink-0">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. FILE PREVIEW MODAL */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};
