import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { X, Plus, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { getUserRole } from "../utils/Auth";
import { UserRole } from "../constants/Roles";
import { api } from "../api/client";

const D = {
  surface: '#111113', surface2: '#18181b', border: '#27272a', border2: '#3f3f46',
  text: '#f4f4f5', textMuted: '#71717a', textSubtle: '#52525b',
  green: '#16a34a', greenLight: '#4ade80', greenDim: 'rgba(22,163,74,0.12)', greenBorder: 'rgba(22,163,74,0.3)',
  blue: '#3b82f6', blueDim: 'rgba(59,130,246,0.12)',
  amber: '#fbbf24', amberDim: 'rgba(251,191,36,0.1)',
  red: '#f87171', redDim: 'rgba(248,113,113,0.1)', redBorder: 'rgba(248,113,113,0.3)',
};

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, fontSize: 13, color: D.text, outline: 'none', boxSizing: 'border-box' };
const taStyle: React.CSSProperties = { ...inp, resize: 'none' };
const selStyle: React.CSSProperties = { ...inp };

const FieldFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = D.green; };
const FieldBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = D.border; };

const statusMeta = (s: string): { color: string; dim: string } => {
  const m: Record<string, { color: string; dim: string }> = {
    pending:     { color: D.amber,      dim: D.amberDim },
    'in-progress': { color: D.blue,    dim: D.blueDim  },
    resolved:    { color: D.greenLight, dim: D.greenDim },
    closed:      { color: D.red,        dim: D.redDim   },
  };
  return m[s] ?? { color: D.textMuted, dim: 'rgba(255,255,255,0.04)' };
};

const StatusBadge = ({ s }: { s: string }) => {
  const { color, dim } = statusMeta(s);
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', color, background: dim, border: `1px solid ${color}44` }}>{s.replace('-', ' ')}</span>;
};

const Paginator = ({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) => {
  if (total <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 16px' }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{ padding: '5px 7px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex' }}><ChevronLeft size={15} style={{ color: D.textMuted }} /></button>
      {Array.from({ length: Math.min(5, total) }, (_, i) => {
        const p = total <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= total - 2 ? total - 4 + i : page - 2 + i;
        return <button key={p} onClick={() => onChange(p)} style={{ width: 32, height: 32, borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${page === p ? D.green : D.border}`, background: page === p ? D.green : D.surface2, color: page === p ? '#fff' : D.textMuted, cursor: 'pointer' }}>{p}</button>;
      })}
      <button onClick={() => onChange(page + 1)} disabled={page === total} style={{ padding: '5px 7px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 6, cursor: page === total ? 'not-allowed' : 'pointer', opacity: page === total ? 0.4 : 1, display: 'flex' }}><ChevronRight size={15} style={{ color: D.textMuted }} /></button>
    </div>
  );
};

interface Complaint { complaintId: string; subject: string; description: string; status: 'pending' | 'in-progress' | 'resolved' | 'closed'; createdBy: string; createdAt: string; adminResponse: string | null; resolvedBy: string | null; resolvedAt: string | null; updatedAt: string; }
interface ComplaintsData { totalComplaints: number; statusBreakdown: { pending: number; inProgress: number; resolved: number; closed: number; }; complaints: Complaint[]; }

const fmtDate = (s: string) => { try { return format(new Date(s), 'dd MMM yyyy, hh:mm a'); } catch { return s; } };

type ModalType = 'create' | 'view' | 'edit' | 'delete' | null;

export default function Complaints() {
  const [data, setData] = useState<ComplaintsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [createForm, setCreateForm] = useState({ subject: '', description: '' });
  const [editForm, setEditForm] = useState({ status: 'pending' as Complaint['status'], adminResponse: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const userRole = getUserRole();
  const isAdmin = userRole === UserRole.ADMIN;

  const currentUserName = (() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.companyName || u.email || ''; } catch { return ''; } })();

  const showAlert = (type: 'success' | 'error', msg: string) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); };

  const fetchData = useCallback(async () => {
    try { setLoading(true); const { data: r } = await api.get('/api/dashboard/complaints'); if (r.success) setData(r.data); else showAlert('error', r.message || 'Failed'); } catch { showAlert('error', 'Network error.'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [perPage]);

  const total = data?.totalComplaints ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const idx = (page - 1) * perPage;
  const current = data?.complaints.slice(idx, idx + perPage) ?? [];

  const openCreate = () => { setCreateForm({ subject: '', description: '' }); setModal('create'); };
  const openView   = (c: Complaint) => { setSelected(c); setModal('view'); };
  const openEdit   = (c: Complaint) => { setSelected(c); setEditForm({ status: c.status, adminResponse: c.adminResponse || '' }); setModal('edit'); };
  const openDelete = (c: Complaint) => { setSelected(c); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const canDelete = (c: Complaint) => isAdmin || c.createdBy === currentUserName;

  const handleCreate = async () => {
    if (!createForm.subject || !createForm.description) { showAlert('error', 'Please fill in all fields'); return; }
    const words = createForm.subject.trim().split(/\s+/).length;
    if (words < 1 || words > 30) { showAlert('error', 'Subject must be 1-30 words'); return; }
    setActionLoading(true);
    try { const { data: r } = await api.post('/api/complaints/create', createForm); if (r.success) { showAlert('success', 'Complaint created!'); closeModal(); fetchData(); } else showAlert('error', r.message || 'Failed'); } catch { showAlert('error', 'Network error.'); } finally { setActionLoading(false); }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setActionLoading(true);
    try { const { data: r } = await api.put(`/api/complaints/update/${selected.complaintId}`, editForm); if (r.success) { showAlert('success', 'Complaint updated!'); closeModal(); fetchData(); } else showAlert('error', r.message || 'Failed'); } catch { showAlert('error', 'Network error.'); } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setActionLoading(true);
    try { const { data: r } = await api.delete(`/api/complaints/delete/${selected.complaintId}`); if (r.success) { showAlert('success', 'Complaint deleted!'); closeModal(); fetchData(); } else showAlert('error', r.message || 'Failed'); } catch { showAlert('error', 'Network error.'); } finally { setActionLoading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${D.border}`, borderTopColor: D.green, animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: D.textMuted, fontSize: 13 }}>Loading complaints…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .row-h:hover td{background:rgba(255,255,255,0.025)!important} select option{background:#18181b;color:#f4f4f5}`}</style>

      {alert && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: alert.type === 'success' ? D.greenDim : D.redDim, border: `1px solid ${alert.type === 'success' ? D.greenBorder : D.redBorder}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 340 }}>
          <AlertCircle size={14} style={{ color: alert.type === 'success' ? D.greenLight : D.red }} />
          <p style={{ fontSize: 12, color: D.text, flex: 1 }}>{alert.msg}</p>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={13} style={{ color: D.textMuted }} /></button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: D.text, margin: 0 }}>Complaints</h1>
            <p style={{ fontSize: 13, color: D.textMuted, marginTop: 4 }}>{total} total complaints</p>
          </div>
          <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: D.green, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}><Plus size={15} /> Add Complaint</button>
        </div>

        {/* Status cards */}
        {data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[['Pending', data.statusBreakdown.pending, D.amber, D.amberDim], ['In Progress', data.statusBreakdown.inProgress, D.blue, D.blueDim], ['Resolved', data.statusBreakdown.resolved, D.greenLight, D.greenDim], ['Closed', data.statusBreakdown.closed, D.red, D.redDim]].map(([l, v, c, dim]) => (
              <div key={String(l)} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px', borderLeftWidth: 3, borderLeftColor: String(c), borderLeftStyle: 'solid' }}>
                <p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: String(c), marginTop: 4 }}>{v}</p>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '10px 14px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: D.textMuted }}>Show</span>
            <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 6, color: D.text, fontSize: 12, padding: '4px 8px', outline: 'none' }}>{[10,25,50].map(n => <option key={n} value={n}>{n}</option>)}</select>
          </div>
          <span style={{ fontSize: 11, color: D.textSubtle }}>{idx + 1}–{Math.min(idx + perPage, total)} of {total}</span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block" style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: `1px solid ${D.border}` }}>
                {['#', 'Date', 'By', 'Subject', 'Description', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, color: D.textSubtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {current.length === 0
                  ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: D.textSubtle, fontSize: 13 }}>No complaints found.</td></tr>
                  : current.map((c, i) => (
                  <tr key={c.complaintId} className="row-h" style={{ borderBottom: `1px solid rgba(39,39,42,0.5)` }}>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: D.textSubtle }}>{idx + i + 1}</td>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: D.textSubtle, whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: D.textMuted }}>{c.createdBy}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: D.text, fontWeight: 500, maxWidth: 180 }}>{c.subject}</td>
                    <td style={{ padding: '11px 14px', maxWidth: 240 }}>
                      <p style={{ fontSize: 12, color: D.textMuted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', margin: 0 }}>{c.description}</p>
                      <button onClick={() => openView(c)} style={{ fontSize: 11, color: D.greenLight, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>more</button>
                    </td>
                    <td style={{ padding: '11px 14px' }}><StatusBadge s={c.status} /></td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openView(c)} title="View" style={{ width: 30, height: 30, borderRadius: 7, background: D.greenDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Eye size={13} style={{ color: D.greenLight }} /></button>
                        {isAdmin && <button onClick={() => openEdit(c)} title="Edit" style={{ width: 30, height: 30, borderRadius: 7, background: D.blueDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit2 size={13} style={{ color: D.blue }} /></button>}
                        {canDelete(c) && <button onClick={() => openDelete(c)} title="Delete" style={{ width: 30, height: 30, borderRadius: 7, background: D.redDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={13} style={{ color: D.red }} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {current.length === 0
            ? <div style={{ padding: 32, textAlign: 'center', background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12 }}><p style={{ color: D.textSubtle, fontSize: 13 }}>No complaints found.</p></div>
            : current.map((c, i) => (
            <div key={c.complaintId} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: D.textSubtle }}>#{idx + i + 1}</span>
                <StatusBadge s={c.status} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: D.text, marginBottom: 2 }}>{c.subject}</p>
              <p style={{ fontSize: 11, color: D.textSubtle, marginBottom: 6 }}>By {c.createdBy} · {format(new Date(c.createdAt), 'dd MMM')}</p>
              <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.description}</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, paddingTop: 8, borderTop: `1px solid ${D.border}` }}>
                <button onClick={() => openView(c)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: D.greenDim, border: 'none', borderRadius: 6, cursor: 'pointer', color: D.greenLight, fontSize: 12, fontWeight: 600 }}><Eye size={12} /> View</button>
                {isAdmin && <button onClick={() => openEdit(c)} style={{ width: 28, height: 28, borderRadius: 6, background: D.blueDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit2 size={12} style={{ color: D.blue }} /></button>}
                {canDelete(c) && <button onClick={() => openDelete(c)} style={{ width: 28, height: 28, borderRadius: 6, background: D.redDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={12} style={{ color: D.red }} /></button>}
              </div>
            </div>
          ))}
        </div>

        <Paginator page={page} total={totalPages} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      </div>

      {/* Create modal */}
      {modal === 'create' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${D.border}` }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: D.text }}>Create Complaint</p>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} style={{ color: D.textMuted }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Subject * <span style={{ fontSize: 10, fontWeight: 400, color: D.textSubtle }}>(1-30 words)</span></label>
                <input type="text" value={createForm.subject} onChange={e => setCreateForm(f => ({...f, subject: e.target.value}))} placeholder="Enter complaint subject" style={inp} onFocus={FieldFocus} onBlur={FieldBlur} />
              </div>
              <div><label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Description *</label>
                <textarea value={createForm.description} onChange={e => setCreateForm(f => ({...f, description: e.target.value}))} rows={5} placeholder="Describe your complaint in detail" style={taStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={handleCreate} disabled={actionLoading} style={{ flex: 1, padding: '9px 0', background: D.green, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer', opacity: actionLoading ? 0.6 : 1 }}>{actionLoading ? 'Creating…' : 'Submit'}</button>
                <button onClick={closeModal} style={{ flex: 1, padding: '9px 0', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, cursor: 'pointer', color: D.textMuted, fontSize: 13, fontWeight: 600 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
      {modal === 'view' && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${D.border}` }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: D.text }}>Complaint Details</p>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} style={{ color: D.textMuted }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, padding: 12 }}>
                {[['By', selected.createdBy], ['Created', fmtDate(selected.createdAt)], ['Updated', fmtDate(selected.updatedAt)]].map(([l, v]) => (
                  <div key={String(l)}><p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{l}</p><p style={{ fontSize: 12, color: D.text }}>{v}</p></div>
                ))}
                <div><p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Status</p><StatusBadge s={selected.status} /></div>
              </div>
              <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Subject</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: D.text }}>{selected.subject}</p>
              </div>
              <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Description</p>
                <p style={{ fontSize: 13, color: D.textMuted, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.description}</p>
              </div>
              {selected.adminResponse && (
                <div style={{ background: D.greenDim, border: `1px solid ${D.greenBorder}`, borderRadius: 8, padding: 12 }}>
                  <p style={{ fontSize: 10, color: D.greenLight, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Admin Response</p>
                  <p style={{ fontSize: 13, color: D.textMuted, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.adminResponse}</p>
                </div>
              )}
              {!selected.adminResponse && selected.status === 'pending' && (
                <div style={{ background: D.amberDim, border: `1px solid ${D.amber}44`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: D.amber }}>⏳ Waiting for admin response…</p>
                </div>
              )}
              {(selected.resolvedBy || selected.resolvedAt) && (
                <div style={{ background: D.blueDim, border: `1px solid ${D.blue}44`, borderRadius: 8, padding: 12 }}>
                  <p style={{ fontSize: 10, color: D.blue, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Resolution</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {selected.resolvedBy && <div><p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Resolved By</p><p style={{ fontSize: 12, color: D.text }}>{selected.resolvedBy}</p></div>}
                    {selected.resolvedAt && <div><p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Resolved At</p><p style={{ fontSize: 12, color: D.text }}>{fmtDate(selected.resolvedAt)}</p></div>}
                  </div>
                </div>
              )}
              <button onClick={closeModal} style={{ width: '100%', padding: '9px 0', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, cursor: 'pointer', color: D.textMuted, fontSize: 13, fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal (admin) */}
      {modal === 'edit' && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${D.border}` }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: D.text }}>Update Complaint</p>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} style={{ color: D.textMuted }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, padding: 10 }}>
                <p style={{ fontSize: 12, color: D.textMuted }}><span style={{ color: D.textSubtle, fontWeight: 600 }}>By: </span>{selected.createdBy}</p>
                <p style={{ fontSize: 12, color: D.textMuted, marginTop: 4 }}><span style={{ color: D.textSubtle, fontWeight: 600 }}>Subject: </span>{selected.subject}</p>
              </div>
              <div><label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Status *</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({...f, status: e.target.value as Complaint['status']}))} style={selStyle} onFocus={FieldFocus} onBlur={FieldBlur}>
                  <option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Admin Response</label>
                <textarea value={editForm.adminResponse} onChange={e => setEditForm(f => ({...f, adminResponse: e.target.value}))} rows={4} placeholder="Enter your response…" style={taStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={handleUpdate} disabled={actionLoading} style={{ flex: 1, padding: '9px 0', background: D.blue, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer', opacity: actionLoading ? 0.6 : 1 }}>{actionLoading ? 'Updating…' : 'Update'}</button>
                <button onClick={closeModal} style={{ flex: 1, padding: '9px 0', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, cursor: 'pointer', color: D.textMuted, fontSize: 13, fontWeight: 600 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {modal === 'delete' && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxWidth: 380 }}>
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: D.redDim, border: `1px solid ${D.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Trash2 size={22} style={{ color: D.red }} /></div>
              <p style={{ fontSize: 15, fontWeight: 700, color: D.text, marginBottom: 8 }}>Delete Complaint</p>
              <p style={{ fontSize: 13, color: D.textMuted, marginBottom: 20 }}>Are you sure you want to delete this complaint? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleDelete} disabled={actionLoading} style={{ flex: 1, padding: '9px 0', background: D.red, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer', opacity: actionLoading ? 0.6 : 1 }}>{actionLoading ? 'Deleting…' : 'Delete'}</button>
                <button onClick={closeModal} style={{ flex: 1, padding: '9px 0', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, cursor: 'pointer', color: D.textMuted, fontSize: 13, fontWeight: 600 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
