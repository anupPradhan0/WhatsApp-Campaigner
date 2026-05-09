import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { QK } from '../lib/queryKeys';

export interface Campaign {
  campaignId: string;
  campaignName: string;
  status: string;
  statusMessage: string;
  message: string;
  createdBy: string;
  mobileNumberCount: number;
  createdAt: string;
  image: string;
  userData?: {
    companyName: string;
    email: string;
    number: string;
    role: string;
    status: string;
    createdAt: string;
  };
}

export interface CampaignsData {
  totalCampaigns: number;
  campaigns: Campaign[];
}

interface FetchResult {
  data: CampaignsData;
  userData?: Campaign['userData'];
}

async function fetchCampaigns(endpoint: string): Promise<FetchResult> {
  const { data: r } = await api.get<{ success: boolean; message?: string; data: CampaignsData; userData?: Campaign['userData'] }>(endpoint);
  if (!r.success) throw new Error(r.message || 'Failed to load campaigns');
  return { data: r.data, userData: r.userData };
}

export function useCampaigns(endpoint: string) {
  const [downloading, setDownloading] = useState<Set<string>>(new Set());
  const [dlError, setDlError] = useState<string | null>(null);

  const { data: result, isLoading, error, refetch } = useQuery({
    queryKey: QK.campaigns(endpoint),
    queryFn: () => fetchCampaigns(endpoint),
  });

  const downloadExcel = async (id: string) => {
    if (downloading.has(id)) return;
    setDownloading(p => new Set(p).add(id));
    setDlError(null);
    try {
      const res = await api.get(`/api/dashboard/export-campaign/${id}`, { responseType: 'blob', validateStatus: () => true });
      if (res.status >= 400) {
        const t = await (res.data as Blob).text();
        throw new Error(JSON.parse(t)?.message || 'Failed');
      }
      const cd = res.headers['content-disposition'] || '';
      const fn = cd.match(/filename="?(.+)"?/i)?.[1] || `Campaign_${id}.xlsx`;
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url; a.download = fn;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setDlError(e instanceof Error ? e.message : 'Failed');
      setTimeout(() => setDlError(null), 5000);
    } finally {
      setDownloading(p => { const n = new Set(p); n.delete(id); return n; });
    }
  };

  return {
    data: result?.data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : '',
    userData: result?.userData ?? null,
    refetch,
    downloadExcel,
    downloading,
    dlError,
  };
}
