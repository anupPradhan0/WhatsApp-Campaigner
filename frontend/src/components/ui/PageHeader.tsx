import React from 'react';
import { D } from '../../theme/tokens';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader = ({ title, subtitle, action }: PageHeaderProps) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: D.text, margin: 0, lineHeight: 1.3 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 13, color: D.textMuted, marginTop: 4 }}>{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);
