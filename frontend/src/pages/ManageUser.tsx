import React, { useState, useEffect, useCallback } from "react";
import type { ChangeEvent } from "react";
import { format } from "date-fns";
import { X, Plus, Eye, Edit2, DollarSign, Minus, Lock, Unlock, Trash2, CheckCircle2, AlertCircle, UserCircle2 } from "lucide-react";
import { getUserRole } from "../utils/Auth";
import { UserRole } from "../constants/Roles";
import { api } from "../api/client";

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
  greenBorder: 'rgba(22,163,74,0.3)',
  blue:        '#3b82f6',
  blueDim:     'rgba(59,130,246,0.12)',
  amber:       '#fbbf24',
  amberDim:    'rgba(251,191,36,0.12)',
  red:         '#f87171',
  redDim:      'rgba(248,113,113,0.1)',
  redBorder:   'rgba(248,113,113,0.3)',
};

/* ── shared helpers ── */
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: D.surface2, border: `1px solid ${D.border}`,
  borderRadius: 8, fontSize: 13, color: D.text,
  outline: 'none', boxSizing: 'border-box',
};

const FLabel = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: D.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
    {children}
  </label>
);

const FInput = ({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <FLabel>{label}</FLabel>
    <input {...p} style={inp}
      onFocus={e => (e.currentTarget.style.borderColor = D.green)}
      onBlur={e  => (e.currentTarget.style.borderColor = D.border)} />
  </div>
);

const FSelect = ({ label, children, ...p }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div>
    <FLabel>{label}</FLabel>
    <select {...p} style={{ ...inp, cursor: 'pointer' }}>{children}</select>
  </div>
);

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}
    onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 14, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
      {children}
    </div>
  </div>
);

const ModalHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${D.border}` }}>
    <p style={{ fontSize: 16, fontWeight: 700, color: D.text }}>{title}</p>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
      <X size={18} style={{ color: D.textMuted }} />
    </button>
  </div>
);

const ModalBody = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: '20px' }}>{children}</div>
);

const ModalFooter = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 10, padding: '0 20px 20px' }}>{children}</div>
);

const PrimaryBtn = ({ children, danger, ...p }: { danger?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} style={{ flex: 1, padding: '9px 0', background: danger ? D.red : D.green, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 8, cursor: p.disabled ? 'not-allowed' : 'pointer', opacity: p.disabled ? 0.6 : 1, transition: 'opacity 0.15s' }}>
    {children}
  </button>
);

const GhostBtn = ({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} style={{ flex: 1, padding: '9px 0', background: D.surface2, color: D.textMuted, fontWeight: 600, fontSize: 13, border: `1px solid ${D.border}`, borderRadius: 8, cursor: 'pointer' }}>
    {children}
  </button>
);

const InlineAlert = ({ msg, type }: { msg: string; type: 'error' | 'success' }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: type === 'error' ? D.redDim : D.greenDim, border: `1px solid ${type === 'error' ? D.redBorder : D.greenBorder}`, borderRadius: 8, marginBottom: 14 }}>
    {type === 'error' ? <AlertCircle size={14} style={{ color: D.red, flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={14} style={{ color: D.greenLight, flexShrink: 0, marginTop: 1 }} />}
    <p style={{ fontSize: 12, color: D.text }}>{msg}</p>
  </div>
);

const statusStyle = (s: string): React.CSSProperties => {
  if (s === 'active')   return { color: D.greenLight, background: D.greenDim, border: `1px solid ${D.greenBorder}` };
  if (s === 'inactive') return { color: D.red,        background: D.redDim,   border: `1px solid ${D.redBorder}` };
  return { color: D.textMuted, background: 'rgba(255,255,255,0.05)', border: `1px solid ${D.border}` };
};

const StatusBadge = ({ status }: { status: string }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em', ...statusStyle(status) }}>
    {status}
  </span>
);

const Avatar = ({ name, image, size = 36 }: { name: string; image?: string; size?: number }) => {
  const [err, setErr] = useState(false);
  if (image && !err) return <img src={image} alt={name} onError={() => setErr(true)} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${D.border2}`, flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', border: `2px solid ${D.blueDim}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.38, fontWeight: 700, color: D.blue }}>{name.charAt(0).toUpperCase()}</span>
    </div>
  );
};

const ActionBtn = ({ icon: Icon, color, bg, title: t, onClick }: { icon: React.FC<{ size?: number }>; color: string; bg: string; title: string; onClick: () => void }) => (
  <button onClick={onClick} title={t} style={{ width: 30, height: 30, borderRadius: 7, background: bg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
    <Icon size={13} />
  </button>
);

/* ── interfaces ── */
interface User {
  id: string; companyName: string; email: string; number: string; role: string;
  resellerCount: number; userCount: number; totalCampaigns: number; balance: number;
  status: 'active' | 'inactive' | 'deleted'; createdAt: string; image: string;
}
interface UsersData { totalUsers: number; users: User[]; }

/* ── page ── */
const ManageUser = () => {
  const [data,    setData]    = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);

  const [modal, setModal] = useState<'create'|'view'|'edit'|'addCredit'|'removeCredit'|'freeze'|'delete'|null>(null);

  const [createForm, setCreateForm] = useState({ companyName:'', email:'', password:'', number:'', role:'user', balance:'', image: null as File|null });
  const [editForm,   setEditForm]   = useState({ companyName:'', email:'', number:'', password:'', confirmPassword:'' });
  const [creditAmt,  setCreditAmt]  = useState('');
  const [debitAmt,   setDebitAmt]   = useState('');

  const userRole = getUserRole();
  const isAdminOrUser = userRole === UserRole.ADMIN || userRole === UserRole.RESELLER;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: r } = await api.get<{ success: boolean; message?: string; data: UsersData }>('/api/dashboard/manage-user');
      if (r.success) setData(r.data); else setError(r.message || 'Failed to load');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setCurrentPage(1); }, [itemsPerPage]);

  const totalPages  = Math.max(1, Math.ceil((data?.totalUsers || 0) / itemsPerPage));
  const startIdx    = (currentPage - 1) * itemsPerPage;
  const current     = data?.users.slice(startIdx, startIdx + itemsPerPage) || [];

  const formatDate = (s: string) => { try { return format(new Date(s), 'dd MMM yyyy, hh:mm a'); } catch { return s; } };

  const openModal = (type: typeof modal, r?: User) => {
    setError(''); setSuccess('');
    if (r) setSelected(r);
    if (type === 'edit' && r) setEditForm({ companyName: r.companyName, email: r.email, number: r.number, password: '', confirmPassword: '' });
    if (type === 'addCredit') setCreditAmt('');
    if (type === 'removeCredit') setDebitAmt('');
    setModal(type);
  };

  const closeModal = () => { setModal(null); setSelected(null); setError(''); setSuccess(''); };

  const toast = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleCreate = async () => {
    if (!createForm.companyName || !createForm.email || !createForm.password || !createForm.number || !createForm.balance) { setError('All fields are required'); return; }
    setActionLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(createForm).forEach(([k, v]) => { if (v !== null) fd.append(k, v instanceof File ? v : String(v)); });
      const { data: r } = await api.post<{ success: boolean; message?: string }>('/api/user/create', fd);
      if (r.success) { closeModal(); setCreateForm({ companyName:'', email:'', password:'', number:'', role:'user', balance:'', image:null }); fetchData(); toast('User created successfully!'); }
      else setError(r.message || 'Failed to create');
    } catch { setError('Network error.'); }
    finally { setActionLoading(false); }
  };

  const handleEdit = async () => {
    if (!selected) return;
    const hasProfile = editForm.companyName || editForm.email || editForm.number;
    const hasPass    = editForm.password || editForm.confirmPassword;
    if (!hasProfile && !hasPass) { setError('Please provide at least one field'); return; }
    if (hasPass && editForm.password !== editForm.confirmPassword) { setError('Passwords do not match'); return; }
    setActionLoading(true); setError('');
    try {
      if (hasProfile) {
        const pd: Record<string, string> = {};
        if (editForm.companyName) pd.companyName = editForm.companyName;
        if (editForm.email)       pd.email       = editForm.email;
        if (editForm.number)      pd.number      = editForm.number;
        const { data: r } = await api.put<{ success: boolean; message?: string }>(`/api/user/update/${selected.id}`, pd);
        if (!r.success) { setError(r.message || 'Failed to update'); setActionLoading(false); return; }
      }
      if (hasPass) {
        const { data: r } = await api.put<{ success: boolean; message?: string }>(`/api/user/change-password/${selected.id}`, { password: editForm.password, confirmPassword: editForm.confirmPassword });
        if (!r.success) { setError(r.message || 'Failed to change password'); setActionLoading(false); return; }
      }
      closeModal(); fetchData(); toast('Updated successfully!');
    } catch { setError('Network error.'); }
    finally { setActionLoading(false); }
  };

  const handleAddCredit = async () => {
    if (!selected || !creditAmt || parseFloat(creditAmt) <= 0) { setError('Enter a valid amount'); return; }
    setActionLoading(true); setError('');
    try {
      const { data: r } = await api.post<{ success: boolean; message?: string }>('/api/transaction/credit', { receiverId: selected.id, amount: parseFloat(creditAmt) });
      if (r.success) { closeModal(); fetchData(); toast(`₹${creditAmt} credited!`); } else setError(r.message || 'Failed');
    } catch { setError('Network error.'); }
    finally { setActionLoading(false); }
  };

  const handleRemoveCredit = async () => {
    if (!selected || !debitAmt || parseFloat(debitAmt) <= 0) { setError('Enter a valid amount'); return; }
    setActionLoading(true); setError('');
    try {
      const { data: r } = await api.post<{ success: boolean; message?: string }>('/api/transaction/debit', { userId: selected.id, amount: parseFloat(debitAmt) });
      if (r.success) { closeModal(); fetchData(); toast(`₹${debitAmt} debited!`); } else setError(r.message || 'Failed');
    } catch { setError('Network error.'); }
    finally { setActionLoading(false); }
  };

  const handleFreeze = async () => {
    if (!selected) return;
    setActionLoading(true); setError('');
    const ep = selected.status === 'active' ? 'freeze' : 'unfreeze';
    try {
      const { data: r } = await api.put<{ success: boolean; message?: string }>(`/api/user/${ep}/${selected.id}`);
      if (r.success) { closeModal(); fetchData(); toast(r.message || 'Done'); } else setError(r.message || 'Failed');
    } catch { setError('Network error.'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setActionLoading(true); setError('');
    try {
      const { data: r } = await api.delete<{ success: boolean; message?: string }>(`/api/user/delete/${selected.id}`);
      if (r.success) { closeModal(); fetchData(); toast('User deleted.'); } else setError(r.message || 'Failed');
    } catch { setError('Network error.'); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400, flexDirection:'column', gap:12 }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:`3px solid ${D.border}`, borderTopColor:D.green, animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:D.textMuted, fontSize:13 }}>Loading resellers…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!isAdminOrUser) return (
    <div style={{ padding:'12px 16px', background:D.redDim, border:`1px solid ${D.redBorder}`, borderRadius:10 }}>
      <p style={{ color:D.red, fontSize:14 }}>Access denied. Admin or User role required.</p>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .row-hover:hover td{background:rgba(255,255,255,0.025)!important}
        .action-btn:hover{filter:brightness(1.2)}
        select option{background:#18181b;color:#f4f4f5}
        input[type=file]::file-selector-button{background:rgba(22,163,74,0.15);border:1px solid rgba(22,163,74,0.3);color:#4ade80;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;margin-right:8px}
      `}</style>

      {/* Global success toast */}
      {success && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:D.greenDim, border:`1px solid ${D.greenBorder}`, borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
          <CheckCircle2 size={14} style={{ color:D.greenLight }} />
          <p style={{ fontSize:13, color:D.text }}>{success}</p>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, color:D.text, margin:0 }}>Manage Resellers</h1>
            <p style={{ fontSize:13, color:D.textMuted, marginTop:4 }}>{data?.totalUsers ?? 0} total resellers</p>
          </div>
          <button onClick={() => openModal('create')} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', background:D.green, color:'#fff', fontWeight:600, fontSize:13, border:'none', borderRadius:8, cursor:'pointer' }}>
            <Plus size={15} /> Add User
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:D.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>Show</span>
          <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))}
            style={{ background:D.surface2, border:`1px solid ${D.border}`, borderRadius:6, color:D.text, fontSize:12, padding:'4px 8px', outline:'none' }}>
            {[10,25,50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span style={{ fontSize:11, color:D.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em' }}>entries</span>
          <span style={{ marginLeft:'auto', fontSize:12, color:D.textSubtle }}>
            {startIdx + 1}–{Math.min(startIdx + itemsPerPage, data?.totalUsers || 0)} of {data?.totalUsers || 0}
          </span>
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block" style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:12, overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${D.border}` }}>
                  {['', 'Company', 'Phone', 'Email', 'Balance', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:10, color:D.textSubtle, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding:'40px 16px', textAlign:'center', color:D.textSubtle, fontSize:13 }}>No resellers found</td></tr>
                ) : current.map(r => (
                  <tr key={r.id} className="row-hover" style={{ borderBottom:`1px solid rgba(39,39,42,0.5)` }}>
                    <td style={{ padding:'10px 16px' }}><Avatar name={r.companyName} image={r.image} size={34} /></td>
                    <td style={{ padding:'10px 16px', fontSize:13, color:D.text, fontWeight:500 }}>{r.companyName}</td>
                    <td style={{ padding:'10px 16px', fontSize:12, color:D.textMuted }}>{r.number}</td>
                    <td style={{ padding:'10px 16px', fontSize:12, color:D.textMuted, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.email}</td>
                    <td style={{ padding:'10px 16px', fontSize:14, fontWeight:700, color:D.greenLight }}>₹{r.balance.toLocaleString()}</td>
                    <td style={{ padding:'10px 16px' }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding:'10px 16px' }}>
                      <div style={{ display:'flex', gap:5 }}>
                        <ActionBtn icon={Eye}        color={D.blue}    bg={D.blueDim}                            title="View"         onClick={() => openModal('view', r)} />
                        <ActionBtn icon={Edit2}       color={D.amber}   bg={D.amberDim}                           title="Edit"         onClick={() => openModal('edit', r)} />
                        <ActionBtn icon={DollarSign}  color={D.greenLight} bg={D.greenDim}                        title="Add Credit"   onClick={() => openModal('addCredit', r)} />
                        <ActionBtn icon={Minus}       color={D.red}     bg={D.redDim}                             title="Remove Credit" onClick={() => openModal('removeCredit', r)} />
                        <ActionBtn icon={r.status === 'active' ? Lock : Unlock} color={r.status==='active'?D.red:D.greenLight} bg={r.status==='active'?D.redDim:D.greenDim} title={r.status==='active'?'Freeze':'Unfreeze'} onClick={() => openModal('freeze', r)} />
                        <ActionBtn icon={Trash2}      color={D.red}     bg={D.redDim}                             title="Delete"       onClick={() => openModal('delete', r)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden" style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {current.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', background:D.surface, border:`1px solid ${D.border}`, borderRadius:12 }}>
              <p style={{ color:D.textSubtle, fontSize:13 }}>No resellers found</p>
            </div>
          ) : current.map(r => (
            <div key={r.id} style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, padding:'12px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, paddingBottom:10, borderBottom:`1px solid ${D.border}` }}>
                <Avatar name={r.companyName} image={r.image} size={38} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:600, color:D.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.companyName}</p>
                  <p style={{ fontSize:11, color:D.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.email}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div><p style={{ fontSize:10, color:D.textSubtle, marginBottom:2 }}>PHONE</p><p style={{ fontSize:12, color:D.textMuted }}>{r.number}</p></div>
                <div style={{ textAlign:'right' }}><p style={{ fontSize:10, color:D.textSubtle, marginBottom:2 }}>BALANCE</p><p style={{ fontSize:16, fontWeight:700, color:D.greenLight }}>₹{r.balance.toLocaleString()}</p></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6 }}>
                <ActionBtn icon={Eye}       color={D.blue}    bg={D.blueDim}  title="View"          onClick={() => openModal('view', r)} />
                <ActionBtn icon={Edit2}      color={D.amber}   bg={D.amberDim} title="Edit"          onClick={() => openModal('edit', r)} />
                <ActionBtn icon={DollarSign} color={D.greenLight} bg={D.greenDim} title="Add Credit"  onClick={() => openModal('addCredit', r)} />
                <ActionBtn icon={Minus}      color={D.red}     bg={D.redDim}   title="Remove Credit" onClick={() => openModal('removeCredit', r)} />
                <ActionBtn icon={r.status==='active'?Lock:Unlock} color={r.status==='active'?D.red:D.greenLight} bg={r.status==='active'?D.redDim:D.greenDim} title={r.status==='active'?'Freeze':'Unfreeze'} onClick={() => openModal('freeze', r)} />
                <ActionBtn icon={Trash2}     color={D.red}     bg={D.redDim}   title="Delete"        onClick={() => openModal('delete', r)} />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, padding:'12px 16px' }}>
            <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1}
              style={{ padding:'5px 7px', background:D.surface2, border:`1px solid ${D.border}`, borderRadius:6, cursor:currentPage===1?'not-allowed':'pointer', opacity:currentPage===1?0.4:1, display:'flex' }}>
              ‹
            </button>
            {Array.from({ length: Math.min(5,totalPages) }, (_,i) => {
              let p = totalPages<=5 ? i+1 : currentPage<=3 ? i+1 : currentPage>=totalPages-2 ? totalPages-4+i : currentPage-2+i;
              return <button key={p} onClick={() => setCurrentPage(p)} style={{ width:32, height:32, borderRadius:6, fontSize:12, fontWeight:600, border:`1px solid ${currentPage===p?D.green:D.border}`, background:currentPage===p?D.green:D.surface2, color:currentPage===p?'#fff':D.textMuted, cursor:'pointer' }}>{p}</button>;
            })}
            <button onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} disabled={currentPage===totalPages}
              style={{ padding:'5px 7px', background:D.surface2, border:`1px solid ${D.border}`, borderRadius:6, cursor:currentPage===totalPages?'not-allowed':'pointer', opacity:currentPage===totalPages?0.4:1, display:'flex' }}>
              ›
            </button>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {/* Create */}
      {modal === 'create' && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth:520, margin:'0 auto' }}>
            <ModalHeader title="Add New User" onClose={closeModal} />
            <ModalBody>
              {error   && <InlineAlert msg={error}   type="error" />}
              {success && <InlineAlert msg={success} type="success" />}
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <FInput label="Company Name *"   type="text"     placeholder="e.g. Acme Corp"           value={createForm.companyName} onChange={e => setCreateForm(f=>({...f, companyName:e.target.value}))} />
                <FInput label="Email *"          type="email"    placeholder="admin@company.com"         value={createForm.email}       onChange={e => setCreateForm(f=>({...f, email:e.target.value}))} />
                <FInput label="Password *"       type="password" placeholder="Enter password"            value={createForm.password}    onChange={e => setCreateForm(f=>({...f, password:e.target.value}))} />
                <FInput label="Phone Number *"   type="tel"      placeholder="10-digit number" maxLength={10} value={createForm.number} onChange={e => setCreateForm(f=>({...f, number:e.target.value}))} />
                <FSelect label="Role *" value={createForm.role} onChange={e => setCreateForm(f=>({...f, role:e.target.value}))}>
                  <option value="user">User</option>
                  <option value="user">User</option>
                </FSelect>
                <FInput label="Initial Balance *" type="number" placeholder="0" min="0" value={createForm.balance} onChange={e => setCreateForm(f=>({...f, balance:e.target.value}))} />
                <div>
                  <FLabel>Profile Image (optional)</FLabel>
                  <input type="file" accept="image/*" style={{ ...inp, padding:'7px 10px', fontSize:12, cursor:'pointer' }}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setCreateForm(x=>({...x, image:f})); }} />
                  {createForm.image && <p style={{ fontSize:11, color:D.greenLight, marginTop:4 }}>✓ {createForm.image.name}</p>}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <PrimaryBtn onClick={handleCreate} disabled={actionLoading}>{actionLoading ? 'Creating…' : 'Create User'}</PrimaryBtn>
              <GhostBtn onClick={closeModal}>Cancel</GhostBtn>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* View */}
      {modal === 'view' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth:520, margin:'0 auto' }}>
            <ModalHeader title="User Details" onClose={closeModal} />
            <ModalBody>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                <Avatar name={selected.companyName} image={selected.image} size={60} />
                <div>
                  <p style={{ fontSize:16, fontWeight:700, color:D.text }}>{selected.companyName}</p>
                  <p style={{ fontSize:12, color:D.textMuted, marginTop:2 }}>{selected.email}</p>
                  <div style={{ marginTop:6 }}><StatusBadge status={selected.status} /></div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                {[['User ID', selected.id], ['Phone', selected.number], ['Role', selected.role], ['Joined', formatDate(selected.createdAt)]].map(([l,v]) => (
                  <div key={l} style={{ background:D.surface2, border:`1px solid ${D.border}`, borderRadius:8, padding:'10px 12px' }}>
                    <p style={{ fontSize:10, color:D.textSubtle, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{l}</p>
                    <p style={{ fontSize:12, color:D.text, fontWeight:500, wordBreak:'break-all' }}>{v}</p>
                  </div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
                {[['Balance', `₹${selected.balance.toLocaleString()}`, D.greenLight], ['Resellers', selected.resellerCount, D.blue], ['Users', selected.userCount, D.amber], ['Campaigns', selected.totalCampaigns, '#a78bfa']].map(([l,v,c]) => (
                  <div key={String(l)} style={{ background:D.surface2, border:`1px solid ${D.border}`, borderRadius:8, padding:'12px 8px', textAlign:'center' }}>
                    <p style={{ fontSize:18, fontWeight:700, color:String(c) }}>{v}</p>
                    <p style={{ fontSize:10, color:D.textSubtle, fontWeight:600, textTransform:'uppercase', marginTop:4 }}>{l}</p>
                  </div>
                ))}
              </div>
            </ModalBody>
            <ModalFooter><GhostBtn onClick={closeModal} style={{ flex:1 }}>Close</GhostBtn></ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* Edit */}
      {modal === 'edit' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth:500, margin:'0 auto' }}>
            <ModalHeader title={`Edit — ${selected.companyName}`} onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div style={{ marginBottom:16 }}>
                <p style={{ fontSize:11, color:D.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Profile</p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <FInput label="Company Name" type="text" placeholder={selected.companyName} value={editForm.companyName} onChange={e => setEditForm(f=>({...f, companyName:e.target.value}))} />
                  <FInput label="Email"        type="email" placeholder={selected.email}       value={editForm.email}       onChange={e => setEditForm(f=>({...f, email:e.target.value}))} />
                  <FInput label="Phone"        type="tel"  placeholder={selected.number}  maxLength={10} value={editForm.number} onChange={e => setEditForm(f=>({...f, number:e.target.value}))} />
                </div>
              </div>
              <div style={{ paddingTop:16, borderTop:`1px solid ${D.border}` }}>
                <p style={{ fontSize:11, color:D.textMuted, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Change Password <span style={{ fontWeight:400, textTransform:'none', fontSize:11, color:D.textSubtle }}>(leave blank to skip)</span></p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <FInput label="New Password"     type="password" placeholder="Min 5 characters" value={editForm.password}        onChange={e => setEditForm(f=>({...f, password:e.target.value}))} />
                  <FInput label="Confirm Password" type="password" placeholder="Repeat password"  value={editForm.confirmPassword} onChange={e => setEditForm(f=>({...f, confirmPassword:e.target.value}))} />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <PrimaryBtn onClick={handleEdit} disabled={actionLoading}>{actionLoading ? 'Saving…' : 'Save Changes'}</PrimaryBtn>
              <GhostBtn onClick={closeModal}>Cancel</GhostBtn>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* Add Credit */}
      {modal === 'addCredit' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth:400, margin:'0 auto' }}>
            <ModalHeader title="Add Credit" onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div style={{ background:D.greenDim, border:`1px solid ${D.greenBorder}`, borderRadius:8, padding:'10px 12px', marginBottom:14 }}>
                <p style={{ fontSize:12, color:D.textMuted }}>User: <span style={{ color:D.text, fontWeight:600 }}>{selected.companyName}</span></p>
                <p style={{ fontSize:12, color:D.textMuted, marginTop:4 }}>Current Balance: <span style={{ color:D.greenLight, fontWeight:700, fontSize:15 }}>₹{selected.balance.toLocaleString()}</span></p>
              </div>
              <FInput label="Amount to Credit *" type="number" placeholder="Enter amount" min="0" value={creditAmt} onChange={e => setCreditAmt(e.target.value)} />
            </ModalBody>
            <ModalFooter>
              <PrimaryBtn onClick={handleAddCredit} disabled={actionLoading}>{actionLoading ? 'Processing…' : 'Add Credit'}</PrimaryBtn>
              <GhostBtn onClick={closeModal}>Cancel</GhostBtn>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* Remove Credit */}
      {modal === 'removeCredit' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth:400, margin:'0 auto' }}>
            <ModalHeader title="Remove Credit" onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div style={{ background:D.redDim, border:`1px solid ${D.redBorder}`, borderRadius:8, padding:'10px 12px', marginBottom:14 }}>
                <p style={{ fontSize:12, color:D.textMuted }}>User: <span style={{ color:D.text, fontWeight:600 }}>{selected.companyName}</span></p>
                <p style={{ fontSize:12, color:D.textMuted, marginTop:4 }}>Current Balance: <span style={{ color:D.greenLight, fontWeight:700, fontSize:15 }}>₹{selected.balance.toLocaleString()}</span></p>
              </div>
              <FInput label="Amount to Debit *" type="number" placeholder="Enter amount" min="0" value={debitAmt} onChange={e => setDebitAmt(e.target.value)} />
            </ModalBody>
            <ModalFooter>
              <PrimaryBtn danger onClick={handleRemoveCredit} disabled={actionLoading}>{actionLoading ? 'Processing…' : 'Remove Credit'}</PrimaryBtn>
              <GhostBtn onClick={closeModal}>Cancel</GhostBtn>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* Freeze */}
      {modal === 'freeze' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth:400, margin:'0 auto' }}>
            <ModalHeader title={selected.status === 'active' ? 'Freeze Account' : 'Unfreeze Account'} onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'16px 0' }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:selected.status==='active'?D.redDim:D.greenDim, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {selected.status==='active' ? <Lock size={22} style={{ color:D.red }} /> : <Unlock size={22} style={{ color:D.greenLight }} />}
                </div>
                <p style={{ fontSize:14, color:D.text, textAlign:'center', lineHeight:1.6 }}>
                  Are you sure you want to <strong>{selected.status==='active'?'freeze':'unfreeze'}</strong> <strong style={{ color:D.text }}>{selected.companyName}</strong>?
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <PrimaryBtn danger={selected.status==='active'} onClick={handleFreeze} disabled={actionLoading}>
                {actionLoading ? 'Processing…' : `Yes, ${selected.status==='active'?'Freeze':'Unfreeze'}`}
              </PrimaryBtn>
              <GhostBtn onClick={closeModal}>Cancel</GhostBtn>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* Delete */}
      {modal === 'delete' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth:400, margin:'0 auto' }}>
            <ModalHeader title="Delete User" onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'16px 0' }}>
                <div style={{ width:52, height:52, borderRadius:'50%', background:D.redDim, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Trash2 size={22} style={{ color:D.red }} />
                </div>
                <p style={{ fontSize:14, color:D.text, textAlign:'center', lineHeight:1.6 }}>
                  Delete <strong style={{ color:D.text }}>{selected.companyName}</strong>? This will soft-delete the account.
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <PrimaryBtn danger onClick={handleDelete} disabled={actionLoading}>{actionLoading ? 'Deleting…' : 'Yes, Delete'}</PrimaryBtn>
              <GhostBtn onClick={closeModal}>Cancel</GhostBtn>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}
    </>
  );
};

export default ManageUser;
