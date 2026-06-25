import React, { useState, useEffect } from 'react';
import {
  Book, Rocket, Sparkles, MessageSquare, Users, Download, Calendar,
  Shield, FileText, Mail, Github, Linkedin, Globe, Menu, X,
  CheckCircle2, Image, Send, BarChart3, HelpCircle, User,
  Database, Filter, Eye, Upload,
} from 'lucide-react';
import { D } from '../theme/tokens';

const navItems = [
  { id: 'getting-started', label: 'Getting Started', icon: Rocket },
  { id: 'features',        label: 'Features',        icon: Sparkles },
  { id: 'how-to-use',      label: 'How to Use',      icon: Book },
  { id: 'faq',             label: 'FAQ',             icon: HelpCircle },
  { id: 'about',           label: 'About Creator',   icon: User },
];

const Section = ({ id, icon: Icon, title, children, accent = D.green }: {
  id: string; icon: React.FC<{ size?: number; color?: string }>; title: string; children: React.ReactNode; accent?: string;
}) => (
  <section id={id} style={{ scrollMarginTop: 80 }}>
    <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: `1px solid ${D.border}` }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} color={accent} />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: D.text, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  </section>
);

const InfoCard = ({ icon: Icon, title, desc, accent }: { icon: React.FC<{ size?: number; color?: string }>; title: string; desc: string; accent: string }) => (
  <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: '14px 16px', borderLeft: `3px solid ${accent}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <Icon size={14} color={accent} />
      <p style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: 0 }}>{title}</p>
    </div>
    <p style={{ fontSize: 12, color: D.textMuted, lineHeight: 1.6, margin: 0 }}>{desc}</p>
  </div>
);

const Step = ({ n, title, desc }: { n: number; title: string; desc: string }) => (
  <div style={{ display: 'flex', gap: 12 }}>
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: D.green, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0, marginTop: 1 }}>{n}</div>
    <div>
      <p style={{ fontSize: 13, fontWeight: 600, color: D.text, marginBottom: 2 }}>{title}</p>
      <p style={{ fontSize: 12, color: D.textMuted, lineHeight: 1.6 }}>{desc}</p>
    </div>
  </div>
);

const HowToCard = ({ icon: Icon, title, steps, accent }: { icon: React.FC<{ size?: number; color?: string }>; title: string; steps: string[]; accent: string }) => (
  <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, borderLeft: `3px solid ${accent}`, padding: '14px 18px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <Icon size={15} color={accent} />
      <p style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: 0 }}>{title}</p>
    </div>
    <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {steps.map((s, i) => (
        <li key={i} style={{ fontSize: 12, color: D.textMuted, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: s }} />
      ))}
    </ol>
  </div>
);

const FaqItem = ({ q, children }: { q: string; children: React.ReactNode }) => (
  <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: '14px 18px' }}>
    <p style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 6 }}>{q}</p>
    <div style={{ fontSize: 12, color: D.textMuted, lineHeight: 1.7 }}>{children}</div>
  </div>
);

const ExtLink = ({ href, icon: Icon, title, sub, bg = D.surface2 }: { href: string; icon: React.FC<{ size?: number; color?: string }>; title: string; sub: string; bg?: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: bg, border: `1px solid ${D.border}`, borderRadius: 9, textDecoration: 'none', transition: 'opacity 0.15s' }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
    <Icon size={16} color={D.text} />
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, color: D.text, margin: 0 }}>{title}</p>
      <p style={{ fontSize: 11, color: D.textMuted, marginTop: 1 }}>{sub}</p>
    </div>
  </a>
);

const Documentation = () => {
  const [active, setActive] = useState('getting-started');
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActive(id); setMobileOpen(false); }
  };

  useEffect(() => {
    const handler = () => {
      const pos = window.scrollY + 120;
      for (const { id } of navItems) {
        const el = document.getElementById(id);
        if (el && pos >= el.offsetTop && pos < el.offsetTop + el.offsetHeight) { setActive(id); break; }
      }
    };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} select option{background:#18181b;color:#f4f4f5}`}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Hero banner */}
        <div style={{ background: `linear-gradient(135deg, rgba(22,163,74,0.18) 0%, rgba(59,130,246,0.1) 100%)`, border: `1px solid ${D.greenBorder}`, borderRadius: 14, padding: '32px 32px 28px', textAlign: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: D.greenLight, background: D.greenDim, border: `1px solid ${D.greenBorder}`, borderRadius: 20, padding: '3px 12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>v1.0.0 · Production Ready</span>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: D.text, margin: '14px 0 8px', letterSpacing: '-0.5px' }}>WhatsApp Campaign Manager</h1>
          <p style={{ fontSize: 14, color: D.textMuted, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 20px' }}>
            Your complete solution for bulk WhatsApp marketing campaigns with advanced tracking and analytics.
          </p>
          <button onClick={() => scrollTo('getting-started')} style={{ padding: '9px 22px', background: D.green, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Get Started →
          </button>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

          {/* Sidebar */}
          <aside style={{ width: 200, flexShrink: 0, position: 'sticky', top: 80 }}>
            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen(v => !v)} className="lg:hidden"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: D.surface, border: `1px solid ${D.border}`, borderRadius: 9, cursor: 'pointer', color: D.text, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              Navigation {mobileOpen ? <X size={15} /> : <Menu size={15} />}
            </button>

            <nav style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {navItems.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => scrollTo(id)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.12s',
                  background: active === id ? D.greenDim : 'transparent',
                  color: active === id ? D.greenLight : D.textMuted,
                  fontWeight: active === id ? 600 : 500, fontSize: 13,
                }}>
                  <Icon size={14} color={active === id ? D.greenLight : D.textSubtle} />
                  {label}
                </button>
              ))}
            </nav>

            <div style={{ marginTop: 12, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '14px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: D.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={11} /> Quick Links
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { href: 'https://github.com/M0rs-Ruki/WhatsApp-Campaigner', label: 'GitHub Repo' },
                  { href: '/support', label: 'Email Support' },
                ].map(({ href, label }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', padding: '6px 10px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, color: D.greenLight, textDecoration: 'none' }}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </aside>

          {/* Main */}
          <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Getting Started */}
            <Section id="getting-started" icon={Rocket} title="Getting Started">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <p style={{ fontSize: 13, color: D.textMuted, lineHeight: 1.7 }}>
                  WhatsApp Campaign Manager enables businesses to create, manage, and track WhatsApp marketing campaigns at scale. Send bulk messages with media attachments, track performance, and manage customer interactions—all from one dashboard.
                </p>

                <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: '14px 18px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: D.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={12} /> Who is it for?</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      ['Marketing Teams', 'Run campaigns efficiently with bulk messaging'],
                      ['Small Businesses', 'Reach customers directly via WhatsApp'],
                      ['Resellers', 'Manage multiple client campaigns'],
                      ['Admins', 'Oversee all campaigns with advanced controls'],
                    ].map(([r, d]) => (
                      <div key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <CheckCircle2 size={12} style={{ color: D.greenLight, flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 12, color: D.textMuted, margin: 0 }}><strong style={{ color: D.text }}>{r}:</strong> {d}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  {[['💻 Device', 'Desktop, Tablet, Mobile'], ['🌐 Browser', 'Chrome, Firefox, Safari'], ['📶 Internet', 'Stable connection required'], ['👤 Account', 'Registration needed']].map(([t, d]) => (
                    <div key={t} style={{ padding: '10px 12px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 9 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: D.text, marginBottom: 3 }}>{t}</p>
                      <p style={{ fontSize: 11, color: D.textMuted }}>{d}</p>
                    </div>
                  ))}
                </div>

                <div style={{ background: D.greenDim, border: `1px solid ${D.greenBorder}`, borderRadius: 10, padding: '14px 18px' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: D.greenLight, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Rocket size={12} /> Quick Setup</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Step n={1} title="Create Your Account" desc="Register with your company name, email, and phone number." />
                    <Step n={2} title="Login to Dashboard" desc="Access your personalized campaign management dashboard." />
                    <Step n={3} title="Create Your First Campaign" desc={'Navigate to "Send WhatsApp" and start sending!'} />
                  </div>
                </div>
              </div>
            </Section>

            {/* Features */}
            <Section id="features" icon={Sparkles} title="Features" accent={D.blue}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {[
                  { icon: MessageSquare, title: 'Campaign Management', desc: 'Create unlimited campaigns with customizable messages, media, and interactive buttons.', accent: D.greenLight },
                  { icon: Send, title: 'Bulk Messaging', desc: 'Send to thousands simultaneously. Import numbers via bulk upload or manual entry.', accent: D.blue },
                  { icon: Download, title: 'Excel Export', desc: 'Download campaign data as professionally formatted Excel files.', accent: D.purple },
                  { icon: Calendar, title: 'Advanced Filtering', desc: 'Filter campaigns by date range and paginate with custom entries per page.', accent: D.amber },
                  { icon: Shield, title: 'Admin Controls', desc: 'Role-based access: Admin, Reseller, User. Admins can view all data.', accent: D.red },
                  { icon: BarChart3, title: 'Campaign Analytics', desc: 'Track performance with stats: recipient count, message length, history.', accent: D.greenLight },
                  { icon: Image, title: 'Media Support', desc: 'Upload images and videos. Cloud storage ensures fast delivery.', accent: D.purple },
                  { icon: FileText, title: 'Support Tickets', desc: 'Built-in complaint system with status tracking and admin responses.', accent: D.amber },
                ].map(f => <InfoCard key={f.title} {...f} />)}
              </div>
            </Section>

            {/* How to Use */}
            <Section id="how-to-use" icon={Book} title="How to Use" accent={D.purple}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <HowToCard icon={MessageSquare} title="1. Create Your First Campaign" accent={D.greenLight} steps={[
                  'Navigate to <strong>Send WhatsApp</strong> from the sidebar',
                  'Enter a <strong>Campaign Name</strong> (e.g., "Summer Sale 2026")',
                  'Write your <strong>Message</strong> using the rich text editor',
                  'Select <strong>Country Code</strong> and add mobile numbers',
                  'Click <strong>Send Campaign</strong>',
                ]} />
                <HowToCard icon={Upload} title="2. Upload Media (Optional)" accent={D.purple} steps={[
                  'In the campaign form, find the <strong>Media Attachment</strong> section',
                  'Click <strong>Choose File</strong> to select an image',
                  'Supported: JPG, PNG, GIF (max 5 MB)',
                  'File preview appears once selected',
                ]} />
                <HowToCard icon={BarChart3} title="3. Track Campaign Reports" accent={D.blue} steps={[
                  'Go to <strong>WhatsApp Reports</strong> in the sidebar',
                  'View all campaigns in a sortable table',
                  'Use pagination to browse (10/25/50 per page)',
                  'Click the Eye icon to view full campaign details',
                ]} />
                <HowToCard icon={Filter} title="4. Filter by Date" accent={D.amber} steps={[
                  'On the Reports page, find the date filter section',
                  'Pick a <strong>From</strong> and <strong>To</strong> date',
                  'Results filter automatically',
                  'Click <strong>Clear</strong> to reset filters',
                ]} />
                <HowToCard icon={Eye} title="5. View Campaign Details" accent={D.greenLight} steps={[
                  'Click the Eye icon on any campaign row',
                  'A modal shows user info, campaign details, and statistics',
                  'Click <strong>Close</strong> to return',
                ]} />
                <HowToCard icon={Download} title="6. Download Campaign Data" accent={D.purple} steps={[
                  'Click the Download icon on the Reports page',
                  'An Excel file generates automatically',
                  'File name: <code style="background:#27272a;padding:1px 5px;border-radius:4px">CampaignName_YYYY-MM-DD.xlsx</code>',
                  'Contains all details and recipient phone numbers',
                ]} />
              </div>
            </Section>

            {/* FAQ */}
            <Section id="faq" icon={HelpCircle} title="FAQ" accent={D.amber}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <FaqItem q="How many phone numbers can I add?">
                  No limit! The system supports bulk import and handles large recipient lists efficiently.
                </FaqItem>
                <FaqItem q="What file formats are supported for media?">
                  Images (JPG, PNG, GIF, WebP), video (MP4, MOV, WebM), and PDF documents. Max 5 MB per file.
                </FaqItem>
                <FaqItem q="Can I edit a campaign after creating it?">
                  Currently campaigns cannot be edited once created. Create a new one with updated details.
                </FaqItem>
                <FaqItem q="What's the difference between User, Reseller, and Admin?">
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    <li><strong style={{ color: D.text }}>User:</strong> Create and manage own campaigns</li>
                    <li><strong style={{ color: D.text }}>Reseller:</strong> Manage multiple client campaigns</li>
                    <li><strong style={{ color: D.text }}>Admin:</strong> Full access to everything</li>
                  </ul>
                </FaqItem>
                <FaqItem q="How do I export campaign data?">
                  Click the Download button on the Reports page. An Excel file is generated automatically.
                </FaqItem>
                <FaqItem q="Is my data secure?">
                  Yes. All data is encrypted, passwords are hashed, and auth uses JWT tokens with regular backups.
                </FaqItem>
                <FaqItem q="Can I use this on mobile?">
                  Absolutely! The platform is fully responsive across smartphones, tablets, and desktops.
                </FaqItem>
                <FaqItem q="How do I report a problem?">
                  Use the built-in Complaints system (sidebar → Complaints) or email <a href="mailto:hello@prominds.digital" style={{ color: D.greenLight }}>hello@prominds.digital</a>.
                </FaqItem>
              </div>
            </Section>

            {/* About */}
            <Section id="about" icon={User} title="About Creator" accent={D.blue}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* ProMinds Digital */}
                <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', border: `1px solid ${D.border}`, flexShrink: 0 }}>
                      <img src="/promindsdigital.png" alt="ProMinds Digital" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: D.text }}>ProMinds Digital</p>
                      <p style={{ fontSize: 12, color: D.blue }}>Digital Marketing & IT Solutions</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: D.textMuted, lineHeight: 1.7, marginBottom: 14 }}>
                    A brand-driven performance marketing company specializing in Digital Marketing, WhatsApp Marketing, SEO, and web/app development.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {['Digital Marketing', 'WhatsApp Marketing', 'SEO', 'Web Development', 'App Development', 'Performance Marketing'].map(s => (
                      <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', background: D.surface, border: `1px solid ${D.border}`, borderRadius: 20, color: D.textMuted }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <ExtLink href="https://prominds.digital/" icon={Globe} title="ProMinds Digital Website" sub="prominds.digital" />
                    <ExtLink href="https://www.facebook.com/promindsdigital/" icon={Globe} title="Facebook Page" sub="Follow for updates" />
                  </div>
                </div>

                {/* Developer */}
                <div style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 10, padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: `1px solid ${D.border}`, flexShrink: 0 }}>
                      <img src="/anup-pradhan.jpeg" alt="Anup Pradhan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: D.text }}>Anup Pradhan</p>
                      <p style={{ fontSize: 12, color: D.greenLight }}>Full-Stack MERN Developer</p>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: D.greenDim, border: `1px solid ${D.greenBorder}`, borderRadius: 20, color: D.greenLight, marginTop: 4, display: 'inline-block' }}>Solo Developer · Built Entire Product</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: D.textMuted, lineHeight: 1.7, marginBottom: 14 }}>
                    Sole architect and developer of the WhatsApp Campaign Management System. Specialized in building scalable full-stack applications with MERN + TypeScript. Single-handedly developed this platform from concept to production.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Mongoose', 'Tailwind CSS', 'JWT', 'Cloudinary', 'ExcelJS', 'Vite'].map(t => (
                      <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', background: D.surface, border: `1px solid ${D.greenBorder}`, borderRadius: 20, color: D.greenLight }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                    <ExtLink href="https://github.com/M0rs-Ruki/WhatsApp-Campaigner" icon={Github} title="GitHub Repository" sub="View source code" />
                    <ExtLink href="https://www.linkedin.com/in/anup-pradhan77" icon={Linkedin} title="LinkedIn Profile" sub="Connect professionally" />
                    <ExtLink href="https://morscode.site/" icon={Globe} title="Portfolio Website" sub="Other projects" />
                    <ExtLink href="mailto:anuppradhan929@gmail.com" icon={Mail} title="Email Developer" sub="anuppradhan929@gmail.com" />
                  </div>
                </div>

                {/* Bottom stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
                  {[
                    { icon: Database, label: 'MongoDB', sub: 'Database', color: D.greenLight },
                    { icon: Shield, label: 'JWT', sub: 'Security', color: D.blue },
                    { icon: Sparkles, label: 'React', sub: 'Frontend', color: D.purple },
                    { icon: Rocket, label: 'Node.js', sub: 'Backend', color: D.amber },
                  ].map(({ icon: Icon, label, sub, color }) => (
                    <div key={label} style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 9, padding: '12px 8px', textAlign: 'center' }}>
                      <Icon size={18} color={color} style={{ marginBottom: 6 }} />
                      <p style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 2 }}>{label}</p>
                      <p style={{ fontSize: 10, color: D.textSubtle }}>{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Collab note */}
                <div style={{ padding: '12px 16px', background: `${D.amber}14`, border: `1px solid ${D.amber}44`, borderRadius: 9, textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: D.textMuted, lineHeight: 1.7 }}>
                    🤝 <strong style={{ color: D.amber }}>Collaboration:</strong> Conceptualized by <strong style={{ color: D.text }}>ProMinds Digital</strong>, developed from scratch by <strong style={{ color: D.text }}>Anup Pradhan</strong> as the sole full-stack developer.
                  </p>
                </div>

                <div style={{ textAlign: 'center', padding: '10px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 9 }}>
                  <p style={{ fontSize: 12, color: D.textMuted }}>
                    ⭐ If you find this helpful, star it on{' '}
                    <a href="https://github.com/M0rs-Ruki/WhatsApp-Campaigner" target="_blank" rel="noopener noreferrer" style={{ color: D.greenLight, fontWeight: 600, textDecoration: 'none' }}>GitHub</a>!
                  </p>
                </div>
              </div>
            </Section>

          </main>
        </div>
      </div>
    </>
  );
};

export default Documentation;
