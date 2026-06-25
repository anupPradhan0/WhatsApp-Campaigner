import React, { useState } from 'react';
import ReactQuill from 'react-quill-new';
import type { FormEvent, ChangeEvent } from 'react';
import { toast } from 'sonner';
import 'react-quill-new/dist/quill.snow.css';
import { api, getErrorMessage } from '../api/client';
import { Send, Phone, Link2, ImageIcon, Users, X, CheckCircle2, Hash, Upload, FileSpreadsheet } from 'lucide-react';
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

const FieldInput = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className={fieldLabelCls}>{label}</label>
    <input {...props} className={fieldCls} />
  </div>
);

const SendWhatsapp = () => {
  const [formData, setFormData] = useState<CampaignForm>({
    campaignName: '', message: '',
    phoneButtonText: '', phoneButtonNumber: '',
    linkButtonText: '', linkButtonUrl: '',
    mobileNumberEntryType: 'manual',
    mobileNumbers: '', countryCode: '+91', numberCount: '',
  });
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'pdf' | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const modules = { toolbar: [['bold', 'italic'], [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote'], ['link']] };
  const formats = ['bold', 'italic', 'list', 'blockquote', 'link'];

  const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File size exceeds 5 MB limit'); return; }
    const valid: Record<string, string[]> = {
      image: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/quicktime', 'video/webm'],
      pdf: ['application/pdf'],
    };
    if (!valid[type].includes(file.type)) { toast.error(`Invalid ${type} file type`); return; }
    setSelectedFile(file); setFileType(type);
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setSuccess('');
    if (!formData.campaignName || !formData.message || !formData.mobileNumbers) {
      toast.error('Campaign name, message, and mobile numbers are required'); return;
    }
    setLoading(true);
    try {
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

      const { data: result } = await api.post<{ success: boolean; message?: string; errors?: string[] }>('/api/campaigns', data);

      if (result.success) {
        setSuccess('Campaign created successfully!');
        setFormData({ campaignName: '', message: '', phoneButtonText: '', phoneButtonNumber: '', linkButtonText: '', linkButtonUrl: '', mobileNumberEntryType: 'manual', mobileNumbers: '', countryCode: '+91', numberCount: '' });
        setSelectedFile(null); setFileType(null);
      } else {
        toast.error(result.errors?.[0] || result.message || 'Failed to create campaign');
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to create campaign'));
    } finally { setLoading(false); }
  };

  const count = countMobileNumbers();

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
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
      `}</style>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-surface border border-line rounded-2xl px-10 py-8 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-[3px] border-line border-t-brand animate-spin" style={{ animationDuration: '0.8s' }} />
            <p className="text-fg-muted text-sm font-medium">Creating campaign…</p>
          </div>
        </div>
      )}

      {/* Success modal */}
      {success && !loading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4" onClick={() => setSuccess('')}>
          <div className="bg-surface border border-line rounded-2xl px-10 py-9 max-w-[360px] w-full text-center [animation:fadeIn_0.2s_ease]" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-brand-dim border border-brand-border flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={26} className="text-brand-light" />
            </div>
            <p className="text-lg font-bold text-fg mb-2">Campaign Sent!</p>
            <p className="text-[13px] text-fg-muted mb-7 leading-[1.6]">{success}</p>
            <button onClick={() => setSuccess('')} className="w-full py-2.5 bg-brand text-white font-semibold text-sm border-none rounded-lg cursor-pointer">Done</button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5">
        <PageHeader title="Send Campaign" subtitle="Create and send a new WhatsApp campaign to your audience." />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Campaign name */}
          <SectionCard>
            <SectionTitle icon={Send}>Campaign Details</SectionTitle>
            <FieldInput label="Campaign Name *" type="text" name="campaignName" value={formData.campaignName} onChange={handleInput} placeholder="e.g. Summer Sale 2026" disabled={loading} />
          </SectionCard>

          {/* Message */}
          <SectionCard>
            <SectionTitle icon={Send}>Message *</SectionTitle>
            <ReactQuill theme="snow" value={formData.message} onChange={content => setFormData(prev => ({ ...prev, message: content }))} modules={modules} formats={formats} placeholder="Type your message here…" />
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
                { type: 'image' as const, label: 'Image', hint: 'JPG, PNG, GIF, WebP', disabled: false, accept: 'image/*' },
                { type: 'video' as const, label: 'Video', hint: 'MP4, MOV, WebM', disabled: false, accept: 'video/mp4,video/quicktime,video/webm' },
                { type: 'pdf' as const, label: 'PDF', hint: 'PDF document', disabled: false, accept: 'application/pdf' },
              ].map(({ type, label, disabled, accept }) => (
                <div key={type}>
                  <label className={cn("block text-[11px] font-semibold uppercase tracking-[0.07em] mb-1.5", disabled ? "text-fg-subtle" : "text-fg-muted")}>
                    {label}
                    {disabled && <span className="ml-1.5 text-[10px] text-fg-subtle font-normal normal-case tracking-normal">· soon</span>}
                  </label>
                  <input type="file" accept={accept} onChange={e => handleFileUpload(e, type)} disabled={disabled || loading || (selectedFile !== null && fileType !== type)} className={cn(fieldCls, "file-input px-3 py-2 text-xs", disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer")} />
                </div>
              ))}
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
              </div>
              <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] w-fit border", count > 0 ? "bg-brand-dim border-brand-border" : "bg-surface2 border-line")}>
                <Hash size={13} className={count > 0 ? "text-brand-light" : "text-fg-subtle"} />
                <span className={cn("text-[13px] font-semibold", count > 0 ? "text-brand-light" : "text-fg-subtle")}>
                  {count} {count === 1 ? 'number' : 'numbers'} detected
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Submit */}
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-7 py-[11px] bg-brand hover:bg-brand-hover text-white font-semibold text-sm border-none rounded-[9px] cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-brand">
              <Send size={15} />
              {loading ? 'Sending…' : 'Send Campaign'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default SendWhatsapp;
