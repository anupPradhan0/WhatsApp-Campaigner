import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft, Download, Loader2, AlertCircle, X, Users,
  CheckCircle2, XCircle, Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCampaignDetail, useCampaignNumbers, useDownloadCampaign,
} from '../hooks/useCampaignDetail';
import { cn } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Paginator } from '../components/ui/Paginator';

const stripHtml = (h: string) => h?.replace(/<[^>]*>/g, '') ?? '';
const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  try { return format(new Date(s), 'dd MMM yyyy, hh:mm a'); } catch { return s; }
};
const fmtTime = (s?: string | null) => {
  if (!s) return '—';
  try { return format(new Date(s), 'dd MMM, hh:mm a'); } catch { return s; }
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-surface border border-line rounded-xl p-4">
    <p className="text-[11px] font-bold text-fg-subtle uppercase tracking-[0.07em] mb-3">{title}</p>
    {children}
  </div>
);

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-[10px] text-fg-subtle font-semibold uppercase tracking-[0.06em] mb-[3px]">{label}</p>
    <div className="text-[13px] text-fg font-medium break-all">{value || '—'}</div>
  </div>
);

const Stat = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) => (
  <div className="bg-surface border border-line rounded-xl px-4 py-3.5 flex items-center gap-3">
    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', color)}>{icon}</div>
    <div>
      <p className="text-lg font-bold text-fg leading-none">{value}</p>
      <p className="text-[10px] text-fg-subtle font-semibold uppercase tracking-[0.06em] mt-1">{label}</p>
    </div>
  </div>
);

export default function CampaignDetails() {
  const { campaignId = '' } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { detail, userData, loading, error } = useCampaignDetail(campaignId);
  const { numbers, countryCode, total, totalPages, fetching, error: numbersError } = useCampaignNumbers(campaignId, page);
  const { downloadExcel, downloading, dlError } = useDownloadCampaign();

  useEffect(() => { setPage(1); }, [campaignId]);

  const downloadImage = async (url: string, name: string) => {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const b = await r.blob();
      const u = URL.createObjectURL(b);
      const a = document.createElement('a');
      a.href = u; a.download = `${name}_media.jpg`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(u);
    } catch {
      toast.error('Could not download media');
    }
  };

  if (loading) return <Spinner label="Loading campaign…" />;

  if (error || !detail) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => navigate('/whatsapp-report')} className="flex items-center gap-1.5 text-fg-muted text-[13px] bg-transparent border-none cursor-pointer p-0 w-fit">
          <ArrowLeft size={15} /> Back to Reports
        </button>
        <div className="p-8 text-center bg-surface border border-danger-border rounded-xl">
          <AlertCircle size={22} className="text-danger mx-auto mb-2" />
          <p className="text-danger text-[13px]">{error || 'Campaign not found.'}</p>
        </div>
      </div>
    );
  }

  const tracked = detail.delivery.tracked > 0;

  return (
    <div className="flex flex-col gap-4">
      {dlError && (
        <div className="fixed top-5 right-5 z-[9999] flex items-center gap-2 max-w-[340px] bg-danger-dim border border-danger-border rounded-[10px] px-3.5 py-2.5">
          <AlertCircle size={14} className="text-danger shrink-0" />
          <p className="flex-1 text-xs text-fg">{dlError}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <button onClick={() => navigate('/whatsapp-report')} className="flex items-center gap-1.5 text-fg-muted text-xs bg-transparent border-none cursor-pointer p-0 mb-2 hover:text-fg">
            <ArrowLeft size={14} /> Back to Reports
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-fg m-0 leading-[1.3]">{detail.campaignName}</h1>
            <StatusBadge status={detail.status} />
          </div>
          <p className="text-[13px] text-fg-muted mt-1">Created {fmtDate(detail.createdAt)} by {detail.createdBy}</p>
        </div>
        <button
          onClick={() => downloadExcel(detail.campaignId)}
          disabled={downloading}
          className="flex items-center gap-[7px] px-4 py-[9px] bg-brand text-white font-semibold text-[13px] border-none rounded-lg cursor-pointer disabled:opacity-60"
        >
          {downloading ? <><Loader2 size={15} className="animate-spin" /> Exporting…</> : <><Download size={15} /> Download Excel</>}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat icon={<Users size={17} className="text-info" />} label="Recipients" value={detail.mobileNumberCount.toLocaleString()} color="bg-info-dim" />
        <Stat icon={<CheckCircle2 size={17} className="text-brand-light" />} label="Delivered" value={tracked ? detail.delivery.delivered.toLocaleString() : '—'} color="bg-brand-dim" />
        <Stat icon={<XCircle size={17} className="text-danger" />} label="Failed" value={tracked ? detail.delivery.failed.toLocaleString() : '—'} color="bg-danger-dim" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Campaign info */}
        <Card title="Campaign Information">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Name" value={detail.campaignName} />
            <Field label="Created By" value={detail.createdBy} />
            <Field label="Recipients" value={detail.mobileNumberCount.toLocaleString()} />
            <Field label="Country Code" value={detail.countryCode} />
            <Field label="Date" value={fmtDate(detail.createdAt)} />
            <Field label="Status" value={<StatusBadge status={detail.status} />} />
          </div>
          {detail.statusMessage && (
            <div>
              <p className="text-[10px] text-fg-subtle font-semibold uppercase tracking-[0.06em] mb-[3px]">Note</p>
              <p className="text-xs text-fg-muted bg-surface2 border border-line rounded-md px-2.5 py-2">{detail.statusMessage}</p>
            </div>
          )}
        </Card>

        {/* User info */}
        {userData && (
          <Card title="User Information">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company" value={userData.companyName} />
              <Field label="Email" value={userData.email} />
              <Field label="Phone" value={userData.number} />
              <Field label="Role" value={userData.role?.toUpperCase()} />
            </div>
          </Card>
        )}
      </div>

      {/* Message */}
      <Card title="Message">
        <p className="text-[13px] text-fg-muted leading-[1.7] whitespace-pre-wrap">{stripHtml(detail.message)}</p>
        {(detail.phoneButton || detail.linkButton) && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
            {detail.phoneButton && (
              <span className="text-xs text-fg bg-surface2 border border-line rounded-md px-2.5 py-1.5">📞 {detail.phoneButton.text} — {detail.phoneButton.number}</span>
            )}
            {detail.linkButton && (
              <span className="text-xs text-fg bg-surface2 border border-line rounded-md px-2.5 py-1.5">🔗 {detail.linkButton.text} — {detail.linkButton.url}</span>
            )}
          </div>
        )}
      </Card>

      {/* Media */}
      {detail.image && (
        <Card title="Media">
          <img src={detail.image} alt="Campaign media" className="w-full max-h-[320px] object-contain rounded-lg bg-surface2" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          <button onClick={() => downloadImage(detail.image!, detail.campaignName)} className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 bg-surface2 border border-line rounded-[7px] cursor-pointer text-fg-muted text-xs font-semibold">
            <Download size={12} /> Download Media
          </button>
        </Card>
      )}

      {/* Recipients table */}
      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Phone size={15} className="text-fg-muted" />
            <p className="text-[13px] font-bold text-fg">Target Phone Numbers</p>
            <span className="text-[11px] font-semibold text-info bg-info-dim px-2 py-[2px] rounded-[20px]">{total.toLocaleString()}</span>
          </div>
          {fetching && <Loader2 size={14} className="text-fg-muted animate-spin" />}
        </div>

        {!tracked && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/[0.07] border-b border-line">
            <AlertCircle size={13} className="text-amber-400 shrink-0" />
            <p className="text-[11px] text-fg-muted">Per-number delivery status wasn't recorded for this campaign. Showing the campaign's overall status as a best-effort estimate.</p>
          </div>
        )}

        {numbersError ? (
          <div className="p-8 text-center text-danger text-[13px]">{numbersError}</div>
        ) : numbers.length === 0 ? (
          <div className="p-8 text-center text-fg-subtle text-[13px]">No phone numbers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead><tr className="border-b border-line">
                {['#', 'Phone Number', 'Status', 'Sent At'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] text-fg-subtle font-bold uppercase tracking-[0.08em] whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {numbers.map(n => (
                  <tr key={n.serial} className="group border-b border-line/50">
                    <td className="px-4 py-2.5 text-xs text-fg-subtle group-hover:bg-white/[0.025] w-[60px]">{n.serial}</td>
                    <td className="px-4 py-2.5 text-[13px] text-fg font-medium tabular-nums group-hover:bg-white/[0.025]">
                      {countryCode && !n.number.startsWith(countryCode) ? `${countryCode} ` : ''}{n.number}
                    </td>
                    <td className="px-4 py-2.5 group-hover:bg-white/[0.025]">
                      <StatusBadge status={n.status} />
                      {n.status === 'failed' && n.error && <span className="block text-[10px] text-fg-subtle mt-0.5">{n.error}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-fg-muted whitespace-nowrap group-hover:bg-white/[0.025]">{fmtTime(n.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Paginator page={page} total={totalPages} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
    </div>
  );
}
