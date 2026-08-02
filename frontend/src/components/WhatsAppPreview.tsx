import { ArrowLeft, Video, Phone, MoreVertical, UserCircle, Link2, Smile, Paperclip, Camera, Mic, Signal, Wifi, BatteryFull } from 'lucide-react';

// Strip HTML tags + decode entities to plain text. Reading textContent off a
// detached node does NOT execute scripts or load images, so this is safe for
// rendering another user's stored message (no HTML injection).
const stripHtml = (h: string) => {
  if (!h) return '';
  const el = document.createElement('div');
  el.innerHTML = h;
  return (el.textContent ?? '').trim();
};

interface Props {
  name?: string;
  profileImage?: string | null;
  message?: string; // raw (may contain HTML) — rendered as safe text
  mediaImage?: string | null;
  mediaIsVideo?: boolean;
  phoneButtonText?: string | null;
  linkButtonText?: string | null;
  time?: string;
}

/** WhatsApp-style phone mockup, shared by Send Campaign and the campaign detail page. */
export function WhatsAppPreview({
  name, profileImage, message, mediaImage, mediaIsVideo,
  phoneButtonText, linkButtonText, time = '9:41 AM',
}: Props) {
  const text = stripHtml(message ?? '');

  return (
    <div className="mx-auto w-full max-w-[300px] rounded-[2.4rem] border-[8px] border-[#0a0a0a] bg-[#0b141a] shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden select-none">
      {/* Header + status bar */}
      <div style={{ background: '#202c33' }}>
        <div className="relative flex items-center justify-between px-5 pt-2 pb-1 text-[10px] font-medium text-[#e9edef]">
          <span>9:41</span>
          <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-16 h-4 bg-[#0a0a0a] rounded-full" />
          <div className="flex items-center gap-1"><Signal size={11} /><Wifi size={11} /><BatteryFull size={14} /></div>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-2">
          <ArrowLeft size={18} className="text-[#e9edef] flex-shrink-0" />
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#0b141a] flex items-center justify-center">
            {profileImage ? <img src={profileImage} alt="" className="w-full h-full object-cover" /> : <UserCircle size={22} className="text-[#8696a0]" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#e9edef] truncate leading-tight">{name || 'Your Business'}</p>
            <p className="text-[10px] text-[#8696a0] leading-tight">online</p>
          </div>
          <Video size={17} className="text-[#e9edef] flex-shrink-0" />
          <Phone size={15} className="text-[#e9edef] flex-shrink-0" />
          <MoreVertical size={17} className="text-[#e9edef] flex-shrink-0" />
        </div>
      </div>

      {/* Chat area */}
      <div
        className="px-3 py-4 min-h-[380px]"
        style={{ backgroundColor: '#0b141a', backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '18px 18px' }}
      >
        <div className="flex justify-center mb-3">
          <span className="text-[10px] px-2.5 py-1 rounded-md" style={{ background: '#182229', color: '#8696a0' }}>TODAY</span>
        </div>

        <div className="max-w-[85%] rounded-lg rounded-tl-none overflow-hidden shadow-[0_1px_1px_rgba(0,0,0,0.35)]" style={{ background: '#202c33' }}>
          {mediaImage && <img src={mediaImage} alt="" className="w-full max-h-44 object-cover" />}
          {!mediaImage && mediaIsVideo && (
            <div className="h-24 flex items-center justify-center" style={{ background: '#111b21' }}><Video size={22} className="text-[#8696a0]" /></div>
          )}
          <div className="px-2.5 py-2">
            {text
              ? <p className="text-[13px] leading-[1.5] break-words whitespace-pre-wrap" style={{ color: '#e9edef' }}>{text}</p>
              : <p className="text-[13px] italic" style={{ color: '#8696a0' }}>Your message preview appears here…</p>}
            <div className="text-right text-[10px] mt-1" style={{ color: '#8696a0' }}>{time}</div>
          </div>
          {phoneButtonText && <div className="flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium" style={{ color: '#53bdeb', borderTop: '1px solid #2a3942' }}><Phone size={14} /> {phoneButtonText}</div>}
          {linkButtonText && <div className="flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium" style={{ color: '#53bdeb', borderTop: '1px solid #2a3942' }}><Link2 size={14} /> {linkButtonText}</div>}
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-1.5 px-2 py-2" style={{ background: '#0b141a' }}>
        <div className="flex-1 flex items-center gap-2 rounded-full px-3 py-2" style={{ background: '#202c33' }}>
          <Smile size={16} className="text-[#8696a0] flex-shrink-0" />
          <span className="text-[11px] flex-1" style={{ color: '#8696a0' }}>Message</span>
          <Paperclip size={15} className="text-[#8696a0] flex-shrink-0" />
          <Camera size={15} className="text-[#8696a0] flex-shrink-0" />
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#00a884' }}>
          <Mic size={17} className="text-[#0b141a]" />
        </div>
      </div>
    </div>
  );
}
