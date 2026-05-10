import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Phone, User, Shield, HelpCircle, MessageSquare,
  ExternalLink, CheckCircle2, Send,
} from 'lucide-react';
import { api } from '../api/client';
import { D, inp, onFocusGreen, onBlurBorder } from '../theme/tokens';
import { Spinner } from '../components/ui/Spinner';
import { PageHeader } from '../components/ui/PageHeader';
import { Toast } from '../components/ui/Alert';

interface CreatorData {
  companyName: string;
  email: string;
  number: string;
  role: string;
  status: string;
  image?: string;
}

const SectionCard = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, overflow: 'hidden' }}>
    {children}
  </div>
);

const SectionHead = ({ icon: Icon, title, accent = D.green }: { icon: React.FC<{ size?: number; color?: string }>; title: string; accent?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: `1px solid ${D.border}`, background: D.surface2 }}>
    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={15} color={accent} />
    </div>
    <p style={{ fontSize: 13, fontWeight: 700, color: D.text }}>{title}</p>
  </div>
);

const ContactLink = ({ href, icon: Icon, label, value, accent }: { href: string; icon: React.FC<{ size?: number; color?: string }>; label: string; value: string; accent: string }) => (
  <a href={href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 9, textDecoration: 'none', transition: 'border-color 0.15s' }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = accent; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = D.border; }}>
    <div style={{ width: 34, height: 34, borderRadius: 8, background: `${accent}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={16} color={accent} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: D.textSubtle, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
    </div>
    <ExternalLink size={13} style={{ color: D.textSubtle, flexShrink: 0 }} />
  </a>
);

const FLabel = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: D.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{children}</label>
);

const Support = () => {
  const navigate = useNavigate();
  const [creatorData, setCreatorData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [supportForm, setSupportForm] = useState({ name: '', email: '', number: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ success: boolean; message?: string; data: CreatorData }>('/api/dashboard/support');
        if (data.success) setCreatorData(data.data);
        else setError(data.message || 'Failed to load support information');
      } catch { setError('Network error. Please try again.'); }
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
        setToast({ type: 'success', msg: data.message || "Message sent! We'll get back to you soon." });
        setSupportForm({ name: '', email: '', number: '', subject: '', message: '' });
      } else {
        setToast({ type: 'error', msg: data.message || 'Failed to send message.' });
      }
    } catch { setToast({ type: 'error', msg: 'Network error. Please try again.' }); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spinner label="Loading support info…" />;

  const roleAccent: Record<string, string> = { admin: D.blue, reseller: D.greenLight, user: D.amber };
  const statusColor = (s: string) => s === 'active' ? D.greenLight : D.red;

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PageHeader title="Support & Help" subtitle="Get assistance from your creator or platform support" />

        {error && (
          <div style={{ padding: '10px 14px', background: D.redDim, border: `1px solid ${D.redBorder}`, borderRadius: 8 }}>
            <p style={{ fontSize: 13, color: D.red }}>{error}</p>
          </div>
        )}

        {/* Creator contact */}
        {creatorData && (
          <SectionCard>
            <SectionHead icon={User} title="Your Account Manager" accent={D.blue} />
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: creatorData.image ? 'transparent' : D.greenDim, border: `1px solid ${D.border}`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {creatorData.image
                    ? <img src={creatorData.image} alt={creatorData.companyName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 22, fontWeight: 700, color: D.greenLight }}>{creatorData.companyName.charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: D.text }}>{creatorData.companyName}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', color: roleAccent[creatorData.role] || D.textMuted, background: `${roleAccent[creatorData.role] || D.textMuted}22` }}>
                      {creatorData.role}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', color: statusColor(creatorData.status), background: `${statusColor(creatorData.status)}22` }}>
                      {creatorData.status}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ContactLink href={`mailto:${creatorData.email}`} icon={Mail} label="Email" value={creatorData.email} accent={D.blue} />
                <ContactLink href={`tel:${creatorData.number}`} icon={Phone} label="Phone" value={creatorData.number} accent={D.greenLight} />
              </div>
              <div style={{ padding: '10px 14px', background: D.greenDim, border: `1px solid ${D.greenBorder}`, borderRadius: 8 }}>
                <p style={{ fontSize: 12, color: D.textMuted, lineHeight: 1.6 }}>
                  Contact your <strong style={{ color: D.text }}>{creatorData.role}</strong> for account, credits, or campaign queries.
                </p>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Platform support */}
        <SectionCard>
          <SectionHead icon={Shield} title="Platform Support" accent={D.purple} />
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ContactLink href="mailto:hello@prominds.digital" icon={Mail} label="Platform Email" value="hello@prominds.digital" accent={D.purple} />
            <ContactLink href="tel:+919876543210" icon={Phone} label="Support Hotline · Mon–Sat 9AM–6PM" value="+91 98765 43210" accent={D.greenLight} />
            <div style={{ borderTop: `1px solid ${D.border}`, paddingTop: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: D.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>File a Formal Complaint</p>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 9 }}>
                <CheckCircle2 size={15} style={{ color: D.greenLight, flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: D.text, marginBottom: 4 }}>Submit via Complaints System</p>
                  <p style={{ fontSize: 12, color: D.textMuted, lineHeight: 1.6, marginBottom: 10 }}>For issues requiring formal tracking and admin response.</p>
                  <button onClick={() => navigate('/complaints')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: D.green, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 7, cursor: 'pointer' }}>
                    <MessageSquare size={13} /> Go to Complaints
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Quick tips */}
        <SectionCard>
          <SectionHead icon={HelpCircle} title="Quick Help Tips" accent={D.amber} />
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              {[
                { title: 'Account & Credits', desc: `Contact your ${creatorData?.role || 'creator'} for balance, credits, or account status issues.` },
                { title: 'Technical Issues', desc: 'Reach out to platform support for bugs, errors, or technical problems.' },
                { title: 'Campaign Help', desc: 'Check the Documentation page for guides on creating and managing campaigns.' },
                { title: 'Formal Complaints', desc: 'Use the Complaints section for issues requiring formal tracking.' },
              ].map(t => (
                <div key={t.title} style={{ padding: '12px 14px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 9 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: D.text, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={12} style={{ color: D.greenLight }} /> {t.title}
                  </p>
                  <p style={{ fontSize: 12, color: D.textMuted, lineHeight: 1.6 }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Support form */}
        <SectionCard>
          <SectionHead icon={Send} title="Send Support Request" />
          <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <FLabel>Your Name *</FLabel>
                <input type="text" name="name" value={supportForm.name} onChange={handleChange} placeholder="Full name" required disabled={submitting} style={inp} onFocus={onFocusGreen} onBlur={onBlurBorder} />
              </div>
              <div>
                <FLabel>Email *</FLabel>
                <input type="email" name="email" value={supportForm.email} onChange={handleChange} placeholder="you@example.com" required disabled={submitting} style={inp} onFocus={onFocusGreen} onBlur={onBlurBorder} />
              </div>
              <div>
                <FLabel>Phone *</FLabel>
                <input type="tel" name="number" value={supportForm.number} onChange={handleChange} placeholder="+91 98765 43210" required disabled={submitting} style={inp} onFocus={onFocusGreen} onBlur={onBlurBorder} />
              </div>
              <div>
                <FLabel>Subject *</FLabel>
                <input type="text" name="subject" value={supportForm.subject} onChange={handleChange} placeholder="Brief subject" required disabled={submitting} style={inp} onFocus={onFocusGreen} onBlur={onBlurBorder} />
              </div>
            </div>
            <div>
              <FLabel>Message *</FLabel>
              <textarea name="message" value={supportForm.message} onChange={handleChange} placeholder="Describe your issue in detail…" rows={5} required disabled={submitting}
                style={{ ...inp, resize: 'vertical' as const, lineHeight: 1.6 }}
                onFocus={onFocusGreen} onBlur={onBlurBorder}
              />
            </div>
            <div>
              <button type="submit" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: D.green, color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', borderRadius: 8, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? (
                  <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} /> Sending…</>
                ) : (
                  <><Send size={14} /> Send Request</>
                )}
              </button>
            </div>
          </form>
        </SectionCard>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #18181b; color: #f4f4f5; }
        ::placeholder { color: ${D.textSubtle}; }
      `}</style>
    </>
  );
};

export default Support;
