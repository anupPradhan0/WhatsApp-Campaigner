import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { QK } from '../lib/queryKeys';

export interface ManagedUser {
  id: string;
  companyName: string;
  email: string;
  number: string;
  role: string;
  resellerCount: number;
  userCount: number;
  totalCampaigns: number;
  balance: number;
  status: 'active' | 'inactive' | 'deleted';
  createdAt: string;
  image: string;
}

export interface UsersData {
  totalUsers: number;
  users: ManagedUser[];
}

export interface ResellersData {
  totalResellers: number;
  resellers: ManagedUser[];
}

export interface AdminsData {
  totalAdmins: number;
  admins: ManagedUser[];
}

export type ListKey = 'users' | 'resellers' | 'admins';

const ROLE_FOR_LIST: Record<ListKey, string> = {
  users: 'user',
  resellers: 'reseller',
  admins: 'admin',
};

const SINGULAR: Record<ListKey, string> = {
  users: 'User',
  resellers: 'Reseller',
  admins: 'Admin',
};

interface CreateForm {
  companyName: string;
  email: string;
  password: string;
  number: string;
  role: string;
  balance: string;
  image: File | null;
}

interface EditForm {
  companyName: string;
  email: string;
  number: string;
  password: string;
  confirmPassword: string;
}

const blankCreate = (listKey: ListKey): CreateForm => ({
  companyName: '', email: '', password: '', number: '',
  role: ROLE_FOR_LIST[listKey],
  balance: '', image: null,
});

const queryKeyFor = (listKey: ListKey) =>
  listKey === 'resellers' ? QK.resellers()
    : listKey === 'admins' ? QK.admins()
    : QK.users();

export function useUserManagement(endpoint: string, listKey: ListKey) {
  const qc = useQueryClient();
  const queryKey = queryKeyFor(listKey);
  const singular = SINGULAR[listKey];

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [modal, setModal] = useState<'create' | 'view' | 'edit' | 'addCredit' | 'removeCredit' | 'freeze' | 'delete' | null>(null);
  const [createForm, setCreateForm] = useState<CreateForm>(blankCreate(listKey));
  const [editForm, setEditForm] = useState<EditForm>({ companyName: '', email: '', number: '', password: '', confirmPassword: '' });
  const [creditAmt, setCreditAmt] = useState('');
  const [debitAmt, setDebitAmt] = useState('');

  const toast = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };
  const invalidate = () => qc.invalidateQueries({ queryKey });

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data: r } = await api.get<{ success: boolean; message?: string; data: UsersData | ResellersData | AdminsData }>(`/api/dashboard/${endpoint}`);
      if (!r.success) throw new Error(r.message || 'Failed to load');
      return r.data;
    },
  });

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: async (form: CreateForm) => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== null) fd.append(k, v instanceof File ? v : String(v)); });
      const { data: r } = await api.post<{ success: boolean; message?: string }>('/api/user/create', fd);
      if (!r.success) throw new Error(r.message || 'Failed to create');
    },
    onSuccess: () => {
      closeModal();
      setCreateForm(blankCreate(listKey));
      invalidate();
      toast(`${singular} created successfully!`);
    },
    onError: (e: Error) => setError(e.message),
  });

  const editMut = useMutation({
    mutationFn: async ({ user, form }: { user: ManagedUser; form: EditForm }) => {
      const hasProfile = form.companyName || form.email || form.number;
      const hasPass = form.password || form.confirmPassword;
      if (hasProfile) {
        const pd: Record<string, string> = {};
        if (form.companyName) pd.companyName = form.companyName;
        if (form.email)       pd.email       = form.email;
        if (form.number)      pd.number      = form.number;
        const { data: r } = await api.put<{ success: boolean; message?: string }>(`/api/user/update/${user.id}`, pd);
        if (!r.success) throw new Error(r.message || 'Failed to update');
      }
      if (hasPass) {
        const { data: r } = await api.put<{ success: boolean; message?: string }>(`/api/user/change-password/${user.id}`, { password: form.password, confirmPassword: form.confirmPassword });
        if (!r.success) throw new Error(r.message || 'Failed to change password');
      }
    },
    onSuccess: () => { closeModal(); invalidate(); toast('Updated successfully!'); },
    onError: (e: Error) => setError(e.message),
  });

  const addCreditMut = useMutation({
    mutationFn: async ({ receiverId, amount }: { receiverId: string; amount: number }) => {
      const { data: r } = await api.post<{ success: boolean; message?: string }>('/api/transaction/credit', { receiverId, amount });
      if (!r.success) throw new Error(r.message || 'Failed');
    },
    onSuccess: () => { closeModal(); invalidate(); toast(`₹${creditAmt} credited!`); },
    onError: (e: Error) => setError(e.message),
  });

  const removeCreditMut = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      const { data: r } = await api.post<{ success: boolean; message?: string }>('/api/transaction/debit', { userId, amount });
      if (!r.success) throw new Error(r.message || 'Failed');
    },
    onSuccess: () => { closeModal(); invalidate(); toast(`₹${debitAmt} debited!`); },
    onError: (e: Error) => setError(e.message),
  });

  const freezeMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const ep = status === 'active' ? 'freeze' : 'unfreeze';
      const { data: r } = await api.put<{ success: boolean; message?: string }>(`/api/user/${ep}/${id}`);
      if (!r.success) throw new Error(r.message || 'Failed');
      return r.message;
    },
    onSuccess: (msg) => { closeModal(); invalidate(); toast(msg || 'Done'); },
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { data: r } = await api.delete<{ success: boolean; message?: string }>(`/api/user/delete/${id}`);
      if (!r.success) throw new Error(r.message || 'Failed');
    },
    onSuccess: () => { closeModal(); invalidate(); toast(`${singular} deleted.`); },
    onError: (e: Error) => setError(e.message),
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const openModal = (type: typeof modal, r?: ManagedUser) => {
    setError(''); setSuccess('');
    if (r) setSelected(r);
    if (type === 'edit' && r) setEditForm({ companyName: r.companyName, email: r.email, number: r.number, password: '', confirmPassword: '' });
    if (type === 'addCredit') setCreditAmt('');
    if (type === 'removeCredit') setDebitAmt('');
    setModal(type);
  };

  const closeModal = () => { setModal(null); setSelected(null); setError(''); setSuccess(''); };

  const handleCreate = () => {
    if (!createForm.companyName || !createForm.email || !createForm.password || !createForm.number || !createForm.balance) {
      setError('All fields are required'); return;
    }
    setError('');
    createMut.mutate(createForm);
  };

  const handleEdit = () => {
    if (!selected) return;
    const hasProfile = editForm.companyName || editForm.email || editForm.number;
    const hasPass = editForm.password || editForm.confirmPassword;
    if (!hasProfile && !hasPass) { setError('Please provide at least one field'); return; }
    if (hasPass && editForm.password !== editForm.confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    editMut.mutate({ user: selected, form: editForm });
  };

  const handleAddCredit = () => {
    if (!selected || !creditAmt || parseFloat(creditAmt) <= 0) { setError('Enter a valid amount'); return; }
    setError('');
    addCreditMut.mutate({ receiverId: selected.id, amount: parseFloat(creditAmt) });
  };

  const handleRemoveCredit = () => {
    if (!selected || !debitAmt || parseFloat(debitAmt) <= 0) { setError('Enter a valid amount'); return; }
    setError('');
    removeCreditMut.mutate({ userId: selected.id, amount: parseFloat(debitAmt) });
  };

  const handleFreeze = () => {
    if (!selected) return;
    setError('');
    freezeMut.mutate({ id: selected.id, status: selected.status });
  };

  const handleDelete = () => {
    if (!selected) return;
    setError('');
    deleteMut.mutate(selected.id);
  };

  const actionLoading = createMut.isPending || editMut.isPending || addCreditMut.isPending
    || removeCreditMut.isPending || freezeMut.isPending || deleteMut.isPending;

  const total = listKey === 'resellers'
    ? (data as ResellersData | undefined)?.totalResellers ?? 0
    : listKey === 'admins'
    ? (data as AdminsData | undefined)?.totalAdmins ?? 0
    : (data as UsersData | undefined)?.totalUsers ?? 0;

  const items = listKey === 'resellers'
    ? (data as ResellersData | undefined)?.resellers ?? []
    : listKey === 'admins'
    ? (data as AdminsData | undefined)?.admins ?? []
    : (data as UsersData | undefined)?.users ?? [];

  return {
    data: data ?? null,
    loading: isLoading,
    error, success, actionLoading,
    selected, modal, createForm, editForm, creditAmt, debitAmt,
    total, items,
    setCreateForm, setEditForm, setCreditAmt, setDebitAmt,
    openModal, closeModal,
    handleCreate, handleEdit, handleAddCredit, handleRemoveCredit, handleFreeze, handleDelete,
    refetch: () => qc.invalidateQueries({ queryKey }),
  };
}
