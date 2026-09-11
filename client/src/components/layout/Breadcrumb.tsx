import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onSelect: (folderId: string | null) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, onSelect }) => {
  return (
    <nav className="flex items-center flex-wrap gap-1 text-xs text-slate-500 font-medium">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.id || 'root'}>
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
            <button
              onClick={() => onSelect(item.id)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-200/60 transition-colors ${
                isLast
                  ? 'text-slate-900 font-bold pointer-events-none'
                  : 'text-slate-600 hover:text-blue-600'
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
