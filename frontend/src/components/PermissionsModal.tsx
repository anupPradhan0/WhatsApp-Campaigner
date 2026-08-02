import { useState } from 'react';
import { Lock } from 'lucide-react';
import { PERMISSIONS } from '../constants/Permissions';
import { hasPermission } from '../utils/Auth';
import { cn } from '../lib/utils';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from './ui/Modal';
import { PrimaryBtn, GhostBtn } from './ui/ActionButton';
import { InlineAlert } from './ui/Alert';

interface Props {
  name: string;
  initial: string[];
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSave: (permissions: string[]) => void;
}

// Grant/revoke permissions on a managed account. A permission the actor does not
// hold is shown disabled — you can only grant what you have.
export function PermissionsModal({ name, initial, loading, error, onClose, onSave }: Props) {
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = (key: string) =>
    setSelected(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title={`Permissions — ${name}`} onClose={onClose} />
      <ModalBody>
        {error && <InlineAlert msg={error} type="error" />}
        <p className="text-xs text-fg-muted mb-3">Grant or revoke capabilities for this account. Revoking cascades to everyone beneath it.</p>
        <div className="flex flex-col gap-2">
          {PERMISSIONS.map(p => {
            const canGrant = hasPermission(p.key);
            const on = selected.includes(p.key);
            return (
              <button
                key={p.key}
                type="button"
                disabled={!canGrant || loading}
                onClick={() => toggle(p.key)}
                title={canGrant ? '' : "You don't have this permission to grant it"}
                className={cn(
                  'flex items-center gap-3 text-left px-3.5 py-3 rounded-lg border transition-colors',
                  !canGrant ? 'opacity-50 cursor-not-allowed bg-surface2 border-line' : 'cursor-pointer bg-surface2 border-line hover:border-line-strong',
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-fg flex items-center gap-1.5">
                    {p.label}
                    {!canGrant && <Lock size={11} className="text-fg-subtle" />}
                  </p>
                  <p className="text-[11px] text-fg-subtle mt-0.5">{p.description}</p>
                </div>
                {/* toggle switch */}
                <span className={cn('relative w-10 h-[22px] rounded-full shrink-0 transition-colors', on ? 'bg-brand' : 'bg-line-strong')}>
                  <span className={cn('absolute top-[3px] w-4 h-4 rounded-full bg-white transition-[left]', on ? 'left-[21px]' : 'left-[3px]')} />
                </span>
              </button>
            );
          })}
        </div>
      </ModalBody>
      <ModalFooter>
        <GhostBtn onClick={onClose} disabled={loading}>Cancel</GhostBtn>
        <PrimaryBtn onClick={() => onSave(selected)} disabled={loading}>
          {loading ? 'Saving…' : 'Save'}
        </PrimaryBtn>
      </ModalFooter>
    </ModalOverlay>
  );
}
