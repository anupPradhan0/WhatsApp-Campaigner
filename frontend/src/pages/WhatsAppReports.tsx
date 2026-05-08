import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { X, Eye, Calendar, Plus, ChevronLeft, ChevronRight, Download, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
const dateInp: React.CSSProperties = { background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 7, color: D.text, fontSize: 12, padding: '6px 10px', outline: 'none', colorScheme: 'dark' };

const statusColor = (s: string) => {
  const m: Record<string, [string, string]> = {
    pending: [D.amber, D.amberDim], delivered: [D.greenLight, D.greenDim],
    processing: [D.blue, D.blueDim], failed: [D.red, D.redDim],
  };
  return m[s?.toLowerCase()] ?? [D.textMuted, 'rgba(255,255,255,0.05)'];
};

const StatusBadge = ({ s }: { s: string }) => {
  const [c, bg] = statusColor(s);
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', color: c, background: bg, border: `1px solid ${c}44` }}>{s || 'N/A'}</span>;
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

interface Campaign { campaignId: string; campaignName: string; message: string; createdBy: string; status: string; statusMessage: string; mobileNumberCount: number; createdAt: string; image: string; }
interface UserData { companyName: string; email: string; number: string; role: string; status: string; createdAt: string; }
interface ReportsData { totalCampaigns: number; campaigns: Campaign[]; }

const stripHtml = (h: string) => h?.replace(/<[^>]*>/g, '') ?? '';
const trunc = (s: string, n = 80) => s.length <= n ? s : s.slice(0, n) + '…';
const fmtDate = (s: string) => { try { return format(new Date(s), 'dd MMM yyyy, hh:mm a'); } catch { return s; } };

export default function WhatsAppReports() {
  const navigate = useNavigate();
  const [data, setData] = useState<ReportsData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<Set<string>>(new Set());
  const [dlError, setDlError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState<Campaign | null>(null);

  const fetchData = useCallback(async () => {
    try { setLoading(true); const { data: r } = await api.get('/api/dashboard/whatsapp-reports'); if (r.success) { setData(r.data); setUserData(r.userData); } else setError(r.message || 'Failed'); } catch { setError('Network error.'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [perPage, startDate, endDate]);

  const filtered = (data?.campaigns ?? []).filter(c => {
    if (!startDate || !endDate) return true;
    const d = new Date(c.createdAt), s = new Date(startDate), e = new Date(endDate); e.setHours(23, 59, 59, 999);
    return d >= s && d <= e;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const idx = (page - 1) * perPage;
  const paginated = filtered.slice(idx, idx + perPage);

  const downloadExcel = async (id: string) => {
    if (downloading.has(id)) return;
    setDownloading(p => new Set(p).add(id)); setDlError(null);
    try {
      const res = await api.get(`/api/dashboard/export-campaign/${id}`, { responseType: 'blob', validateStatus: () => true });
      if (res.status >= 400) { const t = await (res.data as Blob).text(); throw new Error(JSON.parse(t)?.message || 'Failed'); }
      const cd = res.headers['content-disposition'] || ''; const fn = cd.match(/filename="?(.+)"?/i)?.[1] || `Campaign_${id}.xlsx`;
      const url = URL.createObjectURL(res.data as Blob); const a = document.createElement('a'); a.href = url; a.download = fn; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { setDlError(e instanceof Error ? e.message : 'Failed'); setTimeout(() => setDlError(null), 5000); }
    finally { setDownloading(p => { const n = new Set(p); n.delete(id); return n; }); }
  };

  const downloadImage = async (url: string) => {
    try { const r = await fetch(url); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `${selected?.campaignName || 'campaign'}_image.jpg`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u); } catch { /* */ }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${D.border}`, borderTopColor: D.green, animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: D.textMuted, fontSize: 13 }}>Loading reports…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .row-h:hover td{background:rgba(255,255,255,0.025)!important} input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.5)} select option{background:#18181b;color:#f4f4f5}`}</style>

      {dlError && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: D.redDim, border: `1px solid ${D.redBorder}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, maxWidth: 340 }}>
          <AlertCircle size={14} style={{ color: D.red, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: D.text, flex: 1 }}>{dlError}</p>
          <button onClick={() => setDlError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={13} style={{ color: D.textMuted }} /></button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: D.text, margin: 0 }}>WhatsApp Reports</h1>
            <p style={{ fontSize: 13, color: D.textMuted, marginTop: 4 }}>{data?.totalCampaigns ?? 0} total campaigns</p>
          </div>
          <button onClick={() => navigate('/send-whatsapp')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: D.green, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            <Plus size={15} /> New Campaign
          </button>
        </div>

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
          {(startDate || endDate) && <button onClick={() => { setStartDate(''); setEndDate(''); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: D.surface2, border: `1px solid ${D.border2}`, borderRadius: 6, cursor: 'pointer', color: D.textMuted, fontSize: 12 }}><X size={11} /> Clear</button>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <span style={{ fontSize: 11, color: D.textMuted }}>Show</span>
            <select value={perPage} onChange={e => setPerPage(Number(e.target.value))} style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 6, color: D.text, fontSize: 12, padding: '4px 8px', outline: 'none' }}>{[10,25,50].map(n => <option key={n} value={n}>{n}</option>)}</select>
            <span style={{ fontSize: 11, color: D.textSubtle }}>{idx + 1}–{Math.min(idx + perPage, filtered.length)} of {filtered.length}</span>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block" style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: `1px solid ${D.border}` }}>
                {['#', 'Campaign', 'Message', 'Status', 'Recipients', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 10, color: D.textSubtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {paginated.length === 0 ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: D.textSubtle, fontSize: 13 }}>No campaigns found. Try adjusting filters.</td></tr>
                  : paginated.map((c, i) => (
                  <tr key={c.campaignId} className="row-h" style={{ borderBottom: `1px solid rgba(39,39,42,0.5)` }}>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: D.textSubtle }}>{idx + i + 1}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: D.text, fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.campaignName}</td>
                    <td style={{ padding: '11px 14px', maxWidth: 220 }}>
                      <p style={{ fontSize: 12, color: D.textMuted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{trunc(stripHtml(c.message))}</p>
                      {c.message.length > 80 && <button onClick={() => setSelected(c)} style={{ fontSize: 11, color: D.greenLight, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>Read more</button>}
                    </td>
                    <td style={{ padding: '11px 14px' }}><StatusBadge s={c.status} /></td>
                    <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 12, fontWeight: 600, color: D.blue, background: D.blueDim, padding: '3px 8px', borderRadius: 20 }}>{c.mobileNumberCount}</span></td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: D.textMuted, whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setSelected(c)} title="View" style={{ width: 30, height: 30, borderRadius: 7, background: D.greenDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Eye size={13} style={{ color: D.greenLight }} /></button>
                        <button onClick={() => downloadExcel(c.campaignId)} disabled={downloading.has(c.campaignId)} title="Download Excel" style={{ width: 30, height: 30, borderRadius: 7, background: D.blueDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: downloading.has(c.campaignId) ? 0.5 : 1 }}>
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
          {paginated.length === 0 ? <div style={{ padding: 32, textAlign: 'center', background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12 }}><p style={{ color: D.textSubtle, fontSize: 13 }}>No campaigns found.</p></div>
            : paginated.map((c, i) => (
            <div key={c.campaignId} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: D.textSubtle }}>#{idx + i + 1}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <StatusBadge s={c.status} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: D.blue, background: D.blueDim, padding: '2px 7px', borderRadius: 20 }}>{c.mobileNumberCount}</span>
                </div>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: D.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.campaignName}</p>
              <p style={{ fontSize: 12, color: D.textMuted, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{trunc(stripHtml(c.message), 80)}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${D.border}` }}>
                <span style={{ fontSize: 11, color: D.textSubtle }}>{format(new Date(c.createdAt), 'dd MMM, hh:mm a')}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setSelected(c)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: D.greenDim, border: 'none', borderRadius: 6, cursor: 'pointer', color: D.greenLight, fontSize: 12, fontWeight: 600 }}><Eye size={12} /> View</button>
                  <button onClick={() => downloadExcel(c.campaignId)} disabled={downloading.has(c.campaignId)} style={{ width: 28, height: 28, borderRadius: 6, background: D.blueDim, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {downloading.has(c.campaignId) ? <Loader2 size={12} style={{ color: D.blue, animation: 'spin 0.8s linear infinite' }} /> : <Download size={12} style={{ color: D.blue }} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Paginator page={page} total={totalPages} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      </div>

      {/* Details modal */}
      {selected && userData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={() => setSelected(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${D.border}` }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: D.text }}>Campaign Details</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => downloadExcel(selected.campaignId)} disabled={downloading.has(selected.campaignId)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: D.greenDim, border: `1px solid ${D.greenBorder}`, borderRadius: 7, cursor: 'pointer', color: D.greenLight, fontSize: 12, fontWeight: 600 }}>
                  {downloading.has(selected.campaignId) ? <><Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Downloading…</> : <><Download size={12} /> Download Excel</>}
                </button>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={18} style={{ color: D.textMuted }} /></button>
              </div>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* User info */}
              <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: D.textSubtle, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>User Information</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['Company', userData.companyName], ['Email', userData.email], ['Phone', userData.number], ['Role', userData.role.toUpperCase()]].map(([l, v]) => (
                    <div key={l}><p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{l}</p><p style={{ fontSize: 12, color: D.text, fontWeight: 500, wordBreak: 'break-all' }}>{v}</p></div>
                  ))}
                </div>
              </div>
              {/* Campaign info */}
              <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: D.textSubtle, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Campaign Information</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  {[['Name', selected.campaignName], ['Created By', selected.createdBy], ['Recipients', String(selected.mobileNumberCount)], ['Date', fmtDate(selected.createdAt)]].map(([l, v]) => (
                    <div key={l}><p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{l}</p><p style={{ fontSize: 12, color: D.text, fontWeight: 500 }}>{v}</p></div>
                  ))}
                </div>
                <div><p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Status</p><StatusBadge s={selected.status} /></div>
                {selected.statusMessage && <div style={{ marginTop: 10 }}><p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Admin Note</p><p style={{ fontSize: 12, color: D.textMuted, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 6, padding: '8px 10px' }}>{selected.statusMessage}</p></div>}
              </div>
              {/* Media */}
              {selected.image && (
                <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: D.textSubtle, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Media</p>
                  <img src={selected.image} alt="Campaign media" style={{ width: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 8 }} onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Image+Not+Available'; }} />
                  <button onClick={() => downloadImage(selected.image)} style={{ marginTop: 10, width: '100%', padding: '8px 0', background: D.greenDim, border: `1px solid ${D.greenBorder}`, borderRadius: 7, cursor: 'pointer', color: D.greenLight, fontSize: 13, fontWeight: 600 }}>Download Image</button>
                </div>
              )}
              {/* Message */}
              <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: D.textSubtle, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Message</p>
                <p style={{ fontSize: 13, color: D.textMuted, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{stripHtml(selected.message)}</p>
              </div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[['Recipients', selected.mobileNumberCount, D.blue], ['Characters', selected.message.length, D.greenLight], ['SMS Parts', Math.ceil(selected.message.length / 160), '#a78bfa']].map(([l, v, c]) => (
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
