import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, ChevronDown, User, Users, ShieldCheck, X } from "lucide-react";
import { getUserRole } from "../utils/Auth";
import { UserRole } from "../constants/Roles";
import { api } from "../api/client";

const D = {
  surface: '#111113', surface2: '#18181b', surface3: '#1c1c1f', border: '#27272a', border2: '#3f3f46',
  text: '#f4f4f5', textMuted: '#71717a', textSubtle: '#52525b',
  green: '#16a34a', greenLight: '#4ade80', greenDim: 'rgba(22,163,74,0.12)', greenBorder: 'rgba(22,163,74,0.3)',
  blue: '#3b82f6', blueDim: 'rgba(59,130,246,0.12)',
  amber: '#fbbf24', amberDim: 'rgba(251,191,36,0.1)',
  red: '#f87171', redDim: 'rgba(248,113,113,0.1)', redBorder: 'rgba(248,113,113,0.3)',
};

interface TreeNode { id: string; companyName: string; email: string; number: string; role: string; balance: number; totalCampaigns: number; status: string; directResellers: number; directUsers: number; level: number; children: TreeNode[]; }
interface TreeData { totalCount: number; tree: TreeNode; }

const roleStyle = (role: string) => {
  if (role === 'admin')    return { color: D.blue,      dim: D.blueDim,   Icon: ShieldCheck };
  if (role === 'reseller') return { color: D.greenLight, dim: D.greenDim,  Icon: Users };
  return                           { color: D.amber,     dim: D.amberDim,  Icon: User };
};

const StatusDot = ({ s }: { s: string }) => (
  <span style={{ width: 7, height: 7, borderRadius: '50%', background: s === 'active' ? D.greenLight : D.red, display: 'inline-block', flexShrink: 0 }} />
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

  const toggle = (id: string) => setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const renderNode = (node: TreeNode, depth = 0): React.ReactElement => {
    const isExp = expanded.has(node.id);
    const hasKids = node.children?.length > 0;
    const rs = roleStyle(node.role);
    const users = node.children?.filter(c => c.role === 'user') ?? [];
    const resellers = node.children?.filter(c => c.role === 'reseller') ?? [];
    const indentPx = depth * 20;

    return (
      <div key={node.id}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: indentPx, marginBottom: 6 }}>
          {depth > 0 && <div style={{ width: 14, height: 1, background: D.border2, flexShrink: 0 }} />}
          {hasKids
            ? <button onClick={() => toggle(node.id)} style={{ width: 20, height: 20, borderRadius: 5, background: D.surface2, border: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {isExp ? <ChevronDown size={11} style={{ color: D.textMuted }} /> : <ChevronRight size={11} style={{ color: D.textMuted }} />}
              </button>
            : <div style={{ width: 20 }} />}
          <div
            onClick={() => setSelected(node)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = rs.color + '88')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = D.border)}
          >
            <div style={{ width: 28, height: 28, borderRadius: 6, background: rs.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <rs.Icon size={13} style={{ color: rs.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{node.companyName}</p>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', color: rs.color, background: rs.dim, flexShrink: 0 }}>{node.role}</span>
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 20, background: D.surface, border: `1px solid ${D.border}`, color: D.textSubtle, flexShrink: 0 }}>L{node.level}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <StatusDot s={node.status} />
                <span style={{ fontSize: 11, color: D.textSubtle }}>₹{node.balance}</span>
                {hasKids && <span style={{ fontSize: 11, color: D.textSubtle }}>· {node.children.length} children</span>}
              </div>
            </div>
          </div>
        </div>

        {hasKids && isExp && (
          <div style={{ paddingLeft: indentPx + 26, borderLeft: `1px solid ${D.border}`, marginLeft: indentPx + 9, marginBottom: 4 }}>
            {users.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, color: D.amber, background: D.amberDim, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, marginLeft: -2 }}>Users ({users.length})</div>
                {users.map(c => renderNode(c, depth + 1))}
              </div>
            )}
            {resellers.length > 0 && (
              <div>
                <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, color: D.greenLight, background: D.greenDim, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, marginLeft: -2 }}>Resellers ({resellers.length})</div>
                {resellers.map(c => renderNode(c, depth + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${D.border}`, borderTopColor: D.green, animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: D.textMuted, fontSize: 13 }}>Loading network…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!isAdminOrReseller) return (
    <div style={{ padding: '10px 14px', background: D.redDim, border: `1px solid ${D.redBorder}`, borderRadius: 8 }}>
      <p style={{ color: D.red, fontSize: 13 }}>Access Denied. Only Admin and Reseller can view this page.</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: '10px 14px', background: D.redDim, border: `1px solid ${D.redBorder}`, borderRadius: 8 }}>
      <p style={{ color: D.red, fontSize: 13 }}>{error}</p>
    </div>
  );

  if (!treeData) return null;

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: D.text, margin: 0 }}>Network Tree</h1>
            <p style={{ fontSize: 13, color: D.textMuted, marginTop: 4 }}>Your complete network hierarchy</p>
          </div>
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: D.text }}>{treeData.totalCount}</p>
            <p style={{ fontSize: 10, color: D.textSubtle, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>Total Members</p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '10px 16px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', alignSelf: 'center' }}>Legend:</p>
          {[['Admin', D.blue, ShieldCheck], ['Reseller', D.greenLight, Users], ['User', D.amber, User]].map(([label, color, Icon]) => (
            <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {React.createElement(Icon as React.ComponentType<{size: number; style: React.CSSProperties}>, { size: 14, style: { color: String(color) } })}
              <span style={{ fontSize: 12, color: D.textMuted, fontWeight: 500 }}>{String(label)}</span>
            </div>
          ))}
        </div>

        {/* Tree */}
        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, padding: '16px', overflowX: 'auto' }}>
          <div style={{ minWidth: 280 }}>
            {renderNode(treeData.tree)}
          </div>
        </div>
      </div>

      {/* Details modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${D.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {(() => { const rs = roleStyle(selected.role); return <div style={{ width: 36, height: 36, borderRadius: 8, background: rs.dim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><rs.Icon size={18} style={{ color: rs.color }} /></div>; })()}
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: D.text }}>{selected.companyName}</p>
                  <p style={{ fontSize: 11, color: D.textMuted, textTransform: 'uppercase' }}>{selected.role} · Level {selected.level}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} style={{ color: D.textMuted }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Info grid */}
              <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: D.textSubtle, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Member Details</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[['Email', selected.email], ['Phone', selected.number]].map(([l, v]) => (
                    <div key={l} style={{ gridColumn: '1/-1' }}><p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{l}</p><p style={{ fontSize: 12, color: D.text, wordBreak: 'break-all' }}>{v}</p></div>
                  ))}
                  {[['Balance', `₹${selected.balance}`], ['Campaigns', String(selected.totalCampaigns)], ['Resellers', String(selected.directResellers)], ['Direct Users', String(selected.directUsers)]].map(([l, v]) => (
                    <div key={l}><p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{l}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: l === 'Balance' ? D.greenLight : D.text }}>{v}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase' }}>Status</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <StatusDot s={selected.status} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: selected.status === 'active' ? D.greenLight : D.red, textTransform: 'uppercase' }}>{selected.status}</span>
                  </div>
                </div>
              </div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[['Resellers', selected.directResellers, D.greenLight], ['Users', selected.directUsers, D.amber], ['Total Direct', selected.children.length, D.blue]].map(([l, v, c]) => (
                  <div key={String(l)} style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, padding: '12px 10px', textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 700, color: String(c) }}>{v}</p>
                    <p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>{l}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setSelected(null)} style={{ width: '100%', padding: '9px 0', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, cursor: 'pointer', color: D.textMuted, fontSize: 13, fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
