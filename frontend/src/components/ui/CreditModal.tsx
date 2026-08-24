import { useState } from 'react';
import { cn } from '../../lib/utils';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { FInput } from './FormField';
import { PrimaryBtn, GhostBtn } from './ActionButton';
import { InlineAlert } from './Alert';

interface CreditModalProps {
  /** "User" / "Admin" / "Reseller" — the word shown next to the company name. */
  roleLabel: string;
  name: string;
  balance: number;
  error?: string;
  busy?: boolean;
  creditAmt: string;
  debitAmt: string;
  setCreditAmt: (v: string) => void;
  setDebitAmt: (v: string) => void;
  onAdd: () => void;
  onRemove: () => void;
  onClose: () => void;
}

/** Single popup for both directions of a balance change — add or remove credit. */
export const CreditModal = ({
  roleLabel, name, balance, error, busy = false,
  creditAmt, debitAmt, setCreditAmt, setDebitAmt, onAdd, onRemove, onClose,
}: CreditModalProps) => {
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const adding = mode === 'add';

  return (
    <ModalOverlay onClose={onClose}>
      <div className="max-w-[400px] mx-auto">
        <ModalHeader title="Manage Credit" onClose={onClose} />
        <ModalBody>
          {error && <InlineAlert msg={error} type="error" />}

          <div className={cn('border rounded-lg px-3 py-2.5 mb-3.5', adding ? 'bg-brand-dim border-brand-border' : 'bg-danger-dim border-danger-border')}>
            <p className="text-xs text-fg-muted">{roleLabel}: <span className="text-fg font-semibold">{name}</span></p>
            <p className="text-xs text-fg-muted mt-1">Current Balance: <span className="text-brand-light font-bold text-[15px]">₹{balance.toLocaleString()}</span></p>
          </div>

          <div className="flex gap-1.5 p-1 bg-surface2 border border-line rounded-lg mb-3.5">
            {([['add', 'Add Credit'], ['remove', 'Remove Credit']] as const).map(([m, label]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 py-[7px] rounded-md text-[13px] font-semibold border-none cursor-pointer transition-colors',
                  mode === m
                    ? m === 'add' ? 'bg-brand text-white' : 'bg-danger text-white'
                    : 'bg-transparent text-fg-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {adding
            ? <FInput label="Amount to Credit *" type="number" placeholder="Enter amount" min="0" value={creditAmt} onChange={e => setCreditAmt(e.target.value)} />
            : <FInput label="Amount to Debit *" type="number" placeholder="Enter amount" min="0" value={debitAmt} onChange={e => setDebitAmt(e.target.value)} />}
        </ModalBody>
        <ModalFooter>
          <PrimaryBtn danger={!adding} onClick={adding ? onAdd : onRemove} disabled={busy}>
            {busy ? 'Processing…' : adding ? 'Add Credit' : 'Remove Credit'}
          </PrimaryBtn>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
        </ModalFooter>
      </div>
    </ModalOverlay>
  );
};
