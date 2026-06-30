import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { format } from 'date-fns';
import { Plus, Eye, Edit2, DollarSign, Minus, Lock, Unlock, Trash2, CheckCircle2 } from 'lucide-react';
import { getUserRole } from '../utils/Auth';
import { UserRole } from '../constants/Roles';
import { useUserManagement } from '../hooks/useUserManagement';
import { cn } from '../lib/utils';
import { Spinner } from '../components/ui/Spinner';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ModalOverlay, ModalHeader, ModalBody, ModalFooter } from '../components/ui/Modal';
import { FInput, FLabel, FSelect } from '../components/ui/FormField';
import { PrimaryBtn, GhostBtn, ActionBtn } from '../components/ui/ActionButton';
import { InlineAlert } from '../components/ui/Alert';
import { Avatar } from '../components/ui/UserAvatar';
import { Paginator } from '../components/ui/Paginator';
import { PageHeader } from '../components/ui/PageHeader';

const ManageUser = () => {
  const userRole = getUserRole();
  const isAdminOrReseller =
    userRole === UserRole.SUPER_ADMIN ||
    userRole === UserRole.ADMIN ||
    userRole === UserRole.RESELLER;

  const {
    loading, error, success, actionLoading,
    selected, modal, createForm, editForm, creditAmt, debitAmt,
    total, items,
    setCreateForm, setEditForm, setCreditAmt, setDebitAmt,
    openModal, closeModal,
    handleCreate, handleEdit, handleAddCredit, handleRemoveCredit, handleFreeze, handleDelete,
  } = useUserManagement('manage-user', 'users');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const current = items.slice(startIdx, startIdx + itemsPerPage);

  const formatDate = (s: string) => { try { return format(new Date(s), 'dd MMM yyyy, hh:mm a'); } catch { return s; } };

  if (loading) return <Spinner label="Loading users…" />;

  if (!isAdminOrReseller) return (
    <div className="px-4 py-3 bg-danger-dim border border-danger-border rounded-[10px]">
      <p className="text-danger text-sm">Access denied. Admin or Reseller role required.</p>
    </div>
  );

  return (
    <>
      <style>{`
        input[type=file]::file-selector-button{background:rgba(22,163,74,0.15);border:1px solid rgba(22,163,74,0.3);color:#4ade80;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;margin-right:8px}
      `}</style>

      {success && (
        <div className="fixed top-5 right-5 z-[9999] bg-brand-dim border border-brand-border rounded-[10px] px-4 py-2.5 flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <CheckCircle2 size={14} className="text-brand-light" />
          <p className="text-[13px] text-fg">{success}</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <PageHeader
          title="Manage Users"
          subtitle={`${total} total users`}
          action={
            <button onClick={() => openModal('create')} className="flex items-center gap-[7px] px-4 py-[9px] bg-brand text-white font-semibold text-[13px] border-none rounded-lg cursor-pointer">
              <Plus size={15} /> Add User
            </button>
          }
        />

        <div className="bg-surface border border-line rounded-[10px] px-4 py-2.5 flex items-center gap-2.5 flex-wrap">
          <span className="text-[11px] text-fg-muted font-semibold uppercase tracking-[0.07em]">Show</span>
          <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="bg-surface2 border border-line rounded-md text-fg text-xs px-2 py-1 outline-none">
            {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="text-[11px] text-fg-muted font-semibold uppercase tracking-[0.07em]">entries</span>
          <span className="ml-auto text-xs text-fg-subtle">
            {startIdx + 1}–{Math.min(startIdx + itemsPerPage, total)} of {total}
          </span>
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block bg-surface border border-line rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  {['', 'Company', 'Phone', 'Email', 'Balance', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] text-fg-subtle font-bold uppercase tracking-[0.08em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-fg-subtle text-[13px]">No users found</td></tr>
                ) : current.map(r => (
                  <tr key={r.id} className="group border-b border-line/50">
                    <td className="px-4 py-2.5 group-hover:bg-white/[0.025]"><Avatar name={r.companyName} image={r.image} size={34} /></td>
                    <td className="px-4 py-2.5 text-[13px] text-fg font-medium group-hover:bg-white/[0.025]">{r.companyName}</td>
                    <td className="px-4 py-2.5 text-xs text-fg-muted group-hover:bg-white/[0.025]">{r.number}</td>
                    <td className="px-4 py-2.5 text-xs text-fg-muted max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap group-hover:bg-white/[0.025]">{r.email}</td>
                    <td className="px-4 py-2.5 text-sm font-bold text-brand-light group-hover:bg-white/[0.025]">₹{r.balance.toLocaleString()}</td>
                    <td className="px-4 py-2.5 group-hover:bg-white/[0.025]"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-2.5 group-hover:bg-white/[0.025]">
                      <div className="flex gap-[5px]">
                        <ActionBtn icon={Eye}        color="var(--color-info)"        bg="var(--color-info-dim)"  title="View"          onClick={() => openModal('view', r)} />
                        <ActionBtn icon={Edit2}       color="var(--color-warning)"     bg="var(--color-warning-dim)" title="Edit"          onClick={() => openModal('edit', r)} />
                        <ActionBtn icon={DollarSign}  color="var(--color-brand-light)" bg="var(--color-brand-dim)" title="Add Credit"   onClick={() => openModal('addCredit', r)} />
                        <ActionBtn icon={Minus}       color="var(--color-danger)"      bg="var(--color-danger-dim)"   title="Remove Credit" onClick={() => openModal('removeCredit', r)} />
                        <ActionBtn icon={r.status === 'active' ? Lock : Unlock} color={r.status === 'active' ? 'var(--color-danger)' : 'var(--color-brand-light)'} bg={r.status === 'active' ? 'var(--color-danger-dim)' : 'var(--color-brand-dim)'} title={r.status === 'active' ? 'Freeze' : 'Unfreeze'} onClick={() => openModal('freeze', r)} />
                        <ActionBtn icon={Trash2}      color="var(--color-danger)"      bg="var(--color-danger-dim)"   title="Delete"        onClick={() => openModal('delete', r)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden flex flex-col gap-2.5">
          {current.length === 0 ? (
            <div className="p-8 text-center bg-surface border border-line rounded-xl">
              <p className="text-fg-subtle text-[13px]">No users found</p>
            </div>
          ) : current.map(r => (
            <div key={r.id} className="bg-surface border border-line rounded-[10px] px-3.5 py-3">
              <div className="flex items-center gap-2.5 mb-2.5 pb-2.5 border-b border-line">
                <Avatar name={r.companyName} image={r.image} size={38} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-fg overflow-hidden text-ellipsis whitespace-nowrap">{r.companyName}</p>
                  <p className="text-[11px] text-fg-muted overflow-hidden text-ellipsis whitespace-nowrap">{r.email}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="flex justify-between mb-2.5">
                <div><p className="text-[10px] text-fg-subtle mb-0.5">PHONE</p><p className="text-xs text-fg-muted">{r.number}</p></div>
                <div className="text-right"><p className="text-[10px] text-fg-subtle mb-0.5">BALANCE</p><p className="text-base font-bold text-brand-light">₹{r.balance.toLocaleString()}</p></div>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                <ActionBtn icon={Eye}        color="var(--color-info)"        bg="var(--color-info-dim)"  title="View"          onClick={() => openModal('view', r)} />
                <ActionBtn icon={Edit2}       color="var(--color-warning)"     bg="var(--color-warning-dim)" title="Edit"          onClick={() => openModal('edit', r)} />
                <ActionBtn icon={DollarSign}  color="var(--color-brand-light)" bg="var(--color-brand-dim)" title="Add Credit"   onClick={() => openModal('addCredit', r)} />
                <ActionBtn icon={Minus}       color="var(--color-danger)"      bg="var(--color-danger-dim)"   title="Remove Credit" onClick={() => openModal('removeCredit', r)} />
                <ActionBtn icon={r.status === 'active' ? Lock : Unlock} color={r.status === 'active' ? 'var(--color-danger)' : 'var(--color-brand-light)'} bg={r.status === 'active' ? 'var(--color-danger-dim)' : 'var(--color-brand-dim)'} title={r.status === 'active' ? 'Freeze' : 'Unfreeze'} onClick={() => openModal('freeze', r)} />
                <ActionBtn icon={Trash2}      color="var(--color-danger)"      bg="var(--color-danger-dim)"   title="Delete"        onClick={() => openModal('delete', r)} />
              </div>
            </div>
          ))}
        </div>

        <Paginator page={currentPage} total={totalPages} onChange={p => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      </div>

      {/* Create modal */}
      {modal === 'create' && (
        <ModalOverlay onClose={closeModal}>
          <div className="max-w-[520px] mx-auto">
            <ModalHeader title="Add New User" onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div className="flex flex-col gap-3">
                <FInput label="Company Name *" type="text" placeholder="e.g. Acme Corp" value={createForm.companyName} onChange={e => setCreateForm(f => ({ ...f, companyName: e.target.value }))} />
                <FInput label="Email *" type="email" placeholder="admin@company.com" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
                <FInput label="Password *" type="password" placeholder="Enter password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
                <FInput label="Phone Number *" type="tel" placeholder="10-digit number" maxLength={10} value={createForm.number} onChange={e => setCreateForm(f => ({ ...f, number: e.target.value }))} />
                <FSelect label="Role *" value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="user">User</option>
                </FSelect>
                <FInput label="Initial Balance *" type="number" placeholder="0" min="0" value={createForm.balance} onChange={e => setCreateForm(f => ({ ...f, balance: e.target.value }))} />
                <div>
                  <FLabel>Profile Image (optional)</FLabel>
                  <input type="file" accept="image/*"
                    className="w-full px-2.5 py-[7px] text-xs cursor-pointer bg-surface2 border border-line rounded-lg text-fg-muted outline-none"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setCreateForm(x => ({ ...x, image: f })); }} />
                  {createForm.image && <p className="text-[11px] text-brand-light mt-1">✓ {createForm.image.name}</p>}
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

      {/* View modal */}
      {modal === 'view' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div className="max-w-[520px] mx-auto">
            <ModalHeader title="User Details" onClose={closeModal} />
            <ModalBody>
              <div className="flex items-center gap-3.5 mb-5">
                <Avatar name={selected.companyName} image={selected.image} size={60} />
                <div>
                  <p className="text-base font-bold text-fg">{selected.companyName}</p>
                  <p className="text-xs text-fg-muted mt-0.5">{selected.email}</p>
                  <div className="mt-1.5"><StatusBadge status={selected.status} /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[['User ID', selected.id], ['Phone', selected.number], ['Role', selected.role], ['Joined', formatDate(selected.createdAt)]].map(([l, v]) => (
                  <div key={l} className="bg-surface2 border border-line rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-fg-subtle font-semibold uppercase tracking-[0.07em] mb-1">{l}</p>
                    <p className="text-xs text-fg font-medium break-all">{v}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {[['Balance', `₹${selected.balance.toLocaleString()}`, 'text-brand-light'], ['Resellers', selected.resellerCount, 'text-info'], ['Users', selected.userCount, 'text-warning'], ['Campaigns', selected.totalCampaigns, 'text-violet']].map(([l, v, c]) => (
                  <div key={String(l)} className="bg-surface2 border border-line rounded-lg px-2 py-3 text-center">
                    <p className={cn('text-lg font-bold', c)}>{v}</p>
                    <p className="text-[10px] text-fg-subtle font-semibold uppercase mt-1">{l}</p>
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
          <div className="max-w-[500px] mx-auto">
            <ModalHeader title={`Edit — ${selected.companyName}`} onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div className="mb-4">
                <p className="text-[11px] text-fg-muted font-semibold uppercase tracking-[0.07em] mb-2.5">Profile</p>
                <div className="flex flex-col gap-2.5">
                  <FInput label="Company Name" type="text" placeholder={selected.companyName} value={editForm.companyName} onChange={e => setEditForm(f => ({ ...f, companyName: e.target.value }))} />
                  <FInput label="Email" type="email" placeholder={selected.email} value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                  <FInput label="Phone" type="tel" placeholder={selected.number} maxLength={10} value={editForm.number} onChange={e => setEditForm(f => ({ ...f, number: e.target.value }))} />
                </div>
              </div>
              <div className="pt-4 border-t border-line">
                <p className="text-[11px] text-fg-muted font-semibold uppercase tracking-[0.07em] mb-1.5">
                  Change Password <span className="font-normal normal-case text-[11px] text-fg-subtle">(leave blank to skip)</span>
                </p>
                <div className="flex flex-col gap-2.5">
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
          <div className="max-w-[400px] mx-auto">
            <ModalHeader title="Add Credit" onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div className="bg-brand-dim border border-brand-border rounded-lg px-3 py-2.5 mb-3.5">
                <p className="text-xs text-fg-muted">User: <span className="text-fg font-semibold">{selected.companyName}</span></p>
                <p className="text-xs text-fg-muted mt-1">Current Balance: <span className="text-brand-light font-bold text-[15px]">₹{selected.balance.toLocaleString()}</span></p>
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
          <div className="max-w-[400px] mx-auto">
            <ModalHeader title="Remove Credit" onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div className="bg-danger-dim border border-danger-border rounded-lg px-3 py-2.5 mb-3.5">
                <p className="text-xs text-fg-muted">User: <span className="text-fg font-semibold">{selected.companyName}</span></p>
                <p className="text-xs text-fg-muted mt-1">Current Balance: <span className="text-brand-light font-bold text-[15px]">₹{selected.balance.toLocaleString()}</span></p>
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
          <div className="max-w-[400px] mx-auto">
            <ModalHeader title={selected.status === 'active' ? 'Freeze Account' : 'Unfreeze Account'} onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className={cn('w-[52px] h-[52px] rounded-full flex items-center justify-center', selected.status === 'active' ? 'bg-danger-dim' : 'bg-brand-dim')}>
                  {selected.status === 'active' ? <Lock size={22} className="text-danger" /> : <Unlock size={22} className="text-brand-light" />}
                </div>
                <p className="text-sm text-fg text-center leading-[1.6]">
                  Are you sure you want to <strong>{selected.status === 'active' ? 'freeze' : 'unfreeze'}</strong>{' '}
                  <strong className="text-fg">{selected.companyName}</strong>?
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
          <div className="max-w-[400px] mx-auto">
            <ModalHeader title="Delete User" onClose={closeModal} />
            <ModalBody>
              {error && <InlineAlert msg={error} type="error" />}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-[52px] h-[52px] rounded-full bg-danger-dim flex items-center justify-center">
                  <Trash2 size={22} className="text-danger" />
                </div>
                <p className="text-sm text-fg text-center leading-[1.6]">
                  Delete <strong className="text-fg">{selected.companyName}</strong>? This will soft-delete the account.
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
