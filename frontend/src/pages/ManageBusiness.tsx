import React, { useState } from 'react';
import { Building2, Camera, Lock, Phone, Eye, EyeOff, CheckCircle, AlertCircle, X, Upload } from 'lucide-react';
import { useBusiness } from '../hooks/useBusiness';
import { cn } from '../lib/utils';
import { fieldCls } from '../theme/classes';
import { Spinner } from '../components/ui/Spinner';
import { FInput } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import CustomDomainCard from '../components/business/CustomDomainCard';
import { getUserRole } from '../utils/Auth';
import { UserRole } from '../constants/Roles';

const fieldLabelCls = "text-[11px] text-fg-subtle font-semibold uppercase tracking-[0.07em] block mb-1.5";

const SectionCard = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="bg-surface border border-line rounded-xl overflow-hidden">
    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-line bg-surface2">
      {icon}
      <p className="text-sm font-semibold text-fg">{title}</p>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default function ManageBusiness() {
  const {
    formData, setFormData, passwordData, setPasswordData,
    previewUrl, loading, fetchLoading, success, setSuccess, error, setError,
    handleFile, handleSubmit,
  } = useBusiness();

  const role = getUserRole();
  const canWhiteLabel =
    role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN || role === UserRole.RESELLER;

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  if (fetchLoading) return <Spinner label="Loading profile…" />;

  return (
    <div className="max-w-[680px] mx-auto flex flex-col gap-5">
      <PageHeader title="Manage Business" subtitle="Update your profile information, logo, and password" />

      {success && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-brand-dim border border-brand-border rounded-[10px]">
          <CheckCircle size={16} className="text-brand-light shrink-0" />
          <p className="text-[13px] text-brand-light flex-1">{success}</p>
          <button onClick={() => setSuccess('')} className="bg-none border-none cursor-pointer p-0"><X size={14} className="text-brand-light" /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-danger-dim border border-danger-border rounded-[10px]">
          <AlertCircle size={16} className="text-danger shrink-0" />
          <p className="text-[13px] text-danger flex-1">{error}</p>
          <button onClick={() => setError('')} className="bg-none border-none cursor-pointer p-0"><X size={14} className="text-danger" /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Profile info */}
        <SectionCard icon={<Building2 size={16} className="text-brand-light" />} title="Profile Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FInput label="Company Name" type="text" name="companyName" value={formData.companyName} onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))} disabled={loading} />
            <FInput label="Email Address" type="email" name="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} disabled={loading} />
            <div>
              <label className={fieldLabelCls}>Business Contact</label>
              <div className="flex gap-2">
                <div className="px-3 py-2.5 bg-surface2 border border-line rounded-lg text-[13px] text-fg-muted shrink-0 flex items-center gap-1">
                  <Phone size={12} className="text-fg-subtle" /> +91
                </div>
                <input
                  type="tel" name="number" value={formData.number}
                  onChange={e => setFormData(p => ({ ...p, number: e.target.value }))}
                  maxLength={10} placeholder="10-digit number" disabled={loading}
                  className={fieldCls}
                />
              </div>
              <p className="text-[11px] text-fg-subtle mt-[5px]">10-digit number without country code</p>
            </div>
          </div>
        </SectionCard>

        {/* Logo */}
        <SectionCard icon={<Camera size={16} className="text-info" />} title="Business Logo">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border-2 border-line-strong bg-surface2 flex items-center justify-center overflow-hidden shrink-0">
              {previewUrl
                ? <img src={previewUrl} alt="Logo preview" className="w-full h-full object-cover" />
                : <Building2 size={26} className="text-fg-subtle" />}
            </div>
            <div className="flex-1 min-w-0">
              <label className={cn("inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-lg", loading ? "bg-surface2 text-fg-muted cursor-not-allowed" : "bg-brand hover:bg-brand-hover text-white cursor-pointer")}>
                <Upload size={14} /> {previewUrl ? 'Change Logo' : 'Upload Logo'}
                <input type="file" accept="image/*" disabled={loading} onChange={e => handleFile(e.target.files?.[0] ?? null)} className="hidden" />
              </label>
              <p className="text-[11px] text-fg-subtle mt-2">Max 5MB · JPG, PNG, GIF, WebP</p>
            </div>
          </div>
        </SectionCard>

        {/* Password */}
        <SectionCard icon={<Lock size={16} className="text-warning" />} title="Change Password">
          <p className="text-xs text-fg-subtle mb-3.5">Leave blank if you don't want to change your password.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={fieldLabelCls}>New Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} name="newPassword" value={passwordData.newPassword} onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 5 characters" disabled={loading} className={cn(fieldCls, "pr-10")} />
                <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer p-0">
                  {showPwd ? <EyeOff size={14} className="text-fg-muted" /> : <Eye size={14} className="text-fg-muted" />}
                </button>
              </div>
            </div>
            <div>
              <label className={fieldLabelCls}>Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPwd ? 'text' : 'password'} name="confirmPassword" value={passwordData.confirmPassword} onChange={e => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat new password" disabled={loading} className={cn(fieldCls, "pr-10")} />
                <button type="button" onClick={() => setShowConfirmPwd(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-none cursor-pointer p-0">
                  {showConfirmPwd ? <EyeOff size={14} className="text-fg-muted" /> : <Eye size={14} className="text-fg-muted" />}
                </button>
              </div>
            </div>
          </div>
          {(passwordData.newPassword || passwordData.confirmPassword) && (
            <div className="mt-3 flex flex-col gap-1.5">
              {[
                { ok: passwordData.newPassword.length >= 5, label: 'At least 5 characters' },
                { ok: !!passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword, label: 'Both passwords match' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-1.5">
                  <CheckCircle size={13} className={r.ok ? 'text-brand-light' : 'text-fg-subtle'} />
                  <span className={cn('text-[11px]', r.ok ? 'text-brand-light' : 'text-fg-subtle')}>{r.label}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "py-[11px] font-semibold text-sm rounded-lg transition-colors",
            loading
              ? "bg-surface2 text-fg-muted border border-line cursor-not-allowed"
              : "bg-brand text-white border-none cursor-pointer"
          )}
        >
          {loading ? 'Saving changes…' : 'Save Changes'}
        </button>
      </form>

      {/* Outside the profile form — it saves and verifies on its own. Plain
          users never run a white-label portal, so they don't see it. */}
      {canWhiteLabel && <CustomDomainCard />}
    </div>
  );
}
