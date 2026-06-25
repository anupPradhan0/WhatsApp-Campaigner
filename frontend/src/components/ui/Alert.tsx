import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InlineAlertProps {
  msg: string;
  type: 'error' | 'success';
}

/**
 * Inline alert for in-modal/form errors and confirmations.
 * For transient global notifications, use sonner `toast.success/.error` directly.
 */
export const InlineAlert = ({ msg, type }: InlineAlertProps) => (
  <div
    className={cn(
      "flex items-start gap-2 px-3 py-2.5 border rounded-lg mb-3.5",
      type === 'error'
        ? "bg-danger-dim border-danger-border"
        : "bg-brand-dim border-brand-border"
    )}
  >
    {type === 'error'
      ? <AlertCircle size={14} className="text-danger shrink-0 mt-px" />
      : <CheckCircle2 size={14} className="text-brand-light shrink-0 mt-px" />
    }
    <p className="text-xs text-fg">{msg}</p>
  </div>
);
