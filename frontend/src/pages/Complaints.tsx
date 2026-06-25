import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { X, Plus, Eye, Edit2, Trash2 } from "lucide-react";
import { getUserRole } from "../utils/Auth";
import { UserRole } from "../constants/Roles";
import { toast } from 'sonner';
import { api, getErrorMessage } from "../api/client";
import { cn } from "../lib/utils";
import { fieldCls } from "../theme/classes";
import { Paginator } from '../components/ui/Paginator';
import { Spinner } from '../components/ui/Spinner';
import { PageHeader } from '../components/ui/PageHeader';

const formLabelCls = "block text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.07em] mb-1.5";

const statusBadgeCls: Record<string, string> = {
  pending:       "text-warning bg-warning-dim border-warning/[0.27]",
  'in-progress': "text-info bg-info-dim border-info/[0.27]",
  resolved:      "text-brand-light bg-brand-dim border-brand-light/[0.27]",
  closed:        "text-danger bg-danger-dim border-danger/[0.27]",
};

const StatusBadge = ({ s }: { s: string }) => (
  <span className={cn(
    "text-[10px] font-bold px-[9px] py-[3px] rounded-[20px] uppercase tracking-[0.06em] border",
    statusBadgeCls[s] ?? "text-fg-muted bg-white/[0.04] border-fg-muted/[0.27]"
  )}>{s.replace('-', ' ')}</span>
);

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

  const userRole = getUserRole();
  const isAdmin = userRole === UserRole.ADMIN;

  const currentUserName = (() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.companyName || u.email || ''; } catch { return ''; } })();

  const showAlert = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') toast.success(msg);
    else toast.error(msg);
  };

  const fetchData = useCallback(async () => {
    try { setLoading(true); const { data: r } = await api.get('/api/dashboard/complaints'); if (r.success) setData(r.data); else showAlert('error', r.message || 'Failed'); } catch (e) { showAlert('error', getErrorMessage(e)); } finally { setLoading(false); }
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
    try { const { data: r } = await api.post('/api/complaints/create', createForm); if (r.success) { showAlert('success', 'Complaint created!'); closeModal(); fetchData(); } else showAlert('error', r.message || 'Failed'); } catch (e) { showAlert('error', getErrorMessage(e)); } finally { setActionLoading(false); }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setActionLoading(true);
    try { const { data: r } = await api.put(`/api/complaints/update/${selected.complaintId}`, editForm); if (r.success) { showAlert('success', 'Complaint updated!'); closeModal(); fetchData(); } else showAlert('error', r.message || 'Failed'); } catch (e) { showAlert('error', getErrorMessage(e)); } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setActionLoading(true);
    try { const { data: r } = await api.delete(`/api/complaints/delete/${selected.complaintId}`); if (r.success) { showAlert('success', 'Complaint deleted!'); closeModal(); fetchData(); } else showAlert('error', r.message || 'Failed'); } catch (e) { showAlert('error', getErrorMessage(e)); } finally { setActionLoading(false); }
  };

  if (loading) return <Spinner label="Loading complaints…" />;

  return (
    <>
      <div className="flex flex-col gap-4">
        <PageHeader title="Complaints" subtitle={`${total} total complaints`}
          action={<button onClick={openCreate} className="flex items-center gap-[7px] px-4 py-[9px] bg-brand hover:bg-brand-hover text-white font-semibold text-[13px] rounded-lg cursor-pointer transition-colors"><Plus size={15} /> Add Complaint</button>}
        />

        {/* Status cards */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {([['Pending', data.statusBreakdown.pending, 'warning'], ['In Progress', data.statusBreakdown.inProgress, 'info'], ['Resolved', data.statusBreakdown.resolved, 'brand-light'], ['Closed', data.statusBreakdown.closed, 'danger']] as const).map(([l, v, c]) => (
              <div key={l} className={cn(
                "bg-surface border border-line rounded-[10px] px-3.5 py-3 border-l-[3px]",
                c === 'warning' && "border-l-warning",
                c === 'info' && "border-l-info",
                c === 'brand-light' && "border-l-brand-light",
                c === 'danger' && "border-l-danger"
              )}>
                <p className="text-[10px] text-fg-subtle font-semibold uppercase tracking-[0.07em]">{l}</p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  c === 'warning' && "text-warning",
                  c === 'info' && "text-info",
                  c === 'brand-light' && "text-brand-light",
                  c === 'danger' && "text-danger"
                )}>{v}</p>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-2.5 bg-surface border border-line rounded-[10px] px-3.5 py-2.5 flex-wrap justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-fg-muted">Show</span>
            <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} className="bg-surface2 border border-line rounded-md text-fg text-xs px-2 py-1 outline-none">{[10,25,50].map(n => <option key={n} value={n}>{n}</option>)}</select>
          </div>
          <span className="text-[11px] text-fg-subtle">{idx + 1}–{Math.min(idx + perPage, total)} of {total}</span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-surface border border-line rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-line">
                {['#', 'Date', 'By', 'Subject', 'Description', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-3.5 py-3 text-left text-[10px] text-fg-subtle font-bold uppercase tracking-[0.08em] whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {current.length === 0
                  ? <tr><td colSpan={7} className="p-10 text-center text-fg-subtle text-[13px]">No complaints found.</td></tr>
                  : current.map((c, i) => (
                  <tr key={c.complaintId} className="group border-b border-line/50">
                    <td className="px-3.5 py-[11px] text-xs text-fg-subtle group-hover:bg-white/[0.025]">{idx + i + 1}</td>
                    <td className="px-3.5 py-[11px] text-[11px] text-fg-subtle whitespace-nowrap group-hover:bg-white/[0.025]">{fmtDate(c.createdAt)}</td>
                    <td className="px-3.5 py-[11px] text-xs text-fg-muted group-hover:bg-white/[0.025]">{c.createdBy}</td>
                    <td className="px-3.5 py-[11px] text-[13px] text-fg font-medium max-w-[180px] group-hover:bg-white/[0.025]">{c.subject}</td>
                    <td className="px-3.5 py-[11px] max-w-[240px] group-hover:bg-white/[0.025]">
                      <p className="text-xs text-fg-muted overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] m-0">{c.description}</p>
                      <button onClick={() => openView(c)} className="text-[11px] text-brand-light bg-transparent border-none cursor-pointer p-0 mt-0.5">more</button>
                    </td>
                    <td className="px-3.5 py-[11px] group-hover:bg-white/[0.025]"><StatusBadge s={c.status} /></td>
                    <td className="px-3.5 py-[11px] group-hover:bg-white/[0.025]">
                      <div className="flex gap-1.5">
                        <button onClick={() => openView(c)} title="View" className="w-[30px] h-[30px] rounded-[7px] bg-brand-dim flex items-center justify-center cursor-pointer"><Eye size={13} className="text-brand-light" /></button>
                        {isAdmin && <button onClick={() => openEdit(c)} title="Edit" className="w-[30px] h-[30px] rounded-[7px] bg-info-dim flex items-center justify-center cursor-pointer"><Edit2 size={13} className="text-info" /></button>}
                        {canDelete(c) && <button onClick={() => openDelete(c)} title="Delete" className="w-[30px] h-[30px] rounded-[7px] bg-danger-dim flex items-center justify-center cursor-pointer"><Trash2 size={13} className="text-danger" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden flex flex-col gap-2">
          {current.length === 0
            ? <div className="p-8 text-center bg-surface border border-line rounded-xl"><p className="text-fg-subtle text-[13px]">No complaints found.</p></div>
            : current.map((c, i) => (
            <div key={c.complaintId} className="bg-surface border border-line rounded-[10px] px-3.5 py-3">
              <div className="flex justify-between mb-1.5">
                <span className="text-[11px] text-fg-subtle">#{idx + i + 1}</span>
                <StatusBadge s={c.status} />
              </div>
              <p className="text-[13px] font-semibold text-fg mb-0.5">{c.subject}</p>
              <p className="text-[11px] text-fg-subtle mb-1.5">By {c.createdBy} · {format(new Date(c.createdAt), 'dd MMM')}</p>
              <p className="text-xs text-fg-muted mb-2 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{c.description}</p>
              <div className="flex justify-end gap-1.5 pt-2 border-t border-line">
                <button onClick={() => openView(c)} className="flex items-center gap-[5px] px-2.5 py-[5px] bg-brand-dim border-none rounded-md cursor-pointer text-brand-light text-xs font-semibold"><Eye size={12} /> View</button>
                {isAdmin && <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-md bg-info-dim flex items-center justify-center cursor-pointer"><Edit2 size={12} className="text-info" /></button>}
                {canDelete(c) && <button onClick={() => openDelete(c)} className="w-7 h-7 rounded-md bg-danger-dim flex items-center justify-center cursor-pointer"><Trash2 size={12} className="text-danger" /></button>}
              </div>
            </div>
          ))}
        </div>

        <Paginator page={page} total={totalPages} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      </div>

      {/* Create modal */}
      {modal === 'create' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75" onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto bg-surface border border-line rounded-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <p className="text-[15px] font-bold text-fg">Create Complaint</p>
              <button onClick={closeModal} className="bg-transparent border-none cursor-pointer p-1"><X size={18} className="text-fg-muted" /></button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div><label className={formLabelCls}>Subject * <span className="text-[10px] font-normal text-fg-subtle">(1-30 words)</span></label>
                <input type="text" value={createForm.subject} onChange={e => setCreateForm(f => ({...f, subject: e.target.value}))} placeholder="Enter complaint subject" className={fieldCls} />
              </div>
              <div><label className={formLabelCls}>Description *</label>
                <textarea value={createForm.description} onChange={e => setCreateForm(f => ({...f, description: e.target.value}))} rows={5} placeholder="Describe your complaint in detail" className={cn(fieldCls, "resize-none")} />
              </div>
              <div className="flex gap-2.5 mt-1">
                <button onClick={handleCreate} disabled={actionLoading} className="flex-1 py-[9px] bg-brand text-white font-semibold text-[13px] rounded-lg cursor-pointer disabled:opacity-60">{actionLoading ? 'Creating…' : 'Submit'}</button>
                <button onClick={closeModal} className="flex-1 py-[9px] bg-surface2 border border-line rounded-lg cursor-pointer text-fg-muted text-[13px] font-semibold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
      {modal === 'view' && selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75" onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[540px] max-h-[90vh] overflow-y-auto bg-surface border border-line rounded-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <p className="text-[15px] font-bold text-fg">Complaint Details</p>
              <button onClick={closeModal} className="bg-transparent border-none cursor-pointer p-1"><X size={18} className="text-fg-muted" /></button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2.5 bg-surface2 border border-line rounded-lg p-3">
                {[['By', selected.createdBy], ['Created', fmtDate(selected.createdAt)], ['Updated', fmtDate(selected.updatedAt)]].map(([l, v]) => (
                  <div key={String(l)}><p className="text-[10px] text-fg-subtle font-semibold uppercase mb-[3px]">{l}</p><p className="text-xs text-fg">{v}</p></div>
                ))}
                <div><p className="text-[10px] text-fg-subtle font-semibold uppercase mb-[3px]">Status</p><StatusBadge s={selected.status} /></div>
              </div>
              <div className="bg-surface2 border border-line rounded-lg p-3">
                <p className="text-[10px] text-fg-subtle font-semibold uppercase mb-1.5">Subject</p>
                <p className="text-sm font-semibold text-fg">{selected.subject}</p>
              </div>
              <div className="bg-surface2 border border-line rounded-lg p-3">
                <p className="text-[10px] text-fg-subtle font-semibold uppercase mb-1.5">Description</p>
                <p className="text-[13px] text-fg-muted leading-[1.7] whitespace-pre-wrap">{selected.description}</p>
              </div>
              {selected.adminResponse && (
                <div className="bg-brand-dim border border-brand-border rounded-lg p-3">
                  <p className="text-[10px] text-brand-light font-semibold uppercase mb-1.5">Admin Response</p>
                  <p className="text-[13px] text-fg-muted leading-[1.7] whitespace-pre-wrap">{selected.adminResponse}</p>
                </div>
              )}
              {!selected.adminResponse && selected.status === 'pending' && (
                <div className="bg-warning-dim border border-warning/[0.27] rounded-lg p-3 text-center">
                  <p className="text-[13px] text-warning">⏳ Waiting for admin response…</p>
                </div>
              )}
              {(selected.resolvedBy || selected.resolvedAt) && (
                <div className="bg-info-dim border border-info/[0.27] rounded-lg p-3">
                  <p className="text-[10px] text-info font-semibold uppercase mb-2">Resolution</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.resolvedBy && <div><p className="text-[10px] text-fg-subtle font-semibold uppercase mb-[3px]">Resolved By</p><p className="text-xs text-fg">{selected.resolvedBy}</p></div>}
                    {selected.resolvedAt && <div><p className="text-[10px] text-fg-subtle font-semibold uppercase mb-[3px]">Resolved At</p><p className="text-xs text-fg">{fmtDate(selected.resolvedAt)}</p></div>}
                  </div>
                </div>
              )}
              <button onClick={closeModal} className="w-full py-[9px] bg-surface2 border border-line rounded-lg cursor-pointer text-fg-muted text-[13px] font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal (admin) */}
      {modal === 'edit' && selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75" onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[440px] max-h-[90vh] overflow-y-auto bg-surface border border-line rounded-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <p className="text-[15px] font-bold text-fg">Update Complaint</p>
              <button onClick={closeModal} className="bg-transparent border-none cursor-pointer p-1"><X size={18} className="text-fg-muted" /></button>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div className="bg-surface2 border border-line rounded-lg p-2.5">
                <p className="text-xs text-fg-muted"><span className="text-fg-subtle font-semibold">By: </span>{selected.createdBy}</p>
                <p className="text-xs text-fg-muted mt-1"><span className="text-fg-subtle font-semibold">Subject: </span>{selected.subject}</p>
              </div>
              <div><label className={formLabelCls}>Status *</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({...f, status: e.target.value as Complaint['status']}))} className={fieldCls}>
                  <option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
                </select>
              </div>
              <div><label className={formLabelCls}>Admin Response</label>
                <textarea value={editForm.adminResponse} onChange={e => setEditForm(f => ({...f, adminResponse: e.target.value}))} rows={4} placeholder="Enter your response…" className={cn(fieldCls, "resize-none")} />
              </div>
              <div className="flex gap-2.5 mt-1">
                <button onClick={handleUpdate} disabled={actionLoading} className="flex-1 py-[9px] bg-info text-white font-semibold text-[13px] rounded-lg cursor-pointer disabled:opacity-60">{actionLoading ? 'Updating…' : 'Update'}</button>
                <button onClick={closeModal} className="flex-1 py-[9px] bg-surface2 border border-line rounded-lg cursor-pointer text-fg-muted text-[13px] font-semibold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75" onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[380px] bg-surface border border-line rounded-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-danger-dim border border-danger-border flex items-center justify-center mx-auto mb-3.5"><Trash2 size={22} className="text-danger" /></div>
              <p className="text-[15px] font-bold text-fg mb-2">Delete Complaint</p>
              <p className="text-[13px] text-fg-muted mb-5">Are you sure you want to delete this complaint? This action cannot be undone.</p>
              <div className="flex gap-2.5">
                <button onClick={handleDelete} disabled={actionLoading} className="flex-1 py-[9px] bg-danger text-white font-semibold text-[13px] rounded-lg cursor-pointer disabled:opacity-60">{actionLoading ? 'Deleting…' : 'Delete'}</button>
                <button onClick={closeModal} className="flex-1 py-[9px] bg-surface2 border border-line rounded-lg cursor-pointer text-fg-muted text-[13px] font-semibold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
