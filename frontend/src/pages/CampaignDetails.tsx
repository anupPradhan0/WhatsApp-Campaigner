import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft, Download, Loader2, AlertCircle, Users,
  CheckCircle2, XCircle, Phone, Link2, Copy, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCampaignDetail, useCampaignNumbers, useDownloadCampaign,
} from '../hooks/useCampaignDetail';
import { cn } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Paginator } from '../components/ui/Paginator';
import { WhatsAppPreview } from '../components/WhatsAppPreview';
import { DownloadMenu } from '../components/ui/DownloadMenu';

const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  try { return format(new Date(s), 'dd MMM yyyy, hh:mm a'); } catch { return s; }
};
const fmtBubbleTime = (s?: string | null) => {
  if (!s) return '';
  try { return format(new Date(s), 'hh:mm a'); } catch { return ''; }
};
const fmtTime = (s?: string | null) => {
  if (!s) return '—';
  try { return format(new Date(s), 'dd MMM, hh:mm a'); } catch { return s; }
};
// Safe HTML → plain text (textContent off a detached node runs no scripts).
const stripHtml = (h: string) => {
  if (!h) return '';
  const el = document.createElement('div');
  el.innerHTML = h;
  return (el.textContent ?? '').trim();
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
  const location = useLocation();
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);

  const fromAllCampaigns = location.pathname.startsWith('/all-campaign');
  const backTo = fromAllCampaigns ? '/all-campaign' : '/whatsapp-report';
  const backLabel = fromAllCampaigns ? 'Back to All Campaigns' : 'Back to Reports';

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
    } catch (e) {
      toast.error(e instanceof Error ? `Could not download media (${e.message})` : 'Could not download media');
    }
  };

  if (loading) return <Spinner label="Loading campaign…" />;

  if (error || !detail) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => navigate(backTo)} className="flex items-center gap-1.5 text-fg-muted text-[13px] bg-transparent border-none cursor-pointer p-0 w-fit">
          <ArrowLeft size={15} /> {backLabel}
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
          <button onClick={() => navigate(backTo)} className="flex items-center gap-1.5 text-fg-muted text-xs bg-transparent border-none cursor-pointer p-0 mb-2 hover:text-fg">
            <ArrowLeft size={14} /> {backLabel}
          </button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-fg m-0 leading-[1.3]">{detail.campaignName}</h1>
            <StatusBadge status={detail.status} />
          </div>
          <p className="text-[13px] text-fg-muted mt-1">Created {fmtDate(detail.createdAt)} by {detail.createdBy}</p>
        </div>
<DownloadMenu onPick={f => downloadExcel(detail.campaignId, f)} busy={downloading} variant="button" iconSize={15} />
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

      {/* Message — WhatsApp preview */}
      <Card title="Message">
        <div className="grid lg:grid-cols-[340px_minmax(0,1fr)] gap-5 items-start">
          <WhatsAppPreview
            name={detail.createdBy}
            profileImage={detail.profileImage}
            message={detail.message}
            mediaImage={detail.image}
            phoneButtonText={detail.phoneButton?.text}
            linkButtonText={detail.linkButton?.text}
            time={fmtBubbleTime(detail.createdAt)}
          />
          <div className="flex flex-col gap-4 min-w-0">
            {/* Message text + copy */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-fg-subtle font-semibold uppercase tracking-[0.06em]">Message Text</p>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(stripHtml(detail.message));
                      setCopied(true); toast.success('Message copied');
                      setTimeout(() => setCopied(false), 1500);
                    } catch { toast.error('Could not copy message'); }
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-surface2 border border-line rounded-md cursor-pointer text-[11px] font-semibold text-fg-muted hover:text-fg hover:border-line-strong transition-colors"
                >
                  {copied ? <><Check size={12} className="text-brand-light" /> Copied</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <div className="bg-surface2 border border-line rounded-lg px-3.5 py-3 text-[13px] text-fg-muted leading-[1.7] whitespace-pre-wrap break-words max-h-[340px] overflow-y-auto">
                {stripHtml(detail.message) || <span className="italic text-fg-subtle">No message.</span>}
              </div>
            </div>

            {/* Action buttons */}
            {(detail.phoneButton || detail.linkButton) && (
              <div className="flex flex-col gap-2.5">
                <p className="text-[10px] text-fg-subtle font-semibold uppercase tracking-[0.06em]">Action Buttons</p>
                {detail.phoneButton && (
                  <div className="flex items-center gap-3 bg-surface2 border border-line rounded-lg px-3.5 py-2.5">
                    <div className="w-9 h-9 rounded-lg bg-brand-dim flex items-center justify-center shrink-0"><Phone size={16} className="text-brand-light" /></div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-fg truncate">{detail.phoneButton.text}</p>
                      <a href={`tel:${detail.phoneButton.number}`} className="text-[12px] text-fg-muted hover:text-brand-light truncate block">{detail.phoneButton.number}</a>
                    </div>
                  </div>
                )}
                {detail.linkButton && (
                  <div className="flex items-center gap-3 bg-surface2 border border-line rounded-lg px-3.5 py-2.5">
                    <div className="w-9 h-9 rounded-lg bg-info-dim flex items-center justify-center shrink-0"><Link2 size={16} className="text-info" /></div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-fg truncate">{detail.linkButton.text}</p>
                      <a href={detail.linkButton.url} target="_blank" rel="noopener noreferrer" title={detail.linkButton.url} className="text-[12px] text-info hover:underline truncate block">{detail.linkButton.url}</a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Profile picture */}
      {detail.profileImage && (
        <Card title="Campaign Profile Picture">
          <div className="flex items-center gap-4 flex-wrap">
            <img
              src={detail.profileImage}
              alt="Campaign profile"
              className="w-24 h-24 rounded-full object-cover border border-line bg-surface2"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <button
              onClick={() => downloadImage(detail.profileImage!, `${detail.campaignName}-profile`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-dim border border-brand-border rounded-[7px] cursor-pointer text-brand-light text-xs font-semibold"
            >
              <Download size={12} /> Download Profile Picture
            </button>
          </div>
        </Card>
      )}

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
