import React, { useState, useEffect, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import type { FormEvent, ChangeEvent } from 'react';
import { toast } from 'sonner';
import 'react-quill-new/dist/quill.snow.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api, getErrorMessage } from '../api/client';
import { Send, Phone, Link2, ImageIcon, Users, X, Hash, Upload, FileSpreadsheet, UserCircle, Save, AlertTriangle, Eye } from 'lucide-react';
import { getUserRole } from '../utils/Auth';
import { UserRole } from '../constants/Roles';
import { cn } from '../lib/utils';
import { fieldCls } from '../theme/classes';
import { PageHeader } from '../components/ui/PageHeader';
import { parseRecipientsFile } from '../utils/parseRecipients';

interface CampaignForm {
  campaignName: string;
  message: string;
  phoneButtonText: string;
  phoneButtonNumber: string;
  linkButtonText: string;
  linkButtonUrl: string;
  mobileNumberEntryType: string;
  mobileNumbers: string;
  countryCode: string;
  numberCount: string;
}

const SectionCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-surface border border-line rounded-xl px-6 py-5", className)}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, children }: { icon: React.FC<{ size?: number; className?: string }>; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-[7px] bg-brand-dim flex items-center justify-center flex-shrink-0">
      <Icon size={14} className="text-brand-light" />
    </div>
    <p className="text-[13px] font-semibold text-fg uppercase tracking-[0.06em]">{children}</p>
  </div>
);

const fieldLabelCls = "block text-[11px] font-semibold text-fg-muted uppercase tracking-[0.07em] mb-1.5";

// Backend validates the raw (HTML) message string, so count the same thing.
const MESSAGE_LIMIT = 12000;
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();

// Inline error shown directly under the offending field.
const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-[12px] text-danger font-medium mt-1.5">{msg}</p> : null;

const FieldInput = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className={fieldLabelCls}>{label}</label>
    <input {...props} className={fieldCls} />
  </div>
);

const SendWhatsapp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CampaignForm>({
    campaignName: '', message: '',
    phoneButtonText: '', phoneButtonNumber: '',
    linkButtonText: '', linkButtonUrl: '',
    mobileNumberEntryType: 'manual',
    mobileNumbers: '', countryCode: '+91', numberCount: '',
  });
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [partialConfirm, setPartialConfirm] = useState<{ affordable: number; requested: number } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const userRole = getUserRole();
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;

  // Fetch the current balance so we can warn (live) before the user even clicks
  // Send. Best-effort — the server re-checks on submit regardless.
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ success: boolean; data?: { balance?: number } }>('/api/dashboard/home');
        if (data.success && typeof data.data?.balance === 'number') setBalance(data.data.balance);
      } catch { /* ignore — balance warning is optional */ }
    })();
  }, []);

  const modules = { toolbar: [['bold', 'italic'], [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote'], ['link']] };
  const formats = ['bold', 'italic', 'list', 'blockquote', 'link'];

  // Clear a field's inline error as soon as the user starts fixing it.
  const clearFieldError = (name: string) =>
    setFieldErrors(prev => { if (!prev[name]) return prev; const n = { ...prev }; delete n[name]; return n; });

  const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File size exceeds 5 MB limit'); return; }
    const valid: Record<string, string[]> = {
      image: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/quicktime', 'video/webm'],
    };
    if (!valid[type].includes(file.type)) { toast.error(`Invalid ${type} file type`); return; }
    setSelectedFile(file); setFileType(type);
  };

  const handleProfileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file after removing
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Profile picture exceeds 5 MB limit'); return; }
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) { toast.error('Profile picture must be an image (JPG, PNG, GIF, WebP)'); return; }
    setProfileImage(file);
  };

  const handleRecipientsImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File size exceeds 5 MB limit'); return; }
    setImporting(true);
    try {
      const numbers = await parseRecipientsFile(file);
      if (numbers.length === 0) {
        toast.error('No valid phone numbers found in that file');
        return;
      }
      setFormData(prev => {
        // Merge with anything already in the box, de-duplicating.
        const existing = prev.mobileNumbers.split(/[\n,]/).map(n => n.trim()).filter(Boolean);
        const merged = Array.from(new Set([...existing, ...numbers]));
        return { ...prev, mobileNumbers: merged.join(', ') };
      });
      toast.success(`Imported ${numbers.length} number${numbers.length === 1 ? '' : 's'} from ${file.name}`);
    } catch {
      toast.error('Could not read that file. Use a CSV or Excel (.xlsx/.xls) file.');
    } finally {
      setImporting(false);
    }
  };

  const handleMobileNumberChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    if (!/^[0-9+,\s\n\r]*$/.test(value)) { toast.error('Only numbers, +, commas, spaces, and line breaks are allowed'); return; }
    setFormData(prev => ({ ...prev, mobileNumbers: value }));
    clearFieldError('mobileNumbers');
  };

  const handlePhoneNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (!/^[0-9\s+]*$/.test(value)) { toast.error('Only numbers, spaces, and + are allowed'); return; }
    setFormData(prev => ({ ...prev, phoneButtonNumber: value }));
  };

  const countMobileNumbers = () => {
    if (!formData.mobileNumbers.trim()) return 0;
    return formData.mobileNumbers.split(/[\n,]/).map(n => n.trim()).filter(Boolean).length;
  };

  const buildCampaignFormData = (allowPartial: boolean, saveAsDraft: boolean): FormData => {
    const data = new FormData();
    data.append('campaignName', formData.campaignName);
    data.append('message', formData.message);
    data.append('mobileNumberEntryType', formData.mobileNumberEntryType);
    data.append('mobileNumbers', formData.mobileNumbers);
    data.append('countryCode', formData.countryCode);
    if (formData.phoneButtonText && formData.phoneButtonNumber) {
      data.append('phoneButtonText', formData.phoneButtonText);
      data.append('phoneButtonNumber', formData.phoneButtonNumber);
    }
    if (formData.linkButtonText && formData.linkButtonUrl) {
      data.append('linkButtonText', formData.linkButtonText);
      data.append('linkButtonUrl', formData.linkButtonUrl);
    }
    if (selectedFile) data.append('image', selectedFile);
    if (profileImage) data.append('profileImage', profileImage);
    // Confirmed partial send: only the affordable count will be charged/sent.
    if (allowPartial) data.append('allowPartial', 'true');
    // Save silently as a draft — nothing is charged or sent.
    if (saveAsDraft) data.append('saveAsDraft', 'true');
    return data;
  };

  const submitCampaign = async (allowPartial: boolean, saveAsDraft: boolean) => {
    setLoading(true);
    try {
      const { data: result } = await api.post<{ success: boolean; message?: string; errors?: string[] }>(
        '/api/campaigns', buildCampaignFormData(allowPartial, saveAsDraft),
      );

      if (result.success) {
        setFormData({ campaignName: '', message: '', phoneButtonText: '', phoneButtonNumber: '', linkButtonText: '', linkButtonUrl: '', mobileNumberEntryType: 'manual', mobileNumbers: '', countryCode: '+91', numberCount: '' });
        setSelectedFile(null); setFileType(null); setProfileImage(null);
        toast.success(saveAsDraft ? 'Campaign saved as draft.' : 'Campaign created successfully!');
        navigate('/whatsapp-report');
      } else if (!applyServerErrors(result.errors)) {
        toast.error(result.message || 'Failed to create campaign');
      }
    } catch (err: unknown) {
      // Balance can't cover every number — ask the user to confirm a partial send.
      if (axios.isAxiosError(err) && err.response?.data?.code === 'PARTIAL_BALANCE') {
        const d = err.response.data as { affordable: number; requested: number };
        setPartialConfirm({ affordable: d.affordable, requested: d.requested });
        return;
      }
      // Map server-side validation failures back onto their fields so the user
      // sees exactly what to fix, not just a single generic toast.
      const serverErrors = axios.isAxiosError(err)
        ? (err.response?.data as { errors?: string[] } | undefined)?.errors
        : undefined;
      if (!applyServerErrors(serverErrors)) {
        toast.error(getErrorMessage(err, saveAsDraft ? 'Failed to save draft' : 'Failed to create campaign'));
      }
    } finally { setLoading(false); }
  };

  // Backend errors come as ["field: message", ...] — pin each to its field.
  const applyServerErrors = (errors?: string[]): boolean => {
    if (!errors?.length) return false;
    const mapped: Record<string, string> = {};
    for (const e of errors) {
      const i = e.indexOf(':');
      const field = i > 0 ? e.slice(0, i).trim() : '';
      const msg = i > 0 ? e.slice(i + 1).trim() : e;
      mapped[field || 'campaignName'] = msg;
    }
    setFieldErrors(mapped);
    toast.error('Please fix the highlighted fields.');
    return true;
  };

  const validateForm = (): boolean => {
    const e: Record<string, string> = {};

    const name = formData.campaignName.trim();
    if (!name) e.campaignName = 'Campaign name is required.';
    else if (name.length < 3) e.campaignName = 'Campaign name must be at least 3 characters.';
    else if (name.length > 100) e.campaignName = 'Campaign name cannot exceed 100 characters.';

    if (!stripHtml(formData.message)) e.message = 'Message is required.';
    else if (formData.message.length > MESSAGE_LIMIT)
      e.message = `Message is too long (${formData.message.length}/${MESSAGE_LIMIT}). Please shorten it.`;

    if (countMobileNumbers() === 0) e.mobileNumbers = 'Add at least one mobile number.';

    setFieldErrors(e);
    if (Object.keys(e).length) { toast.error('Please fix the highlighted fields.'); return false; }
    return true;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    submitCampaign(false, false);
  };

  const handleSaveDraft = () => {
    if (!validateForm()) return;
    submitCampaign(false, true);
  };

  const confirmPartialSend = () => {
    setPartialConfirm(null);
    submitCampaign(true, false);
  };

  const count = countMobileNumbers();
  // Live warning: recipients exceed the (non-super-admin) balance.
  const overBalance = balance !== null && !isSuperAdmin && count > balance;

  // ─── Live preview derived state ───────────────────────────────────────────────
  // Memoized object URLs so we don't leak a new blob URL on every keystroke.
  const mediaUrl = useMemo(() => (selectedFile && fileType === 'image') ? URL.createObjectURL(selectedFile) : null, [selectedFile, fileType]);
  useEffect(() => () => { if (mediaUrl) URL.revokeObjectURL(mediaUrl); }, [mediaUrl]);
  const profileUrl = useMemo(() => profileImage ? URL.createObjectURL(profileImage) : null, [profileImage]);
  useEffect(() => () => { if (profileUrl) URL.revokeObjectURL(profileUrl); }, [profileUrl]);
  const hasMessage = !!stripHtml(formData.message);
  const hasPhoneBtn = !!(formData.phoneButtonText && formData.phoneButtonNumber);
  const hasLinkBtn = !!(formData.linkButtonText && formData.linkButtonUrl);

  return (
    <>
      {partialConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-[3px] flex items-center justify-center z-50 p-4"
          onClick={() => { if (!loading) setPartialConfirm(null); }}
        >
          <div
            className="bg-surface rounded-2xl w-full max-w-[420px] border border-line shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-[10px] bg-[rgba(245,158,11,0.12)] flex items-center justify-center shrink-0">
                <Users size={18} className="text-[#f59e0b]" />
              </div>
              <h3 className="text-[17px] font-semibold text-fg">Not enough balance</h3>
            </div>
            <p className="text-[13px] text-fg-muted leading-[1.6] mb-1">
              You have <span className="font-semibold text-fg">{partialConfirm.affordable.toLocaleString()}</span> credit{partialConfirm.affordable === 1 ? '' : 's'}, but this campaign has <span className="font-semibold text-fg">{partialConfirm.requested.toLocaleString()}</span> numbers.
            </p>
            <p className="text-[13px] text-fg-muted leading-[1.6] mb-5">
              If you continue, only the first <span className="font-semibold text-brand-light">{partialConfirm.affordable.toLocaleString()}</span> number{partialConfirm.affordable === 1 ? '' : 's'} will be sent — the remaining <span className="font-semibold text-danger">{(partialConfirm.requested - partialConfirm.affordable).toLocaleString()}</span> won&apos;t be delivered.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => setPartialConfirm(null)}
                className="flex-1 h-[42px] rounded-lg border border-line bg-surface2 text-fg text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={confirmPartialSend}
                className="flex-1 h-[42px] rounded-lg border-none bg-brand hover:bg-brand-hover text-white text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sending…' : `Send to ${partialConfirm.affordable.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .ql-toolbar.ql-snow { background: #18181b !important; border: 1px solid #27272a !important; border-bottom: none !important; border-radius: 8px 8px 0 0 !important; }
        .ql-container.ql-snow { background: #111113 !important; border: 1px solid #27272a !important; border-radius: 0 0 8px 8px !important; font-size: 14px !important; color: #f4f4f5 !important; }
        .ql-editor { min-height: 140px; color: #f4f4f5 !important; }
        .ql-editor.ql-blank::before { color: #52525b !important; font-style: normal !important; }
        .ql-snow .ql-stroke { stroke: #71717a !important; } .ql-snow .ql-fill { fill: #71717a !important; }
        .ql-snow .ql-picker-label { color: #71717a !important; } .ql-snow .ql-picker-options { background: #18181b !important; border-color: #27272a !important; }
        .ql-snow .ql-active .ql-stroke { stroke: #4ade80 !important; } .ql-snow .ql-active .ql-fill { fill: #4ade80 !important; }
        .ql-toolbar.ql-snow .ql-formats button:hover .ql-stroke { stroke: #f4f4f5 !important; } .ql-toolbar.ql-snow .ql-formats button:hover .ql-fill { fill: #f4f4f5 !important; }
        .file-input::file-selector-button { background: rgba(22,163,74,0.15); border: 1px solid rgba(22,163,74,0.3); color: #4ade80; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; margin-right: 10px; transition: background 0.15s; }
        .file-input::file-selector-button:hover { background: rgba(22,163,74,0.25); }
        .wa-msg p { margin: 0; } .wa-msg p + p { margin-top: 6px; }
        .wa-msg a { color: #53bdeb; } .wa-msg ul, .wa-msg ol { padding-left: 18px; margin: 0; }
        .wa-msg blockquote { border-left: 3px solid #53bdeb; margin: 4px 0; padding-left: 8px; color: #cfd6da; }
      `}</style>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
          <div className="bg-surface border border-line rounded-2xl px-10 py-8 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-line border-t-brand animate-spin" style={{ animationDuration: '0.8s' }} />
            <p className="text-fg-muted text-sm font-medium">Creating campaign…</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5">
        <PageHeader title="Send Campaign" subtitle="Create and send a new WhatsApp campaign to your audience." />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Campaign name */}
          <SectionCard>
            <SectionTitle icon={Send}>Campaign Details</SectionTitle>
            <FieldInput label="Campaign Name *" type="text" name="campaignName" value={formData.campaignName} onChange={handleInput} placeholder="e.g. Summer Sale 2026" disabled={loading} />
            <FieldError msg={fieldErrors.campaignName} />
          </SectionCard>

          {/* Message */}
          <SectionCard>
            <SectionTitle icon={Send}>Message *</SectionTitle>
            <ReactQuill theme="snow" value={formData.message} onChange={content => { setFormData(prev => ({ ...prev, message: content })); clearFieldError('message'); }} modules={modules} formats={formats} placeholder="Type your message here…" />
            <div className="flex items-center justify-between mt-1.5">
              <FieldError msg={fieldErrors.message} />
              <span className={cn("text-[12px] font-medium ml-auto", formData.message.length > MESSAGE_LIMIT ? "text-danger" : "text-fg-subtle")}>
                {formData.message.length}/{MESSAGE_LIMIT}
              </span>
            </div>
          </SectionCard>

          {/* Action Buttons */}
          <SectionCard>
            <SectionTitle icon={Phone}>Action Buttons (Optional)</SectionTitle>
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
              <div className="flex flex-col gap-3">
                <p className="text-[11px] text-fg-subtle font-semibold uppercase tracking-[0.07em] m-0">
                  <Phone size={10} className="inline mr-[5px]" />Phone Button
                </p>
                <FieldInput label="Button Label" type="text" name="phoneButtonText" value={formData.phoneButtonText} onChange={handleInput} placeholder="e.g. Call Now" disabled={loading} />
                <FieldInput label="Phone Number" type="tel" name="phoneButtonNumber" value={formData.phoneButtonNumber} onChange={handlePhoneNumberChange} placeholder="+91 98765 43210" disabled={loading} />
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-[11px] text-fg-subtle font-semibold uppercase tracking-[0.07em] m-0">
                  <Link2 size={10} className="inline mr-[5px]" />Link Button
                </p>
                <FieldInput label="Button Label" type="text" name="linkButtonText" value={formData.linkButtonText} onChange={handleInput} placeholder="e.g. Visit Website" disabled={loading} />
                <FieldInput label="URL" type="url" name="linkButtonUrl" value={formData.linkButtonUrl} onChange={handleInput} placeholder="https://example.com" disabled={loading} />
              </div>
            </div>
          </SectionCard>

          {/* Media */}
          <SectionCard>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon={ImageIcon}>Media Attachment</SectionTitle>
              <span className="text-[11px] text-fg-subtle bg-surface2 border border-line rounded-[5px] px-2 py-0.5">Max 5 MB</span>
            </div>
            {selectedFile && (
              <div className="mb-4 px-3.5 py-2.5 bg-brand-dim border border-brand-border rounded-lg flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Upload size={14} className="text-brand-light flex-shrink-0" />
                  <span className="text-[13px] text-fg overflow-hidden text-ellipsis whitespace-nowrap">{selectedFile.name}</span>
                  <span className="text-[11px] text-fg-muted flex-shrink-0">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button type="button" onClick={() => { setSelectedFile(null); setFileType(null); }} className="bg-transparent border-none cursor-pointer p-0.5 flex-shrink-0">
                  <X size={14} className="text-danger" />
                </button>
              </div>
            )}
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
              {[
                { type: 'image' as const, label: 'Image', hint: 'JPG, PNG, GIF, WebP', accept: 'image/*' },
                { type: 'video' as const, label: 'Video', hint: 'MP4, MOV, WebM', accept: 'video/mp4,video/quicktime,video/webm' },
              ].map(({ type, label, accept }) => (
                <div key={type}>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.07em] mb-1.5 text-fg-muted">
                    {label}
                  </label>
                  <input type="file" accept={accept} onChange={e => handleFileUpload(e, type)} disabled={loading || (selectedFile !== null && fileType !== type)} className={cn(fieldCls, "file-input px-3 py-2 text-xs cursor-pointer")} />
                </div>
              ))}
            </div>

            {/* Campaign profile picture (optional) */}
            <div className="mt-5 pt-5 border-t border-line">
              <div className="flex items-center gap-2 mb-1">
                <UserCircle size={15} className="text-brand-light" />
                <p className="text-[12px] font-semibold text-fg uppercase tracking-[0.06em]">Profile Picture</p>
                <span className="text-[10px] text-fg-subtle font-normal normal-case tracking-normal">· optional</span>
              </div>
              <p className="text-[11px] text-fg-subtle mb-3">Attach a profile picture for this campaign (image only).</p>

              {profileImage ? (
                <div className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-brand-dim border border-brand-border rounded-lg">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={profileUrl ?? ''} alt="Profile preview" className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-brand-border" />
                    <div className="min-w-0">
                      <p className="text-[13px] text-fg overflow-hidden text-ellipsis whitespace-nowrap">{profileImage.name}</p>
                      <p className="text-[11px] text-fg-muted">{(profileImage.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setProfileImage(null)} className="bg-transparent border-none cursor-pointer p-0.5 flex-shrink-0">
                    <X size={14} className="text-danger" />
                  </button>
                </div>
              ) : (
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" onChange={handleProfileUpload} disabled={loading} className={cn(fieldCls, "file-input px-3 py-2 text-xs cursor-pointer")} />
              )}
            </div>
          </SectionCard>

          {/* Recipients */}
          <SectionCard>
            <SectionTitle icon={Users}>Recipients</SectionTitle>
            <div className="flex flex-col gap-3.5">
              <div>
                <label className={fieldLabelCls}>Entry Type</label>
                <select name="mobileNumberEntryType" value={formData.mobileNumberEntryType} onChange={handleInput} disabled={loading} className={fieldCls}>
                  <option value="manual">Manual Entry</option>
                  <option value="upload">File Upload (CSV / Excel)</option>
                </select>
              </div>

              {formData.mobileNumberEntryType === 'upload' && (
                <div>
                  <label className={fieldLabelCls}>
                    Import from CSV / Excel
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleRecipientsImport}
                    disabled={loading || importing}
                    className={cn(fieldCls, "file-input px-3 py-2 text-xs", importing ? "cursor-wait" : "cursor-pointer")}
                  />
                  <p className="text-[11px] text-fg-subtle mt-1.5 flex items-center gap-[5px]">
                    <FileSpreadsheet size={12} className="text-fg-subtle" />
                    {importing ? 'Reading file…' : 'Numbers from any column are detected and added below. Review them before sending.'}
                  </p>
                </div>
              )}
              <div>
                <label className={fieldLabelCls}>Mobile Numbers *</label>
                <div className="flex gap-2">
                  <input type="text" name="countryCode" value={formData.countryCode} onChange={handleInput} disabled={loading}
                    className={cn(fieldCls, "w-[72px] flex-shrink-0")}
                  />
                  <textarea name="mobileNumbers" value={formData.mobileNumbers} onChange={handleMobileNumberChange}
                    placeholder={"Enter numbers separated by commas or new lines\n9876543210, 9876543211\n9876543212"}
                    rows={5} disabled={loading}
                    className={cn(fieldCls, "resize-y leading-[1.6] font-mono flex-1")}
                  />
                </div>
                <FieldError msg={fieldErrors.mobileNumbers} />
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] w-fit border", count > 0 ? "bg-brand-dim border-brand-border" : "bg-surface2 border-line")}>
                  <Hash size={13} className={count > 0 ? "text-brand-light" : "text-fg-subtle"} />
                  <span className={cn("text-[13px] font-semibold", count > 0 ? "text-brand-light" : "text-fg-subtle")}>
                    {count} {count === 1 ? 'number' : 'numbers'} detected
                  </span>
                </div>
                {balance !== null && !isSuperAdmin && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] w-fit border bg-surface2 border-line">
                    <span className="text-[13px] font-semibold text-fg-muted">Balance: ₹{balance.toLocaleString()}</span>
                  </div>
                )}
              </div>
              {overBalance && (
                <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-[8px] border bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.35)]">
                  <AlertTriangle size={15} className="text-[#f59e0b] flex-shrink-0 mt-px" />
                  <p className="text-[12.5px] text-fg-muted leading-[1.5] m-0">
                    You added <strong className="text-fg">{count.toLocaleString()}</strong> numbers but only have <strong className="text-fg">{balance?.toLocaleString()}</strong> credits.
                    Sending will reach at most <strong className="text-[#f59e0b]">{balance?.toLocaleString()}</strong> of them — top up your balance, remove numbers, or save this as a draft for later.
                  </p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Submit */}
          <div className="flex justify-end pt-1 gap-2.5 flex-wrap">
            <button type="button" onClick={handleSaveDraft} disabled={loading} className="flex items-center gap-2 px-6 py-[11px] bg-surface2 hover:bg-surface border border-line text-fg font-semibold text-sm rounded-[9px] cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              <Save size={15} />
              Save as Draft
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-7 py-[11px] bg-brand hover:bg-brand-hover text-white font-semibold text-sm border-none rounded-[9px] cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-brand">
              <Send size={15} />
              {loading ? 'Sending…' : 'Send Campaign'}
            </button>
          </div>
        </form>

        {/* Live WhatsApp preview */}
        <aside className="lg:sticky lg:top-4 flex flex-col gap-3 order-first lg:order-none">
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
              <Eye size={14} className="text-brand-light" />
              <p className="text-[12px] font-semibold text-fg uppercase tracking-[0.06em]">Live Preview</p>
            </div>
            <div className="p-4" style={{ background: '#0b141a' }}>
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-surface2 border border-line flex items-center justify-center">
                  {profileUrl ? <img src={profileUrl} alt="" className="w-full h-full object-cover" /> : <UserCircle size={20} className="text-fg-subtle" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="rounded-lg rounded-tl-none overflow-hidden shadow-[0_1px_1px_rgba(0,0,0,0.3)]" style={{ background: '#202c33' }}>
                    {mediaUrl && <img src={mediaUrl} alt="" className="w-full max-h-44 object-cover" />}
                    {!mediaUrl && selectedFile && fileType === 'video' && (
                      <div className="h-24 flex items-center justify-center" style={{ background: '#111b21' }}><ImageIcon size={22} className="text-fg-subtle" /></div>
                    )}
                    <div className="px-2.5 py-2">
                      {formData.campaignName && <p className="text-[13px] font-semibold mb-0.5" style={{ color: '#53bdeb' }}>{formData.campaignName}</p>}
                      {hasMessage
                        ? <div className="wa-msg text-[13px] leading-[1.5] break-words" style={{ color: '#e9edef' }} dangerouslySetInnerHTML={{ __html: formData.message }} />
                        : <p className="text-[13px] italic" style={{ color: '#8696a0' }}>Your message preview appears here…</p>}
                      <div className="text-right text-[10px] mt-1" style={{ color: '#8696a0' }}>Now</div>
                    </div>
                    {hasPhoneBtn && <div className="flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium" style={{ color: '#53bdeb', borderTop: '1px solid #2a3942' }}><Phone size={14} /> {formData.phoneButtonText}</div>}
                    {hasLinkBtn && <div className="flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium" style={{ color: '#53bdeb', borderTop: '1px solid #2a3942' }}><Link2 size={14} /> {formData.linkButtonText}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-surface border border-line rounded-xl px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[12px]"><span className="text-fg-subtle">Recipients</span><span className={cn("font-semibold", count > 0 ? "text-brand-light" : "text-fg-subtle")}>{count.toLocaleString()}</span></div>
            {balance !== null && !isSuperAdmin && (
              <div className="flex items-center justify-between text-[12px]"><span className="text-fg-subtle">Balance</span><span className={cn("font-medium", overBalance ? "text-[#f59e0b]" : "text-fg")}>₹{balance.toLocaleString()}</span></div>
            )}
          </div>
        </aside>
        </div>
      </div>
    </>
  );
};

export default SendWhatsapp;
