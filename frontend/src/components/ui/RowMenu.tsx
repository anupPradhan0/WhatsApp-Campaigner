import { useRef, useState } from 'react';
import type React from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface RowMenuItem {
  icon: React.FC<{ size?: number }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

/** Overflow menu for row actions that don't deserve their own icon. */
export const RowMenu = ({ items }: { items: RowMenuItem[] }) => {
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
        title="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-[30px] h-[30px] rounded-[7px] border-none flex items-center justify-center cursor-pointer shrink-0 bg-surface2 text-fg-muted"
      >
        <MoreVertical size={13} />
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div
            role="menu"
            style={rect ? { top: rect.bottom + 6, right: window.innerWidth - rect.right } : undefined}
            className="fixed w-44 z-50 bg-surface border border-line rounded-xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] overflow-hidden p-1.5">
            {items.map(({ icon: Icon, label, onClick, danger }) => (
              <button
                key={label}
                role="menuitem"
                onClick={() => { setOpen(false); onClick(); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium bg-transparent border-none cursor-pointer transition-colors',
                  danger ? 'text-danger hover:bg-danger-dim' : 'text-fg hover:bg-white/[0.05]',
                )}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
