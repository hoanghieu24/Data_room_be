import React, { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Layers, Trash2, GripVertical } from 'lucide-react';

export interface TreeNode {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  subfolderCount: number;
  fileCount: number;
  children: TreeNode[];
}

interface FolderTreeProps {
  tree: TreeNode[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  dragItem?: { id: string; type: 'folder' | 'file'; name: string } | null;
  onDropItem?: (targetFolderId: string | null) => void;
  onDragStartItem?: (item: { id: string; type: 'folder'; name: string }) => void;
  onDragEndItem?: () => void;
  onDeleteFolder?: (folder: any) => void;
}

const TreeItem: React.FC<{
  node: TreeNode;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  dragItem?: { id: string; type: 'folder' | 'file'; name: string } | null;
  onDropItem?: (targetFolderId: string | null) => void;
  onDragStartItem?: (item: { id: string; type: 'folder'; name: string }) => void;
  onDragEndItem?: () => void;
  onDeleteFolder?: (folder: any) => void;
}> = ({
  node,
  selectedFolderId,
  onSelectFolder,
  dragItem,
  onDropItem,
  onDragStartItem,
  onDragEndItem,
  onDeleteFolder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const isSelected = selectedFolderId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  const canAcceptDrop = dragItem && (dragItem.type !== 'folder' || String(dragItem.id) !== String(node.id));

  return (
    <div className="select-none text-xs">
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStartItem?.({ id: String(node.id), type: 'folder', name: node.name });
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', JSON.stringify({ id: node.id, type: 'folder', name: node.name }));
        }}
        onDragEnd={(e) => {
          e.stopPropagation();
          onDragEndItem?.();
        }}
        className={`group flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
          isDragOver
            ? 'bg-blue-100 text-blue-800 font-bold ring-2 ring-blue-500 scale-[1.02]'
            : isSelected
            ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
        onClick={() => onSelectFolder(node.id)}
        onDragOver={(e) => {
          if (canAcceptDrop) {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
            e.dataTransfer.dropEffect = 'move';
          }
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          if (canAcceptDrop) {
            onDropItem?.(node.id);
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
          {hasChildren ? (
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

        {(node.fileCount > 0 || node.subfolderCount > 0) && (
          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full font-semibold">
            {node.fileCount}
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

      {hasChildren && isOpen && (
        <div className="pl-4 ml-2 border-l border-slate-200 mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              dragItem={dragItem}
              onDropItem={onDropItem}
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
  onDragStartItem,
  onDragEndItem,
  onDeleteFolder,
}) => {
  const [isRootDragOver, setIsRootDragOver] = useState(false);

  return (
    <div className="space-y-1">
      {/* Root item */}
      <div
        onClick={() => onSelectFolder(null)}
        onDragOver={(e) => {
          if (dragItem) {
            e.preventDefault();
            e.stopPropagation();
            setIsRootDragOver(true);
            e.dataTransfer.dropEffect = 'move';
          }
        }}
        onDragLeave={() => setIsRootDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsRootDragOver(false);
          if (dragItem) {
            onDropItem?.(null);
          }
        }}
        className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
          isRootDragOver
            ? 'bg-blue-100 text-blue-800 font-bold ring-2 ring-blue-500 scale-[1.02]'
            : selectedFolderId === null
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
      >
        <Layers className="w-4 h-4" />
        <span>Tất cả thư mục (Root)</span>
      </div>

      <div className="pt-1 space-y-0.5">
        {tree.map((node) => (
          <TreeItem
            key={node.id}
            node={node}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            dragItem={dragItem}
            onDropItem={onDropItem}
            onDragStartItem={onDragStartItem}
            onDragEndItem={onDragEndItem}
            onDeleteFolder={onDeleteFolder}
          />
        ))}
      </div>
    </div>
  );
};

