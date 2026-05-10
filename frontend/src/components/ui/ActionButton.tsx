import React from 'react';
import { D } from '../../theme/tokens';

interface PrimaryBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  danger?: boolean;
  variant?: 'green' | 'blue' | 'amber';
}

export const PrimaryBtn = ({ children, danger, variant = 'green', ...p }: PrimaryBtnProps) => {
  const bg = danger ? D.red : variant === 'blue' ? D.blue : variant === 'amber' ? D.amber : D.green;
  return (
    <button
      {...p}
      style={{
        flex: 1, padding: '9px 0', background: bg, color: '#fff',
        fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 8,
        cursor: p.disabled ? 'not-allowed' : 'pointer',
        opacity: p.disabled ? 0.6 : 1, transition: 'opacity 0.15s',
        ...p.style,
      }}
    >
      {children}
    </button>
  );
};

export const GhostBtn = ({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...p}
    style={{
      flex: 1, padding: '9px 0', background: D.surface2, color: D.textMuted,
      fontWeight: 600, fontSize: 13, border: `1px solid ${D.border}`,
      borderRadius: 8, cursor: 'pointer', ...p.style,
    }}
  >
    {children}
  </button>
);

interface ActionBtnProps {
  icon: React.FC<{ size?: number }>;
  color: string;
  bg: string;
  title: string;
  onClick: () => void;
}

export const ActionBtn = ({ icon: Icon, color, bg, title: t, onClick }: ActionBtnProps) => (
  <button
    onClick={onClick}
    title={t}
    style={{
      width: 30, height: 30, borderRadius: 7, background: bg, border: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0, color,
    }}
  >
    <Icon size={13} />
  </button>
);
