import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { X, Plus, Edit2, Trash2, Eye } from "lucide-react";
import { getUserRole } from "../utils/Auth";
import { UserRole } from "../constants/Roles";
import { api } from "../api/client";
import { D, inp, onFocusGreen, onBlurBorder } from '../theme/tokens';
import { Paginator } from '../components/ui/Paginator';
import { Spinner } from '../components/ui/Spinner';
import { PageHeader } from '../components/ui/PageHeader';
import { Toast } from '../components/ui/Alert';

const taStyle: React.CSSProperties = { ...inp, resize: 'none' as const };
const selStyle: React.CSSProperties = { ...inp };

const FieldFocus = onFocusGreen;
const FieldBlur  = onBlurBorder;

// Defined outside component to prevent remount on every render
const NewsStatusBadge = ({ s }: { s: 'ACTIVE' | 'INACTIVE' }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em', color: s === 'ACTIVE' ? D.greenLight : D.red, background: s === 'ACTIVE' ? D.greenDim : D.redDim, border: `1px solid ${s === 'ACTIVE' ? D.greenBorder : D.redBorder}` }}>{s}</span>
);

interface NewsFormProps { formData: { title: string; description: string; status: 'ACTIVE' | 'INACTIVE' }; setFormData: React.Dispatch<React.SetStateAction<{ title: string; description: string; status: 'ACTIVE' | 'INACTIVE' }>>; onSave: () => void; label: string; actionLoading: boolean; onCancel: () => void; }
const NewsForm = ({ formData, setFormData, onSave, label, actionLoading, onCancel }: NewsFormProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div><label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Title *</label>
      <input type="text" value={formData.title} onChange={e => setFormData(f => ({...f, title: e.target.value}))} placeholder="Enter news title" style={inp} onFocus={FieldFocus} onBlur={FieldBlur} />
    </div>
    <div><label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Description *</label>
      <textarea value={formData.description} onChange={e => setFormData(f => ({...f, description: e.target.value}))} rows={5} placeholder="Enter news description" style={taStyle} onFocus={FieldFocus} onBlur={FieldBlur} />
    </div>
    <div><label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Status *</label>
      <select value={formData.status} onChange={e => setFormData(f => ({...f, status: e.target.value as 'ACTIVE' | 'INACTIVE'}))} style={selStyle} onFocus={FieldFocus} onBlur={FieldBlur}>
        <option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option>
      </select>
    </div>
    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
      <button onClick={onSave} disabled={actionLoading} style={{ flex: 1, padding: '9px 0', background: D.green, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer', opacity: actionLoading ? 0.6 : 1 }}>{actionLoading ? 'Saving…' : label}</button>
      <button onClick={onCancel} style={{ flex: 1, padding: '9px 0', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, cursor: 'pointer', color: D.textMuted, fontSize: 13, fontWeight: 600 }}>Cancel</button>
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
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const userRole = getUserRole();
  const isAdmin = userRole === UserRole.ADMIN;

  const showAlert = (type: 'success' | 'error', msg: string) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); };

  const fetchData = useCallback(async () => {
    try { setLoading(true); const { data: r } = await api.get('/api/dashboard/news'); if (r.success) setNewsData(r.data); else showAlert('error', r.message || 'Failed'); } catch { showAlert('error', 'Network error.'); } finally { setLoading(false); }
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
    try { const { data: r } = await api.post('/api/news/create', formData); if (r.success) { showAlert('success', 'News created!'); closeModal(); fetchData(); } else showAlert('error', r.message || 'Failed'); } catch { showAlert('error', 'Network error.'); } finally { setActionLoading(false); }
  };

  const handleUpdate = async () => {
    if (!selected || !formData.title || !formData.description) { showAlert('error', 'Please fill in all fields'); return; }
    setActionLoading(true);
    try { const { data: r } = await api.put(`/api/news/update/${selected.id}`, formData); if (r.success) { showAlert('success', 'News updated!'); closeModal(); fetchData(); } else showAlert('error', r.message || 'Failed'); } catch { showAlert('error', 'Network error.'); } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setActionLoading(true);
    try { const { data: r } = await api.delete(`/api/news/delete/${selected.id}`); if (r.success) { showAlert('success', 'News deleted!'); closeModal(); fetchData(); } else showAlert('error', r.message || 'Failed'); } catch { showAlert('error', 'Network error.'); } finally { setActionLoading(false); }
  };

  if (loading) return <Spinner label="Loading news…" />;

  return (
    <>
      <style>{`.row-h:hover td{background:rgba(255,255,255,0.025)!important} select option{background:#18181b;color:#f4f4f5}`}</style>

      {alert && <Toast msg={alert.msg} type={alert.type} onClose={() => setAlert(null)} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PageHeader title="News" subtitle={`${total} news items`}
          action={isAdmin ? <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: D.green, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}><Plus size={15} /> Create News</button> : undefined}
        />

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '10px 14px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: D.textMuted }}>Show</span>
            <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 6, color: D.text, fontSize: 12, padding: '4px 8px', outline: 'none' }}>{[10,25,50].map(n => <option key={n} value={n}>{n}</option>)}</select>
            <span style={{ fontSize: 11, color: D.textSubtle }}>entries</span>
          </div>
          <span style={{ fontSize: 11, color: D.textSubtle }}>{idx + 1}–{Math.min(idx + perPage, total)} of {total}</span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block" style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: `1px solid ${D.border}` }}>
                {['#', 'Date', 'Title', 'Description', 'Status', 'By', ...(isAdmin ? ['Actions'] : [])].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, color: D.textSubtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {current.length === 0
                  ? <tr><td colSpan={isAdmin ? 7 : 6} style={{ padding: '40px', textAlign: 'center', color: D.textSubtle, fontSize: 13 }}>No news available.</td></tr>
                  : current.map((n, i) => (
                  <tr key={n.id} className="row-h" style={{ borderBottom: `1px solid rgba(39,39,42,0.5)` }}>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: D.textSubtle }}>{idx + i + 1}</td>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: D.textSubtle, whiteSpace: 'nowrap' }}>
                      <div>{fmtDate(n.createdAt)}</div>
                      <div style={{ color: D.textSubtle, marginTop: 2 }}>Upd: {fmtDate(n.updatedAt)}</div>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: D.text, fontWeight: 500, maxWidth: 160 }}>{n.title}</td>
                    <td style={{ padding: '11px 14px', maxWidth: 280 }}>
                      <p style={{ fontSize: 12, color: D.textMuted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', margin: 0 }}>{n.description}</p>
                      <button onClick={() => openView(n)} style={{ fontSize: 11, color: D.greenLight, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>Read more</button>
                    </td>
                    <td style={{ padding: '11px 14px' }}><NewsStatusBadge s={n.status} /></td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: D.textMuted }}>{n.createdBy}</td>
                    {isAdmin && (
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openView(n)} title="View" style={{ width: 30, height: 30, borderRadius: 7, background: D.greenDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Eye size={13} style={{ color: D.greenLight }} /></button>
                          <button onClick={() => openEdit(n)} title="Edit" style={{ width: 30, height: 30, borderRadius: 7, background: D.blueDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit2 size={13} style={{ color: D.blue }} /></button>
                          <button onClick={() => openDelete(n)} title="Delete" style={{ width: 30, height: 30, borderRadius: 7, background: D.redDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={13} style={{ color: D.red }} /></button>
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
        <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {current.length === 0
            ? <div style={{ padding: 32, textAlign: 'center', background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12 }}><p style={{ color: D.textSubtle, fontSize: 13 }}>No news available.</p></div>
            : current.map((n, i) => (
            <div key={n.id} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: D.textSubtle }}>#{idx + i + 1}</span>
                <NewsStatusBadge s={n.status} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: D.text, marginBottom: 4 }}>{n.title}</p>
              <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${D.border}` }}>
                <span style={{ fontSize: 11, color: D.textSubtle }}>By {n.createdBy} · {format(new Date(n.createdAt), 'dd MMM')}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openView(n)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: D.greenDim, border: 'none', borderRadius: 6, cursor: 'pointer', color: D.greenLight, fontSize: 12, fontWeight: 600 }}><Eye size={12} /> View</button>
                  {isAdmin && <>
                    <button onClick={() => openEdit(n)} style={{ width: 28, height: 28, borderRadius: 6, background: D.blueDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit2 size={12} style={{ color: D.blue }} /></button>
                    <button onClick={() => openDelete(n)} style={{ width: 28, height: 28, borderRadius: 6, background: D.redDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={12} style={{ color: D.red }} /></button>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${D.border}` }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: D.text }}>Create News</p>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} style={{ color: D.textMuted }} /></button>
            </div>
            <div style={{ padding: 20 }}><NewsForm formData={formData} setFormData={setFormData} onSave={handleCreate} label="Create News" actionLoading={actionLoading} onCancel={closeModal} /></div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {modal === 'edit' && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${D.border}` }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: D.text }}>Edit News</p>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} style={{ color: D.textMuted }} /></button>
            </div>
            <div style={{ padding: 20 }}><NewsForm formData={formData} setFormData={setFormData} onSave={handleUpdate} label="Save Changes" actionLoading={actionLoading} onCancel={closeModal} /></div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {modal === 'delete' && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxWidth: 380 }}>
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: D.redDim, border: `1px solid ${D.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Trash2 size={22} style={{ color: D.red }} /></div>
              <p style={{ fontSize: 15, fontWeight: 700, color: D.text, marginBottom: 8 }}>Delete News</p>
              <p style={{ fontSize: 13, color: D.textMuted, marginBottom: 20 }}>Are you sure you want to delete "<strong style={{ color: D.text }}>{selected.title}</strong>"? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleDelete} disabled={actionLoading} style={{ flex: 1, padding: '9px 0', background: D.red, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer', opacity: actionLoading ? 0.6 : 1 }}>{actionLoading ? 'Deleting…' : 'Delete'}</button>
                <button onClick={closeModal} style={{ flex: 1, padding: '9px 0', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, cursor: 'pointer', color: D.textMuted, fontSize: 13, fontWeight: 600 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
      {modal === 'view' && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${D.border}` }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: D.text }}>{selected.title}</p>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} style={{ color: D.textMuted }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, padding: 12 }}>
                {[['Status', null], ['By', selected.createdBy], ['Created', fmtDate(selected.createdAt)], ['Updated', fmtDate(selected.updatedAt)]].map(([l, v]) => (
                  <div key={String(l)}>
                    <p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{l}</p>
                    {l === 'Status' ? <NewsStatusBadge s={selected.status} /> : <p style={{ fontSize: 12, color: D.text }}>{v}</p>}
                  </div>
                ))}
              </div>
              <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, padding: 14 }}>
                <p style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Description</p>
                <p style={{ fontSize: 13, color: D.textMuted, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selected.description}</p>
              </div>
              <button onClick={closeModal} style={{ width: '100%', padding: '9px 0', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, cursor: 'pointer', color: D.textMuted, fontSize: 13, fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
