import React, { useState, useEffect } from 'react';
import {
  Book, Rocket, Sparkles, MessageSquare, Users, Download, Calendar,
  Shield, FileText, Mail, Github, Linkedin, Globe, Menu, X,
  CheckCircle2, Image, Send, BarChart3, HelpCircle, User,
  Filter, Eye, Upload, Coins, Ban, Video, Link2,
  UserCircle, FileSpreadsheet,
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { id: 'getting-started', label: 'Getting Started',     icon: Rocket },
  { id: 'user-roles',      label: 'User Roles',          icon: Shield },
  { id: 'features',        label: 'Features',            icon: Sparkles },
  { id: 'create-campaign', label: 'Creating a Campaign', icon: Send },
  { id: 'media',           label: 'Media & Uploads',     icon: Image },
  { id: 'custom-domain',   label: 'Custom Domain',       icon: Globe },
  { id: 'how-to-use',      label: 'How to Use',          icon: Book },
  { id: 'faq',             label: 'FAQ',                 icon: HelpCircle },
  { id: 'about',           label: 'About Creator',       icon: User },
];

const ROLES = [
  {
    name: 'Super Admin', color: '#f87171', icon: Shield, tag: 'God mode',
    can: [
      'Full access to every account and every campaign in the whole system',
      'Create Admins, Resellers, and Users',
      'Add credits to any account — credits are minted at no cost to the super admin',
      'Send campaigns for free (unlimited, no credits deducted)',
      'See the entire network in Tree View, plus manage News, Complaints and any campaign status',
    ],
    cannot: ['Nothing is restricted — the super admin sits at the very top of the hierarchy'],
  },
  {
    name: 'Admin', color: '#3b82f6', icon: Users, tag: 'Manages a downline',
    can: [
      'Create Resellers and Users beneath them',
      'Manage their whole downline — edit, freeze, delete, reset password',
      'Add or remove credits for downline accounts, funded from the admin’s own wallet',
      'See every campaign created anywhere in their downline (a reseller’s users included)',
      'Manually change the status of any campaign in their downline, and post News',
      'Send their own campaigns (paid from their balance)',
    ],
    cannot: [
      'Cannot create other Admins or a Super Admin',
      'Cannot see or act on accounts outside their own downline',
    ],
  },
  {
    name: 'Reseller', color: '#4ade80', icon: UserCircle, tag: 'Manages users',
    can: [
      'Create Users beneath them',
      'Manage their own users — edit, freeze, delete, reset password',
      'Add or remove credits for their users, funded from the reseller’s own wallet',
      'See and manage campaigns created by their users',
      'Send their own campaigns (paid from their balance)',
    ],
    cannot: [
      'Cannot create Admins or other Resellers',
      'Cannot access any account outside their downline',
    ],
  },
  {
    name: 'User', color: '#fbbf24', icon: User, tag: 'Runs campaigns',
    can: [
      'Create and send their own WhatsApp campaigns (paid from their balance)',
      'Attach media, a campaign profile picture, and interactive buttons',
      'View their own campaign reports and export them to Excel',
      'Raise support complaints and read News',
    ],
    cannot: [
      'Cannot create any accounts',
      'Cannot see other users’ data or campaigns',
    ],
  },
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
        <span className="text-[10px] font-bold text-brand-light bg-brand-dim border border-brand-border rounded-[20px] px-3 py-[3px] uppercase tracking-[0.1em]">v1.2.0 · Production Ready</span>
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
                  <Step n={3} title="Create Your First Campaign" desc={'Navigate to "Campaign" and start sending!'} />
                </div>
              </div>
            </div>
          </Section>

          {/* User Roles */}
          <Section id="user-roles" icon={Shield} title="User Roles & Permissions" accent="#f87171">
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-fg-muted leading-[1.7]">
                The platform has <strong className="text-fg">four roles</strong> in a strict top-to-bottom hierarchy.
                Each role can manage everything below it, and every account only ever sees its own data plus the data of accounts beneath it (its “downline”).
              </p>

              <div className="bg-surface2 border border-line rounded-[10px] px-[18px] py-3 text-center">
                <p className="text-[13px] font-bold text-fg tracking-wide m-0">
                  Super&nbsp;Admin&nbsp;&nbsp;→&nbsp;&nbsp;Admin&nbsp;&nbsp;→&nbsp;&nbsp;Reseller&nbsp;&nbsp;→&nbsp;&nbsp;User
                </p>
              </div>

              {ROLES.map((r) => (
                <div key={r.name} className="bg-surface2 border border-line rounded-[10px] border-l-[3px] px-[18px] py-4" style={{ borderLeftColor: r.color }}>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <r.icon size={16} color={r.color} />
                    <p className="text-[14px] font-bold text-fg m-0">{r.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-[20px] border" style={{ color: r.color, borderColor: `${r.color}55`, background: `${r.color}18` }}>{r.tag}</span>
                  </div>
                  <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
                    <div>
                      <p className="text-[11px] font-bold text-brand-light uppercase tracking-[0.06em] mb-1.5">Can do</p>
                      <ul className="m-0 p-0 flex flex-col gap-1.5 list-none">
                        {r.can.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-fg-muted leading-[1.55]">
                            <CheckCircle2 size={12} className="text-brand-light flex-shrink-0 mt-0.5" /><span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-danger uppercase tracking-[0.06em] mb-1.5">Cannot do</p>
                      <ul className="m-0 p-0 flex flex-col gap-1.5 list-none">
                        {r.cannot.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-fg-muted leading-[1.55]">
                            <Ban size={12} className="text-danger flex-shrink-0 mt-0.5" /><span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}

              <div className="bg-brand-dim border border-brand-border rounded-[10px] px-[18px] py-3.5">
                <p className="text-xs font-bold text-brand-light uppercase tracking-[0.07em] mb-2 flex items-center gap-1.5"><Coins size={12} /> Credits &amp; Balance</p>
                <p className="text-xs text-fg-muted leading-[1.7] m-0">
                  Your <strong className="text-fg">balance is your credits</strong>. Every message costs <strong className="text-fg">1 credit</strong> — one recipient equals one credit.
                  Admins and Resellers fund their downline’s credits from their <strong className="text-fg">own wallet</strong>; the Super Admin mints credits and sends campaigns for free.
                  If a campaign has more numbers than you have credits, you’re warned first and can choose to send to only as many as you can afford.
                </p>
              </div>
            </div>
          </Section>

          {/* Features */}
          <Section id="features" icon={Sparkles} title="Features" accent="#3b82f6">
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
              {[
                { icon: MessageSquare, title: 'Campaign Management', desc: 'Create campaigns with a rich-text message, media, a profile picture, and interactive buttons.', accent: '#4ade80' },
                { icon: Send, title: 'Bulk Messaging', desc: 'Reach many recipients at once — type numbers manually or import them from a CSV / Excel file.', accent: '#3b82f6' },
                { icon: Image, title: 'Media & Profile Picture', desc: 'Attach an image, video or PDF (max 5 MB) and a display picture shown with the campaign.', accent: '#a78bfa' },
                { icon: Link2, title: 'Interactive Buttons', desc: 'Add a Call button (phone number) and a Link button (URL) to drive replies and clicks.', accent: '#4ade80' },
                { icon: Coins, title: 'Credit System', desc: '1 credit = 1 message. Insufficient balance? You’re warned and can send a partial batch.', accent: '#fbbf24' },
                { icon: Download, title: 'Excel Export', desc: 'Download campaign data — including full +country-code phone numbers — as a newer .xlsx or an old Excel 97-2003 .xls.', accent: '#a78bfa' },
                { icon: Calendar, title: 'Filtering & Pagination', desc: 'Filter reports by date range and page through results (10 / 25 / 50 per page).', accent: '#3b82f6' },
                { icon: Shield, title: 'Role-Based Access', desc: 'Super Admin, Admin, Reseller and User — each scoped to their own downline.', accent: '#f87171' },
                { icon: BarChart3, title: 'Reports & Tree View', desc: 'Track every campaign and visualise your whole account network in Tree View.', accent: '#4ade80' },
                { icon: FileText, title: 'Support & News', desc: 'Built-in complaints with admin responses, plus a News feed from your admins.', accent: '#fbbf24' },
              ].map(f => <InfoCard key={f.title} {...f} />)}
            </div>
          </Section>

          {/* Creating a Campaign */}
          <Section id="create-campaign" icon={Send} title="Creating a Campaign — Step by Step" accent="#4ade80">
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-fg-muted leading-[1.7]">
                Open <strong className="text-fg">Campaign</strong> from the sidebar and fill in the form. Only the name, message and recipients are required — everything else is optional.
              </p>
              <div className="bg-brand-dim border border-brand-border rounded-[10px] px-[18px] py-3.5">
                <div className="flex flex-col gap-2.5">
                  <Step n={1} title="Campaign Name" desc={'A label just for you — e.g. "Summer Sale 2026". Minimum 3 characters.'} />
                  <Step n={2} title="Message" desc="Write your text in the rich-text editor. This is what recipients receive." />
                  <Step n={3} title="Media (optional)" desc="Attach one image, video or PDF (up to 5 MB). A preview appears once selected." />
                  <Step n={4} title="Profile Picture (optional)" desc="Add a display image shown alongside the campaign. Images only." />
                  <Step n={5} title="Buttons (optional)" desc="Add a Call button (text + phone number) and/or a Link button (text + URL)." />
                  <Step n={6} title="Recipients" desc="Pick a country code, then type numbers (comma or new-line separated) or import a CSV / Excel file — numbers are auto-detected from any column." />
                  <Step n={7} title="Send Campaign" desc="Click Send. Each recipient costs 1 credit. If you don’t have enough, you can confirm a partial send." />
                </div>
              </div>
              <div className="bg-surface2 border border-line rounded-[10px] border-l-[3px] px-[18px] py-3.5" style={{ borderLeftColor: '#fbbf24' }}>
                <p className="text-[13px] font-bold text-fg mb-1 flex items-center gap-1.5"><Coins size={14} className="text-warning" /> Not enough credits?</p>
                <p className="text-xs text-fg-muted leading-[1.7] m-0">
                  If a campaign has more numbers than your balance, nothing is charged — you’ll see a prompt showing how many you can afford.
                  Choose <strong className="text-fg">Cancel</strong> to top up first, or continue to send to only that many numbers.
                </p>
              </div>
              <div className="bg-surface2 border border-line rounded-[10px] border-l-[3px] px-[18px] py-3.5" style={{ borderLeftColor: '#3b82f6' }}>
                <p className="text-[13px] font-bold text-fg mb-1 flex items-center gap-1.5"><BarChart3 size={14} className="text-info" /> After sending</p>
                <p className="text-xs text-fg-muted leading-[1.7] m-0">
                  Every new campaign starts as <strong className="text-fg">Pending</strong>. The status stays pending until an <strong className="text-fg">Admin or Super Admin</strong> reviews and updates it — recipient statuses always mirror the campaign’s status.
                </p>
              </div>
            </div>
          </Section>

          {/* Media & Uploads */}
          <Section id="media" icon={Image} title="Media &amp; Uploads" accent="#a78bfa">
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                <InfoCard icon={Image} title="Images" accent="#4ade80" desc="JPG, JPEG, PNG, GIF, WebP — up to 5 MB each." />
                <InfoCard icon={Video} title="Videos" accent="#3b82f6" desc="MP4, MOV (QuickTime), WebM — up to 5 MB each." />
                <InfoCard icon={FileText} title="Documents" accent="#fbbf24" desc="PDF files — up to 5 MB each." />
                <InfoCard icon={UserCircle} title="Profile Picture" accent="#a78bfa" desc="An image shown with the campaign. Same image formats, up to 5 MB." />
                <InfoCard icon={FileSpreadsheet} title="Recipient Import" accent="#4ade80" desc="Upload a CSV or Excel (.xlsx / .xls). Phone numbers are auto-detected from any column. Max 5 MB." />
              </div>
              <div className="bg-surface2 border border-line rounded-[10px] px-[18px] py-3.5">
                <p className="text-xs font-bold text-fg-muted uppercase tracking-[0.07em] mb-2 flex items-center gap-1.5"><Upload size={12} /> Good to know</p>
                <ul className="m-0 pl-[18px] flex flex-col gap-1.5">
                  <li className="text-xs text-fg-muted leading-[1.6]">The <strong className="text-fg">size limit is 5 MB per file</strong> — compress large videos before uploading.</li>
                  <li className="text-xs text-fg-muted leading-[1.6]">You can attach <strong className="text-fg">one media file and one profile picture</strong> per campaign.</li>
                  <li className="text-xs text-fg-muted leading-[1.6]">Unsupported file types are rejected with a clear error — stick to the formats above.</li>
                </ul>
              </div>
            </div>
          </Section>

          {/* Custom Domain */}
          <Section id="custom-domain" icon={Globe} title="Custom Domain (White Label)" accent="#3b82f6">
            <p className="text-[13px] text-fg-muted leading-[1.7] mb-4">
              Run the panel on <strong className="text-fg">your own web address</strong> instead of ours —
              your customers see <code className="font-mono text-brand-light">panel.yourbrand.com</code> and your
              branding, never the platform's. HTTPS is set up automatically once the domain is verified.
            </p>

            <div className="bg-surface2 border border-line rounded-[10px] border-l-[3px] border-l-[#f87171] px-[18px] py-3.5 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={15} color="#f87171" />
                <p className="text-[13px] font-bold text-fg m-0">Who can set this up?</p>
              </div>
              <ul className="m-0 pl-[18px] flex flex-col gap-1.5">
                <li className="text-xs text-fg-muted leading-[1.6]"><strong className="text-fg">Super Admin, Admin and Reseller</strong> — the tab appears under <strong className="text-fg">Manage Business → Custom Domain</strong>.</li>
                <li className="text-xs text-fg-muted leading-[1.6]"><strong className="text-fg">Users</strong> cannot — they don't run their own portal, so the tab is hidden for them.</li>
                <li className="text-xs text-fg-muted leading-[1.6]">Each account gets <strong className="text-fg">one</strong> domain, and a domain can't be claimed by two accounts.</li>
              </ul>
            </div>

            <p className="text-[13px] font-bold text-fg mb-3">Step by step</p>
            <div className="flex flex-col gap-3.5 mb-4">
              <Step n={1} title="Pick a subdomain" desc="Go to Manage Business → Custom Domain and type the address you want, e.g. panel.yourbrand.com. It must be a subdomain — a root domain like yourbrand.com cannot hold a CNAME record. Click Save." />
              <Step n={2} title="Add the DNS record at your registrar" desc="Log in wherever your domain is registered (GoDaddy, Hostinger, Cloudflare, Namecheap…), open its DNS / Manage DNS page, and add the record shown on screen. Every field has a copy button — paste them exactly." />
              <Step n={3} title="Click Verify" desc="Come back and press Verify now. We look up your DNS and confirm it points at us. If it isn't visible yet, wait and press Re-check — DNS can take a few minutes to a few hours to spread worldwide." />
              <Step n={4} title="Open your new address" desc="Once it says Verified, visit your domain. The security certificate is issued on the first visit, so the very first load can take a few extra seconds." />
            </div>

            <p className="text-[13px] font-bold text-fg mb-2">The DNS record</p>
            <div className="overflow-x-auto mb-2">
              <table className="w-full border-collapse bg-surface2 border border-line rounded-[10px] overflow-hidden">
                <thead>
                  <tr className="border-b border-line">
                    {['Field', 'What to enter'].map(h => (
                      <th key={h} className="px-3.5 py-2.5 text-left text-[10px] text-fg-subtle font-bold uppercase tracking-[0.08em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Type', 'CNAME', 'Not an A record — only a CNAME will verify.'],
                    ['Name', 'panel', 'Just the subdomain part. Some registrars want the full host instead.'],
                    ['Value', 'shown in the app', 'Copy it from the Custom Domain tab — it points at our servers.'],
                    ['TTL', 'leave default', 'Any value works; lower simply updates sooner.'],
                  ].map(([f, v, note]) => (
                    <tr key={f} className="border-b border-line/50">
                      <td className="px-3.5 py-2.5 text-xs font-semibold text-fg whitespace-nowrap">{f}</td>
                      <td className="px-3.5 py-2.5">
                        <code className="text-xs font-mono text-brand-light">{v}</code>
                        <p className="text-[11px] text-fg-subtle mt-0.5">{note}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-fg-subtle leading-[1.6] mb-4">
              The exact record is always shown in the app — it previews live as you type, so you can see it before saving.
            </p>

            <p className="text-[13px] font-bold text-fg mb-3">If something goes wrong</p>
            <div className="flex flex-col gap-2.5">
              <FaqItem q={'"No CNAME record found for that domain yet"'}>
                The record hasn't spread yet, or it was saved under a different name. Check the <strong className="text-fg">Name</strong> field
                at your registrar (try the full host if just the label didn't work), then wait a few minutes and press <strong className="text-fg">Re-check</strong>.
              </FaqItem>
              <FaqItem q={'"The CNAME does not point at the platform"'}>
                A record exists, but its value is something else — often a leftover parking or hosting record.
                Delete any other A or CNAME record for that same subdomain, leaving only ours.
              </FaqItem>
              <FaqItem q="I added an A record with an IP address — why doesn't it work?">
                Verification only accepts a <strong className="text-fg">CNAME</strong>. An A record pins you to one fixed IP that can change,
                which would silently break your panel. Delete the A record and add the CNAME instead.
              </FaqItem>
              <FaqItem q="Can I use my main domain, like yourbrand.com?">
                No. The DNS standard doesn't allow a CNAME on a root domain — it would clash with your email and website records.
                Use a subdomain such as <code className="font-mono text-brand-light">panel.</code>, <code className="font-mono text-brand-light">app.</code> or <code className="font-mono text-brand-light">wa.</code>
              </FaqItem>
              <FaqItem q="My site shows 404 / the certificate looks wrong">
                Give it a minute after verifying and reload — the certificate is requested on the first visit.
                If it persists, press <strong className="text-fg">Re-check</strong>; that re-runs the routing setup safely.
              </FaqItem>
              <FaqItem q="How do I change or remove my domain?">
                Type a new address and press <strong className="text-fg">Update</strong>, or use <strong className="text-fg">Remove domain</strong>.
                Removing frees the address for another account and sends your panel back to the default web address.
              </FaqItem>
            </div>
          </Section>

          {/* How to Use */}
          <Section id="how-to-use" icon={Book} title="How to Use" accent="#a78bfa">
            <div className="flex flex-col gap-3">
              <HowToCard icon={MessageSquare} title="1. Create Your First Campaign" accent="#4ade80" steps={[
                'Navigate to <strong>Campaign</strong> from the sidebar',
                'Enter a <strong>Campaign Name</strong> (e.g., "Summer Sale 2026")',
                'Write your <strong>Message</strong> using the rich text editor',
                'Select <strong>Country Code</strong> and add mobile numbers',
                'Click <strong>Send Campaign</strong>',
              ]} />
              <HowToCard icon={Upload} title="2. Add Media & Profile Picture (Optional)" accent="#a78bfa" steps={[
                'In the campaign form, open the <strong>Media Attachment</strong> section',
                'Choose an <strong>image, video or PDF</strong> — JPG, PNG, GIF, WebP, MP4, MOV, WebM or PDF (max 5 MB)',
                'Add a <strong>Profile Picture</strong> (image only) to show alongside the campaign',
                'A preview appears once each file is selected',
              ]} />
              <HowToCard icon={FileSpreadsheet} title="3. Import Recipients from a File" accent="#3b82f6" steps={[
                'In the <strong>Recipients</strong> section choose the file-upload option',
                'Upload a <strong>CSV or Excel</strong> file (.csv / .xlsx / .xls, max 5 MB)',
                'Phone numbers are <strong>auto-detected from any column</strong>',
                'Review the detected numbers before sending',
              ]} />
              <HowToCard icon={BarChart3} title="4. Track Campaign Reports" accent="#3b82f6" steps={[
                'Go to <strong>WhatsApp Reports</strong> in the sidebar',
                'View all campaigns in a sortable table',
                'Use pagination to browse (10/25/50 per page)',
                'Click the Eye icon to view full campaign details',
              ]} />
              <HowToCard icon={Filter} title="5. Filter by Date" accent="#fbbf24" steps={[
                'On the Reports page, find the date filter section',
                'Pick a <strong>From</strong> and <strong>To</strong> date',
                'Results filter automatically',
                'Click <strong>Clear</strong> to reset filters',
              ]} />
              <HowToCard icon={Eye} title="6. View Campaign Details" accent="#4ade80" steps={[
                'Click the Eye icon on any campaign row',
                'A modal shows user info, campaign details, and statistics',
                'Click <strong>Close</strong> to return',
              ]} />
              <HowToCard icon={Download} title="7. Download Campaign Data" accent="#a78bfa" steps={[
                'Click the Download icon on the Reports page',
                'Choose <strong>Excel (.xlsx)</strong> — the newer version — or <strong>Excel 97-2003 (.xls)</strong> — the old version',
                'File name: <code style="background:#27272a;padding:1px 5px;border-radius:4px">CampaignName_YYYY-MM-DD.xlsx</code> (or <code style="background:#27272a;padding:1px 5px;border-radius:4px">.xls</code>)',
                'Contains all details and recipient phone numbers',
              ]} />
            </div>
          </Section>

          {/* FAQ */}
          <Section id="faq" icon={HelpCircle} title="FAQ" accent="#fbbf24">
            <div className="flex flex-col gap-2.5">
              <FaqItem q="How many phone numbers can I add?">
                There's no hard cap on list size, but every recipient costs <strong className="text-fg">1 credit</strong>. If a campaign has more numbers than your balance, you'll be prompted to top up or send to only as many as you can afford.
              </FaqItem>
              <FaqItem q="What file formats are supported for media?">
                Images (JPG, JPEG, PNG, GIF, WebP), video (MP4, MOV, WebM) and PDF documents — <strong className="text-fg">max 5 MB per file</strong>. You can attach one media file plus one profile picture per campaign.
              </FaqItem>
              <FaqItem q="What are the four roles and who can do what?">
                <ul className="m-0 pl-4">
                  <li><strong className="text-fg">Super Admin:</strong> full control of the whole system; creates Admins/Resellers/Users; sends free</li>
                  <li><strong className="text-fg">Admin:</strong> creates Resellers &amp; Users; manages and sees their whole downline</li>
                  <li><strong className="text-fg">Reseller:</strong> creates and manages their own Users</li>
                  <li><strong className="text-fg">User:</strong> creates and sends their own campaigns only</li>
                </ul>
                See the <strong className="text-fg">User Roles</strong> section above for the full breakdown.
              </FaqItem>
              <FaqItem q="What are credits and how are they charged?">
                Your balance is your credits — <strong className="text-fg">1 credit = 1 message</strong>. Admins and Resellers fund their downline from their own wallet; the Super Admin mints credits and sends for free. Deleting an account refunds its remaining credits back to its creator.
              </FaqItem>
              <FaqItem q="Why is my campaign still showing “Pending”?">
                Every campaign starts as <strong className="text-fg">Pending</strong> by design and stays that way until an <strong className="text-fg">Admin or Super Admin</strong> reviews it and updates the status. Each recipient's status always mirrors the campaign's status.
              </FaqItem>
              <FaqItem q="Can I edit a campaign after creating it?">
                A campaign's content can't be edited once created — create a new one instead. Its <strong className="text-fg">status</strong>, however, can be changed by an Admin or Super Admin.
              </FaqItem>
              <FaqItem q="How do I export campaign data?">
                Click the Download button on the Reports page and pick a format: <strong className="text-fg">Excel (.xlsx)</strong> — the newer version, keeps the styled sheet — or <strong className="text-fg">Excel 97-2003 (.xls)</strong> — the old version, plain data, for older Excel and ERP imports. Either way recipients are listed in a single full-number column (e.g. <code style={{ background: '#27272a', padding: '1px 5px', borderRadius: 4 }}>+919090090150</code>).
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
                    <p className="text-xs text-brand-light">Software Engineer</p>
                  </div>
                </div>
                <p className="text-xs text-fg-muted leading-[1.7] mb-3.5">
                  Software engineer and sole architect of the WhatsApp Campaign Management System, which he designed and built end to end — from initial concept through to production. The platform was developed in collaboration with <strong className="text-fg">ProMinds Digital</strong>.
                </p>
                <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                  <ExtLink href="https://github.com/M0rs-Ruki/WhatsApp-Campaigner" icon={Github} title="GitHub Repository" sub="View source code" />
                  <ExtLink href="https://www.linkedin.com/in/anuppradhan0/" icon={Linkedin} title="LinkedIn Profile" sub="Connect professionally" />
                  <ExtLink href="https://www.anuppradhan.in/" icon={Globe} title="Portfolio Website" sub="anuppradhan.in" />
                  <ExtLink href="mailto:anuppradhan929@gmail.com" icon={Mail} title="Email Developer" sub="anuppradhan929@gmail.com" />
                </div>
              </div>

              {/* Collab note */}
              <div className="px-4 py-3 rounded-[9px] text-center bg-[#fbbf2414] border border-[#fbbf2444]">
                <p className="text-xs text-fg-muted leading-[1.7]">
                  🤝 <strong className="text-warning">Collaboration:</strong> Conceptualized by <strong className="text-fg">ProMinds Digital</strong>, developed from scratch by <strong className="text-fg">Anup Pradhan</strong> as the sole software developer.
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
