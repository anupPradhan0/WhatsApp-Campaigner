import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Eye, Edit2, Calendar, Download, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../constants/Roles';
import { getUserRole } from '../utils/Auth';
import { useCampaigns, type Campaign } from '../hooks/useCampaigns';
import { api } from '../api/client';
import { D, inp } from '../theme/tokens';
import { Spinner } from '../components/ui/Spinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Paginator } from '../components/ui/Paginator';
import { PageHeader } from '../components/ui/PageHeader';

const stripHtml = (h: string) => h?.replace(/<[^>]*>/g, '') ?? '';
const trunc = (s: string, n = 80) => s.length <= n ? s : s.slice(0, n) + '…';
const fmtDate = (s: string) => { try { return format(new Date(s), 'dd MMM yyyy, hh:mm a'); } catch { return s; } };
const dateInp: React.CSSProperties = { background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 7, color: D.text, fontSize: 12, padding: '6px 10px', outline: 'none', colorScheme: 'dark' };

export default function AllCampaigns() {
  const userRole = getUserRole();
  const { data, loading, error, refetch, downloadExcel, downloading, dlError, clearDlError } = useCampaigns('/api/dashboard/all-campaigns');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [editCampaign, setEditCampaign] = useState<typeof selected>(null);
  const [updateStatus, setUpdateStatus] = useState('pending');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => { setPage(1); }, [perPage, startDate, endDate]);

  const filtered = (data?.campaigns ?? []).filter(c => {
    if (!startDate || !endDate) return true;
    const d = new Date(c.createdAt), s = new Date(startDate), e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    return d >= s && d <= e;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const idx = (page - 1) * perPage;
  const paginated = filtered.slice(idx, idx + perPage);

  const downloadImage = async (url: string, name: string) => {
    // External image URL — uses plain fetch without auth/credentials to avoid CORS preflight.
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const b = await r.blob();
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = `${name}-image.jpg`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(u);
    } catch {
      toast.error('Could not download image');
    }
  };

  const handleUpdateStatus = async () => {
    if (!editCampaign) return;
    setUpdatingStatus(true);
    try {
      const { data: r } = await api.put(`/api/campaigns/stats/${editCampaign.campaignId}`, { status: updateStatus, statusMessage: updateMessage });
      if (r.success) { toast.success('Status updated!'); setEditCampaign(null); refetch(); }
      else toast.error(r.message || 'Failed');
    } catch { toast.error('Error updating status'); }
    finally { setUpdatingStatus(false); }
  };

  if (loading) return <Spinner label="Loading campaigns…" />;

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .row-h:hover td{background:rgba(255,255,255,0.025)!important} input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5)} select option{background:#18181b;color:#f4f4f5}`}</style>

      {dlError && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: D.redDim, border: `1px solid ${D.redBorder}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 340 }}>
          <AlertCircle size={14} style={{ color: D.red, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: D.text, flex: 1 }}>{dlError}</p>
          <button onClick={clearDlError} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={13} style={{ color: D.textMuted }} /></button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PageHeader title="All Campaigns" subtitle="Latest 50 campaigns from all users" />

        {error && <div style={{ padding: '10px 14px', background: D.redDim, border: `1px solid ${D.redBorder}`, borderRadius: 8 }}><p style={{ color: D.red, fontSize: 13 }}>{error}</p></div>}

        {/* Filter bar */}
        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Calendar size={14} style={{ color: D.textMuted }} />
          <span style={{ fontSize: 11, color: D.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Filter</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div><div style={{ fontSize: 10, color: D.textSubtle, marginBottom: 2 }}>FROM</div><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={dateInp} /></div>
            <span style={{ color: D.textSubtle, fontSize: 13 }}>→</span>
            <div><div style={{ fontSize: 10, color: D.textSubtle, marginBottom: 2 }}>TO</div><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={dateInp} /></div>
          </div>
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: D.surface2, border: `1px solid ${D.border2}`, borderRadius: 6, cursor: 'pointer', color: D.textMuted, fontSize: 12 }}>
              <X size={11} /> Clear
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <span style={{ fontSize: 11, color: D.textMuted }}>Show</span>
            <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 6, color: D.text, fontSize: 12, padding: '4px 8px', outline: 'none' }}>
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span style={{ fontSize: 11, color: D.textSubtle }}>{idx + 1}–{Math.min(idx + perPage, filtered.length)} of {filtered.length}</span>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block" style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: `1px solid ${D.border}` }}>
                {['#', 'Campaign', 'Message', 'By', 'Recipients', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, color: D.textSubtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {paginated.length === 0
                  ? <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: D.textSubtle, fontSize: 13 }}>No campaigns found.</td></tr>
                  : paginated.map((c, i) => (
                    <tr key={c.campaignId} className="row-h" style={{ borderBottom: `1px solid rgba(39,39,42,0.5)` }}>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: D.textSubtle }}>{idx + i + 1}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: D.text, fontWeight: 500, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.campaignName}</td>
                      <td style={{ padding: '11px 14px', maxWidth: 200 }}>
                        <p style={{ fontSize: 12, color: D.textMuted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', margin: 0 }}>{trunc(stripHtml(c.message))}</p>
                        {c.message.length > 80 && <button onClick={() => setSelected(c)} style={{ fontSize: 11, color: D.greenLight, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>more</button>}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: D.textMuted, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.createdBy}</td>
                      <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 12, fontWeight: 600, color: D.blue, background: D.blueDim, padding: '3px 8px', borderRadius: 20 }}>{c.mobileNumberCount}</span></td>
                      <td style={{ padding: '11px 14px' }}><StatusBadge status={c.status} /></td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: D.textMuted, whiteSpace: 'nowrap' }}>{format(new Date(c.createdAt), 'dd MMM')}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {userRole === UserRole.ADMIN && (
                            <button onClick={() => { setEditCampaign(c); setUpdateStatus(c.status || 'pending'); setUpdateMessage(''); }} title="Edit Status" style={{ width: 30, height: 30, borderRadius: 7, background: D.blueDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Edit2 size={12} style={{ color: D.blue }} />
                            </button>
                          )}
                          <button onClick={() => setSelected(c)} title="View" style={{ width: 30, height: 30, borderRadius: 7, background: D.greenDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Eye size={13} style={{ color: D.greenLight }} />
                          </button>
                          <button onClick={() => downloadExcel(c.campaignId)} disabled={downloading.has(c.campaignId)} title="Download" style={{ width: 30, height: 30, borderRadius: 7, background: D.blueDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: downloading.has(c.campaignId) ? 0.5 : 1 }}>
                            {downloading.has(c.campaignId) ? <Loader2 size={13} style={{ color: D.blue, animation: 'spin 0.8s linear infinite' }} /> : <Download size={13} style={{ color: D.blue }} />}
                          </button>
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
          {paginated.length === 0
            ? <div style={{ padding: 32, textAlign: 'center', background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12 }}><p style={{ color: D.textSubtle, fontSize: 13 }}>No campaigns found.</p></div>
            : paginated.map((c, i) => (
              <div key={c.campaignId} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: D.textSubtle }}>#{idx + i + 1}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <StatusBadge status={c.status} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: D.blue, background: D.blueDim, padding: '2px 7px', borderRadius: 20 }}>{c.mobileNumberCount}</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: D.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.campaignName}</p>
                <p style={{ fontSize: 11, color: D.textSubtle, marginBottom: 6 }}>By: {c.createdBy} · {format(new Date(c.createdAt), 'dd MMM')}</p>
                <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{trunc(stripHtml(c.message), 80)}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, paddingTop: 8, borderTop: `1px solid ${D.border}` }}>
                  {userRole === UserRole.ADMIN && (
                    <button onClick={() => { setEditCampaign(c); setUpdateStatus(c.status || 'pending'); setUpdateMessage(''); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: D.blueDim, border: 'none', borderRadius: 6, cursor: 'pointer', color: D.blue, fontSize: 12, fontWeight: 600 }}>
                      <Edit2 size={12} /> Edit
                    </button>
                  )}
                  <button onClick={() => setSelected(c)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: D.greenDim, border: 'none', borderRadius: 6, cursor: 'pointer', color: D.greenLight, fontSize: 12, fontWeight: 600 }}><Eye size={12} /> View</button>
                  <button onClick={() => downloadExcel(c.campaignId)} disabled={downloading.has(c.campaignId)} style={{ width: 28, height: 28, borderRadius: 6, background: D.blueDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {downloading.has(c.campaignId) ? <Loader2 size={12} style={{ color: D.blue, animation: 'spin 0.8s linear infinite' }} /> : <Download size={12} style={{ color: D.blue }} />}
                  </button>
                </div>
              </div>
            ))}
        </div>

        <Paginator page={page} total={totalPages} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      </div>

      {/* View modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${D.border}` }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: D.text }}>Campaign Details</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => downloadExcel(selected.campaignId)} disabled={downloading.has(selected.campaignId)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: D.greenDim, border: `1px solid ${D.greenBorder}`, borderRadius: 7, cursor: 'pointer', color: D.greenLight, fontSize: 12, fontWeight: 600 }}>
                  {downloading.has(selected.campaignId) ? <><Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Downloading…</> : <><Download size={12} /> Download</>}
                </button>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} style={{ color: D.textMuted }} /></button>
              </div>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {selected.userData && (
                <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: D.textSubtle, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>User Information</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[['Company', selected.userData.companyName], ['Email', selected.userData.email], ['Phone', selected.userData.number], ['Role', selected.userData.role.toUpperCase()]].map(([l, v]) => (
                      <div key={l}><p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{l}</p><p style={{ fontSize: 12, color: D.text, fontWeight: 500, wordBreak: 'break-all' }}>{v}</p></div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: D.textSubtle, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Campaign Information</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  {[['Name', selected.campaignName], ['Created By', selected.createdBy], ['Recipients', String(selected.mobileNumberCount)], ['Date', fmtDate(selected.createdAt)]].map(([l, v]) => (
                    <div key={l}><p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{l}</p><p style={{ fontSize: 12, color: D.text, fontWeight: 500 }}>{v}</p></div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div><p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Status</p><StatusBadge status={selected.status} /></div>
                </div>
                {selected.statusMessage && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Admin Note</p>
                    <p style={{ fontSize: 12, color: D.textMuted, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 6, padding: '8px 10px' }}>{selected.statusMessage}</p>
                  </div>
                )}
              </div>
              {selected.image && (
                <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: D.textSubtle, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Media</p>
                  <img src={selected.image} alt="Campaign" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 8 }} onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Not+Available'; }} />
                  <button onClick={() => downloadImage(selected.image, selected.campaignName)} style={{ marginTop: 10, width: '100%', padding: '8px 0', background: D.greenDim, border: `1px solid ${D.greenBorder}`, borderRadius: 7, cursor: 'pointer', color: D.greenLight, fontSize: 13, fontWeight: 600 }}>Download Image</button>
                </div>
              )}
              <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: D.textSubtle, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Message</p>
                <p style={{ fontSize: 13, color: D.textMuted, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{stripHtml(selected.message)}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: '100%', padding: '9px 0', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, cursor: 'pointer', color: D.textMuted, fontSize: 13, fontWeight: 600 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status modal (admin) */}
      {editCampaign && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={() => setEditCampaign(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${D.border}` }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: D.text }}>Update Campaign Status</p>
              <button onClick={() => setEditCampaign(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} style={{ color: D.textMuted }} /></button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 12, color: D.textMuted }}><span style={{ color: D.textSubtle, fontWeight: 600 }}>Campaign: </span>{editCampaign.campaignName}</p>
                <p style={{ fontSize: 12, color: D.textMuted, marginTop: 4 }}>Current: <StatusBadge status={editCampaign.status} /></p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: D.textMuted, fontWeight: 600, marginBottom: 6 }}>New Status <span style={{ color: D.red }}>*</span></p>
                <select value={updateStatus} onChange={e => setUpdateStatus(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="pending">Pending</option><option value="delivered">Delivered</option><option value="failed">Failed</option><option value="processing">Processing</option>
                </select>
              </div>
              <div>
                <p style={{ fontSize: 12, color: D.textMuted, fontWeight: 600, marginBottom: 6 }}>Status Message</p>
                <textarea value={updateMessage} onChange={e => setUpdateMessage(e.target.value)} rows={3} placeholder={`Current: ${editCampaign.statusMessage || 'None'}`} style={{ ...inp, resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleUpdateStatus} disabled={updatingStatus} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: D.blue, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer', opacity: updatingStatus ? 0.6 : 1 }}>
                  {updatingStatus ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Updating…</> : <><Check size={13} /> Update</>}
                </button>
                <button onClick={() => setEditCampaign(null)} style={{ flex: 1, padding: '9px 0', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, cursor: 'pointer', color: D.textMuted, fontSize: 13, fontWeight: 600 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
