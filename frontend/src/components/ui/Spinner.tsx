
import { D } from '../../theme/tokens';

interface SpinnerProps {
  label?: string;
  size?: number;
}

export const Spinner = ({ label = 'Loading…', size = 36 }: SpinnerProps) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 12 }}>
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `3px solid ${D.border}`, borderTopColor: D.green,
      animation: 'spin 0.8s linear infinite',
    }} />
    <p style={{ color: D.textMuted, fontSize: 13 }}>{label}</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);
