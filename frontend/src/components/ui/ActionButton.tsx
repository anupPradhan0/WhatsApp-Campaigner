import React from 'react';
import { cn } from '../../lib/utils';

interface PrimaryBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  danger?: boolean;
  variant?: 'green' | 'blue' | 'amber';
}

export const PrimaryBtn = ({ children, danger, variant = 'green', className, ...p }: PrimaryBtnProps) => {
  const bgCls = danger
    ? 'bg-danger'
    : variant === 'blue'
    ? 'bg-info'
    : variant === 'amber'
    ? 'bg-warning'
    : 'bg-brand';
  return (
    <button
      {...p}
      className={cn(
        "flex-1 px-0 py-[9px] text-white font-semibold text-[13px] border-none rounded-lg cursor-pointer transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-60",
        bgCls,
        className
      )}
    >
      {children}
    </button>
  );
};

export const GhostBtn = ({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...p}
    className={cn(
      "flex-1 px-0 py-[9px] bg-surface2 text-fg-muted font-semibold text-[13px] border border-line rounded-lg cursor-pointer",
      className
    )}
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
    className="w-[30px] h-[30px] rounded-[7px] border-none flex items-center justify-center cursor-pointer shrink-0"
    style={{ background: bg, color }}
  >
    <Icon size={13} />
  </button>
);
