import React, { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Layers } from 'lucide-react';

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
}

const TreeItem: React.FC<{
  node: TreeNode;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}> = ({ node, selectedFolderId, onSelectFolder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedFolderId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none text-xs">
      <div
        className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
            : 'text-slate-700 hover:bg-slate-100'
        }`}
        onClick={() => onSelectFolder(node.id)}
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
      </div>

      {hasChildren && isOpen && (
        <div className="pl-4 ml-2 border-l border-slate-200 mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({ tree, selectedFolderId, onSelectFolder }) => {
  return (
    <div className="space-y-1">
      {/* Root item */}
      <div
        onClick={() => onSelectFolder(null)}
        className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
          selectedFolderId === null
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
          />
        ))}
      </div>
    </div>
  );
};
