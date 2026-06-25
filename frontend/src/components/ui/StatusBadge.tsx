
import { D } from '../../theme/tokens';

interface BadgeProps {
  label: string;
  color: string;
  bg: string;
}

export const Badge = ({ label, color, bg }: BadgeProps) => (
  <span
    className="text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px] whitespace-nowrap border"
    style={{ color, background: bg, borderColor: `${color}33` }}
  >
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
    <span
      className="text-[10px] font-bold px-[9px] py-[3px] rounded-[20px] uppercase tracking-[0.06em] border"
      style={{ color, background: bg, borderColor: `${color}44` }}
    >
      {(status || 'N/A').replace('-', ' ')}
    </span>
  );
};
