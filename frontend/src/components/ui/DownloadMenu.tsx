import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { ExcelFormat } from '../../hooks/useCampaigns';
import { cn } from '../../lib/utils';

interface DownloadMenuProps {
  onPick: (fileFormat: ExcelFormat) => void;
  busy?: boolean;
  /** 'icon' = compact square in a table row, 'button' = labelled page action. */
  variant?: 'icon' | 'button';
  className?: string;
  iconSize?: number;
}

const OPTIONS: { fileFormat: ExcelFormat; label: string; hint: string }[] = [
  { fileFormat: 'xlsx', label: 'Excel (.xlsx)', hint: 'Newer version — Excel 2007 and later' },
  { fileFormat: 'xls', label: 'Excel 97-2003 (.xls)', hint: 'Old version — for older Excel' },
];

/** Download button that lets the user choose the old or the new Excel format. */
export function DownloadMenu({ onPick, busy = false, variant = 'icon', className, iconSize = 13 }: DownloadMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        title="Download Excel"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          variant === 'icon'
            ? 'w-[30px] h-[30px] rounded-[7px] bg-info-dim border-none flex items-center justify-center cursor-pointer'
            : 'flex items-center gap-[7px] px-4 py-[9px] bg-brand text-white font-semibold text-[13px] border-none rounded-lg cursor-pointer',
          busy ? 'opacity-60' : 'opacity-100',
          className,
        )}
      >
        {busy
          ? <Loader2 size={iconSize} className={cn('animate-spin', variant === 'icon' && 'text-info')} />
          : <Download size={iconSize} className={cn(variant === 'icon' && 'text-info')} />}
        {variant === 'button' && (busy ? 'Exporting…' : 'Download Excel')}
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div role="menu" className="absolute right-0 top-full mt-2 w-60 z-50 bg-surface border border-line rounded-xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] overflow-hidden p-1.5">
            {OPTIONS.map(o => (
              <button
                key={o.fileFormat}
                role="menuitem"
                onClick={() => { setOpen(false); onPick(o.fileFormat); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer bg-transparent border-none"
              >
                <span className="block text-[13px] text-fg font-medium">{o.label}</span>
                <span className="block text-[11px] text-fg-muted">{o.hint}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
