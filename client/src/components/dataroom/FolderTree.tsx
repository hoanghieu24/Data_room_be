import React, { useState, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Layers,
  Trash2,
  FolderPlus,
  Image as ImageIcon,
  FileText
} from 'lucide-react';

export interface TreeNode {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  subfolderCount?: number;
  fileCount: number;
  totalSize?: number;
  files?: any[];
  children: TreeNode[];
}

interface FolderTreeProps {
  tree: TreeNode[];
  rootFiles?: any[];
  selectedFolderId: string | null;
  selectedFileId?: string | number | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectFile?: (file: any) => void;
  dragItem?: { id: string; type: 'folder' | 'file'; name: string } | null;
  onDropItem?: (targetFolderId: string | null, droppedItem?: any) => void;
  onDropFiles?: (files: FileList | File[], targetFolderId: string | null) => void;
  onDragStartItem?: (item: { id: string; type: 'folder' | 'file'; name: string }) => void;
  onDragEndItem?: () => void;
  onDeleteFolder?: (folder: any) => void;
  onCreateRootFolder?: () => void;
}

/**
 * Bộ nhớ phiên kéo thả toàn cục để bảo đảm dữ liệu kéo thả không bị mất
 * khi React re-render hoặc sự kiện onDragEnd kích hoạt trước onDrop.
 */
export const globalDragItem = {
  current: null as { id: string; type: 'folder' | 'file'; name: string } | null,
  set(item: { id: string; type: 'folder' | 'file'; name: string } | null) {
    this.current = item;
  },
  get() {
    return this.current;
  },
  clearWithDelay() {
    setTimeout(() => {
      this.current = null;
    }, 400);
  }
};

/**
 * Icon badge định dạng file
 */
export const FileMiniBadge: React.FC<{ file: any; size?: 'sm' | 'md' }> = ({ file, size = 'sm' }) => {
  const name = file?.name || file?.fileName || '';
  const ext = (file?.extension || file?.fileType || name.split('.').pop() || '').toLowerCase();

  const isExcel = ['xls', 'xlsx', 'csv'].includes(ext);
  const isPdf = ext === 'pdf';
  const isWord = ['doc', 'docx'].includes(ext);
  const isPpt = ['ppt', 'pptx'].includes(ext);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);

  const dimClass = size === 'md' ? 'w-8 h-8 rounded-lg text-xs' : 'w-5 h-5 rounded text-[10px]';

  if (isExcel) {
    return (
      <div className={`${dimClass} bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs`}>
        X
      </div>
    );
  }
  if (isPdf) {
    return (
      <div className={`${dimClass} bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs tracking-tight ${size === 'md' ? 'text-xs' : 'text-[8px]'}`}>
        pdf
      </div>
    );
  }
  if (isWord) {
    return (
      <div className={`${dimClass} bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs`}>
        W
      </div>
    );
  }
  if (isPpt) {
    return (
      <div className={`${dimClass} bg-amber-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs`}>
        P
      </div>
    );
  }
  if (isImage) {
    return (
      <div className={`${dimClass} bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs`}>
        <ImageIcon className={size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} />
      </div>
    );
  }

  return (
    <div className={`${dimClass} bg-slate-500 text-white flex items-center justify-center shrink-0 shadow-xs`}>
      <FileText className={size === 'md' ? 'w-4 h-4' : 'w-3 h-3'} />
    </div>
  );
};

const TreeItem: React.FC<{
  node: TreeNode;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  dragItem?: { id: string; type: 'folder' | 'file'; name: string } | null;
  onDropItem?: (targetFolderId: string | null, droppedItem?: any) => void;
  onDropFiles?: (files: FileList | File[], targetFolderId: string | null) => void;
  onDragStartItem?: (item: { id: string; type: 'folder' | 'file'; name: string }) => void;
  onDragEndItem?: () => void;
  onDeleteFolder?: (folder: any) => void;
}> = ({
  node,
  selectedFolderId,
  onSelectFolder,
  dragItem,
  onDropItem,
  onDropFiles,
  onDragStartItem,
  onDragEndItem,
  onDeleteFolder,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const isSelected = selectedFolderId === String(node.id);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none text-xs">
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          const item = { id: String(node.id), type: 'folder' as const, name: node.name };
          globalDragItem.set(item);
          onDragStartItem?.(item);
          e.dataTransfer.effectAllowed = 'all';
          e.dataTransfer.setData('text/plain', JSON.stringify(item));
          e.dataTransfer.setData('application/json', JSON.stringify(item));
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          globalDragItem.clearWithDelay();
          onDragEndItem?.();
        }}
        className={`group flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-all duration-150 ${
          isDragOver
            ? 'bg-blue-100 text-blue-800 font-bold ring-2 ring-blue-500 shadow-sm'
            : isSelected
            ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
        onClick={() => onSelectFolder(String(node.id))}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounter.current++;
          setIsDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
          if (!isDragOver) setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounter.current--;
          if (dragCounter.current <= 0) {
            setIsDragOver(false);
            dragCounter.current = 0;
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounter.current = 0;
          setIsDragOver(false);

          // 1. Thả file từ desktop ngoài vào thư mục này
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setIsOpen(true);
            onDropFiles?.(e.dataTransfer.files, String(node.id));
            return;
          }

          // 2. Thả file/folder nội bộ vào thư mục này
          let item = globalDragItem.get() || dragItem;
          if (!item) {
            try {
              const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
              if (raw) item = JSON.parse(raw);
            } catch {}
          }

          if (item) {
            if (item.type === 'folder' && String(item.id) === String(node.id)) {
              return;
            }
            setIsOpen(true);
            onDropItem?.(String(node.id), item);
          }
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-0.5 hover:bg-slate-200 rounded text-slate-400 shrink-0 cursor-pointer"
        >
          {hasChildren ? (
            isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <span className="w-3.5 h-3.5 inline-block" />
          )}
        </button>

        {isSelected || isOpen ? (
          <FolderOpen className="w-4 h-4 text-blue-500 shrink-0 pointer-events-none" />
        ) : (
          <Folder className="w-4 h-4 text-amber-500 shrink-0 pointer-events-none" />
        )}

        <span className="truncate flex-1 font-medium pointer-events-none">{node.name}</span>

        {isDragOver && (
          <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold pointer-events-none animate-pulse">
            Thả vào đây
          </span>
        )}

        {!isDragOver && (node.fileCount > 0 || (node.files && node.files.length > 0)) && (
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full font-semibold pointer-events-none">
            {node.fileCount || node.files?.length || 0}
          </span>
        )}

        {/* Nút xóa thư mục */}
        {onDeleteFolder && !isDragOver && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(node);
            }}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer shrink-0"
            title={`Xóa thư mục "${node.name}"`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="pl-3.5 ml-2 border-l border-slate-200 mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              dragItem={dragItem}
              onDropItem={onDropItem}
              onDropFiles={onDropFiles}
              onDragStartItem={onDragStartItem}
              onDragEndItem={onDragEndItem}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({
  tree,
  selectedFolderId,
  onSelectFolder,
  dragItem,
  onDropItem,
  onDropFiles,
  onDragStartItem,
  onDragEndItem,
  onDeleteFolder,
  onCreateRootFolder,
}) => {
  const [isRootDragOver, setIsRootDragOver] = useState(false);
  const [isRootOpen, setIsRootOpen] = useState(true);
  const rootDragCounter = useRef(0);

  const hasRootContent = tree.length > 0;

  return (
    <div className="space-y-1">
      {/* Root item - Drop target for moving files to root or uploading to root */}
      <div
        onClick={() => onSelectFolder(null)}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          rootDragCounter.current++;
          setIsRootDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
          if (!isRootDragOver) setIsRootDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          rootDragCounter.current--;
          if (rootDragCounter.current <= 0) {
            setIsRootDragOver(false);
            rootDragCounter.current = 0;
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          rootDragCounter.current = 0;
          setIsRootDragOver(false);

          // 1. Thả file từ desktop ngoài vào Root
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onDropFiles?.(e.dataTransfer.files, null);
            return;
          }

          // 2. Thả file/folder nội bộ ra Root
          let item = globalDragItem.get() || dragItem;
          if (!item) {
            try {
              const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
              if (raw) item = JSON.parse(raw);
            } catch {}
          }
          if (item) {
            onDropItem?.(null, item);
          }
        }}
        className={`group flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer text-xs font-semibold transition-all duration-150 ${
          isRootDragOver
            ? 'bg-blue-100 text-blue-800 font-bold ring-2 ring-blue-500 shadow-sm'
            : selectedFolderId === null
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsRootOpen(!isRootOpen);
          }}
          className={`p-0.5 rounded shrink-0 cursor-pointer ${
            selectedFolderId === null ? 'text-blue-100 hover:bg-blue-700' : 'text-slate-400 hover:bg-slate-200'
          }`}
        >
          {hasRootContent ? (
            isRootOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <span className="w-3.5 h-3.5 inline-block" />
          )}
        </button>

        <Layers className="w-4 h-4 shrink-0 pointer-events-none" />
        <span className="truncate flex-1 pointer-events-none">Tất cả thư mục (Root)</span>

        {isRootDragOver && (
          <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold pointer-events-none animate-pulse">
            Thả vào đây
          </span>
        )}

        {onCreateRootFolder && !isRootDragOver && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCreateRootFolder();
            }}
            className={`p-1 rounded transition-all cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 ${
              selectedFolderId === null
                ? 'hover:bg-blue-700 text-blue-100 hover:text-white'
                : 'hover:bg-slate-200 text-slate-400 hover:text-blue-600'
            }`}
            title="Tạo thư mục mới ở Root"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isRootOpen && (
        <div className="pt-0.5 space-y-0.5">
          {tree.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              dragItem={dragItem}
              onDropItem={onDropItem}
              onDropFiles={onDropFiles}
              onDragStartItem={onDragStartItem}
              onDragEndItem={onDragEndItem}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};
