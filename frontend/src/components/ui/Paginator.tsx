
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaginatorProps {
  page: number;
  total: number;
  onChange: (p: number) => void;
}

export const Paginator = ({ page, total, onChange }: PaginatorProps) => {
  if (total <= 1) return null;

  const pages = Array.from({ length: Math.min(5, total) }, (_, i) => {
    if (total <= 5)         return i + 1;
    if (page <= 3)          return i + 1;
    if (page >= total - 2)  return total - 4 + i;
    return page - 2 + i;
  });

  return (
    <div className="flex items-center justify-center gap-1.5 bg-surface border border-line rounded-[10px] px-4 py-3">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex px-[7px] py-[5px] bg-surface2 border border-line rounded-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={15} className="text-fg-muted" />
      </button>

      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "w-8 h-8 rounded-md text-xs font-semibold border cursor-pointer",
            page === p
              ? "border-brand bg-brand text-white"
              : "border-line bg-surface2 text-fg-muted"
          )}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === total}
        className="flex px-[7px] py-[5px] bg-surface2 border border-line rounded-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight size={15} className="text-fg-muted" />
      </button>
    </div>
  );
};
