import { useState } from 'react';
import { UserRole } from '../constants/Roles';
import { getUserRole } from '../utils/Auth';
import { cn } from '../lib/utils';
import ManageUser from './ManageUser';
import ManageReseller from './ManageReseller';
import ManageAdmin from './ManageAdmin';
import AllAccounts from './AllAccounts';

// Merged account management: Users / Resellers / Admins as tabs instead of three
// separate sidebar links. Each tab is gated to the same roles the old menu items
// allowed; a role that can reach only one gets no tab bar. Each child page keeps
// its own header + "Add" button unchanged.
const TABS = [
  { key: 'all', label: 'All Accounts', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RESELLER], Comp: AllAccounts },
  { key: 'users', label: 'Users', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RESELLER], Comp: ManageUser },
  { key: 'resellers', label: 'Resellers', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], Comp: ManageReseller },
  { key: 'admins', label: 'Admins', roles: [UserRole.SUPER_ADMIN], Comp: ManageAdmin },
] as const;

export default function ManageAccounts() {
  const role = getUserRole();
  const visible = TABS.filter(t => t.roles.includes(role as never));
  const [tab, setTab] = useState(visible[0]?.key ?? 'users');

  const Active = (visible.find(t => t.key === tab) ?? visible[0])?.Comp;

  return (
    <div className="flex flex-col gap-4">
      {visible.length > 1 && (
        <div className="flex gap-1 bg-surface border border-line rounded-[10px] p-1 w-fit">
          {visible.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-4 py-[7px] rounded-[7px] text-[13px] font-semibold cursor-pointer border-none transition-colors",
                tab === t.key ? "bg-brand text-white" : "bg-transparent text-fg-muted",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {Active && <Active />}
    </div>
  );
}
