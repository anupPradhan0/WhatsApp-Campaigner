import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const ModalOverlay = ({ children, onClose, className }: { children: React.ReactNode; onClose: () => void; className?: string }) => (
  <div
    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80"
    onClick={onClose}
  >
    <div
      onClick={e => e.stopPropagation()}
      className={cn(
        "w-full max-w-[480px] max-h-[90vh] overflow-y-auto bg-surface border border-brand-border rounded-2xl shadow-[0_0_0_1px_rgba(22,163,74,0.08),0_24px_64px_-16px_rgba(0,0,0,0.85)]",
        className
      )}
    >
      {children}
    </div>
  </div>
);

export const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div className="flex items-center justify-between px-5 py-[18px] border-b border-brand-border/40">
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
