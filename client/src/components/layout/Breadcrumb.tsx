import React, { useState } from 'react';
import { ChevronRight, Home, Folder } from 'lucide-react';

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onSelect: (folderId: string | null) => void;
  dragItem?: { id: string; type: 'folder' | 'file'; name: string } | null;
  onDropItem?: (folderId: string | null, droppedItem?: any) => void;
  onDropFiles?: (files: FileList | File[], folderId: string | null) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  onSelect,
  dragItem,
  onDropItem,
  onDropFiles,
}) => {
  const [dragOverId, setDragOverId] = useState<string | null | undefined>(undefined);

  return (
    <nav className="flex items-center gap-1 text-xs text-slate-500 font-medium overflow-x-auto py-0.5 max-w-full">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isDragOver = dragOverId === item.id;

        return (
          <React.Fragment key={item.id ?? `crumb-${index}`}>
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              onDragOver={(e) => {
                if (!isLast) {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverId(item.id);
                  e.dataTransfer.dropEffect = 'move';
                }
              }}
              onDragLeave={() => {
                if (dragOverId === item.id) setDragOverId(undefined);
              }}
              onDrop={(e) => {
                if (!isLast) {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverId(undefined);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    onDropFiles?.(e.dataTransfer.files, item.id);
                    return;
                  }
                  onDropItem?.(item.id);
                }
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors shrink-0 max-w-[150px] sm:max-w-[200px] ${
                isDragOver
                  ? 'bg-blue-100 text-blue-800 font-bold ring-2 ring-blue-500 shadow-xs'
                  : isLast
                  ? 'text-slate-900 font-bold cursor-default bg-slate-100'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100 cursor-pointer'
              }`}
              title={item.name}
            >
              {index === 0 ? (
                <Home className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <span className="truncate">{item.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
