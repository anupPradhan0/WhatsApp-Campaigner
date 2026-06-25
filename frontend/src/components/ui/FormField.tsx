import React from 'react';
import { cn } from '../../lib/utils';
import { fieldCls } from '../../theme/classes';

export const FLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[11px] font-semibold text-fg-muted uppercase tracking-[0.07em] mb-[5px]">
    {children}
  </label>
);

export const FInput = ({ label, className, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <FLabel>{label}</FLabel>
    <input {...p} className={cn(fieldCls, className)} />
  </div>
);

export const FSelect = ({ label, children, className, ...p }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div>
    <FLabel>{label}</FLabel>
    <select {...p} className={cn(fieldCls, "cursor-pointer", className)}>
      {children}
    </select>
  </div>
);

export const FTextarea = ({ label, rows = 4, className, ...p }: { label: string; rows?: number } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div>
    <FLabel>{label}</FLabel>
    <textarea {...p} rows={rows} className={cn(fieldCls, "resize-none", className)} />
  </div>
);
