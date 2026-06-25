import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Eye, Edit2, Calendar, Download, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '../constants/Roles';
import { getUserRole } from '../utils/Auth';
import { useCampaigns, type Campaign } from '../hooks/useCampaigns';
import { api } from '../api/client';
import { cn } from '../lib/utils';
import { fieldCls } from '../theme/classes';
import { Spinner } from '../components/ui/Spinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Paginator } from '../components/ui/Paginator';
import { PageHeader } from '../components/ui/PageHeader';

const stripHtml = (h: string) => h?.replace(/<[^>]*>/g, '') ?? '';
const trunc = (s: string, n = 80) => s.length <= n ? s : s.slice(0, n) + '…';
const fmtDate = (s: string) => { try { return format(new Date(s), 'dd MMM yyyy, hh:mm a'); } catch { return s; } };
const dateInpCls = "bg-surface2 border border-line rounded-[7px] text-fg text-xs px-2.5 py-1.5 outline-none [color-scheme:dark]";

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
      <style>{`input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5)}`}</style>

      {dlError && (
        <div className="fixed top-5 right-5 z-[9999] flex items-center gap-2 max-w-[340px] bg-danger-dim border border-danger-border rounded-[10px] px-3.5 py-2.5">
          <AlertCircle size={14} className="text-danger shrink-0" />
          <p className="text-xs text-fg flex-1">{dlError}</p>
          <button onClick={clearDlError} className="bg-transparent border-none cursor-pointer p-0"><X size={13} className="text-fg-muted" /></button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <PageHeader title="All Campaigns" subtitle="Latest 50 campaigns from all users" />

        {error && <div className="px-3.5 py-2.5 bg-danger-dim border border-danger-border rounded-lg"><p className="text-danger text-[13px]">{error}</p></div>}

        {/* Filter bar */}
        <div className="flex items-center flex-wrap gap-3 bg-surface border border-line rounded-[10px] px-4 py-3">
          <Calendar size={14} className="text-fg-muted" />
          <span className="text-[11px] text-fg-muted font-semibold uppercase tracking-[0.07em]">Filter</span>
          <div className="flex items-center gap-2">
            <div><div className="text-[10px] text-fg-subtle mb-0.5">FROM</div><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={dateInpCls} /></div>
            <span className="text-fg-subtle text-[13px]">→</span>
            <div><div className="text-[10px] text-fg-subtle mb-0.5">TO</div><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={dateInpCls} /></div>
          </div>
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="flex items-center gap-1 px-2.5 py-[5px] bg-surface2 border border-line-strong rounded-md cursor-pointer text-fg-muted text-xs">
              <X size={11} /> Clear
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[11px] text-fg-muted">Show</span>
            <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} className="bg-surface2 border border-line rounded-md text-fg text-xs px-2 py-1 outline-none">
              {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-[11px] text-fg-subtle">{idx + 1}–{Math.min(idx + perPage, filtered.length)} of {filtered.length}</span>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block bg-surface border border-line rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-line">
                {['#', 'Campaign', 'Message', 'By', 'Recipients', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-3.5 py-3 text-left text-[10px] text-fg-subtle font-bold uppercase tracking-[0.08em] whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {paginated.length === 0
                  ? <tr><td colSpan={8} className="p-10 text-center text-fg-subtle text-[13px]">No campaigns found.</td></tr>
                  : paginated.map((c, i) => (
                    <tr key={c.campaignId} className="group border-b border-[rgba(39,39,42,0.5)]">
                      <td className="px-3.5 py-[11px] text-xs text-fg-subtle group-hover:bg-white/[0.025]">{idx + i + 1}</td>
                      <td className="px-3.5 py-[11px] text-[13px] text-fg font-medium max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap group-hover:bg-white/[0.025]">{c.campaignName}</td>
                      <td className="px-3.5 py-[11px] max-w-[200px] group-hover:bg-white/[0.025]">
                        <p className="text-xs text-fg-muted overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] m-0">{trunc(stripHtml(c.message))}</p>
                        {c.message.length > 80 && <button onClick={() => setSelected(c)} className="text-[11px] text-brand-light bg-transparent border-none cursor-pointer p-0 mt-0.5">more</button>}
                      </td>
                      <td className="px-3.5 py-[11px] text-xs text-fg-muted max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap group-hover:bg-white/[0.025]">{c.createdBy}</td>
                      <td className="px-3.5 py-[11px] group-hover:bg-white/[0.025]"><span className="text-xs font-semibold text-info bg-info-dim px-2 py-[3px] rounded-[20px]">{c.mobileNumberCount}</span></td>
                      <td className="px-3.5 py-[11px] group-hover:bg-white/[0.025]"><StatusBadge status={c.status} /></td>
                      <td className="px-3.5 py-[11px] text-xs text-fg-muted whitespace-nowrap group-hover:bg-white/[0.025]">{format(new Date(c.createdAt), 'dd MMM')}</td>
                      <td className="px-3.5 py-[11px] group-hover:bg-white/[0.025]">
                        <div className="flex gap-1.5">
                          {userRole === UserRole.ADMIN && (
                            <button onClick={() => { setEditCampaign(c); setUpdateStatus(c.status || 'pending'); setUpdateMessage(''); }} title="Edit Status" className="w-[30px] h-[30px] rounded-[7px] bg-info-dim border-none flex items-center justify-center cursor-pointer">
                              <Edit2 size={12} className="text-info" />
                            </button>
                          )}
                          <button onClick={() => setSelected(c)} title="View" className="w-[30px] h-[30px] rounded-[7px] bg-brand-dim border-none flex items-center justify-center cursor-pointer">
                            <Eye size={13} className="text-brand-light" />
                          </button>
                          <button onClick={() => downloadExcel(c.campaignId)} disabled={downloading.has(c.campaignId)} title="Download" className={cn("w-[30px] h-[30px] rounded-[7px] bg-info-dim border-none flex items-center justify-center cursor-pointer", downloading.has(c.campaignId) ? "opacity-50" : "opacity-100")}>
                            {downloading.has(c.campaignId) ? <Loader2 size={13} className="text-info animate-spin" /> : <Download size={13} className="text-info" />}
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
        <div className="md:hidden flex flex-col gap-2">
          {paginated.length === 0
            ? <div className="p-8 text-center bg-surface border border-line rounded-xl"><p className="text-fg-subtle text-[13px]">No campaigns found.</p></div>
            : paginated.map((c, i) => (
              <div key={c.campaignId} className="bg-surface border border-line rounded-[10px] px-3.5 py-3">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] text-fg-subtle">#{idx + i + 1}</span>
                  <div className="flex gap-1.5 items-center">
                    <StatusBadge status={c.status} />
                    <span className="text-[11px] font-semibold text-info bg-info-dim px-[7px] py-0.5 rounded-[20px]">{c.mobileNumberCount}</span>
                  </div>
                </div>
                <p className="text-[13px] font-semibold text-fg mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">{c.campaignName}</p>
                <p className="text-[11px] text-fg-subtle mb-1.5">By: {c.createdBy} · {format(new Date(c.createdAt), 'dd MMM')}</p>
                <p className="text-xs text-fg-muted mb-2 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{trunc(stripHtml(c.message), 80)}</p>
                <div className="flex justify-end gap-1.5 pt-2 border-t border-line">
                  {userRole === UserRole.ADMIN && (
                    <button onClick={() => { setEditCampaign(c); setUpdateStatus(c.status || 'pending'); setUpdateMessage(''); }} className="flex items-center gap-[5px] px-2.5 py-[5px] bg-info-dim border-none rounded-md cursor-pointer text-info text-xs font-semibold">
                      <Edit2 size={12} /> Edit
                    </button>
                  )}
                  <button onClick={() => setSelected(c)} className="flex items-center gap-[5px] px-2.5 py-[5px] bg-brand-dim border-none rounded-md cursor-pointer text-brand-light text-xs font-semibold"><Eye size={12} /> View</button>
                  <button onClick={() => downloadExcel(c.campaignId)} disabled={downloading.has(c.campaignId)} className="w-7 h-7 rounded-md bg-info-dim border-none flex items-center justify-center cursor-pointer">
                    {downloading.has(c.campaignId) ? <Loader2 size={12} className="text-info animate-spin" /> : <Download size={12} className="text-info" />}
                  </button>
                </div>
              </div>
            ))}
        </div>

        <Paginator page={page} total={totalPages} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      </div>

      {/* View modal */}
      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80" onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[620px] max-h-[90vh] overflow-y-auto bg-surface border border-brand-border shadow-[0_0_0_1px_rgba(22,163,74,0.08),0_24px_64px_-16px_rgba(0,0,0,0.85)] rounded-[14px]">
            <div className="flex items-center justify-between px-5 py-[18px] border-b border-line">
              <p className="text-base font-bold text-fg">Campaign Details</p>
              <div className="flex gap-2">
                <button onClick={() => downloadExcel(selected.campaignId)} disabled={downloading.has(selected.campaignId)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-dim border border-brand-border rounded-[7px] cursor-pointer text-brand-light text-xs font-semibold">
                  {downloading.has(selected.campaignId) ? <><Loader2 size={12} className="animate-spin" /> Downloading…</> : <><Download size={12} /> Download</>}
                </button>
                <button onClick={() => setSelected(null)} className="bg-transparent border-none cursor-pointer p-1"><X size={18} className="text-fg-muted" /></button>
              </div>
            </div>
            <div className="p-5 flex flex-col gap-3.5">
              {selected.userData && (
                <div className="bg-surface2 border border-line rounded-[10px] p-3.5">
                  <p className="text-[11px] font-bold text-fg-subtle uppercase tracking-[0.07em] mb-2.5">User Information</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[['Company', selected.userData.companyName], ['Email', selected.userData.email], ['Phone', selected.userData.number], ['Role', selected.userData.role.toUpperCase()]].map(([l, v]) => (
                      <div key={l}><p className="text-[10px] text-fg-subtle font-semibold uppercase tracking-[0.06em] mb-[3px]">{l}</p><p className="text-xs text-fg font-medium break-all">{v}</p></div>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-surface2 border border-line rounded-[10px] p-3.5">
                <p className="text-[11px] font-bold text-fg-subtle uppercase tracking-[0.07em] mb-2.5">Campaign Information</p>
                <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                  {[['Name', selected.campaignName], ['Created By', selected.createdBy], ['Recipients', String(selected.mobileNumberCount)], ['Date', fmtDate(selected.createdAt)]].map(([l, v]) => (
                    <div key={l}><p className="text-[10px] text-fg-subtle font-semibold uppercase tracking-[0.06em] mb-[3px]">{l}</p><p className="text-xs text-fg font-medium">{v}</p></div>
                  ))}
                </div>
                <div className="flex gap-3 items-center">
                  <div><p className="text-[10px] text-fg-subtle font-semibold uppercase mb-1">Status</p><StatusBadge status={selected.status} /></div>
                </div>
                {selected.statusMessage && (
                  <div className="mt-2.5">
                    <p className="text-[10px] text-fg-subtle font-semibold uppercase mb-[3px]">Admin Note</p>
                    <p className="text-xs text-fg-muted bg-surface border border-line rounded-md px-2.5 py-2">{selected.statusMessage}</p>
                  </div>
                )}
              </div>
              {selected.image && (
                <div className="bg-surface2 border border-line rounded-[10px] p-3.5">
                  <p className="text-[11px] font-bold text-fg-subtle uppercase tracking-[0.07em] mb-2.5">Media</p>
                  <img src={selected.image} alt="Campaign" className="w-full max-h-[260px] object-contain rounded-lg" onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Not+Available'; }} />
                  <button onClick={() => downloadImage(selected.image, selected.campaignName)} className="mt-2.5 w-full py-2 bg-brand-dim border border-brand-border rounded-[7px] cursor-pointer text-brand-light text-[13px] font-semibold">Download Image</button>
                </div>
              )}
              <div className="bg-surface2 border border-line rounded-[10px] p-3.5">
                <p className="text-[11px] font-bold text-fg-subtle uppercase tracking-[0.07em] mb-2">Message</p>
                <p className="text-[13px] text-fg-muted leading-[1.7] whitespace-pre-wrap">{stripHtml(selected.message)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-full py-[9px] bg-surface2 border border-line rounded-lg cursor-pointer text-fg-muted text-[13px] font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status modal (admin) */}
      {editCampaign && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80" onClick={() => setEditCampaign(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-[420px] bg-surface border border-brand-border shadow-[0_0_0_1px_rgba(22,163,74,0.08),0_24px_64px_-16px_rgba(0,0,0,0.85)] rounded-[14px]">
            <div className="flex items-center justify-between px-5 py-[18px] border-b border-line">
              <p className="text-[15px] font-bold text-fg">Update Campaign Status</p>
              <button onClick={() => setEditCampaign(null)} className="bg-transparent border-none cursor-pointer p-1"><X size={18} className="text-fg-muted" /></button>
            </div>
            <div className="p-5 flex flex-col gap-3.5">
              <div className="bg-surface2 border border-line rounded-lg p-3">
                <p className="text-xs text-fg-muted"><span className="text-fg-subtle font-semibold">Campaign: </span>{editCampaign.campaignName}</p>
                <p className="text-xs text-fg-muted mt-1">Current: <StatusBadge status={editCampaign.status} /></p>
              </div>
              <div>
                <p className="text-xs text-fg-muted font-semibold mb-1.5">New Status <span className="text-danger">*</span></p>
                <select value={updateStatus} onChange={e => setUpdateStatus(e.target.value)} className={cn(fieldCls, "cursor-pointer")}>
                  <option value="pending">Pending</option><option value="delivered">Delivered</option><option value="failed">Failed</option><option value="processing">Processing</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-fg-muted font-semibold mb-1.5">Status Message</p>
                <textarea value={updateMessage} onChange={e => setUpdateMessage(e.target.value)} rows={3} placeholder={`Current: ${editCampaign.statusMessage || 'None'}`} className={cn(fieldCls, "resize-none")} />
              </div>
              <div className="flex gap-2.5">
                <button onClick={handleUpdateStatus} disabled={updatingStatus} className="flex-1 flex items-center justify-center gap-1.5 py-[9px] bg-info text-white font-semibold text-[13px] border-none rounded-lg cursor-pointer disabled:opacity-60">
                  {updatingStatus ? <><Loader2 size={13} className="animate-spin" /> Updating…</> : <><Check size={13} /> Update</>}
                </button>
                <button onClick={() => setEditCampaign(null)} className="flex-1 py-[9px] bg-surface2 border border-line rounded-lg cursor-pointer text-fg-muted text-[13px] font-semibold">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
