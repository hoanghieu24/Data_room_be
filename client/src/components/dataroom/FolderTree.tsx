import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Layers,
  Trash2,
  GripVertical,
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
 * Icon badge định dạng file đồng bộ chuẩn với giao diện trong ảnh
 */
export const FileMiniBadge: React.FC<{ file: any; size?: 'sm' | 'md' }> = ({ file, size = 'sm' }) => {
  const name = file?.name || file?.fileName || '';
  const ext = (file?.extension || file?.fileType || name.split('.').pop() || '').toLowerCase();

  const isExcel = ['xls', 'xlsx', 'csv'].includes(ext);
  const isPdf = ext === 'pdf';
  const isWord = ['doc', 'docx'].includes(ext);
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
  selectedFileId?: string | number | null;
  onSelectFolder: (folderId: string | null) => void;
  onSelectFile?: (file: any) => void;
  dragItem?: { id: string; type: 'folder' | 'file'; name: string } | null;
  onDropItem?: (targetFolderId: string | null, droppedItem?: any) => void;
  onDropFiles?: (files: FileList | File[], targetFolderId: string | null) => void;
  onDragStartItem?: (item: { id: string; type: 'folder' | 'file'; name: string }) => void;
  onDragEndItem?: () => void;
  onDeleteFolder?: (folder: any) => void;
}> = ({
  node,
  selectedFolderId,
  selectedFileId,
  onSelectFolder,
  onSelectFile,
  dragItem,
  onDropItem,
  onDropFiles,
  onDragStartItem,
  onDragEndItem,
  onDeleteFolder,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const isSelected = selectedFolderId === String(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const hasFiles = node.files && node.files.length > 0;
  const canExpand = hasChildren || hasFiles;

  return (
    <div className="select-none text-xs">
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          const item = { id: String(node.id), type: 'folder' as const, name: node.name };
          onDragStartItem?.(item);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', JSON.stringify(item));
          e.dataTransfer.setData('application/json', JSON.stringify(item));
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          onDragEndItem?.();
        }}
        className={`group flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
          isDragOver
            ? 'bg-blue-100 text-blue-800 font-bold ring-2 ring-blue-500 scale-[1.02] shadow-sm'
            : isSelected
            ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
        onClick={() => onSelectFolder(String(node.id))}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);

          // 1. Thả file từ desktop ngoài vào thư mục này
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onDropFiles?.(e.dataTransfer.files, String(node.id));
            return;
          }

          // 2. Thả file/folder nội bộ vào thư mục này
          let item = dragItem;
          if (!item) {
            try {
              const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
              if (raw) item = JSON.parse(raw);
            } catch {}
          }

          if (item) {
            // Không cho thả folder vào chính nó
            if (item.type === 'folder' && String(item.id) === String(node.id)) {
              return;
            }
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
          className="p-0.5 hover:bg-slate-200 rounded text-slate-400"
        >
          {canExpand ? (
            isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <span className="w-3.5 h-3.5 inline-block" />
          )}
        </button>

        <GripVertical className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 shrink-0 cursor-grab" />

        {isSelected || isOpen ? (
          <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
        )}

        <span className="truncate flex-1 font-medium">{node.name}</span>

        {(node.fileCount > 0 || (node.files && node.files.length > 0)) && (
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full font-semibold">
            {node.fileCount || node.files?.length || 0}
          </span>
        )}

        {/* Nút xóa thư mục trực tiếp trên cây thư mục */}
        {onDeleteFolder && (
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

      {canExpand && isOpen && (
        <div className="pl-3.5 ml-2 border-l border-slate-200 mt-0.5 space-y-0.5">
          {/* Subfolders */}
          {node.children?.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              selectedFolderId={selectedFolderId}
              selectedFileId={selectedFileId}
              onSelectFolder={onSelectFolder}
              onSelectFile={onSelectFile}
              dragItem={dragItem}
              onDropItem={onDropItem}
              onDropFiles={onDropFiles}
              onDragStartItem={onDragStartItem}
              onDragEndItem={onDragEndItem}
              onDeleteFolder={onDeleteFolder}
            />
          ))}

          {/* Files inside this folder - Draggable to move to another folder */}
          {node.files?.map((file: any) => {
            const isFileSelected = selectedFileId && String(selectedFileId) === String(file.id);
            return (
              <div
                key={file.id}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  onDragStartItem?.({ id: String(file.id), type: 'file', name: file.name });
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', JSON.stringify({ id: file.id, type: 'file', name: file.name }));
                }}
                onDragEnd={(e) => {
                  e.stopPropagation();
                  onDragEndItem?.();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFile?.(file);
                }}
                className={`flex items-center gap-2 py-1 px-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
                  isFileSelected
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title={`Kéo thả để di chuyển tệp "${file.name}"`}
              >
                <FileMiniBadge file={file} size="sm" />
                <span className="truncate flex-1 font-normal text-xs">{file.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({
  tree,
  rootFiles = [],
  selectedFolderId,
  selectedFileId,
  onSelectFolder,
  onSelectFile,
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

  const hasRootContent = tree.length > 0 || rootFiles.length > 0;

  return (
    <div className="space-y-1">
      {/* Root item - Drop target for moving files to root or uploading to root */}
      <div
        onClick={() => onSelectFolder(null)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsRootDragOver(true);
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsRootDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsRootDragOver(false);

          // 1. Thả file từ desktop ngoài vào Root
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onDropFiles?.(e.dataTransfer.files, null);
            return;
          }

          // 2. Thả file/folder nội bộ ra Root
          let item = dragItem;
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
        className={`group flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer text-xs font-semibold transition-all ${
          isRootDragOver
            ? 'bg-blue-100 text-blue-800 font-bold ring-2 ring-blue-500 scale-[1.02] shadow-sm'
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
          className={`p-0.5 rounded ${
            selectedFolderId === null ? 'text-blue-100 hover:bg-blue-700' : 'text-slate-400 hover:bg-slate-200'
          }`}
        >
          {hasRootContent ? (
            isRootOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <span className="w-3.5 h-3.5 inline-block" />
          )}
        </button>

        <Layers className="w-4 h-4 shrink-0" />
        <span className="truncate flex-1">Tất cả thư mục (Root)</span>

        {rootFiles.length > 0 && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
              selectedFolderId === null ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {rootFiles.length}
          </span>
        )}

        {onCreateRootFolder && (
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
            title="Tạo thư mục mới ở Root (cùng cấp với Data Room)"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isRootOpen && (
        <div className="pt-0.5 space-y-0.5">
          {/* Cây thư mục */}
          {tree.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              selectedFolderId={selectedFolderId}
              selectedFileId={selectedFileId}
              onSelectFolder={onSelectFolder}
              onSelectFile={onSelectFile}
              dragItem={dragItem}
              onDropItem={onDropItem}
              onDropFiles={onDropFiles}
              onDragStartItem={onDragStartItem}
              onDragEndItem={onDragEndItem}
              onDeleteFolder={onDeleteFolder}
            />
          ))}

          {/* Danh sách các file nằm ở Root - Draggable to move into a folder */}
          {rootFiles.length > 0 && (
            <div className="pl-3.5 ml-2 border-l border-slate-200 mt-0.5 space-y-0.5">
              {rootFiles.map((file: any) => {
                const isFileSelected = selectedFileId && String(selectedFileId) === String(file.id);
                return (
                  <div
                    key={file.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      onDragStartItem?.({ id: String(file.id), type: 'file', name: file.name });
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', JSON.stringify({ id: file.id, type: 'file', name: file.name }));
                    }}
                    onDragEnd={(e) => {
                      e.stopPropagation();
                      onDragEndItem?.();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFile?.(file);
                    }}
                    className={`flex items-center gap-2 py-1 px-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
                      isFileSelected
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                    title={`Kéo thả để di chuyển tệp "${file.name}"`}
                  >
                    <FileMiniBadge file={file} size="sm" />
                    <span className="truncate flex-1 font-normal text-xs">{file.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
