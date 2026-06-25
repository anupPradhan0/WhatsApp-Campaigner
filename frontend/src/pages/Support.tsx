import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, User, Shield, HelpCircle, MessageSquare,
  ExternalLink, CheckCircle2, Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, getErrorMessage } from '../api/client';
import { cn } from '../lib/utils';
import { fieldCls } from '../theme/classes';
import { Spinner } from '../components/ui/Spinner';
import { PageHeader } from '../components/ui/PageHeader';

interface CreatorData {
  companyName: string;
  email: string;
  number: string;
  role: string;
  status: string;
  image?: string;
}

type Tone = 'brand' | 'brand-light' | 'info' | 'violet' | 'warning';

// Icon color + faint background ("${accent}22"/"${accent}1a") per accent tone.
const toneIcon: Record<Tone, string> = {
  'brand': 'text-brand',
  'brand-light': 'text-brand-light',
  'info': 'text-info',
  'violet': 'text-violet',
  'warning': 'text-warning',
};
const toneBox: Record<Tone, string> = {
  'brand': 'bg-brand/[0.13]',
  'brand-light': 'bg-brand-light/[0.13]',
  'info': 'bg-info/[0.13]',
  'violet': 'bg-violet/[0.13]',
  'warning': 'bg-warning/[0.13]',
};
const toneBoxLink: Record<Tone, string> = {
  'brand': 'bg-brand/10',
  'brand-light': 'bg-brand-light/10',
  'info': 'bg-info/10',
  'violet': 'bg-violet/10',
  'warning': 'bg-warning/10',
};
const toneHoverBorder: Record<Tone, string> = {
  'brand': 'hover:border-brand',
  'brand-light': 'hover:border-brand-light',
  'info': 'hover:border-info',
  'violet': 'hover:border-violet',
  'warning': 'hover:border-warning',
};

const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-surface border border-line rounded-xl overflow-hidden">
    {children}
  </div>
);

const SectionHead = ({ icon: Icon, title, accent = 'brand' }: { icon: React.FC<{ size?: number }>; title: string; accent?: Tone }) => (
  <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-line bg-surface2">
    <div className={cn("w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0", toneBox[accent], toneIcon[accent])}>
      <Icon size={15} />
    </div>
    <p className="text-[13px] font-bold text-fg">{title}</p>
  </div>
);

const ContactLink = ({ href, icon: Icon, label, value, accent }: { href: string; icon: React.FC<{ size?: number }>; label: string; value: string; accent: Tone }) => (
  <a href={href} className={cn("flex items-center gap-3 px-4 py-3 bg-surface2 border border-line rounded-[9px] no-underline transition-colors", toneHoverBorder[accent])}>
    <div className={cn("w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0", toneBoxLink[accent], toneIcon[accent])}>
      <Icon size={16} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-[0.07em] mb-0.5">{label}</p>
      <p className="text-[13px] font-semibold text-fg overflow-hidden text-ellipsis whitespace-nowrap">{value}</p>
    </div>
    <ExternalLink size={13} className="text-fg-subtle shrink-0" />
  </a>
);

const FLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[11px] font-bold text-fg-muted uppercase tracking-[0.07em] mb-1.5">{children}</label>
);

const Support = () => {
  const navigate = useNavigate();
  const [creatorData, setCreatorData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [supportForm, setSupportForm] = useState({ name: '', email: '', number: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ success: boolean; message?: string; data: CreatorData }>('/api/dashboard/support');
        if (data.success) setCreatorData(data.data);
        else setError(data.message || 'Failed to load support information');
      } catch (e) { setError(getErrorMessage(e)); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSupportForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post<{ success: boolean; message?: string }>('/api/support', supportForm);
      if (data.success) {
        toast.success(data.message || "Message sent! We'll get back to you soon.");
        setSupportForm({ name: '', email: '', number: '', subject: '', message: '' });
      } else {
        toast.error(data.message || 'Failed to send message.');
      }
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spinner label="Loading support info…" />;

  // role/status badge text color + faint ("${color}22") background per tone.
  const roleBadge: Record<string, string> = {
    admin: 'text-info bg-info/[0.13]',
    reseller: 'text-brand-light bg-brand-light/[0.13]',
    user: 'text-warning bg-warning/[0.13]',
  };
  const roleBadgeFallback = 'text-fg-muted bg-fg-muted/[0.13]';
  const statusBadge = (s: string) => s === 'active' ? 'text-brand-light bg-brand-light/[0.13]' : 'text-danger bg-danger/[0.13]';

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Support & Help" subtitle="Get assistance from your creator or platform support" />

      {error && (
        <div className="px-3.5 py-2.5 bg-danger-dim border border-danger-border rounded-lg">
          <p className="text-[13px] text-danger">{error}</p>
        </div>
      )}

      {/* Creator contact */}
      {creatorData && (
        <SectionCard>
          <SectionHead icon={User} title="Your Account Manager" accent="info" />
          <div className="p-5 flex flex-col gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className={cn("w-14 h-14 rounded-xl border border-line overflow-hidden shrink-0 flex items-center justify-center", creatorData.image ? "bg-transparent" : "bg-brand-dim")}>
                {creatorData.image
                  ? <img src={creatorData.image} alt={creatorData.companyName} className="w-full h-full object-cover" />
                  : <span className="text-[22px] font-bold text-brand-light">{creatorData.companyName.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div>
                <p className="text-[15px] font-bold text-fg">{creatorData.companyName}</p>
                <div className="flex gap-1.5 mt-[5px] flex-wrap">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-[20px] uppercase", roleBadge[creatorData.role] || roleBadgeFallback)}>
                    {creatorData.role}
                  </span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-[20px] uppercase", statusBadge(creatorData.status))}>
                    {creatorData.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <ContactLink href={`mailto:${creatorData.email}`} icon={Mail} label="Email" value={creatorData.email} accent="info" />
              <ContactLink href={`tel:${creatorData.number}`} icon={Phone} label="Phone" value={creatorData.number} accent="brand-light" />
            </div>
            <div className="px-3.5 py-2.5 bg-brand-dim border border-brand-border rounded-lg">
              <p className="text-xs text-fg-muted leading-[1.6]">
                Contact your <strong className="text-fg">{creatorData.role}</strong> for account, credits, or campaign queries.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Platform support */}
      <SectionCard>
        <SectionHead icon={Shield} title="Platform Support" accent="violet" />
        <div className="p-5 flex flex-col gap-3">
          <ContactLink href="mailto:hello@prominds.digital" icon={Mail} label="Platform Email" value="hello@prominds.digital" accent="violet" />
          <ContactLink href="tel:+919876543210" icon={Phone} label="Support Hotline · Mon–Sat 9AM–6PM" value="+91 98765 43210" accent="brand-light" />
          <div className="border-t border-line pt-3.5">
            <p className="text-xs font-bold text-fg-muted mb-2.5 uppercase tracking-[0.07em]">File a Formal Complaint</p>
            <div className="flex items-start gap-2.5 px-3.5 py-3 bg-surface2 border border-line rounded-[9px]">
              <CheckCircle2 size={15} className="text-brand-light shrink-0 mt-px" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-fg mb-1">Submit via Complaints System</p>
                <p className="text-xs text-fg-muted leading-[1.6] mb-2.5">For issues requiring formal tracking and admin response.</p>
                <button onClick={() => navigate('/complaints')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white font-semibold text-[13px] border-none rounded-[7px] cursor-pointer">
                  <MessageSquare size={13} /> Go to Complaints
                </button>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Quick tips */}
      <SectionCard>
        <SectionHead icon={HelpCircle} title="Quick Help Tips" accent="warning" />
        <div className="p-5">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
            {[
              { title: 'Account & Credits', desc: `Contact your ${creatorData?.role || 'creator'} for balance, credits, or account status issues.` },
              { title: 'Technical Issues', desc: 'Reach out to platform support for bugs, errors, or technical problems.' },
              { title: 'Campaign Help', desc: 'Check the Documentation page for guides on creating and managing campaigns.' },
              { title: 'Formal Complaints', desc: 'Use the Complaints section for issues requiring formal tracking.' },
            ].map(t => (
              <div key={t.title} className="px-3.5 py-3 bg-surface2 border border-line rounded-[9px]">
                <p className="text-xs font-bold text-fg mb-[5px] flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-brand-light" /> {t.title}
                </p>
                <p className="text-xs text-fg-muted leading-[1.6]">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Support form */}
      <SectionCard>
        <SectionHead icon={Send} title="Send Support Request" />
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3.5">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
            <div>
              <FLabel>Your Name *</FLabel>
              <input type="text" name="name" value={supportForm.name} onChange={handleChange} placeholder="Full name" required disabled={submitting} className={cn(fieldCls, "placeholder:text-fg-subtle")} />
            </div>
            <div>
              <FLabel>Email *</FLabel>
              <input type="email" name="email" value={supportForm.email} onChange={handleChange} placeholder="you@example.com" required disabled={submitting} className={cn(fieldCls, "placeholder:text-fg-subtle")} />
            </div>
            <div>
              <FLabel>Phone *</FLabel>
              <input type="tel" name="number" value={supportForm.number} onChange={handleChange} placeholder="+91 98765 43210" required disabled={submitting} className={cn(fieldCls, "placeholder:text-fg-subtle")} />
            </div>
            <div>
              <FLabel>Subject *</FLabel>
              <input type="text" name="subject" value={supportForm.subject} onChange={handleChange} placeholder="Brief subject" required disabled={submitting} className={cn(fieldCls, "placeholder:text-fg-subtle")} />
            </div>
          </div>
          <div>
            <FLabel>Message *</FLabel>
            <textarea name="message" value={supportForm.message} onChange={handleChange} placeholder="Describe your issue in detail…" rows={5} required disabled={submitting}
              className={cn(fieldCls, "resize-y leading-[1.6] placeholder:text-fg-subtle")}
            />
          </div>
          <div>
            <button type="submit" disabled={submitting} className={cn("inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-white font-semibold text-sm border-none rounded-lg", submitting ? "cursor-not-allowed opacity-60" : "cursor-pointer")}>
              {submitting ? (
                <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Sending…</>
              ) : (
                <><Send size={14} /> Send Request</>
              )}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};

export default Support;
