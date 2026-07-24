import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Search, X } from 'lucide-react';
import { api } from '../api/client';
import { UserRole } from '../constants/Roles';
import { getUserRole } from '../utils/Auth';
import { QK } from '../lib/queryKeys';
import { cn } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';
import { PageHeader } from '../components/ui/PageHeader';
import type { ManagedUser } from '../hooks/useUserManagement';

// Merged read-only view of every account the current role can manage. Reuses the
// per-type endpoints' query keys so it shares cache with the other tabs (no
// double fetch; edits made on a tab reflect here after invalidation).
const SOURCES = [
  { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RESELLER], endpoint: 'manage-user', field: 'users', qk: QK.users() },
  { roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN], endpoint: 'manage-reseller', field: 'resellers', qk: QK.resellers() },
  { roles: [UserRole.SUPER_ADMIN], endpoint: 'manage-admin', field: 'admins', qk: QK.admins() },
] as const;

const roleCls: Record<string, string> = {
  admin: 'text-warning bg-warning-dim',
  reseller: 'text-info bg-info-dim',
  user: 'text-brand-light bg-brand-dim',
};
const statusCls: Record<string, string> = {
  active: 'text-brand-light bg-brand-dim',
  inactive: 'text-danger bg-danger-dim',
  deleted: 'text-fg-subtle bg-white/[0.05]',
};

export default function AllAccounts() {
  const role = getUserRole() as UserRole;
  const allowed = SOURCES.filter(s => (s.roles as readonly UserRole[]).includes(role));
  const [emailSearch, setEmailSearch] = useState('');

  const results = useQueries({
    queries: allowed.map(s => ({
      queryKey: s.qk,
      queryFn: async () => {
        const { data: r } = await api.get<{ success: boolean; message?: string; data: Record<string, ManagedUser[]> }>(`/api/dashboard/${s.endpoint}`);
        if (!r.success) throw new Error(r.message || 'Failed to load');
        return r.data;
      },
    })),
  });

  if (results.some(r => r.isLoading)) return <Spinner label="Loading accounts…" />;

  const accounts = results.flatMap((r, i) => (r.data?.[allowed[i].field] ?? []) as ManagedUser[]);
  const q = emailSearch.trim().toLowerCase();
  const filtered = q ? accounts.filter(a => (a.email ?? '').toLowerCase().includes(q)) : accounts;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="All Accounts" subtitle={`${accounts.length} total accounts`} />

      {/* Email filter */}
      <div className="flex items-center gap-2 bg-surface border border-line rounded-[10px] px-3.5 py-2.5 max-w-md">
        <Search size={15} className="text-fg-muted shrink-0" />
        <input
          type="search"
          value={emailSearch}
          onChange={e => setEmailSearch(e.target.value)}
          placeholder="Search by email…"
          className="flex-1 bg-transparent border-none outline-none text-fg text-[13px] placeholder:text-fg-subtle"
        />
        {emailSearch && <button onClick={() => setEmailSearch('')} className="bg-transparent border-none cursor-pointer p-0"><X size={14} className="text-fg-muted" /></button>}
      </div>

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead><tr className="border-b border-line">
              {['#', 'Account', 'Email', 'Role', 'Balance', 'Status', 'Joined'].map(h => (
                <th key={h} className="px-3.5 py-3 text-left text-[10px] text-fg-subtle font-bold uppercase tracking-[0.08em] whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7} className="p-10 text-center text-fg-subtle text-[13px]">No accounts found.</td></tr>
                : filtered.map((a, i) => (
                  <tr key={a.id} className="group border-b border-line/50">
                    <td className="px-3.5 py-[11px] text-xs text-fg-subtle group-hover:bg-white/[0.025]">{i + 1}</td>
                    <td className="px-3.5 py-[11px] group-hover:bg-white/[0.025]">
                      <div className="flex items-center gap-2 max-w-[200px]">
                        {a.image && <img src={a.image} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-line" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
                        <span className="text-[13px] text-fg font-medium overflow-hidden text-ellipsis whitespace-nowrap">{a.companyName}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-[11px] text-xs text-fg-muted whitespace-nowrap group-hover:bg-white/[0.025]">{a.email}</td>
                    <td className="px-3.5 py-[11px] group-hover:bg-white/[0.025]">
                      <span className={cn("text-[11px] font-semibold px-2 py-[3px] rounded-[20px] capitalize", roleCls[a.role] ?? 'text-fg-muted bg-white/[0.05]')}>{a.role}</span>
                    </td>
                    <td className="px-3.5 py-[11px] text-xs font-semibold text-fg whitespace-nowrap group-hover:bg-white/[0.025]">₹{(a.balance ?? 0).toLocaleString()}</td>
                    <td className="px-3.5 py-[11px] group-hover:bg-white/[0.025]">
                      <span className={cn("text-[11px] font-semibold px-2 py-[3px] rounded-[20px] capitalize", statusCls[a.status] ?? 'text-fg-muted bg-white/[0.05]')}>{a.status}</span>
                    </td>
                    <td className="px-3.5 py-[11px] text-xs text-fg-muted whitespace-nowrap group-hover:bg-white/[0.025]">{format(new Date(a.createdAt), 'dd MMM yyyy')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
