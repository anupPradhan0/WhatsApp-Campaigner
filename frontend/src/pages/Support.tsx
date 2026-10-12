import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, User, MessageSquare, Send,
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

const ContactRow = ({ href, icon: Icon, label, value }: { href: string; icon: React.FC<{ size?: number; className?: string }>; label: string; value: string }) => (
  <div className="flex items-center gap-3 py-3 border-t border-line first:border-t-0 first:pt-0 last:pb-0">
    <Icon size={16} className="text-brand-light shrink-0" />
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-[0.07em] mb-0.5">{label}</p>
      <a href={href} className="text-[13px] font-semibold text-fg no-underline hover:text-brand-light break-all">{value}</a>
    </div>
  </div>
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

      <div className="rounded-xl border border-brand-border bg-[linear-gradient(120deg,rgba(22,163,74,0.14),rgba(59,130,246,0.07))] px-5 py-5 sm:px-6 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-brand-light uppercase tracking-[0.1em] mb-1">WhatsApp Campaigner</p>
          <h2 className="text-lg sm:text-xl font-bold text-fg mb-1">How can we help?</h2>
          <p className="text-sm text-fg-muted">Powerful messaging at your fingertips. Get help from your account manager or our support team.</p>
        </div>
        <a href="/docs" className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-line bg-surface text-sm font-semibold text-fg no-underline hover:border-brand-light transition-colors shrink-0">View documentation</a>
      </div>

      {error && (
        <div className="px-3.5 py-2.5 bg-danger-dim border border-danger-border rounded-lg">
          <p className="text-[13px] text-danger">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)] gap-5 items-start">
        <SectionCard>
          <SectionHead icon={Send} title="Send us a message" />
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

      <div className="flex flex-col gap-5">
        {creatorData ? (
          <SectionCard>
            <SectionHead icon={User} title="Your account contact" accent="info" />
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-11 h-11 rounded-xl border border-line overflow-hidden shrink-0 flex items-center justify-center", creatorData.image ? "bg-transparent" : "bg-brand-dim")}>
                  {creatorData.image ? <img src={creatorData.image} alt={creatorData.companyName} className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-brand-light">{creatorData.companyName.charAt(0).toUpperCase()}</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-fg truncate">{creatorData.companyName}</p>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", roleBadge[creatorData.role] || roleBadgeFallback)}>{creatorData.role}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", statusBadge(creatorData.status))}>{creatorData.status}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-fg-muted leading-relaxed mb-3">This is the {creatorData.role} who created your account. Contact them for account, credit, or campaign questions.</p>
              <ContactRow href={`mailto:${creatorData.email}`} icon={Mail} label="Email" value={creatorData.email} />
              <ContactRow href={`tel:${creatorData.number}`} icon={Phone} label="Phone" value={creatorData.number} />
            </div>
          </SectionCard>
        ) : (
          <SectionCard>
            <SectionHead icon={User} title="Your account contact" accent="info" />
            <div className="p-5">
              <p className="text-sm font-semibold text-fg mb-1">No account contact assigned</p>
              <p className="text-xs text-fg-muted leading-relaxed">Use the message form to contact the support team.</p>
            </div>
          </SectionCard>
        )}

        <SectionCard>
          <SectionHead icon={MessageSquare} title="Formal complaints" accent="violet" />
          <div className="p-5">
            <p className="text-xs text-fg-muted leading-relaxed mb-3">Track an issue and receive an admin response through the Complaints system.</p>
            <button onClick={() => navigate('/complaints')} className="inline-flex items-center gap-2 px-3.5 py-2 bg-brand text-white font-semibold text-[13px] border-none rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
              <MessageSquare size={14} /> Open Complaints
            </button>
          </div>
        </SectionCard>
      </div>
      </div>
    </div>
  );
};

export default Support;
