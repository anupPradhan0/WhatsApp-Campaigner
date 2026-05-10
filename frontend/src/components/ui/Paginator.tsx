
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { D } from '../../theme/tokens';

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
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      background: D.surface, border: `1px solid ${D.border}`,
      borderRadius: 10, padding: '12px 16px',
    }}>
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        style={{ padding: '5px 7px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex' }}
      >
        <ChevronLeft size={15} style={{ color: D.textMuted }} />
      </button>

      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={{
            width: 32, height: 32, borderRadius: 6, fontSize: 12, fontWeight: 600,
            border: `1px solid ${page === p ? D.green : D.border}`,
            background: page === p ? D.green : D.surface2,
            color: page === p ? '#fff' : D.textMuted,
            cursor: 'pointer',
          }}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === total}
        style={{ padding: '5px 7px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 6, cursor: page === total ? 'not-allowed' : 'pointer', opacity: page === total ? 0.4 : 1, display: 'flex' }}
      >
        <ChevronRight size={15} style={{ color: D.textMuted }} />
      </button>
    </div>
  );
};
