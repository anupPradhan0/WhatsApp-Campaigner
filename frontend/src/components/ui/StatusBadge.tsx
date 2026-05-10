
import { D } from '../../theme/tokens';

interface BadgeProps {
  label: string;
  color: string;
  bg: string;
}

export const Badge = ({ label, color, bg }: BadgeProps) => (
  <span style={{
    fontSize: 11, fontWeight: 600, color, background: bg,
    padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap',
    border: `1px solid ${color}33`,
  }}>
    {label}
  </span>
);

export const statusColor = (status: string): { color: string; bg: string } => {
  const s = status?.toLowerCase();
  if (s === 'completed' || s === 'delivered' || s === 'resolved' || s === 'active')
    return { color: D.greenLight, bg: D.greenDim };
  if (s === 'pending')
    return { color: D.amber, bg: D.amberDim };
  if (s === 'processing' || s === 'in-progress')
    return { color: D.blue, bg: D.blueDim };
  if (s === 'failed' || s === 'error' || s === 'inactive' || s === 'closed')
    return { color: D.red, bg: D.redDim };
  return { color: D.textMuted, bg: 'rgba(255,255,255,0.06)' };
};

export const StatusBadge = ({ status }: { status: string }) => {
  const { color, bg } = statusColor(status);
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      color, background: bg, border: `1px solid ${color}44`,
    }}>
      {(status || 'N/A').replace('-', ' ')}
    </span>
  );
};
