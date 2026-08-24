import { useEffect, useState } from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { getImpersonation, exitImpersonation, reloadIntoDashboard } from '../utils/Auth';

const mmss = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const leave = () => { void exitImpersonation().then(reloadIntoDashboard); };

/**
 * Sticky bar shown while a super admin is signed in as someone else.
 * Ticks down the remaining time and exits the session automatically when it
 * runs out, so they land back in their own account instead of a dead session.
 */
export const ImpersonationBanner = () => {
  // Read once on mount: the session only changes via a full page load.
  const [state] = useState(getImpersonation);
  const [left, setLeft] = useState(() => (state ? state.expiresAt - Date.now() : 0));
  const expiresAt = state?.expiresAt;

  useEffect(() => {
    if (!expiresAt) return;
    // A second of slack, so we exit just before the server token actually dies.
    if (expiresAt - Date.now() <= 1000) { leave(); return; }

    const id = setInterval(() => {
      const remaining = expiresAt - Date.now();
      setLeft(remaining);
      if (remaining <= 1000) { clearInterval(id); leave(); }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!state) return null;

  return (
    <div className="sticky top-0 z-[100] flex flex-wrap items-center gap-2 px-4 py-2 bg-warning-dim border-b border-warning">
      <ShieldAlert size={15} className="text-warning shrink-0" />
      <p className="text-[13px] text-fg m-0">
        Signed in as <strong>{state.asName}</strong> ({state.asRole}) — session ends in{' '}
        <strong className="tabular-nums">{mmss(left)}</strong>
      </p>
      <button
        onClick={leave}
        className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-warning text-black font-semibold text-xs border-none rounded-md cursor-pointer"
      >
        <LogOut size={13} /> Exit session
      </button>
    </div>
  );
};
