import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onSelect: (folderId: string | null) => void;
  dragItem?: { id: string; type: 'folder' | 'file'; name: string } | null;
  onDropItem?: (folderId: string | null) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onSelect, dragItem, onDropItem }) => {
  const [dragOverId, setDragOverId] = React.useState<string | null | undefined>(undefined);

  return (
    <nav className="flex items-center flex-wrap gap-1 text-xs text-slate-500 font-medium">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isDragOver = dragOverId === item.id;
        const canDrop = dragItem && !isLast && (dragItem.type !== 'folder' || String(dragItem.id) !== String(item.id));

        return (
          <React.Fragment key={item.id || 'root'}>
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
            <button
              onClick={() => onSelect(item.id)}
              onDragOver={(e) => {
                if (canDrop) {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverId(item.id);
                  e.dataTransfer.dropEffect = 'move';
                }
              }}
              onDragLeave={() => setDragOverId(undefined)}
              onDrop={(e) => {
                if (canDrop) {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOverId(undefined);
                  onDropItem?.(item.id);
                }
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
                isDragOver
                  ? 'bg-blue-100 text-blue-800 font-bold ring-2 ring-blue-500'
                  : isLast
                  ? 'text-slate-900 font-bold pointer-events-none'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-200/60'
              }`}
            >
              {index === 0 && <Home className="w-3.5 h-3.5" />}
              <span>{item.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
