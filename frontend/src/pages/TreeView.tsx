import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronDown, User, Users, ShieldCheck, X } from "lucide-react";
import { getUserRole } from "../utils/Auth";
import { UserRole } from "../constants/Roles";
import { api } from "../api/client";
import { cn } from "../lib/utils";
import { Spinner } from '../components/ui/Spinner';
import { PageHeader } from '../components/ui/PageHeader';

interface TreeNode { id: string; companyName: string; email: string; number: string; role: string; balance: number; totalCampaigns: number; status: string; directResellers: number; directUsers: number; level: number; children: TreeNode[]; }
interface TreeData { totalCount: number; tree: TreeNode; }

interface RoleStyle { color: string; dim: string; hoverBorder: string; Icon: React.ComponentType<{ size?: number; className?: string }>; }
const roleStyle = (role: string): RoleStyle => {
  if (role === 'admin')    return { color: 'text-info',        dim: 'bg-info-dim',    hoverBorder: 'hover:border-info/50',        Icon: ShieldCheck };
  if (role === 'reseller') return { color: 'text-brand-light', dim: 'bg-brand-dim',   hoverBorder: 'hover:border-brand-light/50',  Icon: Users };
  return                          { color: 'text-warning',     dim: 'bg-warning-dim', hoverBorder: 'hover:border-warning/50',      Icon: User };
};

const StatusDot = ({ s }: { s: string }) => (
  <span className={cn("w-[7px] h-[7px] rounded-full inline-block flex-shrink-0", s === 'active' ? "bg-brand-light" : "bg-danger")} />
);

export default function TreeView() {
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<TreeNode | null>(null);

  const userRole = getUserRole();
  const isAdminOrReseller = userRole === UserRole.ADMIN || userRole === UserRole.RESELLER;

  const fetchData = useCallback(async () => {
    try { setLoading(true); const { data: r } = await api.get('/api/dashboard/tree-view'); if (r.success) { setTreeData(r.data); if (r.data.tree) setExpanded(new Set([r.data.tree.id])); } else setError(r.message || 'Failed'); } catch { setError('Network error.'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const toggle = (id: string) => setExpanded(prev => {
    const s = new Set(prev);
    if (s.has(id)) s.delete(id); else s.add(id);
    return s;
  });

  const renderNode = (node: TreeNode, depth = 0): React.ReactElement => {
    const isExp = expanded.has(node.id);
    const hasKids = node.children?.length > 0;
    const rs = roleStyle(node.role);
    const users = node.children?.filter(c => c.role === 'user') ?? [];
    const resellers = node.children?.filter(c => c.role === 'reseller') ?? [];
    const indentPx = depth * 20;

    return (
      <div key={node.id}>
        <div className="flex items-center gap-1.5 mb-1.5" style={{ paddingLeft: indentPx }}>
          {depth > 0 && <div className="w-3.5 h-px bg-line-strong flex-shrink-0" />}
          {hasKids
            ? <button onClick={() => toggle(node.id)} className="w-5 h-5 rounded-[5px] bg-surface2 border border-line flex items-center justify-center cursor-pointer flex-shrink-0">
                {isExp ? <ChevronDown size={11} className="text-fg-muted" /> : <ChevronRight size={11} className="text-fg-muted" />}
              </button>
            : <div className="w-5" />}
          <div
            onClick={() => setSelected(node)}
            className={cn("flex-1 flex items-center gap-2 px-2.5 py-[7px] bg-surface2 border border-line rounded-lg cursor-pointer transition-colors", rs.hoverBorder)}
          >
            <div className={cn("w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0", rs.dim)}>
              <rs.Icon size={13} className={rs.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-semibold text-fg overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]">{node.companyName}</p>
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-[20px] uppercase tracking-[0.06em] flex-shrink-0", rs.color, rs.dim)}>{node.role}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-[20px] bg-surface border border-line text-fg-subtle flex-shrink-0">L{node.level}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusDot s={node.status} />
                <span className="text-[11px] text-fg-subtle">₹{node.balance}</span>
                {hasKids && <span className="text-[11px] text-fg-subtle">· {node.children.length} children</span>}
              </div>
            </div>
          </div>
        </div>

        {hasKids && isExp && (
          <div className="border-l border-line mb-1" style={{ paddingLeft: indentPx + 26, marginLeft: indentPx + 9 }}>
            {users.length > 0 && (
              <div className="mb-1.5">
                <div className="inline-block text-[9px] font-bold text-warning bg-warning-dim px-2 py-0.5 rounded-[20px] uppercase tracking-[0.06em] mb-1.5 -ml-0.5">Users ({users.length})</div>
                {users.map(c => renderNode(c, depth + 1))}
              </div>
            )}
            {resellers.length > 0 && (
              <div>
                <div className="inline-block text-[9px] font-bold text-brand-light bg-brand-dim px-2 py-0.5 rounded-[20px] uppercase tracking-[0.06em] mb-1.5 -ml-0.5">Resellers ({resellers.length})</div>
                {resellers.map(c => renderNode(c, depth + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <Spinner label="Loading network…" />;

  if (!isAdminOrReseller) return (
    <div className="px-3.5 py-2.5 bg-danger-dim border border-danger-border rounded-lg">
      <p className="text-danger text-[13px]">Access Denied. Only Admin and Reseller can view this page.</p>
    </div>
  );

  if (error) return (
    <div className="px-3.5 py-2.5 bg-danger-dim border border-danger-border rounded-lg">
      <p className="text-danger text-[13px]">{error}</p>
    </div>
  );

  if (!treeData) return null;

  return (
    <>
      <div className="flex flex-col gap-4">
        <PageHeader title="Network Tree" subtitle="Your complete network hierarchy"
          action={
            <div className="bg-surface border border-line rounded-[10px] px-[18px] py-2.5 text-center">
              <p className="text-2xl font-bold text-fg">{treeData.totalCount}</p>
              <p className="text-[10px] text-fg-subtle uppercase tracking-[0.07em] mt-0.5">Total Members</p>
            </div>
          }
        />

        {/* Legend */}
        <div className="bg-surface border border-line rounded-[10px] px-4 py-2.5 flex gap-5 flex-wrap">
          <p className="text-[10px] text-fg-subtle font-semibold uppercase tracking-[0.07em] self-center">Legend:</p>
          {([['Admin', 'text-info', ShieldCheck], ['Reseller', 'text-brand-light', Users], ['User', 'text-warning', User]] as const).map(([label, color, Icon]) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon size={14} className={color} />
              <span className="text-xs text-fg-muted font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Tree */}
        <div className="bg-surface border border-line rounded-xl p-4 overflow-x-auto">
          <div className="min-w-[280px]">
            {renderNode(treeData.tree)}
          </div>
        </div>
      </div>

      {/* Details modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-surface border border-line rounded-[14px] w-full max-w-[520px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                {(() => { const rs = roleStyle(selected.role); return <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", rs.dim)}><rs.Icon size={18} className={rs.color} /></div>; })()}
                <div>
                  <p className="text-[15px] font-bold text-fg">{selected.companyName}</p>
                  <p className="text-[11px] text-fg-muted uppercase">{selected.role} · Level {selected.level}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="bg-transparent border-none cursor-pointer p-1"><X size={18} className="text-fg-muted" /></button>
            </div>
            <div className="p-5 flex flex-col gap-3.5">
              {/* Info grid */}
              <div className="bg-surface2 border border-line rounded-[10px] p-3.5">
                <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-[0.07em] mb-3">Member Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['Email', selected.email], ['Phone', selected.number]].map(([l, v]) => (
                    <div key={l} className="col-span-full"><p className="text-[10px] text-fg-subtle font-semibold uppercase mb-[3px]">{l}</p><p className="text-xs text-fg break-all">{v}</p></div>
                  ))}
                  {[['Balance', `₹${selected.balance}`], ['Campaigns', String(selected.totalCampaigns)], ['Resellers', String(selected.directResellers)], ['Direct Users', String(selected.directUsers)]].map(([l, v]) => (
                    <div key={l}><p className="text-[10px] text-fg-subtle font-semibold uppercase mb-[3px]">{l}</p>
                      <p className={cn("text-sm font-bold", l === 'Balance' ? "text-brand-light" : "text-fg")}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <p className="text-[10px] text-fg-subtle font-semibold uppercase">Status</p>
                  <div className="flex items-center gap-[5px]">
                    <StatusDot s={selected.status} />
                    <span className={cn("text-xs font-semibold uppercase", selected.status === 'active' ? "text-brand-light" : "text-danger")}>{selected.status}</span>
                  </div>
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2.5">
                {([['Resellers', selected.directResellers, 'text-brand-light'], ['Users', selected.directUsers, 'text-warning'], ['Total Direct', selected.children.length, 'text-info']] as const).map(([l, v, c]) => (
                  <div key={l} className="bg-surface2 border border-line rounded-lg px-2.5 py-3 text-center">
                    <p className={cn("text-xl font-bold", c)}>{v}</p>
                    <p className="text-[10px] text-fg-subtle font-semibold uppercase mt-1">{l}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setSelected(null)} className="w-full py-[9px] bg-surface2 border border-line rounded-lg cursor-pointer text-fg-muted text-[13px] font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
