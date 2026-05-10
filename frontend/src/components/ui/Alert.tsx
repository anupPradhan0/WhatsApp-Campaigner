
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { D } from '../../theme/tokens';

interface InlineAlertProps {
  msg: string;
  type: 'error' | 'success';
}

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

interface ToastProps {
  msg: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast = ({ msg, type, onClose }: ToastProps) => (
  <div style={{
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    background: type === 'success' ? D.greenDim : D.redDim,
    border: `1px solid ${type === 'success' ? D.greenBorder : D.redBorder}`,
    borderRadius: 10, padding: '10px 14px',
    display: 'flex', alignItems: 'center', gap: 8,
    maxWidth: 340, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    animation: 'slideInRight 0.25s ease',
  }}>
    {type === 'success'
      ? <CheckCircle2 size={14} style={{ color: D.greenLight, flexShrink: 0 }} />
      : <AlertCircle size={14} style={{ color: D.red, flexShrink: 0 }} />
    }
    <p style={{ fontSize: 13, color: D.text, flex: 1 }}>{msg}</p>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
      <X size={13} style={{ color: D.textMuted }} />
    </button>
    <style>{`@keyframes slideInRight { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
  </div>
);
