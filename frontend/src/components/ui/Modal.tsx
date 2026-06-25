import React from 'react';
import { X } from 'lucide-react';

export const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75"
    onClick={onClose}
  >
    <div
      onClick={e => e.stopPropagation()}
      className="w-full max-h-[90vh] overflow-y-auto bg-surface border border-line rounded-2xl"
    >
      {children}
    </div>
  </div>
);

export const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div className="flex items-center justify-between px-5 py-[18px] border-b border-line">
    <p className="text-base font-bold text-fg">{title}</p>
    <button onClick={onClose} className="flex bg-transparent border-none cursor-pointer p-1">
      <X size={18} className="text-fg-muted" />
    </button>
  </div>
);

export const ModalBody = ({ children }: { children: React.ReactNode }) => (
  <div className="p-5">{children}</div>
);

export const ModalFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2.5 px-5 pb-5 pt-0">{children}</div>
);
