import { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { CampaignExportType } from '../../utils/downloadCampaign';
import { cn } from '../../lib/utils';

interface DownloadMenuProps {
  onPick: (exportType: CampaignExportType) => void;
  busy?: boolean;
  recipientCount?: number;
  /** 'icon' = compact square in a table row, 'button' = labelled page action. */
  variant?: 'icon' | 'button';
  className?: string;
  iconSize?: number;
}

const OPTIONS: { exportType: CampaignExportType; label: string; hint: string }[] = [
  { exportType: 'all', label: 'Full campaign (.xlsx)', hint: 'All campaign data — Excel 2007 and later' },
  { exportType: 'numbers', label: 'Phone numbers only (.xlsx)', hint: 'A simple spreadsheet with recipient numbers' },
];

/** Download button for the full campaign or only its recipient numbers. */
export function DownloadMenu({ onPick, busy = false, recipientCount, variant = 'icon', className, iconSize = 13 }: DownloadMenuProps) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  // Fixed positioning, not absolute: the table wrapper is `overflow-x-auto`,
  // which would clip an absolutely-positioned menu inside the row.
  const rect = open ? btnRef.current?.getBoundingClientRect() : undefined;

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        title={busy && recipientCount && recipientCount >= 10_000
          ? `Preparing Excel file for ${recipientCount.toLocaleString()} recipients…`
          : busy ? 'Preparing Excel file…' : 'Download Excel'}
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
        {variant === 'button' && (busy
          ? recipientCount && recipientCount >= 10_000 ? 'Preparing large file…' : 'Preparing file…'
          : 'Download Excel')}
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            role="menu"
            style={rect ? { top: rect.bottom + 8, right: window.innerWidth - rect.right } : undefined}
            className="fixed w-60 z-50 bg-surface border border-line rounded-xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] overflow-hidden p-1.5">
            {OPTIONS.map(o => (
              <button
                key={o.exportType}
                role="menuitem"
                onClick={() => { setOpen(false); onPick(o.exportType); }}
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
