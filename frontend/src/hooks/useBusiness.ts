import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage } from '../api/client';
import { QK } from '../lib/queryKeys';

export interface BusinessData {
  companyName: string;
  email: string;
  number: string;
  image?: string;
}

async function fetchBusiness(): Promise<BusinessData> {
  const { data: r } = await api.get('/api/dashboard/manage-business');
  if (!r.success) throw new Error(r.message || 'Failed');
  return {
    companyName: r.data.companyName || '',
    email: r.data.email || '',
    number: String(r.data.number ?? ''),
    image: r.data.image || '',
  };
}

const getUserId = (): string | null => {
  try { return JSON.parse(localStorage.getItem('user') || '{}')._id ?? null; }
  catch { return null; }
};

export function useBusiness() {
  const qc = useQueryClient();

  const [formData, setFormData] = useState<BusinessData>({ companyName: '', email: '', number: '' });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  const { data: originalData, isLoading: fetchLoading } = useQuery({
    queryKey: QK.business(),
    queryFn: fetchBusiness,
  });

  // Populate local form state once data arrives
  useEffect(() => {
    if (originalData) {
      setFormData(originalData);
      if (originalData.image) setPreviewUrl(originalData.image);
    }
  }, [originalData]);

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const updateMut = useMutation({
    mutationFn: async (payload: { profileFd?: FormData; pwd?: { newPassword: string; confirmPassword: string } }) => {
      const changed: string[] = [];
      if (payload.profileFd) {
        const { data: r } = await api.put('/api/auth/update-profile', payload.profileFd);
        if (!r.success) throw new Error(r.message || 'Profile update failed');
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...u, companyName: r.user.companyName, email: r.user.email, number: String(r.user.number), image: r.user.image }));
        const nd: BusinessData = { companyName: r.user.companyName, email: r.user.email, number: String(r.user.number), image: r.user.image };
        setFormData(nd);
        if (r.user.image) setPreviewUrl(r.user.image);
        setSelectedImage(null);
        qc.setQueryData(QK.business(), nd);
        changed.push('profile');
      }
      if (payload.pwd) {
        const { data: r } = await api.put('/api/user/change-own-password', payload.pwd);
        if (!r.success) throw new Error(r.message || 'Password change failed');
        setPasswordData({ newPassword: '', confirmPassword: '' });
        changed.push('password');
      }
      return changed;
    },
    onSuccess: (changed) => {
      const msg = changed.includes('profile') && changed.includes('password')
        ? 'Profile and password updated!'
        : changed.includes('password') ? 'Password changed successfully!'
        : 'Profile updated!';
      setSuccess(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(''), 5000);
    },
    onError: (e: unknown) => {
      setError(getErrorMessage(e));
    },
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('Max 5MB'); return; }
    if (!f.type.startsWith('image/')) { setError('Invalid image type'); return; }
    setSelectedImage(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!getUserId()) { setError('Session expired. Please login.'); return; }

    const orig: BusinessData = originalData ?? { companyName: '', email: '', number: '' };
    const updates: Partial<BusinessData> = {};
    if (formData.companyName !== orig.companyName && formData.companyName.trim()) updates.companyName = formData.companyName;
    if (formData.email !== orig.email && formData.email.trim()) updates.email = formData.email;
    if (formData.number !== orig.number && formData.number.trim()) updates.number = formData.number;

    const hasProfile = Object.keys(updates).length > 0 || !!selectedImage;
    const hasPwd = !!(passwordData.newPassword || passwordData.confirmPassword);
    if (!hasProfile && !hasPwd) { setError('No changes detected.'); return; }

    if (updates.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email)) { setError('Invalid email address'); return; }
    if (updates.number && !/^[0-9]{10}$/.test(updates.number)) { setError('Enter a valid 10-digit number'); return; }

    if (hasPwd) {
      if (!passwordData.newPassword || !passwordData.confirmPassword) { setError('Fill in both password fields'); return; }
      if (passwordData.newPassword !== passwordData.confirmPassword) { setError('Passwords do not match'); return; }
      if (passwordData.newPassword.length < 5) { setError('Password must be at least 5 characters'); return; }
    }

    let profileFd: FormData | undefined;
    if (hasProfile) {
      profileFd = new FormData();
      if (updates.companyName) profileFd.append('companyName', updates.companyName);
      if (updates.email)       profileFd.append('email', updates.email);
      if (updates.number)      profileFd.append('number', updates.number);
      if (selectedImage)       profileFd.append('image', selectedImage);
    }

    updateMut.mutate({
      profileFd,
      pwd: hasPwd ? passwordData : undefined,
    });
  };

  return {
    formData, setFormData,
    passwordData, setPasswordData,
    previewUrl,
    loading: updateMut.isPending,
    fetchLoading,
    success, setSuccess,
    error, setError,
    handleFile, handleSubmit,
  };
}
