import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { D } from '../../theme/tokens';

interface InlineAlertProps {
  msg: string;
  type: 'error' | 'success';
}

/**
 * Inline alert for in-modal/form errors and confirmations.
 * For transient global notifications, use sonner `toast.success/.error` directly.
 */
export const InlineAlert = ({ msg, type }: InlineAlertProps) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 8,
    padding: '10px 12px',
    background: type === 'error' ? D.redDim : D.greenDim,
    border: `1px solid ${type === 'error' ? D.redBorder : D.greenBorder}`,
    borderRadius: 8, marginBottom: 14,
  }}>
    {type === 'error'
      ? <AlertCircle size={14} style={{ color: D.red, flexShrink: 0, marginTop: 1 }} />
      : <CheckCircle2 size={14} style={{ color: D.greenLight, flexShrink: 0, marginTop: 1 }} />
    }
    <p style={{ fontSize: 12, color: D.text }}>{msg}</p>
  </div>
);
