import React, { useState, useEffect } from 'react';
import {
  Book, Rocket, Sparkles, MessageSquare, Users, Download, Calendar,
  Shield, FileText, Mail, Github, Linkedin, Globe, Menu, X,
  CheckCircle2, Image, Send, BarChart3, HelpCircle, User,
  Database, Filter, Eye, Upload,
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { id: 'getting-started', label: 'Getting Started', icon: Rocket },
  { id: 'features',        label: 'Features',        icon: Sparkles },
  { id: 'how-to-use',      label: 'How to Use',      icon: Book },
  { id: 'faq',             label: 'FAQ',             icon: HelpCircle },
  { id: 'about',           label: 'About Creator',   icon: User },
];

const Section = ({ id, icon: Icon, title, children, accent = '#16a34a' }: {
  id: string; icon: React.FC<{ size?: number; color?: string }>; title: string; children: React.ReactNode; accent?: string;
}) => (
  <section id={id} className="scroll-mt-20">
    <div className="bg-surface border border-line rounded-[14px] overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-line">
        <div className="w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: `${accent}22` }}>
          <Icon size={17} color={accent} />
        </div>
        <h2 className="text-lg font-bold text-fg m-0">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </section>
);

const InfoCard = ({ icon: Icon, title, desc, accent }: { icon: React.FC<{ size?: number; color?: string }>; title: string; desc: string; accent: string }) => (
  <div className="bg-surface2 border border-line rounded-[10px] px-4 py-3.5 border-l-[3px]" style={{ borderLeftColor: accent }}>
    <div className="flex items-center gap-2 mb-1.5">
      <Icon size={14} color={accent} />
      <p className="text-[13px] font-bold text-fg m-0">{title}</p>
    </div>
    <p className="text-xs text-fg-muted leading-[1.6] m-0">{desc}</p>
  </div>
);

const Step = ({ n, title, desc }: { n: number; title: string; desc: string }) => (
  <div className="flex gap-3">
    <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-px">{n}</div>
    <div>
      <p className="text-[13px] font-semibold text-fg mb-0.5">{title}</p>
      <p className="text-xs text-fg-muted leading-[1.6]">{desc}</p>
    </div>
  </div>
);

const HowToCard = ({ icon: Icon, title, steps, accent }: { icon: React.FC<{ size?: number; color?: string }>; title: string; steps: string[]; accent: string }) => (
  <div className="bg-surface2 border border-line rounded-[10px] border-l-[3px] px-[18px] py-3.5" style={{ borderLeftColor: accent }}>
    <div className="flex items-center gap-2 mb-3">
      <Icon size={15} color={accent} />
      <p className="text-[13px] font-bold text-fg m-0">{title}</p>
    </div>
    <ol className="m-0 pl-[18px] flex flex-col gap-1.5">
      {steps.map((s, i) => (
        <li key={i} className="text-xs text-fg-muted leading-[1.6]" dangerouslySetInnerHTML={{ __html: s }} />
      ))}
    </ol>
  </div>
);

const FaqItem = ({ q, children }: { q: string; children: React.ReactNode }) => (
  <div className="bg-surface2 border border-line rounded-[10px] px-[18px] py-3.5">
    <p className="text-[13px] font-bold text-fg mb-1.5">{q}</p>
    <div className="text-xs text-fg-muted leading-[1.7]">{children}</div>
  </div>
);

const ExtLink = ({ href, icon: Icon, title, sub, bg }: { href: string; icon: React.FC<{ size?: number; color?: string }>; title: string; sub: string; bg?: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    className={cn('flex items-center gap-3 px-3.5 py-3 border border-line rounded-[9px] no-underline transition-opacity hover:opacity-85', bg ?? 'bg-surface2')}>
    <Icon size={16} color="#f4f4f5" />
    <div>
      <p className="text-[13px] font-bold text-fg m-0">{title}</p>
      <p className="text-[11px] text-fg-muted mt-px">{sub}</p>
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
    <div className="flex flex-col gap-5">

      {/* Hero banner */}
      <div className="border border-brand-border rounded-[14px] px-8 pt-8 pb-7 text-center bg-[linear-gradient(135deg,rgba(22,163,74,0.18)_0%,rgba(59,130,246,0.1)_100%)]">
        <span className="text-[10px] font-bold text-brand-light bg-brand-dim border border-brand-border rounded-[20px] px-3 py-[3px] uppercase tracking-[0.1em]">v1.0.0 · Production Ready</span>
        <h1 className="text-[28px] font-extrabold text-fg mt-3.5 mb-2 tracking-[-0.5px]">WhatsApp Campaign Manager</h1>
        <p className="text-sm text-fg-muted leading-[1.7] max-w-[520px] mx-auto mb-5">
          Your complete solution for bulk WhatsApp marketing campaigns with advanced tracking and analytics.
        </p>
        <button onClick={() => scrollTo('getting-started')} className="px-[22px] py-[9px] bg-brand text-white font-semibold text-[13px] border-none rounded-lg cursor-pointer">
          Get Started →
        </button>
      </div>

      <div className="flex gap-5 items-start">

        {/* Sidebar */}
        <aside className="w-[200px] flex-shrink-0 sticky top-20">
          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(v => !v)} className="lg:hidden w-full flex items-center justify-between px-3.5 py-2.5 bg-surface border border-line rounded-[9px] cursor-pointer text-fg text-[13px] font-semibold mb-2">
            Navigation {mobileOpen ? <X size={15} /> : <Menu size={15} />}
          </button>

          <nav className="bg-surface border border-line rounded-[10px] p-2 flex flex-col gap-0.5">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => scrollTo(id)} className={cn(
                'flex items-center gap-2 px-2.5 py-2 rounded-[7px] border-none cursor-pointer w-full text-left transition-colors text-[13px]',
                active === id ? 'bg-brand-dim text-brand-light font-semibold' : 'bg-transparent text-fg-muted font-medium'
              )}>
                <Icon size={14} className={active === id ? 'text-brand-light' : 'text-fg-subtle'} />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-3 bg-surface border border-line rounded-[10px] p-3.5">
            <p className="text-[11px] font-bold text-fg-muted uppercase tracking-[0.07em] mb-2.5 flex items-center gap-1.5">
              <Sparkles size={11} /> Quick Links
            </p>
            <div className="flex flex-col gap-1.5">
              {[
                { href: 'https://github.com/M0rs-Ruki/WhatsApp-Campaigner', label: 'GitHub Repo' },
                { href: '/support', label: 'Email Support' },
              ].map(({ href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="block px-2.5 py-1.5 bg-surface2 border border-line rounded-[7px] text-xs font-semibold text-brand-light no-underline">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Getting Started */}
          <Section id="getting-started" icon={Rocket} title="Getting Started">
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-fg-muted leading-[1.7]">
                WhatsApp Campaign Manager enables businesses to create, manage, and track WhatsApp marketing campaigns at scale. Send bulk messages with media attachments, track performance, and manage customer interactions—all from one dashboard.
              </p>

              <div className="bg-surface2 border border-line rounded-[10px] px-[18px] py-3.5">
                <p className="text-xs font-bold text-fg-muted uppercase tracking-[0.07em] mb-2.5 flex items-center gap-1.5"><Users size={12} /> Who is it for?</p>
                <div className="flex flex-col gap-1.5">
                  {[
                    ['Marketing Teams', 'Run campaigns efficiently with bulk messaging'],
                    ['Small Businesses', 'Reach customers directly via WhatsApp'],
                    ['Resellers', 'Manage multiple client campaigns'],
                    ['Admins', 'Oversee all campaigns with advanced controls'],
                  ].map(([r, d]) => (
                    <div key={r} className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-brand-light flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-fg-muted m-0"><strong className="text-fg">{r}:</strong> {d}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]">
                {[['💻 Device', 'Desktop, Tablet, Mobile'], ['🌐 Browser', 'Chrome, Firefox, Safari'], ['📶 Internet', 'Stable connection required'], ['👤 Account', 'Registration needed']].map(([t, d]) => (
                  <div key={t} className="px-3 py-2.5 bg-surface2 border border-line rounded-[9px]">
                    <p className="text-xs font-bold text-fg mb-[3px]">{t}</p>
                    <p className="text-[11px] text-fg-muted">{d}</p>
                  </div>
                ))}
              </div>

              <div className="bg-brand-dim border border-brand-border rounded-[10px] px-[18px] py-3.5">
                <p className="text-xs font-bold text-brand-light uppercase tracking-[0.07em] mb-3 flex items-center gap-1.5"><Rocket size={12} /> Quick Setup</p>
                <div className="flex flex-col gap-2.5">
                  <Step n={1} title="Create Your Account" desc="Register with your company name, email, and phone number." />
                  <Step n={2} title="Login to Dashboard" desc="Access your personalized campaign management dashboard." />
                  <Step n={3} title="Create Your First Campaign" desc={'Navigate to "Send WhatsApp" and start sending!'} />
                </div>
              </div>
            </div>
          </Section>

          {/* Features */}
          <Section id="features" icon={Sparkles} title="Features" accent="#3b82f6">
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
              {[
                { icon: MessageSquare, title: 'Campaign Management', desc: 'Create unlimited campaigns with customizable messages, media, and interactive buttons.', accent: '#4ade80' },
                { icon: Send, title: 'Bulk Messaging', desc: 'Send to thousands simultaneously. Import numbers via bulk upload or manual entry.', accent: '#3b82f6' },
                { icon: Download, title: 'Excel Export', desc: 'Download campaign data as professionally formatted Excel files.', accent: '#a78bfa' },
                { icon: Calendar, title: 'Advanced Filtering', desc: 'Filter campaigns by date range and paginate with custom entries per page.', accent: '#fbbf24' },
                { icon: Shield, title: 'Admin Controls', desc: 'Role-based access: Admin, Reseller, User. Admins can view all data.', accent: '#f87171' },
                { icon: BarChart3, title: 'Campaign Analytics', desc: 'Track performance with stats: recipient count, message length, history.', accent: '#4ade80' },
                { icon: Image, title: 'Media Support', desc: 'Upload images and videos. Cloud storage ensures fast delivery.', accent: '#a78bfa' },
                { icon: FileText, title: 'Support Tickets', desc: 'Built-in complaint system with status tracking and admin responses.', accent: '#fbbf24' },
              ].map(f => <InfoCard key={f.title} {...f} />)}
            </div>
          </Section>

          {/* How to Use */}
          <Section id="how-to-use" icon={Book} title="How to Use" accent="#a78bfa">
            <div className="flex flex-col gap-3">
              <HowToCard icon={MessageSquare} title="1. Create Your First Campaign" accent="#4ade80" steps={[
                'Navigate to <strong>Send WhatsApp</strong> from the sidebar',
                'Enter a <strong>Campaign Name</strong> (e.g., "Summer Sale 2026")',
                'Write your <strong>Message</strong> using the rich text editor',
                'Select <strong>Country Code</strong> and add mobile numbers',
                'Click <strong>Send Campaign</strong>',
              ]} />
              <HowToCard icon={Upload} title="2. Upload Media (Optional)" accent="#a78bfa" steps={[
                'In the campaign form, find the <strong>Media Attachment</strong> section',
                'Click <strong>Choose File</strong> to select an image',
                'Supported: JPG, PNG, GIF (max 5 MB)',
                'File preview appears once selected',
              ]} />
              <HowToCard icon={BarChart3} title="3. Track Campaign Reports" accent="#3b82f6" steps={[
                'Go to <strong>WhatsApp Reports</strong> in the sidebar',
                'View all campaigns in a sortable table',
                'Use pagination to browse (10/25/50 per page)',
                'Click the Eye icon to view full campaign details',
              ]} />
              <HowToCard icon={Filter} title="4. Filter by Date" accent="#fbbf24" steps={[
                'On the Reports page, find the date filter section',
                'Pick a <strong>From</strong> and <strong>To</strong> date',
                'Results filter automatically',
                'Click <strong>Clear</strong> to reset filters',
              ]} />
              <HowToCard icon={Eye} title="5. View Campaign Details" accent="#4ade80" steps={[
                'Click the Eye icon on any campaign row',
                'A modal shows user info, campaign details, and statistics',
                'Click <strong>Close</strong> to return',
              ]} />
              <HowToCard icon={Download} title="6. Download Campaign Data" accent="#a78bfa" steps={[
                'Click the Download icon on the Reports page',
                'An Excel file generates automatically',
                'File name: <code style="background:#27272a;padding:1px 5px;border-radius:4px">CampaignName_YYYY-MM-DD.xlsx</code>',
                'Contains all details and recipient phone numbers',
              ]} />
            </div>
          </Section>

          {/* FAQ */}
          <Section id="faq" icon={HelpCircle} title="FAQ" accent="#fbbf24">
            <div className="flex flex-col gap-2.5">
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
                <ul className="m-0 pl-4">
                  <li><strong className="text-fg">User:</strong> Create and manage own campaigns</li>
                  <li><strong className="text-fg">Reseller:</strong> Manage multiple client campaigns</li>
                  <li><strong className="text-fg">Admin:</strong> Full access to everything</li>
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
                Use the built-in Complaints system (sidebar → Complaints) or email <a href="mailto:hello@prominds.digital" className="text-brand-light">hello@prominds.digital</a>.
              </FaqItem>
            </div>
          </Section>

          {/* About */}
          <Section id="about" icon={User} title="About Creator" accent="#3b82f6">
            <div className="flex flex-col gap-5">

              {/* ProMinds Digital */}
              <div className="bg-surface2 border border-line rounded-[10px] p-5">
                <div className="flex items-center gap-3.5 mb-3.5">
                  <div className="w-[52px] h-[52px] rounded-xl overflow-hidden border border-line flex-shrink-0">
                    <img src="/promindsdigital.png" alt="ProMinds Digital" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-fg">ProMinds Digital</p>
                    <p className="text-xs text-info">Digital Marketing & IT Solutions</p>
                  </div>
                </div>
                <p className="text-xs text-fg-muted leading-[1.7] mb-3.5">
                  A brand-driven performance marketing company specializing in Digital Marketing, WhatsApp Marketing, SEO, and web/app development.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3.5">
                  {['Digital Marketing', 'WhatsApp Marketing', 'SEO', 'Web Development', 'App Development', 'Performance Marketing'].map(s => (
                    <span key={s} className="text-[11px] font-semibold px-2.5 py-[3px] bg-surface border border-line rounded-[20px] text-fg-muted">{s}</span>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <ExtLink href="https://prominds.digital/" icon={Globe} title="ProMinds Digital Website" sub="prominds.digital" />
                  <ExtLink href="https://www.facebook.com/promindsdigital/" icon={Globe} title="Facebook Page" sub="Follow for updates" />
                </div>
              </div>

              {/* Developer */}
              <div className="bg-surface2 border border-line rounded-[10px] p-5">
                <div className="flex items-center gap-3.5 mb-3.5">
                  <div className="w-[52px] h-[52px] rounded-full overflow-hidden border border-line flex-shrink-0">
                    <img src="/anup-pradhan.jpeg" alt="Anup Pradhan" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-fg">Anup Pradhan</p>
                    <p className="text-xs text-brand-light">Full-Stack MERN Developer</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-dim border border-brand-border rounded-[20px] text-brand-light mt-1 inline-block">Solo Developer · Built Entire Product</span>
                  </div>
                </div>
                <p className="text-xs text-fg-muted leading-[1.7] mb-3.5">
                  Sole architect and developer of the WhatsApp Campaign Management System. Specialized in building scalable full-stack applications with MERN + TypeScript. Single-handedly developed this platform from concept to production.
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3.5">
                  {['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Mongoose', 'Tailwind CSS', 'JWT', 'Cloudinary', 'ExcelJS', 'Vite'].map(t => (
                    <span key={t} className="text-[11px] font-semibold px-2.5 py-[3px] bg-surface border border-brand-border rounded-[20px] text-brand-light">{t}</span>
                  ))}
                </div>
                <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                  <ExtLink href="https://github.com/M0rs-Ruki/WhatsApp-Campaigner" icon={Github} title="GitHub Repository" sub="View source code" />
                  <ExtLink href="https://www.linkedin.com/in/anup-pradhan77" icon={Linkedin} title="LinkedIn Profile" sub="Connect professionally" />
                  <ExtLink href="https://morscode.site/" icon={Globe} title="Portfolio Website" sub="Other projects" />
                  <ExtLink href="mailto:anuppradhan929@gmail.com" icon={Mail} title="Email Developer" sub="anuppradhan929@gmail.com" />
                </div>
              </div>

              {/* Bottom stats */}
              <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(100px,1fr))]">
                {[
                  { icon: Database, label: 'MongoDB', sub: 'Database', color: '#4ade80' },
                  { icon: Shield, label: 'JWT', sub: 'Security', color: '#3b82f6' },
                  { icon: Sparkles, label: 'React', sub: 'Frontend', color: '#a78bfa' },
                  { icon: Rocket, label: 'Node.js', sub: 'Backend', color: '#fbbf24' },
                ].map(({ icon: Icon, label, sub, color }) => (
                  <div key={label} className="bg-surface2 border border-line rounded-[9px] px-2 py-3 text-center">
                    <Icon size={18} color={color} className="mb-1.5 mx-auto" />
                    <p className="text-[13px] font-bold mb-0.5" style={{ color }}>{label}</p>
                    <p className="text-[10px] text-fg-subtle">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Collab note */}
              <div className="px-4 py-3 rounded-[9px] text-center bg-[#fbbf2414] border border-[#fbbf2444]">
                <p className="text-xs text-fg-muted leading-[1.7]">
                  🤝 <strong className="text-warning">Collaboration:</strong> Conceptualized by <strong className="text-fg">ProMinds Digital</strong>, developed from scratch by <strong className="text-fg">Anup Pradhan</strong> as the sole full-stack developer.
                </p>
              </div>

              <div className="text-center p-2.5 bg-surface2 border border-line rounded-[9px]">
                <p className="text-xs text-fg-muted">
                  ⭐ If you find this helpful, star it on{' '}
                  <a href="https://github.com/M0rs-Ruki/WhatsApp-Campaigner" target="_blank" rel="noopener noreferrer" className="text-brand-light font-semibold no-underline">GitHub</a>!
                </p>
              </div>
            </div>
          </Section>

        </main>
      </div>
    </div>
  );
};

export default Documentation;
