import React, { useState } from "react";
import ReactQuill from "react-quill-new";
import type { FormEvent, ChangeEvent } from "react";
import axios from "axios";
import "react-quill-new/dist/quill.snow.css";
import { api } from "../api/client";
import {
  Send, Phone, Link2, ImageIcon, Users,
  X, CheckCircle2, AlertCircle, Hash, Upload,
} from "lucide-react";

/* ── design tokens ── */
const D = {
  bg:          '#0a0a0c',
  surface:     '#111113',
  surface2:    '#18181b',
  border:      '#27272a',
  border2:     '#3f3f46',
  text:        '#f4f4f5',
  textMuted:   '#71717a',
  textSubtle:  '#52525b',
  green:       '#16a34a',
  greenLight:  '#4ade80',
  greenDim:    'rgba(22,163,74,0.12)',
  greenBorder: 'rgba(22,163,74,0.35)',
  red:         '#f87171',
  redDim:      'rgba(248,113,113,0.1)',
  redBorder:   'rgba(248,113,113,0.3)',
};

interface FormData {
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

/* ── small shared pieces ── */
const SectionCard = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: D.surface, border: `1px solid ${D.border}`,
    borderRadius: 12, padding: '20px 24px', ...style,
  }}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, children }: { icon: React.FC<{ size?: number; color?: string }>; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
    <div style={{ width: 28, height: 28, borderRadius: 7, background: D.greenDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={14} color={D.greenLight} />
    </div>
    <p style={{ fontSize: 13, fontWeight: 600, color: D.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</p>
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: D.surface2, border: `1px solid ${D.border}`,
  borderRadius: 8, fontSize: 14, color: D.text,
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const FieldInput = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: D.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
      {label}
    </label>
    <input
      {...props}
      style={inputStyle}
      onFocus={e => { e.currentTarget.style.borderColor = D.green; }}
      onBlur={e =>  { e.currentTarget.style.borderColor = D.border; }}
    />
  </div>
);

/* ── toast ── */
const Toast = ({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) => (
  <div style={{
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    background: type === 'success' ? D.greenDim : D.redDim,
    border: `1px solid ${type === 'success' ? D.greenBorder : D.redBorder}`,
    borderRadius: 10, padding: '12px 16px',
    display: 'flex', alignItems: 'flex-start', gap: 10,
    maxWidth: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    animation: 'slideInRight 0.25s ease',
  }}>
    {type === 'success'
      ? <CheckCircle2 size={16} style={{ color: D.greenLight, flexShrink: 0, marginTop: 1 }} />
      : <AlertCircle  size={16} style={{ color: D.red,        flexShrink: 0, marginTop: 1 }} />
    }
    <p style={{ fontSize: 13, color: D.text, flex: 1, lineHeight: 1.5 }}>{msg}</p>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
      <X size={14} style={{ color: D.textMuted }} />
    </button>
  </div>
);

/* ── main component ── */
const SendWhatsapp = () => {
  const [formData, setFormData] = useState<FormData>({
    campaignName: "",
    message: "",
    phoneButtonText: "",
    phoneButtonNumber: "",
    linkButtonText: "",
    linkButtonUrl: "",
    mobileNumberEntryType: "Manual Entry",
    mobileNumbers: "",
    countryCode: "+91",
    numberCount: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType,     setFileType]     = useState<"image" | "video" | "pdf" | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [success,      setSuccess]      = useState("");
  const [toastError,   setToastError]   = useState("");

  const modules  = { toolbar: [["bold", "italic"], [{ list: "ordered" }, { list: "bullet" }], ["blockquote"], ["link"]] };
  const formats  = ["bold", "italic", "list", "blockquote", "link"];

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMessageChange = (content: string) => setFormData(prev => ({ ...prev, message: content }));

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, type: "image" | "video" | "pdf") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setToastError("File size exceeds 5 MB limit"); return; }
    const valid: Record<string, string[]> = {
      image: ["image/png", "image/jpeg", "image/jpg", "image/gif"],
      video: ["video/mp4"],
      pdf:   ["application/pdf"],
    };
    if (!valid[type].includes(file.type)) { setToastError(`Invalid ${type} file type`); return; }
    setSelectedFile(file);
    setFileType(type);
  };

  const handleMobileNumberChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    if (!/^[0-9+,\s\n\r]*$/.test(value)) {
      setToastError("Only numbers, +, commas, spaces, and line breaks are allowed");
      return;
    }
    setFormData(prev => ({ ...prev, mobileNumbers: value }));
  };

  const handlePhoneNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (!/^[0-9\s+]*$/.test(value)) { setToastError("Only numbers, spaces, and + are allowed"); return; }
    setFormData(prev => ({ ...prev, phoneButtonNumber: value }));
  };

  const countMobileNumbers = () => {
    if (!formData.mobileNumbers.trim()) return 0;
    return formData.mobileNumbers.split(/[\n,]/).map(n => n.trim()).filter(Boolean).length;
  };

  const clearFile = () => { setSelectedFile(null); setFileType(null); };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setToastError("");
    setSuccess("");

    if (!formData.campaignName || !formData.message || !formData.mobileNumbers) {
      setToastError("Campaign name, message, and mobile numbers are required");
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("campaignName", formData.campaignName);
      submitData.append("message", formData.message);
      submitData.append("mobileNumberEntryType", formData.mobileNumberEntryType);
      submitData.append("mobileNumbers", formData.mobileNumbers);
      submitData.append("countryCode", formData.countryCode);
      if (formData.phoneButtonText && formData.phoneButtonNumber) {
        submitData.append("phoneButtonText", formData.phoneButtonText);
        submitData.append("phoneButtonNumber", formData.phoneButtonNumber);
      }
      if (formData.linkButtonText && formData.linkButtonUrl) {
        submitData.append("linkButtonText", formData.linkButtonText);
        submitData.append("linkButtonUrl", formData.linkButtonUrl);
      }
      if (selectedFile) submitData.append("image", selectedFile);

      const { data: result } = await api.post<{ success: boolean; message?: string; errors?: string[] }>("/api/campaigns", submitData);

      if (result.success) {
        setSuccess("Campaign created successfully!");
        setFormData({ campaignName: "", message: "", phoneButtonText: "", phoneButtonNumber: "", linkButtonText: "", linkButtonUrl: "", mobileNumberEntryType: "Manual Entry", mobileNumbers: "", countryCode: "+91", numberCount: "" });
        setSelectedFile(null);
        setFileType(null);
      } else {
        setToastError(result.errors?.[0] || result.message || "Failed to create campaign");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data as { message?: string; errors?: string[] };
        setToastError(d.errors?.[0] || d.message || "Failed to create campaign");
      } else if (err instanceof Error) {
        setToastError(err.message);
      } else {
        setToastError("An unknown error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const count = countMobileNumbers();

  return (
    <>
      <style>{`
        @keyframes spin           { to { transform: rotate(360deg); } }
        @keyframes slideInRight   { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeIn         { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }

        /* Quill dark theme overrides */
        .ql-toolbar.ql-snow {
          background: #18181b !important;
          border: 1px solid #27272a !important;
          border-bottom: none !important;
          border-radius: 8px 8px 0 0 !important;
        }
        .ql-container.ql-snow {
          background: #111113 !important;
          border: 1px solid #27272a !important;
          border-radius: 0 0 8px 8px !important;
          font-size: 14px !important;
          color: #f4f4f5 !important;
        }
        .ql-editor { min-height: 140px; color: #f4f4f5 !important; }
        .ql-editor.ql-blank::before { color: #52525b !important; font-style: normal !important; }
        .ql-snow .ql-stroke         { stroke: #71717a !important; }
        .ql-snow .ql-fill           { fill:   #71717a !important; }
        .ql-snow .ql-picker-label   { color:  #71717a !important; }
        .ql-snow .ql-picker-options { background: #18181b !important; border-color: #27272a !important; }
        .ql-snow .ql-active .ql-stroke { stroke: #4ade80 !important; }
        .ql-snow .ql-active .ql-fill   { fill:   #4ade80 !important; }
        .ql-toolbar.ql-snow .ql-formats button:hover .ql-stroke { stroke: #f4f4f5 !important; }
        .ql-toolbar.ql-snow .ql-formats button:hover .ql-fill   { fill:   #f4f4f5 !important; }

        /* file input styling */
        .file-input::file-selector-button {
          background: rgba(22,163,74,0.15);
          border: 1px solid rgba(22,163,74,0.3);
          color: #4ade80;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-right: 10px;
          transition: background 0.15s;
        }
        .file-input::file-selector-button:hover { background: rgba(22,163,74,0.25); }
        .file-input:disabled::file-selector-button { opacity: 0.4; cursor: not-allowed; }

        textarea:focus, select:focus { outline: none; border-color: #16a34a !important; }
        select option { background: #18181b; color: #f4f4f5; }
      `}</style>

      {/* Toasts */}
      {toastError && <Toast msg={toastError} type="error"   onClose={() => setToastError("")} />}

      {/* Loading overlay */}
      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 16, padding: '32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${D.border}`, borderTopColor: D.green, animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: D.textMuted, fontSize: 14, fontWeight: 500 }}>Creating campaign…</p>
          </div>
        </div>
      )}

      {/* Success modal */}
      {success && !loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
          onClick={() => setSuccess("")}>
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 16, padding: '36px 40px', maxWidth: 360, width: '100%', animation: 'fadeIn 0.2s ease', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: D.greenDim, border: `1px solid ${D.greenBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle2 size={26} style={{ color: D.greenLight }} />
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: D.text, marginBottom: 8 }}>Campaign Sent!</p>
            <p style={{ fontSize: 13, color: D.textMuted, marginBottom: 28, lineHeight: 1.6 }}>{success}</p>
            <button
              onClick={() => setSuccess("")}
              style={{ width: '100%', padding: '10px 0', background: D.green, color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', borderRadius: 8, cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: D.text, margin: 0 }}>Send Campaign</h1>
        <p style={{ fontSize: 13, color: D.textMuted, marginTop: 4 }}>Create and send a new WhatsApp campaign to your audience.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Campaign name */}
        <SectionCard>
          <SectionTitle icon={Send}>Campaign Details</SectionTitle>
          <FieldInput
            label="Campaign Name *"
            type="text"
            name="campaignName"
            value={formData.campaignName}
            onChange={handleInputChange}
            placeholder="e.g. Summer Sale 2026"
            disabled={loading}
          />
        </SectionCard>

        {/* Message */}
        <SectionCard>
          <SectionTitle icon={Send}>Message *</SectionTitle>
          <ReactQuill
            theme="snow"
            value={formData.message}
            onChange={handleMessageChange}
            modules={modules}
            formats={formats}
            placeholder="Type your message here…"
          />
        </SectionCard>

        {/* Buttons section */}
        <SectionCard>
          <SectionTitle icon={Phone}>Action Buttons (Optional)</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {/* Phone button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                <Phone size={10} style={{ display: 'inline', marginRight: 5 }} />Phone Button
              </p>
              <FieldInput label="Button Label" type="text" name="phoneButtonText" value={formData.phoneButtonText} onChange={handleInputChange} placeholder="e.g. Call Now" disabled={loading} />
              <FieldInput label="Phone Number" type="tel" name="phoneButtonNumber" value={formData.phoneButtonNumber} onChange={handlePhoneNumberChange} placeholder="+91 98765 43210" disabled={loading} />
            </div>
            {/* Link button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                <Link2 size={10} style={{ display: 'inline', marginRight: 5 }} />Link Button
              </p>
              <FieldInput label="Button Label" type="text" name="linkButtonText" value={formData.linkButtonText} onChange={handleInputChange} placeholder="e.g. Visit Website" disabled={loading} />
              <FieldInput label="URL" type="url" name="linkButtonUrl" value={formData.linkButtonUrl} onChange={handleInputChange} placeholder="https://example.com" disabled={loading} />
            </div>
          </div>
        </SectionCard>

        {/* Media upload */}
        <SectionCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <SectionTitle icon={ImageIcon}>Media Attachment</SectionTitle>
            <span style={{ fontSize: 11, color: D.textSubtle, background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 5, padding: '2px 8px' }}>Max 5 MB</span>
          </div>

          {selectedFile && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: D.greenDim, border: `1px solid ${D.greenBorder}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Upload size={14} style={{ color: D.greenLight, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile.name}
                </span>
                <span style={{ fontSize: 11, color: D.textMuted, flexShrink: 0 }}>({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <button type="button" onClick={clearFile} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                <X size={14} style={{ color: D.red }} />
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { type: 'image' as const, label: 'Image', hint: 'JPG, PNG, GIF', disabled: false, accept: 'image/*' },
              { type: 'video' as const, label: 'Video', hint: 'MP4 — coming soon', disabled: true, accept: 'video/*' },
              { type: 'pdf'   as const, label: 'PDF',   hint: 'Coming soon',     disabled: true, accept: 'application/pdf' },
            ].map(({ type, label, hint, disabled, accept }) => (
              <div key={type}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: disabled ? D.textSubtle : D.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  {label}
                  {disabled && <span style={{ marginLeft: 6, fontSize: 10, color: D.textSubtle, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· soon</span>}
                </label>
                <input
                  type="file"
                  accept={accept}
                  onChange={e => handleFileUpload(e, type)}
                  disabled={disabled || loading || (selectedFile !== null && fileType !== type)}
                  className="file-input"
                  style={{
                    ...inputStyle, padding: '8px 12px',
                    fontSize: 12, cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.45 : 1,
                  }}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Recipients */}
        <SectionCard>
          <SectionTitle icon={Users}>Recipients</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Entry type */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: D.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                Entry Type
              </label>
              <select
                name="mobileNumberEntryType"
                value={formData.mobileNumberEntryType}
                onChange={handleInputChange}
                disabled={loading}
                style={{ ...inputStyle }}
              >
                <option value="Manual Entry">Manual Entry</option>
                <option value="CSV Upload">CSV Upload</option>
                <option value="Contact List">Contact List</option>
              </select>
            </div>

            {/* Country code + numbers */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: D.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                Mobile Numbers *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  disabled={loading}
                  style={{ ...inputStyle, width: 72, flexShrink: 0 }}
                  onFocus={e => { e.currentTarget.style.borderColor = D.green; }}
                  onBlur={e =>  { e.currentTarget.style.borderColor = D.border; }}
                />
                <textarea
                  name="mobileNumbers"
                  value={formData.mobileNumbers}
                  onChange={handleMobileNumberChange}
                  placeholder="Enter numbers separated by commas or new lines&#10;9876543210, 9876543211&#10;9876543212"
                  rows={5}
                  disabled={loading}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, fontFamily: 'monospace', flex: 1 }}
                  onFocus={e => { e.currentTarget.style.borderColor = D.green; }}
                  onBlur={e =>  { e.currentTarget.style.borderColor = D.border; }}
                />
              </div>
            </div>

            {/* Number count badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: count > 0 ? D.greenDim : D.surface2, border: `1px solid ${count > 0 ? D.greenBorder : D.border}`, borderRadius: 7 }}>
                <Hash size={13} style={{ color: count > 0 ? D.greenLight : D.textSubtle }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: count > 0 ? D.greenLight : D.textSubtle }}>
                  {count} {count === 1 ? 'number' : 'numbers'} detected
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 28px', background: D.green, color: '#fff',
              fontWeight: 600, fontSize: 14, border: 'none', borderRadius: 9,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.15s, background 0.15s',
              boxShadow: '0 0 0 0 rgba(22,163,74,0)',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#15803d'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = D.green; }}
          >
            <Send size={15} />
            {loading ? 'Sending…' : 'Send Campaign'}
          </button>
        </div>
      </form>
    </>
  );
};

export default SendWhatsapp;
