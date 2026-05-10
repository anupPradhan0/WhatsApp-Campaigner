import React, { useState } from 'react';
import { Building2, Camera, Lock, Phone, Eye, EyeOff, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useBusiness } from '../hooks/useBusiness';
import { D, inp } from '../theme/tokens';
import { Spinner } from '../components/ui/Spinner';
import { FInput } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';

const SectionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: `1px solid ${D.border}`, background: D.surface2 }}>
      {icon}
      <p style={{ fontSize: 14, fontWeight: 600, color: D.text }}>{title}</p>
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

export default function ManageBusiness() {
  const {
    formData, setFormData, passwordData, setPasswordData,
    previewUrl, loading, fetchLoading, success, setSuccess, error, setError,
    handleFile, handleSubmit,
  } = useBusiness();

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  if (fetchLoading) return <Spinner label="Loading profile…" />;

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        input[type=file]::file-selector-button{background:${D.green};color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;margin-right:10px}
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <PageHeader title="Manage Business" subtitle="Update your profile information, logo, and password" />

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
              <FInput label="Company Name" type="text" name="companyName" value={formData.companyName} onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))} disabled={loading} />
              <FInput label="Email Address" type="email" name="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} disabled={loading} />
              <div>
                <label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Business Contact</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ padding: '10px 12px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, fontSize: 13, color: D.textMuted, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={12} style={{ color: D.textSubtle }} /> +91
                  </div>
                  <input
                    type="tel" name="number" value={formData.number}
                    onChange={e => setFormData(p => ({ ...p, number: e.target.value }))}
                    maxLength={10} placeholder="10-digit number" disabled={loading}
                    style={inp}
                    onFocus={e => { e.currentTarget.style.borderColor = D.green; }}
                    onBlur={e => { e.currentTarget.style.borderColor = D.border; }}
                  />
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
            <input
              type="file" accept="image/*" disabled={loading}
              onChange={e => handleFile(e.target.files?.[0] ?? null)}
              style={{ ...inp, padding: '8px 12px', cursor: 'pointer' }}
            />
            <p style={{ fontSize: 11, color: D.textSubtle, marginTop: 8 }}>Max 5MB · JPG, PNG, GIF, WebP</p>
          </SectionCard>

          {/* Password */}
          <SectionCard icon={<Lock size={16} style={{ color: D.amber }} />} title="Change Password">
            <p style={{ fontSize: 12, color: D.textSubtle, marginBottom: 14 }}>Leave blank if you don't want to change your password.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} name="newPassword" value={passwordData.newPassword} onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 5 characters" disabled={loading} style={{ ...inp, paddingRight: 40 }}
                    onFocus={e => { e.currentTarget.style.borderColor = D.green; }}
                    onBlur={e => { e.currentTarget.style.borderColor = D.border; }}
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showPwd ? <EyeOff size={14} style={{ color: D.textMuted }} /> : <Eye size={14} style={{ color: D.textMuted }} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirmPwd ? 'text' : 'password'} name="confirmPassword" value={passwordData.confirmPassword} onChange={e => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat new password" disabled={loading} style={{ ...inp, paddingRight: 40 }}
                    onFocus={e => { e.currentTarget.style.borderColor = D.green; }}
                    onBlur={e => { e.currentTarget.style.borderColor = D.border; }}
                  />
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

          <button
            type="submit"
            disabled={loading}
            style={{ padding: '11px 0', background: loading ? D.surface2 : D.green, color: loading ? D.textMuted : '#fff', fontWeight: 600, fontSize: 14, border: loading ? `1px solid ${D.border}` : 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
          >
            {loading ? 'Saving changes…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </>
  );
}
