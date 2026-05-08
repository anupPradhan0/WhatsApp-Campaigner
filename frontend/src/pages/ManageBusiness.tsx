import React, { useState, useEffect, useCallback } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { Building2, Mail, Phone, Lock, Camera, CheckCircle, AlertCircle, X, Eye, EyeOff } from 'lucide-react';
import { api } from '../api/client';

const D = {
  surface: '#111113', surface2: '#18181b', border: '#27272a', border2: '#3f3f46',
  text: '#f4f4f5', textMuted: '#71717a', textSubtle: '#52525b',
  green: '#16a34a', greenLight: '#4ade80', greenDim: 'rgba(22,163,74,0.12)', greenBorder: 'rgba(22,163,74,0.3)',
  blue: '#3b82f6', blueDim: 'rgba(59,130,246,0.12)',
  red: '#f87171', redDim: 'rgba(248,113,113,0.1)', redBorder: 'rgba(248,113,113,0.3)',
  amber: '#fbbf24', amberDim: 'rgba(251,191,36,0.08)',
};

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, fontSize: 13, color: D.text, outline: 'none', boxSizing: 'border-box' };

const FieldFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = D.green; };
const FieldBlur  = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = D.border; };

interface BusinessData { companyName: string; email: string; number: string; image?: string; }

const SectionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: `1px solid ${D.border}`, background: D.surface2 }}>
      {icon}
      <p style={{ fontSize: 14, fontWeight: 600, color: D.text }}>{title}</p>
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

const FInput = ({ label, hint, ...p }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>{label}</label>
    <input {...p} style={{ ...inp, ...(p.style ?? {}) }} onFocus={FieldFocus} onBlur={FieldBlur} />
    {hint && <p style={{ fontSize: 11, color: D.textSubtle, marginTop: 5 }}>{hint}</p>}
  </div>
);

export default function ManageBusiness() {
  const [originalData, setOriginalData] = useState<BusinessData>({ companyName: '', email: '', number: '' });
  const [formData, setFormData] = useState<BusinessData>({ companyName: '', email: '', number: '' });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const getUserId = (): string | null => {
    try { return JSON.parse(localStorage.getItem('user') || '{}')._id ?? null; } catch { return null; }
  };

  const fetchData = useCallback(async () => {
    try {
      setFetchLoading(true);
      const { data: r } = await api.get('/api/dashboard/manage-business');
      if (r.success) {
        const d = { companyName: r.data.companyName || '', email: r.data.email || '', number: String(r.data.number ?? ''), image: r.data.image || '' };
        setOriginalData(d); setFormData(d);
        if (r.data.image) setPreviewUrl(r.data.image);
      } else setError(r.message || 'Failed');
    } catch { setError('Network error.'); } finally { setFetchLoading(false); }
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); setError(''); };
  const handlePwd   = (e: ChangeEvent<HTMLInputElement>) => { const { name, value } = e.target; setPasswordData(p => ({ ...p, [name]: value })); setError(''); };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('Max 5MB'); return; }
    if (!f.type.startsWith('image/')) { setError('Invalid image type'); return; }
    setSelectedImage(f); setPreviewUrl(URL.createObjectURL(f)); setError('');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(''); setSuccess('');
    const userId = getUserId(); if (!userId) { setError('Session expired. Please login.'); return; }

    const updates: Partial<BusinessData> = {};
    if (formData.companyName !== originalData.companyName && formData.companyName.trim()) updates.companyName = formData.companyName;
    if (formData.email !== originalData.email && formData.email.trim()) updates.email = formData.email;
    if (formData.number !== originalData.number && formData.number.trim()) updates.number = formData.number;

    const hasProfile = Object.keys(updates).length > 0 || !!selectedImage;
    const hasPwd = !!(passwordData.newPassword || passwordData.confirmPassword);
    if (!hasProfile && !hasPwd) { setError('No changes detected.'); return; }

    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) { setError('Invalid email address'); return; }
    if (updates.number && !/^[0-9]{10}$/.test(updates.number)) { setError('Enter a valid 10-digit number'); return; }

    if (hasPwd) {
      if (!passwordData.newPassword || !passwordData.confirmPassword) { setError('Fill in both password fields'); return; }
      if (passwordData.newPassword !== passwordData.confirmPassword) { setError('Passwords do not match'); return; }
      if (passwordData.newPassword.length < 5) { setError('Password must be at least 5 characters'); return; }
    }

    setLoading(true);
    try {
      let profileOk = false; let pwdOk = false;
      const changed: string[] = [];

      if (hasProfile) {
        const fd = new FormData();
        if (updates.companyName) { fd.append('companyName', updates.companyName); changed.push('company name'); }
        if (updates.email)       { fd.append('email', updates.email); changed.push('email'); }
        if (updates.number)      { fd.append('number', updates.number); changed.push('phone number'); }
        if (selectedImage)       { fd.append('image', selectedImage); changed.push('profile image'); }

        const { data: r } = await api.put('/api/auth/update-profile', fd);
        if (r.success) {
          profileOk = true;
          const u = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...u, companyName: r.user.companyName, email: r.user.email, number: String(r.user.number), image: r.user.image }));
          const nd = { companyName: r.user.companyName, email: r.user.email, number: String(r.user.number), image: r.user.image };
          setOriginalData(nd); setFormData(nd);
          if (r.user.image) setPreviewUrl(r.user.image);
          setSelectedImage(null);
        } else { setError(r.message || 'Profile update failed'); setLoading(false); return; }
      }

      if (hasPwd) {
        const { data: r } = await api.put('/api/user/change-own-password', { newPassword: passwordData.newPassword, confirmPassword: passwordData.confirmPassword });
        if (r.success) { pwdOk = true; setPasswordData({ newPassword: '', confirmPassword: '' }); }
        else { setError(r.message || 'Password change failed'); setLoading(false); return; }
      }

      if (profileOk && pwdOk) setSuccess(`${changed.join(', ')} and password updated!`);
      else if (profileOk) setSuccess(`${changed.join(', ')} updated!`);
      else if (pwdOk) setSuccess('Password changed successfully!');

      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      if (axios.isAxiosError(err)) setError(String((err.response?.data as { message?: string })?.message ?? 'Network error.'));
      else setError('Network error.');
    } finally { setLoading(false); }
  };

  if (fetchLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${D.border}`, borderTopColor: D.green, animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: D.textMuted, fontSize: 13 }}>Loading profile…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input[type=file]::file-selector-button{background:${D.green};color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;margin-right:10px}`}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: D.text, margin: 0 }}>Manage Business</h1>
          <p style={{ fontSize: 13, color: D.textMuted, marginTop: 4 }}>Update your profile information, logo, and password</p>
        </div>

        {/* Alerts */}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: D.greenDim, border: `1px solid ${D.greenBorder}`, borderRadius: 10 }}>
            <CheckCircle size={16} style={{ color: D.greenLight, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: D.greenLight, flex: 1 }}>{success}</p>
            <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={14} style={{ color: D.greenLight }} /></button>
          </div>
        )}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: D.redDim, border: `1px solid ${D.redBorder}`, borderRadius: 10 }}>
            <AlertCircle size={16} style={{ color: D.red, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: D.red, flex: 1 }}>{error}</p>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={14} style={{ color: D.red }} /></button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile info */}
          <SectionCard icon={<Building2 size={16} style={{ color: D.greenLight }} />} title="Profile Information">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FInput label="Company Name" type="text" name="companyName" value={formData.companyName} onChange={handleInput} placeholder={`Current: ${originalData.companyName || 'Not set'}`} disabled={loading} />
              <FInput label="Email Address" type="email" name="email" value={formData.email} onChange={handleInput} placeholder={`Current: ${originalData.email || 'Not set'}`} disabled={loading} />
              <div>
                <label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Business Contact</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ padding: '10px 12px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, fontSize: 13, color: D.textMuted, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={12} style={{ color: D.textSubtle }} /> +91
                  </div>
                  <input type="tel" name="number" value={formData.number} onChange={handleInput} maxLength={10} placeholder={`Current: ${originalData.number || 'Not set'}`} disabled={loading} style={inp} onFocus={FieldFocus} onBlur={FieldBlur} />
                </div>
                <p style={{ fontSize: 11, color: D.textSubtle, marginTop: 5 }}>10-digit number without country code</p>
              </div>
            </div>
          </SectionCard>

          {/* Logo */}
          <SectionCard icon={<Camera size={16} style={{ color: D.blue }} />} title="Business Logo">
            {previewUrl && (
              <div style={{ marginBottom: 14 }}>
                <img src={previewUrl} alt="Logo preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: `2px solid ${D.greenBorder}` }} />
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFile} disabled={loading} style={{ ...inp, padding: '8px 12px', cursor: 'pointer' }} />
            <p style={{ fontSize: 11, color: D.textSubtle, marginTop: 8 }}>Max 5MB · JPG, PNG, GIF, WebP</p>
          </SectionCard>

          {/* Password */}
          <SectionCard icon={<Lock size={16} style={{ color: D.amber }} />} title="Change Password">
            <p style={{ fontSize: 12, color: D.textSubtle, marginBottom: 14 }}>Leave blank if you don't want to change your password.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} name="newPassword" value={passwordData.newPassword} onChange={handlePwd} placeholder="Min 5 characters" disabled={loading} style={{ ...inp, paddingRight: 40 }} onFocus={FieldFocus} onBlur={FieldBlur} />
                  <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showPwd ? <EyeOff size={14} style={{ color: D.textMuted }} /> : <Eye size={14} style={{ color: D.textMuted }} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirmPwd ? 'text' : 'password'} name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePwd} placeholder="Repeat new password" disabled={loading} style={{ ...inp, paddingRight: 40 }} onFocus={FieldFocus} onBlur={FieldBlur} />
                  <button type="button" onClick={() => setShowConfirmPwd(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showConfirmPwd ? <EyeOff size={14} style={{ color: D.textMuted }} /> : <Eye size={14} style={{ color: D.textMuted }} />}
                  </button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', background: D.amberDim, border: `1px solid ${D.amber}33`, borderRadius: 8 }}>
              <p style={{ fontSize: 11, color: D.textSubtle, lineHeight: 1.7 }}>
                <span style={{ fontWeight: 700, color: D.amber }}>Requirements: </span>
                Minimum 5 characters · Both fields must match
              </p>
            </div>
          </SectionCard>

          {/* Submit */}
          <button type="submit" disabled={loading} style={{ padding: '11px 0', background: loading ? D.surface2 : D.green, color: loading ? D.textMuted : '#fff', fontWeight: 600, fontSize: 14, border: loading ? `1px solid ${D.border}` : 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
            {loading ? 'Saving changes…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </>
  );
}
