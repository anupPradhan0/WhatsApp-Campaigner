import React from 'react';
import { X } from 'lucide-react';
import { D } from '../../theme/tokens';

export const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
    onClick={onClose}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
    >
      {children}
    </div>
  </div>
);

export const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${D.border}` }}>
    <p style={{ fontSize: 16, fontWeight: 700, color: D.text }}>{title}</p>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
      <X size={18} style={{ color: D.textMuted }} />
    </button>
  </div>
);

export const ModalBody = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: '20px' }}>{children}</div>
);

export const ModalFooter = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 10, padding: '0 20px 20px' }}>{children}</div>
);
