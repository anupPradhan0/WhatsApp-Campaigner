export const D = {
  bg:          '#0a0a0c',
  surface:     '#111113',
  surface2:    '#18181b',
  border:      '#27272a',
  border2:     '#3f3f46',
  text:        '#f4f4f5',
  textMuted:   '#71717a',
  textSubtle:  '#52525b',
  green:       '#16a34a',
  greenLight:  '#4ade80',
  greenDim:    'rgba(22,163,74,0.12)',
  greenBorder: 'rgba(22,163,74,0.3)',
  greenHover:  '#15803d',
  blue:        '#3b82f6',
  blueDim:     'rgba(59,130,246,0.12)',
  amber:       '#fbbf24',
  amberDim:    'rgba(251,191,36,0.1)',
  purple:      '#a78bfa',
  purpleDim:   'rgba(167,139,250,0.12)',
  red:         '#f87171',
  redDim:      'rgba(248,113,113,0.1)',
  redBorder:   'rgba(248,113,113,0.3)',
} as const;

export const inp = {
  width: '100%',
  padding: '9px 12px',
  background: D.surface2,
  border: `1px solid ${D.border}`,
  borderRadius: 8,
  fontSize: 13,
  color: D.text,
  outline: 'none',
  boxSizing: 'border-box' as const,
};

export const onFocusGreen = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = D.green;
};

export const onBlurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = D.border;
};
