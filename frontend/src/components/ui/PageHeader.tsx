import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader = ({ title, subtitle, action }: PageHeaderProps) => (
  <div className="flex items-start justify-between flex-wrap gap-2.5">
    <div>
      <h1 className="text-xl font-bold text-fg m-0 leading-[1.3]">{title}</h1>
      {subtitle && <p className="text-[13px] text-fg-muted mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
