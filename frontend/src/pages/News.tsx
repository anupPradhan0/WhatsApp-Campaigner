import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { X, Plus, Edit2, Trash2, Eye } from "lucide-react";
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

// Defined outside component to prevent remount on every render
const NewsStatusBadge = ({ s }: { s: 'ACTIVE' | 'INACTIVE' }) => (
  <span
    className={cn(
      "inline-block text-[10px] font-bold px-[9px] py-[3px] rounded-full uppercase tracking-[0.05em] border",
      s === 'ACTIVE'
        ? "text-brand-light bg-brand-dim border-brand-border"
        : "text-danger bg-danger-dim border-danger-border"
    )}
  >
    {s}
  </span>
);

interface NewsFormProps { formData: { title: string; description: string; status: 'ACTIVE' | 'INACTIVE' }; setFormData: React.Dispatch<React.SetStateAction<{ title: string; description: string; status: 'ACTIVE' | 'INACTIVE' }>>; onSave: () => void; label: string; actionLoading: boolean; onCancel: () => void; }
const NewsForm = ({ formData, setFormData, onSave, label, actionLoading, onCancel }: NewsFormProps) => (
  <div className="flex flex-col gap-3">
    <div>
      <label className={formLabelCls}>Title *</label>
      <input type="text" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} placeholder="Enter news title" className={fieldCls} />
    </div>
    <div>
      <label className={formLabelCls}>Description *</label>
      <textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} rows={5} placeholder="Enter news description" className={cn(fieldCls, "resize-none")} />
    </div>
    <div>
      <label className={formLabelCls}>Status *</label>
      <select value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))} className={fieldCls}>
        <option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option>
      </select>
    </div>
    <div className="flex gap-2.5 mt-1">
      <button onClick={onSave} disabled={actionLoading} className="flex-1 py-[9px] bg-brand hover:bg-brand-hover text-white font-semibold text-[13px] rounded-lg cursor-pointer transition-colors disabled:opacity-60">{actionLoading ? 'Saving…' : label}</button>
      <button onClick={onCancel} className="flex-1 py-[9px] bg-surface2 border border-line rounded-lg cursor-pointer text-fg-muted text-[13px] font-semibold">Cancel</button>
    </div>
  </div>
);


interface NewsItem { id: string; title: string; description: string; status: 'ACTIVE' | 'INACTIVE'; createdBy: string; createdAt: string; updatedAt: string; }
interface NewsData { totalNews: number; news: NewsItem[]; }

const fmtDate = (s: string) => { try { return format(new Date(s), 'dd MMM yyyy, hh:mm a'); } catch { return s; } };

type ModalType = 'create' | 'edit' | 'delete' | 'view' | null;

export default function News() {
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' });
  const [actionLoading, setActionLoading] = useState(false);

  const userRole = getUserRole();
  const isAdmin = userRole === UserRole.ADMIN;

  const showAlert = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') toast.success(msg);
    else toast.error(msg);
  };

  const fetchData = useCallback(async () => {
    try { setLoading(true); const { data: r } = await api.get('/api/dashboard/news'); if (r.success) setNewsData(r.data); else showAlert('error', r.message || 'Failed'); } catch (e) { showAlert('error', getErrorMessage(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [perPage]);

  const total = newsData?.totalNews ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const idx = (page - 1) * perPage;
  const current = newsData?.news.slice(idx, idx + perPage) ?? [];

  const openCreate = () => { setFormData({ title: '', description: '', status: 'ACTIVE' }); setModal('create'); };
  const openEdit   = (n: NewsItem) => { setSelected(n); setFormData({ title: n.title, description: n.description, status: n.status }); setModal('edit'); };
  const openDelete = (n: NewsItem) => { setSelected(n); setModal('delete'); };
  const openView   = (n: NewsItem) => { setSelected(n); setModal('view'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleCreate = async () => {
    if (!formData.title || !formData.description) { showAlert('error', 'Please fill in all fields'); return; }
    setActionLoading(true);
    try { const { data: r } = await api.post('/api/news/create', formData); if (r.success) { showAlert('success', 'News created!'); closeModal(); fetchData(); } else showAlert('error', r.message || 'Failed'); } catch (e) { showAlert('error', getErrorMessage(e)); } finally { setActionLoading(false); }
  };

  const handleUpdate = async () => {
    if (!selected || !formData.title || !formData.description) { showAlert('error', 'Please fill in all fields'); return; }
    setActionLoading(true);
    try { const { data: r } = await api.put(`/api/news/update/${selected.id}`, formData); if (r.success) { showAlert('success', 'News updated!'); closeModal(); fetchData(); } else showAlert('error', r.message || 'Failed'); } catch (e) { showAlert('error', getErrorMessage(e)); } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setActionLoading(true);
    try { const { data: r } = await api.delete(`/api/news/delete/${selected.id}`); if (r.success) { showAlert('success', 'News deleted!'); closeModal(); fetchData(); } else showAlert('error', r.message || 'Failed'); } catch (e) { showAlert('error', getErrorMessage(e)); } finally { setActionLoading(false); }
  };

  if (loading) return <Spinner label="Loading news…" />;

  return (
    <>
      <div className="flex flex-col gap-4">
        <PageHeader title="News" subtitle={`${total} news items`}
          action={isAdmin ? <button onClick={openCreate} className="flex items-center gap-[7px] px-4 py-[9px] bg-brand hover:bg-brand-hover text-white font-semibold text-[13px] rounded-lg cursor-pointer transition-colors"><Plus size={15} /> Create News</button> : undefined}
        />

        {/* Toolbar */}
        <div className="flex items-center gap-2.5 bg-surface border border-line rounded-[10px] px-3.5 py-2.5 flex-wrap justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-fg-muted">Show</span>
            <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} className="bg-surface2 border border-line rounded-md text-fg text-xs px-2 py-1 outline-none">{[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}</select>
            <span className="text-[11px] text-fg-subtle">entries</span>
          </div>
          <span className="text-[11px] text-fg-subtle">{idx + 1}–{Math.min(idx + perPage, total)} of {total}</span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-surface border border-line rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-line">
                {['#', 'Date', 'Title', 'Description', 'Status', 'By', ...(isAdmin ? ['Actions'] : [])].map(h => (
                  <th key={h} className="px-3.5 py-3 text-left text-[10px] text-fg-subtle font-bold uppercase tracking-[0.08em] whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {current.length === 0
                  ? <tr><td colSpan={isAdmin ? 7 : 6} className="p-10 text-center text-fg-subtle text-[13px]">No news available.</td></tr>
                  : current.map((n, i) => (
                  <tr key={n.id} className="group border-b border-line/50">
                    <td className="px-3.5 py-[11px] text-xs text-fg-subtle group-hover:bg-white/[0.025]">{idx + i + 1}</td>
                    <td className="px-3.5 py-[11px] text-[11px] text-fg-subtle whitespace-nowrap group-hover:bg-white/[0.025]">
                      <div>{fmtDate(n.createdAt)}</div>
                      <div className="text-fg-subtle mt-0.5">Upd: {fmtDate(n.updatedAt)}</div>
                    </td>
                    <td className="px-3.5 py-[11px] text-[13px] text-fg font-medium max-w-[160px] group-hover:bg-white/[0.025]">{n.title}</td>
                    <td className="px-3.5 py-[11px] max-w-[280px] group-hover:bg-white/[0.025]">
                      <p className="text-xs text-fg-muted overflow-hidden [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]">{n.description}</p>
                      <button onClick={() => openView(n)} className="text-[11px] text-brand-light bg-transparent border-none cursor-pointer p-0 mt-0.5">Read more</button>
                    </td>
                    <td className="px-3.5 py-[11px] group-hover:bg-white/[0.025]"><NewsStatusBadge s={n.status} /></td>
                    <td className="px-3.5 py-[11px] text-xs text-fg-muted group-hover:bg-white/[0.025]">{n.createdBy}</td>
                    {isAdmin && (
                      <td className="px-3.5 py-[11px] group-hover:bg-white/[0.025]">
                        <div className="flex gap-1.5">
                          <button onClick={() => openView(n)} title="View" className="w-[30px] h-[30px] rounded-[7px] bg-brand-dim flex items-center justify-center cursor-pointer"><Eye size={13} className="text-brand-light" /></button>
                          <button onClick={() => openEdit(n)} title="Edit" className="w-[30px] h-[30px] rounded-[7px] bg-info-dim flex items-center justify-center cursor-pointer"><Edit2 size={13} className="text-info" /></button>
                          <button onClick={() => openDelete(n)} title="Delete" className="w-[30px] h-[30px] rounded-[7px] bg-danger-dim flex items-center justify-center cursor-pointer"><Trash2 size={13} className="text-danger" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden flex flex-col gap-2">
          {current.length === 0
            ? <div className="p-8 text-center bg-surface border border-line rounded-xl"><p className="text-fg-subtle text-[13px]">No news available.</p></div>
            : current.map((n, i) => (
            <div key={n.id} className="bg-surface border border-line rounded-[10px] px-3.5 py-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] text-fg-subtle">#{idx + i + 1}</span>
                <NewsStatusBadge s={n.status} />
              </div>
              <p className="text-[13px] font-semibold text-fg mb-1">{n.title}</p>
              <p className="text-xs text-fg-muted mb-2 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{n.description}</p>
              <div className="flex justify-between items-center pt-2 border-t border-line">
                <span className="text-[11px] text-fg-subtle">By {n.createdBy} · {format(new Date(n.createdAt), 'dd MMM')}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => openView(n)} className="flex items-center gap-[5px] px-2.5 py-[5px] bg-brand-dim border-none rounded-md cursor-pointer text-brand-light text-xs font-semibold"><Eye size={12} /> View</button>
                  {isAdmin && <>
                    <button onClick={() => openEdit(n)} className="w-7 h-7 rounded-md bg-info-dim flex items-center justify-center cursor-pointer"><Edit2 size={12} className="text-info" /></button>
                    <button onClick={() => openDelete(n)} className="w-7 h-7 rounded-md bg-danger-dim flex items-center justify-center cursor-pointer"><Trash2 size={12} className="text-danger" /></button>
                  </>}
                </div>
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
              <p className="text-[15px] font-bold text-fg">Create News</p>
              <button onClick={closeModal} className="bg-transparent border-none cursor-pointer p-1"><X size={18} className="text-fg-muted" /></button>
            </div>
            <div className="p-5"><NewsForm formData={formData} setFormData={setFormData} onSave={handleCreate} label="Create News" actionLoading={actionLoading} onCancel={closeModal} /></div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {modal === 'edit' && selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75" onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto bg-surface border border-line rounded-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <p className="text-[15px] font-bold text-fg">Edit News</p>
              <button onClick={closeModal} className="bg-transparent border-none cursor-pointer p-1"><X size={18} className="text-fg-muted" /></button>
            </div>
            <div className="p-5"><NewsForm formData={formData} setFormData={setFormData} onSave={handleUpdate} label="Save Changes" actionLoading={actionLoading} onCancel={closeModal} /></div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75" onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[380px] bg-surface border border-line rounded-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-danger-dim border border-danger-border flex items-center justify-center mx-auto mb-3.5"><Trash2 size={22} className="text-danger" /></div>
              <p className="text-[15px] font-bold text-fg mb-2">Delete News</p>
              <p className="text-[13px] text-fg-muted mb-5">Are you sure you want to delete "<strong className="text-fg">{selected.title}</strong>"? This action cannot be undone.</p>
              <div className="flex gap-2.5">
                <button onClick={handleDelete} disabled={actionLoading} className="flex-1 py-[9px] bg-danger text-white font-semibold text-[13px] rounded-lg cursor-pointer disabled:opacity-60">{actionLoading ? 'Deleting…' : 'Delete'}</button>
                <button onClick={closeModal} className="flex-1 py-[9px] bg-surface2 border border-line rounded-lg cursor-pointer text-fg-muted text-[13px] font-semibold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
      {modal === 'view' && selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75" onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto bg-surface border border-line rounded-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <p className="text-[15px] font-bold text-fg">{selected.title}</p>
              <button onClick={closeModal} className="bg-transparent border-none cursor-pointer p-1"><X size={18} className="text-fg-muted" /></button>
            </div>
            <div className="p-5 flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-2.5 bg-surface2 border border-line rounded-lg p-3">
                {[['Status', null], ['By', selected.createdBy], ['Created', fmtDate(selected.createdAt)], ['Updated', fmtDate(selected.updatedAt)]].map(([l, v]) => (
                  <div key={String(l)}>
                    <p className="text-[10px] text-fg-subtle font-semibold uppercase mb-1">{l}</p>
                    {l === 'Status' ? <NewsStatusBadge s={selected.status} /> : <p className="text-xs text-fg">{v}</p>}
                  </div>
                ))}
              </div>
              <div className="bg-surface2 border border-line rounded-lg p-3.5">
                <p className="text-[11px] text-fg-subtle font-semibold uppercase mb-2">Description</p>
                <p className="text-[13px] text-fg-muted leading-[1.7] whitespace-pre-wrap">{selected.description}</p>
              </div>
              <button onClick={closeModal} className="w-full py-[9px] bg-surface2 border border-line rounded-lg cursor-pointer text-fg-muted text-[13px] font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
