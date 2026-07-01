import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Mail,
  Phone,
  ArrowLeft,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  MessageSquare,
  Users,
  BarChart3,
  Zap,
  Building2,
  Lock,
  AtSign,
  TrendingUp,
  Send,
} from 'lucide-react';
import { api } from '../api/client';
import { cn } from '../lib/utils';

/* ─── tiny reusable primitives ──────────────────────────────────────────── */

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-fg text-sm font-medium leading-5 mb-1.5"
    >
      {children}
    </label>
  );
}

function Input({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  hasError,
  suffix,
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
        className={cn(
          'w-full h-[42px] bg-surface rounded-lg text-sm text-fg outline-none box-border border transition-[border-color,box-shadow] duration-150',
          suffix ? 'pl-3 pr-10' : 'px-3',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          hasError
            ? 'border-danger shadow-[0_0_0_3px_rgba(248,113,113,0.08)]'
            : 'border-line focus:border-[#16a34a] focus:shadow-[0_0_0_3px_rgba(22,163,74,0.12)]',
        )}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {suffix}
        </span>
      )}
    </div>
  );
}


function PrimaryButton({
  type = 'button',
  disabled,
  loading,
  children,
  onClick,
  color = 'green',
}: {
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  color?: 'green' | 'amber';
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        'w-full h-[42px] text-white border-none rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-[background] duration-150',
        isDisabled
          ? 'bg-[#9ca3af] cursor-not-allowed'
          : color === 'amber'
            ? 'bg-[#d97706] hover:bg-[#b45309] cursor-pointer'
            : 'bg-[#16a34a] hover:bg-[#15803d] cursor-pointer',
      )}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

/* ─── main component ─────────────────────────────────────────────────────── */

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showSignUp, setShowSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);
  const [bootstrapChecked, setBootstrapChecked] = useState(false);
  const [showBootstrapForm, setShowBootstrapForm] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapError, setBootstrapError] = useState('');
  const [showBootstrapPassword, setShowBootstrapPassword] = useState(false);
  const [bootstrapForm, setBootstrapForm] = useState({
    companyName: '',
    email: '',
    password: '',
    number: '',
    image: null as File | null,
  });

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ success: boolean; hasUsers: boolean }>('/api/auth/bootstrap-status');
        if (data.success) setBootstrapAvailable(!data.hasUsers);
      } catch { /* silent */ }
      finally { setBootstrapChecked(true); }
    })();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const { data } = await api.post<{ success: boolean; message?: string; user?: unknown; token?: string }>(
        '/api/auth/login', { email, password }
      );
      if (data.success) {
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('token', data.token);
        navigate('/home');
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.data?.message
        ? String(err.response.data.message)
        : 'Network error. Please check your connection.');
    } finally { setLoading(false); }
  };

  const handleBootstrapSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBootstrapError('');
    const { companyName, email: bEmail, password: bPwd, number } = bootstrapForm;
    if (!companyName || !bEmail || !bPwd || !number) { setBootstrapError('All fields are required.'); return; }
    setBootstrapLoading(true);
    try {
      const fd = new FormData();
      fd.append('companyName', companyName);
      fd.append('email', bEmail);
      fd.append('password', bPwd);
      fd.append('number', number);
      if (bootstrapForm.image) fd.append('image', bootstrapForm.image);
      const { data } = await api.post<{ success: boolean; message?: string; user?: unknown; token?: string }>(
        '/api/auth/bootstrap-admin', fd
      );
      if (data.success) {
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('token', data.token);
        navigate('/home');
      } else {
        setBootstrapError(data.message || 'Failed to create super admin account.');
      }
    } catch (err) {
      setBootstrapError(axios.isAxiosError(err) && err.response?.data?.message
        ? String(err.response.data.message)
        : 'Network error. Please check your connection.');
    } finally { setBootstrapLoading(false); }
  };

  /* left panel stats */
  const stats = [
    { label: 'Messages Sent', value: '2.4M+', icon: Send },
    { label: 'Active Campaigns', value: '12K+', icon: TrendingUp },
    { label: 'Businesses', value: '3K+', icon: Building2 },
  ];

  const features = [
    { icon: MessageSquare, text: 'Bulk WhatsApp Campaigns' },
    { icon: Users, text: 'Multi-level User Management' },
    { icon: BarChart3, text: 'Real-time Delivery Analytics' },
    { icon: Zap, text: 'Automated Message Scheduling' },
  ];

  /* shared back-button */
  const BackBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 bg-none border-none cursor-pointer text-fg-muted text-sm font-medium p-0 mb-7"
    >
      <ArrowLeft size={16} />
      Back to sign in
    </button>
  );

  return (
    <>
      <style>{`
        ::placeholder { color: #52525b; }
        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #111113 inset !important;
          -webkit-text-fill-color: #f4f4f5 !important;
          caret-color: #f4f4f5;
        }
      `}</style>

      <div className="flex min-h-[100dvh] bg-bg justify-center">
       <div className="flex w-full max-w-[1440px]">

        {/* ── LEFT PANEL ── */}
        <div className="hidden lg:flex flex-[0_0_55%] h-[100dvh] overflow-hidden relative bg-[#0a0a0c]">
          {/* mesh grid background */}
          <div
            className="absolute inset-0 bg-[length:40px_40px]"
            style={{
              backgroundImage: `
              linear-gradient(rgba(22,163,74,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(22,163,74,0.06) 1px, transparent 1px)
            `,
            }}
          />
          {/* radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,rgba(22,163,74,0.12)_0%,transparent_70%)]" />

          {/* content */}
          <div className="relative z-[1] flex flex-col items-start justify-center text-left h-full px-16 py-10 gap-9 max-w-[560px] mx-auto w-full">
            {/* logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-[linear-gradient(135deg,#16a34a,#15803d)] flex items-center justify-center shadow-[0_0_20px_rgba(22,163,74,0.4)]">
                <MessageSquare size={18} color="#fff" />
              </div>
              <div>
                <div className="text-white text-[15px] font-semibold leading-[1.2]">WhatsApp</div>
                <div className="text-[#4ade80] text-[11px] font-medium tracking-[0.08em] uppercase">Campaign Manager</div>
              </div>
            </div>

            {/* headline */}
            <div>
              <p className="text-[#4ade80] text-xs font-semibold tracking-[0.1em] uppercase mb-3.5">
                WhatsApp Marketing Platform
              </p>
              <h1 className="text-white text-[42px] font-bold leading-[1.12] tracking-[-0.5px] mb-4">
                Reach millions.<br />
                <span className="text-[#4ade80]">Drive results.</span>
              </h1>
              <p className="text-[#6b7280] text-[15px] leading-[1.6] max-w-[420px]">
                The all-in-one WhatsApp campaign platform for businesses that want to grow faster and connect deeper with their customers.
              </p>
            </div>

            {/* stats row */}
            <div className="flex gap-0 w-full rounded-xl overflow-hidden border border-white/[0.07]">
              {stats.map(({ label, value, icon: Icon }, i) => (
                <div
                  key={label}
                  className={cn(
                    'flex-1 px-4 py-5 bg-white/[0.03] text-left',
                    i < stats.length - 1 ? 'border-r border-white/[0.07]' : '',
                  )}
                >
                  <Icon size={16} color="#4ade80" className="block mb-2" />
                  <div className="text-white text-[22px] font-bold leading-none">{value}</div>
                  <div className="text-[#6b7280] text-[11px] mt-1 font-medium">{label}</div>
                </div>
              ))}
            </div>

            {/* features */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              {features.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-2.5 px-3.5 py-3 bg-white/[0.04] border border-white/[0.07] rounded-[10px]"
                >
                  <div className="w-[30px] h-[30px] rounded-lg bg-[rgba(22,163,74,0.15)] flex items-center justify-center shrink-0">
                    <Icon size={14} color="#4ade80" />
                  </div>
                  <span className="text-[#d1d5db] text-[13px] font-medium leading-[1.3]">{text}</span>
                </div>
              ))}
            </div>

            <p className="text-[#374151] text-xs">
              © {new Date().getFullYear()} WhatsApp Campaign Manager
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 overflow-y-auto bg-bg">
          <div className="w-full max-w-[440px]">

            {/* mobile logo */}
            <div className="flex lg:hidden items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                <MessageSquare size={16} color="#fff" />
              </div>
              <span className="font-bold text-[15px] text-fg">WhatsApp Campaign Manager</span>
            </div>

            {/* ── LOGIN FORM ── */}
            {!showSignUp && !showBootstrapForm && (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-medium text-fg tracking-[-0.1px] leading-[30px]">
                    Welcome back
                  </h2>
                  <p className="text-sm text-fg-muted mt-1 leading-5">
                    Sign in to your account to continue
                  </p>
                </div>

                {error && (
                  <div className="flex gap-2.5 items-start px-3.5 py-3 bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.3)] rounded-lg mb-5">
                    <AlertCircle size={15} color="#f87171" className="shrink-0 mt-px" />
                    <p className="text-[13px] text-danger leading-[18px]">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="you@company.com"
                      disabled={loading}
                      hasError={!!error && !password}
                      suffix={<AtSign size={15} color="#52525b" />}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="password" className="text-sm font-medium text-fg">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="bg-none border-none cursor-pointer text-[13px] text-brand font-medium p-0"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={setPassword}
                      placeholder="Enter your password"
                      disabled={loading}
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="bg-none border-none cursor-pointer p-0 flex text-fg-subtle"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />
                  </div>

                  <PrimaryButton type="submit" loading={loading}>
                    {loading ? 'Signing in…' : 'Sign in'}
                  </PrimaryButton>
                </form>

                <p className="text-center mt-5 text-sm text-fg-muted">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setShowSignUp(true); setShowBootstrapForm(false); setError(''); }}
                    className="bg-none border-none cursor-pointer text-brand font-medium text-sm p-0"
                  >
                    Contact us
                  </button>
                </p>

                {/* bootstrap banner */}
                {bootstrapChecked && bootstrapAvailable && (
                  <div className="mt-5 p-4 bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)] rounded-[10px]">
                    <div className="flex gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-[rgba(245,158,11,0.15)] flex items-center justify-center shrink-0">
                        <Zap size={15} color="#f59e0b" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#f59e0b]">First-time setup</p>
                        <p className="text-xs text-fg-muted mt-0.5 leading-4">
                          No accounts found. Create the one super admin account to get started.
                        </p>
                      </div>
                    </div>
                    <PrimaryButton
                      color="amber"
                      onClick={() => { setShowBootstrapForm(true); setShowSignUp(false); setError(''); setBootstrapError(''); }}
                    >
                      Create Super Admin Account
                    </PrimaryButton>
                  </div>
                )}
              </>
            )}

            {/* ── BOOTSTRAP FORM ── */}
            {showBootstrapForm && (
              <>
                <BackBtn onClick={() => { setShowBootstrapForm(false); setBootstrapError(''); }} />

                <div className="mb-7 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-medium text-fg tracking-[-0.1px] leading-[30px]">
                      Create Super Admin Account
                    </h2>
                    <p className="text-sm text-fg-muted mt-1">
                      This is the single super admin account and will have full system access.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#f59e0b] bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)] rounded-[20px] px-2.5 py-1 shrink-0 mt-1">
                    First-time setup
                  </span>
                </div>

                {bootstrapError && (
                  <div className="flex gap-2.5 items-start px-3.5 py-3 bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.3)] rounded-lg mb-5">
                    <AlertCircle size={15} color="#f87171" className="shrink-0 mt-px" />
                    <p className="text-[13px] text-danger">{bootstrapError}</p>
                  </div>
                )}

                <form onSubmit={handleBootstrapSubmit} className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="b-company">Company Name</Label>
                    <Input
                      id="b-company"
                      value={bootstrapForm.companyName}
                      onChange={v => setBootstrapForm(f => ({ ...f, companyName: v }))}
                      placeholder="Acme Corp"
                      disabled={bootstrapLoading}
                      suffix={<Building2 size={15} color="#52525b" />}
                    />
                  </div>
                  <div>
                    <Label htmlFor="b-email">Email Address</Label>
                    <Input
                      id="b-email"
                      type="email"
                      value={bootstrapForm.email}
                      onChange={v => setBootstrapForm(f => ({ ...f, email: v }))}
                      placeholder="admin@company.com"
                      disabled={bootstrapLoading}
                      suffix={<AtSign size={15} color="#52525b" />}
                    />
                  </div>
                  <div>
                    <Label htmlFor="b-password">Password</Label>
                    <Input
                      id="b-password"
                      type={showBootstrapPassword ? 'text' : 'password'}
                      value={bootstrapForm.password}
                      onChange={v => setBootstrapForm(f => ({ ...f, password: v }))}
                      placeholder="Create a strong password"
                      disabled={bootstrapLoading}
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowBootstrapPassword(v => !v)}
                          className="bg-none border-none cursor-pointer p-0 flex text-fg-subtle"
                          tabIndex={-1}
                        >
                          {showBootstrapPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="b-number">Phone Number</Label>
                    <Input
                      id="b-number"
                      type="tel"
                      value={bootstrapForm.number}
                      onChange={v => setBootstrapForm(f => ({ ...f, number: v }))}
                      placeholder="+91 98765 43210"
                      disabled={bootstrapLoading}
                      suffix={<Phone size={15} color="#52525b" />}
                    />
                  </div>
                  <div>
                    <label htmlFor="b-image" className="text-sm font-medium text-fg block mb-1.5">
                      Profile Image{' '}
                      <span className="text-fg-subtle font-normal text-[13px]">(optional)</span>
                    </label>
                    <input
                      type="file"
                      id="b-image"
                      accept="image/*"
                      disabled={bootstrapLoading}
                      onChange={(e) => setBootstrapForm(f => ({ ...f, image: e.target.files?.[0] || null }))}
                      className="w-full text-[13px] text-fg-muted border border-line rounded-lg px-3 py-2 bg-surface cursor-pointer"
                    />
                  </div>
                  <PrimaryButton type="submit" loading={bootstrapLoading}>
                    {bootstrapLoading ? 'Creating account…' : 'Create Super Admin Account'}
                  </PrimaryButton>
                </form>
              </>
            )}

            {/* ── SIGN UP / CONTACT ── */}
            {showSignUp && !showBootstrapForm && (
              <>
                <BackBtn onClick={() => setShowSignUp(false)} />

                <div className="mb-7">
                  <h2 className="text-2xl font-medium text-fg tracking-[-0.1px] leading-[30px]">
                    Get Access
                  </h2>
                  <p className="text-sm text-fg-muted mt-1">
                    Reach out to our team and we'll set you up.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5">
                  <a
                    href="mailto:hello@prominds.digital"
                    className="flex items-center gap-3.5 px-4 py-3.5 border border-line rounded-[10px] no-underline bg-surface transition-[border-color,background] duration-150 hover:border-[#16a34a] hover:bg-[#18181b]"
                  >
                    <div className="w-[38px] h-[38px] rounded-[10px] bg-[rgba(59,130,246,0.15)] flex items-center justify-center shrink-0">
                      <Mail size={18} color="#60a5fa" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.06em] mb-0.5">Email Us</p>
                      <p className="text-sm font-medium text-[#60a5fa]">hello@prominds.digital</p>
                    </div>
                  </a>

                  <a
                    href="tel:+919090090150"
                    className="flex items-center gap-3.5 px-4 py-3.5 border border-line rounded-[10px] no-underline bg-surface transition-[border-color,background] duration-150 hover:border-[#16a34a] hover:bg-[#18181b]"
                  >
                    <div className="w-[38px] h-[38px] rounded-[10px] bg-brand-dim flex items-center justify-center shrink-0">
                      <Phone size={18} color="#4ade80" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-[0.06em] mb-0.5">Call Us</p>
                      <p className="text-sm font-medium text-[#4ade80]">+91 90900 90150</p>
                    </div>
                  </a>

                  <div className="px-3.5 py-3 bg-surface border border-line rounded-lg">
                    <p className="text-xs text-fg-muted leading-[18px]">
                      <span className="font-semibold text-fg">Note: </span>
                      Our team will verify your details and create an account within 24 hours.
                    </p>
                  </div>
                </div>

                <a
                  href="mailto:hello@prominds.digital"
                  className="flex items-center justify-center mt-4 h-[42px] bg-brand hover:bg-brand-hover text-white rounded-lg no-underline text-sm font-medium transition-[background] duration-150"
                >
                  Send Email
                </a>

                <p className="text-center mt-[18px] text-sm text-fg-muted">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setShowSignUp(false)}
                    className="bg-none border-none cursor-pointer text-brand font-medium text-sm p-0"
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
       </div>

        {/* ── FORGOT PASSWORD MODAL ── */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-[4px] flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-2xl w-full max-w-[420px] border border-line shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
              <div className="px-6 pt-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[17px] font-semibold text-fg">Forgot Password?</h3>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="bg-none border-none cursor-pointer text-fg-muted flex p-1 rounded-md"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex justify-center mb-5">
                  <div className="w-14 h-14 rounded-[14px] bg-[rgba(234,88,12,0.12)] flex items-center justify-center">
                    <Lock size={24} color="#fb923c" />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 mb-5">
                  <div className="p-3.5 bg-[rgba(234,88,12,0.08)] border border-[rgba(234,88,12,0.2)] rounded-[10px]">
                    <p className="text-[13px] font-semibold text-[#fb923c] mb-1.5">Contact Your Admin or Reseller</p>
                    <p className="text-[13px] text-fg-muted leading-[18px]">
                      To reset your password, contact your <strong className="text-fg">Admin</strong> or <strong className="text-fg">Reseller</strong>. They have the authority to change your password.
                    </p>
                  </div>
                  <div className="p-3.5 bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)] rounded-[10px]">
                    <p className="text-xs font-semibold text-[#60a5fa] mb-1">After Password Reset</p>
                    <p className="text-xs text-fg-muted leading-[18px]">
                      You can update it yourself via{' '}
                      <span className="font-semibold text-[#60a5fa]">Dashboard → Manage Business Profile</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <PrimaryButton onClick={() => setShowForgotPassword(false)}>Got it</PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
