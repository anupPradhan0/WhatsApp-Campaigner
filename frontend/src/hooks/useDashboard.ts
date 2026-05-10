import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { QK } from '../lib/queryKeys';

export interface DashboardData {
  companyName: string;
  image: string;
  role: string;
  balance: number;
  totalReseller: number;
  totalUsers: number;
  totalCampaigns: number;
  totalMessages: number;
  weeklyStats: Array<{ weekRange: string; totalCampaigns: number; totalMessages: number }>;
  topFiveCampaigns: Array<{ _id: string; campaignName: string; numberCount: number; status: string; createdAt: string }>;
  latestNews: { title: string; description: string; status: string; createdAt: string } | null;
}

async function fetchDashboard(): Promise<DashboardData> {
  const { data: r } = await api.get<{ success: boolean; message?: string; data: DashboardData }>('/api/dashboard/home');
  if (!r.success) throw new Error(r.message || 'Failed to load dashboard data');
  return r.data;
}

export function useDashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QK.dashboard(),
    queryFn: fetchDashboard,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : '',
    refetch,
  };
}
