import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { QK } from '../lib/queryKeys';
import { downloadCampaignExcel, type ExcelFormat } from '../utils/downloadCampaign';

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
  profileImage?: string | null;
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

  const downloadExcel = async (id: string, fileFormat: ExcelFormat = 'xlsx') => {
    if (downloading.has(id)) return;
    setDownloading(p => new Set(p).add(id));
    setDlError(null);
    try {
      await downloadCampaignExcel(id, fileFormat);
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
    clearDlError: () => setDlError(null),
  };
}
