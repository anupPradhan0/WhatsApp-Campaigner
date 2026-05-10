import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { format } from 'date-fns';
import { Plus, Eye, Edit2, DollarSign, Minus, Lock, Unlock, Trash2, CheckCircle2 } from 'lucide-react';
import { getUserRole } from '../utils/Auth';
import { UserRole } from '../constants/Roles';
import { useUserManagement } from '../hooks/useUserManagement';
import { D } from '../theme/tokens';
import { Spinner } from '../components/ui/Spinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { FInput, FLabel, FSelect } from '../components/ui/FormField';
import { PrimaryBtn, GhostBtn, ActionBtn } from '../components/ui/ActionButton';
import { InlineAlert } from '../components/ui/Alert';
import { Avatar } from '../components/ui/UserAvatar';
import { Paginator } from '../components/ui/Paginator';
import { PageHeader } from '../components/ui/PageHeader';

const ManageReseller = () => {
  const userRole = getUserRole();
  const isAdminOrReseller = userRole === UserRole.ADMIN || userRole === UserRole.RESELLER;

  const {
    loading, error, success, actionLoading,
    selected, modal, createForm, editForm, creditAmt, debitAmt,
    total, items,
    setCreateForm, setEditForm, setCreditAmt, setDebitAmt,
    openModal, closeModal,
    handleCreate, handleEdit, handleAddCredit, handleRemoveCredit, handleFreeze, handleDelete,
  } = useUserManagement('manage-reseller', 'resellers');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const current = items.slice(startIdx, startIdx + itemsPerPage);

  const formatDate = (s: string) => { try { return format(new Date(s), 'dd MMM yyyy, hh:mm a'); } catch { return s; } };

  if (loading) return <Spinner label="Loading resellers…" />;

  if (!isAdminOrReseller) return (
    <div style={{ padding: '12px 16px', background: D.redDim, border: `1px solid ${D.redBorder}`, borderRadius: 10 }}>
      <p style={{ color: D.red, fontSize: 14 }}>Access denied. Admin or Reseller role required.</p>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .row-hover:hover td{background:rgba(255,255,255,0.025)!important}
        select option{background:#18181b;color:#f4f4f5}
        input[type=file]::file-selector-button{background:rgba(22,163,74,0.15);border:1px solid rgba(22,163,74,0.3);color:#4ade80;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;margin-right:8px}
      `}</style>

      {success && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: D.greenDim, border: `1px solid ${D.greenBorder}`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          <CheckCircle2 size={14} style={{ color: D.greenLight }} />
          <p style={{ fontSize: 13, color: D.text }}>{success}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <PageHeader
          title="Manage Resellers"
          subtitle={`${total} total resellers`}
          action={
            <button onClick={() => openModal('create')} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: D.green, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              <Plus size={15} /> Add Reseller
            </button>
          }
        />

        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: D.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Show</span>
          <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 6, color: D.text, fontSize: 12, padding: '4px 8px', outline: 'none' }}>
            {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span style={{ fontSize: 11, color: D.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>entries</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: D.textSubtle }}>
            {startIdx + 1}–{Math.min(startIdx + itemsPerPage, total)} of {total}
          </span>
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block" style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                  {['', 'Company', 'Phone', 'Email', 'Balance', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, color: D.textSubtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: D.textSubtle, fontSize: 13 }}>No resellers found</td></tr>
                ) : current.map(r => (
                  <tr key={r.id} className="row-hover" style={{ borderBottom: `1px solid rgba(39,39,42,0.5)` }}>
                    <td style={{ padding: '10px 16px' }}><Avatar name={r.companyName} image={r.image} size={34} /></td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: D.text, fontWeight: 500 }}>{r.companyName}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: D.textMuted }}>{r.number}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: D.textMuted, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</td>
                    <td style={{ padding: '10px 16px', fontSize: 14, fontWeight: 700, color: D.greenLight }}>₹{r.balance.toLocaleString()}</td>
                    <td style={{ padding: '10px 16px' }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <ActionBtn icon={Eye}         color={D.blue}      bg={D.blueDim}  title="View"          onClick={() => openModal('view', r)} />
                        <ActionBtn icon={Edit2}        color={D.amber}     bg={D.amberDim} title="Edit"          onClick={() => openModal('edit', r)} />
                        <ActionBtn icon={DollarSign}   color={D.greenLight} bg={D.greenDim} title="Add Credit"   onClick={() => openModal('addCredit', r)} />
                        <ActionBtn icon={Minus}        color={D.red}       bg={D.redDim}   title="Remove Credit" onClick={() => openModal('removeCredit', r)} />
                        <ActionBtn icon={r.status === 'active' ? Lock : Unlock} color={r.status === 'active' ? D.red : D.greenLight} bg={r.status === 'active' ? D.redDim : D.greenDim} title={r.status === 'active' ? 'Freeze' : 'Unfreeze'} onClick={() => openModal('freeze', r)} />
                        <ActionBtn icon={Trash2}       color={D.red}       bg={D.redDim}   title="Delete"        onClick={() => openModal('delete', r)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {current.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12 }}>
              <p style={{ color: D.textSubtle, fontSize: 13 }}>No resellers found</p>
            </div>
          ) : current.map(r => (
            <div key={r.id} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${D.border}` }}>
                <Avatar name={r.companyName} image={r.image} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.companyName}</p>
                  <p style={{ fontSize: 11, color: D.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div><p style={{ fontSize: 10, color: D.textSubtle, marginBottom: 2 }}>PHONE</p><p style={{ fontSize: 12, color: D.textMuted }}>{r.number}</p></div>
                <div style={{ textAlign: 'right' }}><p style={{ fontSize: 10, color: D.textSubtle, marginBottom: 2 }}>BALANCE</p><p style={{ fontSize: 16, fontWeight: 700, color: D.greenLight }}>₹{r.balance.toLocaleString()}</p></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
                <ActionBtn icon={Eye}         color={D.blue}      bg={D.blueDim}  title="View"          onClick={() => openModal('view', r)} />
                <ActionBtn icon={Edit2}        color={D.amber}     bg={D.amberDim} title="Edit"          onClick={() => openModal('edit', r)} />
                <ActionBtn icon={DollarSign}   color={D.greenLight} bg={D.greenDim} title="Add Credit"   onClick={() => openModal('addCredit', r)} />
                <ActionBtn icon={Minus}        color={D.red}       bg={D.redDim}   title="Remove Credit" onClick={() => openModal('removeCredit', r)} />
                <ActionBtn icon={r.status === 'active' ? Lock : Unlock} color={r.status === 'active' ? D.red : D.greenLight} bg={r.status === 'active' ? D.redDim : D.greenDim} title={r.status === 'active' ? 'Freeze' : 'Unfreeze'} onClick={() => openModal('freeze', r)} />
                <ActionBtn icon={Trash2}       color={D.red}       bg={D.redDim}   title="Delete"        onClick={() => openModal('delete', r)} />
              </div>
            </div>
          ))}
        </div>

        <Paginator page={currentPage} total={totalPages} onChange={p => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      </div>

      {/* Create modal */}
      {modal === 'create' && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <ModalHeader title="Add New Reseller" onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <FInput label="Company Name *" type="text" placeholder="e.g. Acme Corp" value={createForm.companyName} onChange={e => setCreateForm(f => ({ ...f, companyName: e.target.value }))} />
                <FInput label="Email *" type="email" placeholder="admin@company.com" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
                <FInput label="Password *" type="password" placeholder="Enter password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
                <FInput label="Phone Number *" type="tel" placeholder="10-digit number" maxLength={10} value={createForm.number} onChange={e => setCreateForm(f => ({ ...f, number: e.target.value }))} />
                <FSelect label="Role *" value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="reseller">Reseller</option>
                  <option value="user">User</option>
                </FSelect>
                <FInput label="Initial Balance *" type="number" placeholder="0" min="0" value={createForm.balance} onChange={e => setCreateForm(f => ({ ...f, balance: e.target.value }))} />
                <div>
                  <FLabel>Profile Image (optional)</FLabel>
                  <input type="file" accept="image/*"
                    style={{ width: '100%', padding: '7px 10px', fontSize: 12, cursor: 'pointer', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, color: D.textMuted, outline: 'none' }}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setCreateForm(x => ({ ...x, image: f })); }} />
                  {createForm.image && <p style={{ fontSize: 11, color: D.greenLight, marginTop: 4 }}>✓ {createForm.image.name}</p>}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <PrimaryBtn onClick={handleCreate} disabled={actionLoading}>{actionLoading ? 'Creating…' : 'Create Reseller'}</PrimaryBtn>
              <GhostBtn onClick={closeModal}>Cancel</GhostBtn>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* View modal */}
      {modal === 'view' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <ModalHeader title="Reseller Details" onClose={closeModal} />
            <ModalBody>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <Avatar name={selected.companyName} image={selected.image} size={60} />
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: D.text }}>{selected.companyName}</p>
                  <p style={{ fontSize: 12, color: D.textMuted, marginTop: 2 }}>{selected.email}</p>
                  <div style={{ marginTop: 6 }}><StatusBadge status={selected.status} /></div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[['User ID', selected.id], ['Phone', selected.number], ['Role', selected.role], ['Joined', formatDate(selected.createdAt)]].map(([l, v]) => (
                  <div key={l} style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, padding: '10px 12px' }}>
                    <p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{l}</p>
                    <p style={{ fontSize: 12, color: D.text, fontWeight: 500, wordBreak: 'break-all' }}>{v}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {[['Balance', `₹${selected.balance.toLocaleString()}`, D.greenLight], ['Resellers', selected.resellerCount, D.blue], ['Users', selected.userCount, D.amber], ['Campaigns', selected.totalCampaigns, D.purple]].map(([l, v, c]) => (
                  <div key={String(l)} style={{ background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 8, padding: '12px 8px', textAlign: 'center' }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: String(c) }}>{v}</p>
                    <p style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>{l}</p>
                  </div>
                ))}
              </div>
            </ModalBody>
            <ModalFooter><GhostBtn onClick={closeModal} style={{ flex: 1 }}>Close</GhostBtn></ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* Edit modal */}
      {modal === 'edit' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth: 500, margin: '0 auto' }}>
            <ModalHeader title={`Edit — ${selected.companyName}`} onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: D.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Profile</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <FInput label="Company Name" type="text" placeholder={selected.companyName} value={editForm.companyName} onChange={e => setEditForm(f => ({ ...f, companyName: e.target.value }))} />
                  <FInput label="Email" type="email" placeholder={selected.email} value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                  <FInput label="Phone" type="tel" placeholder={selected.number} maxLength={10} value={editForm.number} onChange={e => setEditForm(f => ({ ...f, number: e.target.value }))} />
                </div>
              </div>
              <div style={{ paddingTop: 16, borderTop: `1px solid ${D.border}` }}>
                <p style={{ fontSize: 11, color: D.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  Change Password <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 11, color: D.textSubtle }}>(leave blank to skip)</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <FInput label="New Password" type="password" placeholder="Min 5 characters" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} />
                  <FInput label="Confirm Password" type="password" placeholder="Repeat password" value={editForm.confirmPassword} onChange={e => setEditForm(f => ({ ...f, confirmPassword: e.target.value }))} />
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

      {/* Add Credit modal */}
      {modal === 'addCredit' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            <ModalHeader title="Add Credit" onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div style={{ background: D.greenDim, border: `1px solid ${D.greenBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: D.textMuted }}>Reseller: <span style={{ color: D.text, fontWeight: 600 }}>{selected.companyName}</span></p>
                <p style={{ fontSize: 12, color: D.textMuted, marginTop: 4 }}>Current Balance: <span style={{ color: D.greenLight, fontWeight: 700, fontSize: 15 }}>₹{selected.balance.toLocaleString()}</span></p>
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

      {/* Remove Credit modal */}
      {modal === 'removeCredit' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            <ModalHeader title="Remove Credit" onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div style={{ background: D.redDim, border: `1px solid ${D.redBorder}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: D.textMuted }}>Reseller: <span style={{ color: D.text, fontWeight: 600 }}>{selected.companyName}</span></p>
                <p style={{ fontSize: 12, color: D.textMuted, marginTop: 4 }}>Current Balance: <span style={{ color: D.greenLight, fontWeight: 700, fontSize: 15 }}>₹{selected.balance.toLocaleString()}</span></p>
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

      {/* Freeze modal */}
      {modal === 'freeze' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            <ModalHeader title={selected.status === 'active' ? 'Freeze Account' : 'Unfreeze Account'} onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 0' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: selected.status === 'active' ? D.redDim : D.greenDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selected.status === 'active' ? <Lock size={22} style={{ color: D.red }} /> : <Unlock size={22} style={{ color: D.greenLight }} />}
                </div>
                <p style={{ fontSize: 14, color: D.text, textAlign: 'center', lineHeight: 1.6 }}>
                  Are you sure you want to <strong>{selected.status === 'active' ? 'freeze' : 'unfreeze'}</strong>{' '}
                  <strong style={{ color: D.text }}>{selected.companyName}</strong>?
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <PrimaryBtn danger={selected.status === 'active'} onClick={handleFreeze} disabled={actionLoading}>
                {actionLoading ? 'Processing…' : `Yes, ${selected.status === 'active' ? 'Freeze' : 'Unfreeze'}`}
              </PrimaryBtn>
              <GhostBtn onClick={closeModal}>Cancel</GhostBtn>
            </ModalFooter>
          </div>
        </ModalOverlay>
      )}

      {/* Delete modal */}
      {modal === 'delete' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div style={{ maxWidth: 400, margin: '0 auto' }}>
            <ModalHeader title="Delete Reseller" onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 0' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: D.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={22} style={{ color: D.red }} />
                </div>
                <p style={{ fontSize: 14, color: D.text, textAlign: 'center', lineHeight: 1.6 }}>
                  Delete <strong style={{ color: D.text }}>{selected.companyName}</strong>? This will soft-delete the account.
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

export default ManageReseller;
