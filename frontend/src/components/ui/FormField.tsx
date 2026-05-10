import React from 'react';
import { D, inp, onFocusGreen, onBlurBorder } from '../../theme/tokens';

export const FLabel = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: D.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
    {children}
  </label>
);

export const FInput = ({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <FLabel>{label}</FLabel>
    <input {...p} style={{ ...inp, ...p.style }} onFocus={onFocusGreen} onBlur={onBlurBorder} />
  </div>
);

export const FSelect = ({ label, children, ...p }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div>
    <FLabel>{label}</FLabel>
    <select {...p} style={{ ...inp, cursor: 'pointer', ...p.style }} onFocus={onFocusGreen} onBlur={onBlurBorder}>
      {children}
    </select>
  </div>
);

export const FTextarea = ({ label, rows = 4, ...p }: { label: string; rows?: number } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div>
    <FLabel>{label}</FLabel>
    <textarea {...p} rows={rows} style={{ ...inp, resize: 'none', ...p.style }} onFocus={onFocusGreen} onBlur={onBlurBorder} />
  </div>
);
