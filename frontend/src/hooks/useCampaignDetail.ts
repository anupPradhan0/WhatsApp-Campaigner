import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api/client';
import { QK } from '../lib/queryKeys';

export interface CampaignDetail {
  campaignId: string;
  campaignName: string;
  message: string;
  createdBy: string;
  mobileNumberCount: number;
  createdAt: string;
  image: string | null;
  mediaType: string | null;
  countryCode: string;
  status: string;
  statusMessage?: string;
  phoneButton?: { text: string; number: string } | null;
  linkButton?: { text: string; url: string } | null;
  delivery: {
    delivered: number;
    failed: number;
    tracked: number;
    total: number;
  };
}

export interface CampaignNumber {
  serial: number;
  number: string;
  status: string;
  error: string | null;
  sentAt: string | null;
}

export interface CampaignNumbersPage {
  countryCode: string;
  numbers: CampaignNumber[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DetailResult {
  data: CampaignDetail;
  userData?: {
    companyName: string;
    email: string;
    number: string;
    role: string;
    status: string;
    createdAt: string;
  };
}

async function fetchDetail(id: string): Promise<DetailResult> {
  const { data: r } = await api.get<{
    success: boolean;
    message?: string;
    data: CampaignDetail;
    userData?: DetailResult['userData'];
  }>(`/api/dashboard/campaign/${id}`);
  if (!r.success) throw new Error(r.message || 'Failed to load campaign');
  return { data: r.data, userData: r.userData };
}

async function fetchNumbers(id: string, page: number, limit: number): Promise<CampaignNumbersPage> {
  const { data: r } = await api.get<{ success: boolean; message?: string; data: CampaignNumbersPage }>(
    `/api/dashboard/campaign/${id}/numbers`,
    { params: { page, limit } }
  );
  if (!r.success) throw new Error(r.message || 'Failed to load numbers');
  return r.data;
}

export function useCampaignDetail(campaignId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: QK.campaignDetail(campaignId),
    queryFn: () => fetchDetail(campaignId),
    enabled: !!campaignId,
  });
  return {
    detail: data?.data ?? null,
    userData: data?.userData ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : '',
  };
}

const PER_PAGE = 20;

export function useCampaignNumbers(campaignId: string, page: number) {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: QK.campaignNumbers(campaignId, page),
    queryFn: () => fetchNumbers(campaignId, page, PER_PAGE),
    enabled: !!campaignId,
    placeholderData: keepPreviousData,
  });
  return {
    numbers: data?.numbers ?? [],
    countryCode: data?.countryCode ?? '',
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    loading: isLoading,
    fetching: isFetching,
    error: error ? (error as Error).message : '',
  };
}

export function useDownloadCampaign() {
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  const downloadExcel = async (id: string) => {
    if (downloading) return;
    setDownloading(true);
    setDlError(null);
    try {
      const res = await api.get(`/api/dashboard/export-campaign/${id}`, {
        responseType: 'blob',
        validateStatus: () => true,
      });
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
      setDownloading(false);
    }
  };

  return { downloadExcel, downloading, dlError };
}
