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

/* ─── design tokens ─────────────────────────────────────────────────────── */
const D = {
  bg: '#0a0a0c',
  surface: '#111113',
  surfaceHover: '#18181b',
  border: '#27272a',
  borderFocus: '#16a34a',
  text: '#f4f4f5',
  textMuted: '#71717a',
  textSubtle: '#52525b',
  green: '#16a34a',
  greenHover: '#15803d',
  greenDim: 'rgba(22,163,74,0.15)',
  greenGlow: 'rgba(22,163,74,0.12)',
  red: '#f87171',
  redBg: 'rgba(248,113,113,0.08)',
  redBorder: 'rgba(248,113,113,0.3)',
  amber: '#f59e0b',
  amberBg: 'rgba(245,158,11,0.08)',
  amberBorder: 'rgba(245,158,11,0.25)',
};

/* ─── tiny reusable primitives ──────────────────────────────────────────── */

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{ color: D.text, fontSize: 14, fontWeight: 500, lineHeight: '20px', display: 'block', marginBottom: 6 }}
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
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
        style={{
          width: '100%',
          height: 42,
          padding: suffix ? '0 40px 0 12px' : '0 12px',
          background: D.surface,
          border: `1px solid ${hasError ? D.red : D.border}`,
          borderRadius: 8,
          fontSize: 14,
          color: D.text,
          outline: 'none',
          boxSizing: 'border-box',
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'text',
          boxShadow: hasError ? `0 0 0 3px ${D.redBg}` : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={(e) => {
          if (!hasError) {
            e.currentTarget.style.borderColor = D.borderFocus;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${D.greenGlow}`;
          }
        }}
        onBlur={(e) => {
          if (!hasError) {
            e.currentTarget.style.borderColor = D.border;
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      />
      {suffix && (
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
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
  const bg = color === 'amber' ? '#d97706' : '#16a34a';
  const hover = color === 'amber' ? '#b45309' : '#15803d';
  const [hov, setHov] = useState(false);
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        height: 42,
        background: disabled || loading ? '#9ca3af' : hov ? hover : bg,
        color: '#ffffff',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'background 0.15s',
      }}
    >
      {loading && (
        <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }} fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
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
        setBootstrapError(data.message || 'Failed to create admin account.');
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
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none', cursor: 'pointer',
        color: D.textMuted, fontSize: 14, fontWeight: 500, padding: 0,
        marginBottom: 28,
      }}
    >
      <ArrowLeft size={16} />
      Back to sign in
    </button>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; background: #0a0a0c; }
        ::placeholder { color: #52525b; }
        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #111113 inset !important;
          -webkit-text-fill-color: #f4f4f5 !important;
          caret-color: #f4f4f5;
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100dvh', background: D.bg }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          display: 'none',
          flex: '0 0 57%',
          height: '100dvh',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#0a0a0c',
        }}
          className="lg-show"
        >
          {/* mesh grid background */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              linear-gradient(rgba(22,163,74,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(22,163,74,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }} />
          {/* radial glow */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(22,163,74,0.12) 0%, transparent 70%)',
          }} />

          {/* content */}
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column',
            height: '100%', padding: '40px 48px',
          }}>
            {/* logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(22,163,74,0.4)',
              }}>
                <MessageSquare size={18} color="#fff" />
              </div>
              <div>
                <div style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, lineHeight: 1.2 }}>WhatsApp</div>
                <div style={{ color: '#4ade80', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Campaign Manager</div>
              </div>
            </div>

            {/* headline */}
            <div style={{ marginTop: 'auto', marginBottom: 48 }}>
              <p style={{ color: '#4ade80', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                WhatsApp Marketing Platform
              </p>
              <h1 style={{
                color: '#ffffff', fontSize: 42, fontWeight: 700,
                lineHeight: 1.12, letterSpacing: '-0.5px', marginBottom: 16,
              }}>
                Reach millions.<br />
                <span style={{ color: '#4ade80' }}>Drive results.</span>
              </h1>
              <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, maxWidth: 380 }}>
                The all-in-one WhatsApp campaign platform for businesses that want to grow faster and connect deeper with their customers.
              </p>
            </div>

            {/* stats row */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
              {stats.map(({ label, value, icon: Icon }, i) => (
                <div key={label} style={{
                  flex: 1, padding: '20px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  textAlign: 'center',
                }}>
                  <Icon size={16} color="#4ade80" style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                  <div style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{value}</div>
                  <div style={{ color: '#6b7280', fontSize: 11, marginTop: 4, fontWeight: 500 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* features */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {features.map(({ icon: Icon, text }) => (
                <div key={text} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10,
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'rgba(22,163,74,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={14} color="#4ade80" />
                  </div>
                  <span style={{ color: '#d1d5db', fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{text}</span>
                </div>
              ))}
            </div>

            <p style={{ color: '#374151', fontSize: 12, marginTop: 32 }}>
              © {new Date().getFullYear()} WhatsApp Campaign Manager
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px', overflowY: 'auto',
          background: D.bg,
        }}>
          <div style={{ width: '100%', maxWidth: 440 }}>

            {/* mobile logo */}
            <div className="lg-hide" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: D.green,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageSquare size={16} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: D.text }}>WhatsApp Campaign Manager</span>
            </div>

            {/* ── LOGIN FORM ── */}
            {!showSignUp && !showBootstrapForm && (
              <>
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 500, color: D.text, letterSpacing: '-0.1px', lineHeight: '30px' }}>
                    Welcome back
                  </h2>
                  <p style={{ fontSize: 14, color: D.textMuted, marginTop: 4, lineHeight: '20px' }}>
                    Sign in to your account to continue
                  </p>
                </div>

                {error && (
                  <div style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    padding: '12px 14px', background: D.redBg,
                    border: `1px solid ${D.redBorder}`, borderRadius: 8, marginBottom: 20,
                  }}>
                    <AlertCircle size={15} color={D.red} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: D.red, lineHeight: '18px' }}>{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                      suffix={<AtSign size={15} color={D.textSubtle} />}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label htmlFor="password" style={{ fontSize: 14, fontWeight: 500, color: D.text }}>
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: D.green, fontWeight: 500, padding: 0 }}
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
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: D.textSubtle }}
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

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: D.textMuted }}>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setShowSignUp(true); setShowBootstrapForm(false); setError(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.green, fontWeight: 500, fontSize: 14, padding: 0 }}
                  >
                    Contact us
                  </button>
                </p>

                {/* bootstrap banner */}
                {bootstrapChecked && bootstrapAvailable && (
                  <div style={{
                    marginTop: 20, padding: '16px',
                    background: D.amberBg, border: `1px solid ${D.amberBorder}`, borderRadius: 10,
                  }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'rgba(245,158,11,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Zap size={15} color={D.amber} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: D.amber }}>First-time setup</p>
                        <p style={{ fontSize: 12, color: D.textMuted, marginTop: 2, lineHeight: '16px' }}>
                          No accounts found. Create your super admin to get started.
                        </p>
                      </div>
                    </div>
                    <PrimaryButton
                      color="amber"
                      onClick={() => { setShowBootstrapForm(true); setShowSignUp(false); setError(''); setBootstrapError(''); }}
                    >
                      Create Admin Account
                    </PrimaryButton>
                  </div>
                )}
              </>
            )}

            {/* ── BOOTSTRAP FORM ── */}
            {showBootstrapForm && (
              <>
                <BackBtn onClick={() => { setShowBootstrapForm(false); setBootstrapError(''); }} />

                <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 500, color: D.text, letterSpacing: '-0.1px', lineHeight: '30px' }}>
                      Create Admin Account
                    </h2>
                    <p style={{ fontSize: 14, color: D.textMuted, marginTop: 4 }}>
                      This account will have full system access.
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: D.amber,
                    background: D.amberBg, border: `1px solid ${D.amberBorder}`,
                    borderRadius: 20, padding: '4px 10px', flexShrink: 0, marginTop: 4,
                  }}>
                    First-time setup
                  </span>
                </div>

                {bootstrapError && (
                  <div style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    padding: '12px 14px', background: D.redBg,
                    border: `1px solid ${D.redBorder}`, borderRadius: 8, marginBottom: 20,
                  }}>
                    <AlertCircle size={15} color={D.red} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: D.red }}>{bootstrapError}</p>
                  </div>
                )}

                <form onSubmit={handleBootstrapSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <Label htmlFor="b-company">Company Name</Label>
                    <Input
                      id="b-company"
                      value={bootstrapForm.companyName}
                      onChange={v => setBootstrapForm(f => ({ ...f, companyName: v }))}
                      placeholder="Acme Corp"
                      disabled={bootstrapLoading}
                      suffix={<Building2 size={15} color={D.textSubtle} />}
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
                      suffix={<AtSign size={15} color={D.textSubtle} />}
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
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: D.textSubtle }}
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
                      suffix={<Phone size={15} color={D.textSubtle} />}
                    />
                  </div>
                  <div>
                    <label htmlFor="b-image" style={{ fontSize: 14, fontWeight: 500, color: D.text, display: 'block', marginBottom: 6 }}>
                      Profile Image{' '}
                      <span style={{ color: D.textSubtle, fontWeight: 400, fontSize: 13 }}>(optional)</span>
                    </label>
                    <input
                      type="file"
                      id="b-image"
                      accept="image/*"
                      disabled={bootstrapLoading}
                      onChange={(e) => setBootstrapForm(f => ({ ...f, image: e.target.files?.[0] || null }))}
                      style={{
                        width: '100%', fontSize: 13, color: D.textMuted,
                        border: `1px solid ${D.border}`, borderRadius: 8,
                        padding: '8px 12px', background: D.surface, cursor: 'pointer',
                      }}
                    />
                  </div>
                  <PrimaryButton type="submit" loading={bootstrapLoading}>
                    {bootstrapLoading ? 'Creating account…' : 'Create Admin Account'}
                  </PrimaryButton>
                </form>
              </>
            )}

            {/* ── SIGN UP / CONTACT ── */}
            {showSignUp && !showBootstrapForm && (
              <>
                <BackBtn onClick={() => setShowSignUp(false)} />

                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 500, color: D.text, letterSpacing: '-0.1px', lineHeight: '30px' }}>
                    Get Access
                  </h2>
                  <p style={{ fontSize: 14, color: D.textMuted, marginTop: 4 }}>
                    Reach out to our team and we'll set you up.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <a
                    href="mailto:support@example.com"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', border: `1px solid ${D.border}`,
                      borderRadius: 10, textDecoration: 'none', background: D.surface,
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = D.borderFocus; (e.currentTarget as HTMLElement).style.background = D.surfaceHover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = D.border; (e.currentTarget as HTMLElement).style.background = D.surface; }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Mail size={18} color="#60a5fa" />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: D.textSubtle, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Email Us</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#60a5fa' }}>support@example.com</p>
                    </div>
                  </a>

                  <a
                    href="tel:+911234567890"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', border: `1px solid ${D.border}`,
                      borderRadius: 10, textDecoration: 'none', background: D.surface,
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = D.borderFocus; (e.currentTarget as HTMLElement).style.background = D.surfaceHover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = D.border; (e.currentTarget as HTMLElement).style.background = D.surface; }}
                  >
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: D.greenDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Phone size={18} color="#4ade80" />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: D.textSubtle, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Call Us</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#4ade80' }}>+91 12345 67890</p>
                    </div>
                  </a>

                  <div style={{ padding: '12px 14px', background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8 }}>
                    <p style={{ fontSize: 12, color: D.textMuted, lineHeight: '18px' }}>
                      <span style={{ fontWeight: 600, color: D.text }}>Note: </span>
                      Our team will verify your details and create an account within 24 hours.
                    </p>
                  </div>
                </div>

                <a
                  href="mailto:support@example.com"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 16, height: 42, background: D.green, color: '#fff',
                    borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = D.greenHover; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = D.green; }}
                >
                  Send Email
                </a>

                <p style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: D.textMuted }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setShowSignUp(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.green, fontWeight: 500, fontSize: 14, padding: 0 }}
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── FORGOT PASSWORD MODAL ── */}
        {showForgotPassword && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
          }}>
            <div style={{
              background: D.surface, borderRadius: 16,
              width: '100%', maxWidth: 420,
              border: `1px solid ${D.border}`,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '24px 24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: D.text }}>Forgot Password?</h3>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: D.textMuted, display: 'flex', padding: 4, borderRadius: 6 }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(234,88,12,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={24} color="#fb923c" />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  <div style={{ padding: '14px', background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.2)', borderRadius: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fb923c', marginBottom: 6 }}>Contact Your Admin or Reseller</p>
                    <p style={{ fontSize: 13, color: D.textMuted, lineHeight: '18px' }}>
                      To reset your password, contact your <strong style={{ color: D.text }}>Admin</strong> or <strong style={{ color: D.text }}>Reseller</strong>. They have the authority to change your password.
                    </p>
                  </div>
                  <div style={{ padding: '14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa', marginBottom: 4 }}>After Password Reset</p>
                    <p style={{ fontSize: 12, color: D.textMuted, lineHeight: '18px' }}>
                      You can update it yourself via{' '}
                      <span style={{ fontWeight: 600, color: '#60a5fa' }}>Dashboard → Manage Business Profile</span>
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ padding: '0 24px 24px' }}>
                <PrimaryButton onClick={() => setShowForgotPassword(false)}>Got it</PrimaryButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* responsive: show left panel on large screens */}
      <style>{`
        @media (min-width: 1024px) {
          .lg-show { display: flex !important; }
          .lg-hide { display: none !important; }
        }
      `}</style>
    </>
  );
}
