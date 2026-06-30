import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Eye, Calendar, Plus, Download, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaigns';
import { cn } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Paginator } from '../components/ui/Paginator';
import { PageHeader } from '../components/ui/PageHeader';

const stripHtml = (h: string) => h?.replace(/<[^>]*>/g, '') ?? '';
const trunc = (s: string, n = 80) => s.length <= n ? s : s.slice(0, n) + '…';
const fmtDate = (s: string) => { try { return format(new Date(s), 'dd MMM yyyy, hh:mm a'); } catch { return s; } };
const dateInpCls = "bg-surface2 border border-line rounded-[7px] text-fg text-xs px-2.5 py-1.5 outline-none [color-scheme:dark]";

export default function WhatsAppReports() {
  const navigate = useNavigate();
  const { data, loading, error, downloadExcel, downloading, dlError, clearDlError } = useCampaigns('/api/dashboard/whatsapp-reports');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const openDetails = (id: string) => navigate(`/whatsapp-report/${id}`);

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

  if (loading) return <Spinner label="Loading reports…" />;

  return (
    <>
      <style>{`input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5)}`}</style>

      {dlError && (
        <div className="fixed top-5 right-5 z-[9999] flex items-center gap-2 max-w-[340px] bg-danger-dim border border-danger-border rounded-[10px] px-3.5 py-2.5">
          <AlertCircle size={14} className="text-danger shrink-0" />
          <p className="flex-1 text-xs text-fg">{dlError}</p>
          <button onClick={clearDlError} className="bg-transparent border-none cursor-pointer p-0"><X size={13} className="text-fg-muted" /></button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <PageHeader
          title="WhatsApp Reports"
          subtitle={`${data?.totalCampaigns ?? 0} total campaigns`}
          action={
            <button onClick={() => navigate('/send-whatsapp')} className="flex items-center gap-[7px] px-4 py-[9px] bg-brand text-white font-semibold text-[13px] border-none rounded-lg cursor-pointer">
              <Plus size={15} /> New Campaign
            </button>
          }
        />

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
                {['#', 'Campaign', 'Message', 'Status', 'Recipients', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-3.5 py-3 text-left text-[10px] text-fg-subtle font-bold uppercase tracking-[0.08em] whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {paginated.length === 0
                  ? <tr><td colSpan={7} className="p-10 text-center text-fg-subtle text-[13px]">No campaigns found. Try adjusting filters.</td></tr>
                  : paginated.map((c, i) => (
                    <tr key={c.campaignId} className="group border-b border-line/50">
                      <td className="px-3.5 py-[11px] text-xs text-fg-subtle group-hover:bg-white/[0.025]">{idx + i + 1}</td>
                      <td className="px-3.5 py-[11px] text-[13px] text-fg font-medium max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap group-hover:bg-white/[0.025]">{c.campaignName}</td>
                      <td className="px-3.5 py-[11px] max-w-[220px] group-hover:bg-white/[0.025]">
                        <p className="text-xs text-fg-muted overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{trunc(stripHtml(c.message))}</p>
                        {c.message.length > 80 && <button onClick={() => openDetails(c.campaignId)} className="text-[11px] text-brand-light bg-transparent border-none cursor-pointer p-0 mt-0.5">Read more</button>}
                      </td>
                      <td className="px-3.5 py-[11px] group-hover:bg-white/[0.025]"><StatusBadge status={c.status} /></td>
                      <td className="px-3.5 py-[11px] group-hover:bg-white/[0.025]"><span className="text-xs font-semibold text-info bg-info-dim px-2 py-[3px] rounded-[20px]">{c.mobileNumberCount}</span></td>
                      <td className="px-3.5 py-[11px] text-xs text-fg-muted whitespace-nowrap group-hover:bg-white/[0.025]">{fmtDate(c.createdAt)}</td>
                      <td className="px-3.5 py-[11px] group-hover:bg-white/[0.025]">
                        <div className="flex gap-1.5">
                          <button onClick={() => openDetails(c.campaignId)} title="View" className="w-[30px] h-[30px] rounded-[7px] bg-brand-dim border-none flex items-center justify-center cursor-pointer"><Eye size={13} className="text-brand-light" /></button>
                          <button onClick={() => downloadExcel(c.campaignId)} disabled={downloading.has(c.campaignId)} title="Download Excel" className={cn("w-[30px] h-[30px] rounded-[7px] bg-info-dim border-none flex items-center justify-center cursor-pointer", downloading.has(c.campaignId) ? "opacity-50" : "opacity-100")}>
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
                <p className="text-[13px] font-semibold text-fg mb-1 overflow-hidden text-ellipsis whitespace-nowrap">{c.campaignName}</p>
                <p className="text-xs text-fg-muted mb-2 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">{trunc(stripHtml(c.message), 80)}</p>
                <div className="flex justify-between items-center pt-2 border-t border-line">
                  <span className="text-[11px] text-fg-subtle">{format(new Date(c.createdAt), 'dd MMM, hh:mm a')}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => openDetails(c.campaignId)} className="flex items-center gap-[5px] px-2.5 py-[5px] bg-brand-dim border-none rounded-md cursor-pointer text-brand-light text-xs font-semibold"><Eye size={12} /> View</button>
                    <button onClick={() => downloadExcel(c.campaignId)} disabled={downloading.has(c.campaignId)} className="w-7 h-7 rounded-md bg-info-dim border-none flex items-center justify-center cursor-pointer">
                      {downloading.has(c.campaignId) ? <Loader2 size={12} className="text-info animate-spin" /> : <Download size={12} className="text-info" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <Paginator page={page} total={totalPages} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      </div>
    </>
  );
}
