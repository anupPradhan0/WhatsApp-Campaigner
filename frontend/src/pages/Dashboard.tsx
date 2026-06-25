import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import Marquee from 'react-fast-marquee';
import {
  Wallet, Users, Settings, TrendingUp,
  Megaphone, MessageSquare, ArrowUpRight, Radio,
} from 'lucide-react';
import { getUserRole } from '../utils/Auth';
import { UserRole } from '../constants/Roles';
import { useDashboard } from '../hooks/useDashboard';
import { D } from '../theme/tokens';
import { Spinner } from '../components/ui/Spinner';
import { Badge, statusColor } from '../components/ui/StatusBadge';

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { weekRange: string; totalCampaigns: number; totalMessages: number }; value: number; dataKey: string }>;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface2 border border-line-strong rounded-lg px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
      <p className="text-[11px] text-fg-subtle mb-1.5 font-semibold uppercase tracking-[0.06em]">{d.weekRange}</p>
      <p className="text-[13px] text-info font-semibold mb-[3px]">Campaigns: {d.totalCampaigns}</p>
      <p className="text-[13px] text-brand-light font-semibold">Messages: {d.totalMessages}</p>
    </div>
  );
};

const Dashboard = () => {
  const { data, loading, error } = useDashboard();
  const [chartHeight, setChartHeight] = useState(300);
  const [isMobile, setIsMobile] = useState(false);
  const userRole = getUserRole();

  useEffect(() => {
    const handle = () => {
      const w = window.innerWidth;
      setIsMobile(w < 640);
      setChartHeight(w < 640 ? 200 : w < 1024 ? 240 : 300);
    };
    window.addEventListener('resize', handle);
    handle();
    return () => window.removeEventListener('resize', handle);
  }, []);

  if (loading) return <Spinner label="Loading dashboard…" />;

  if (error) return (
    <div className="px-4 py-3 bg-danger-dim border border-danger-border rounded-[10px]">
      <p className="text-danger text-sm">{error}</p>
    </div>
  );

  if (!data) return null;

  const isAdminOrReseller = userRole === UserRole.ADMIN || userRole === UserRole.RESELLER;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    {
      show: true,
      label: userRole === UserRole.ADMIN ? 'Total Messages' : 'Available Balance',
      value: userRole === UserRole.ADMIN ? data.totalMessages.toLocaleString() : `₹${data.balance.toLocaleString()}`,
      icon: userRole === UserRole.ADMIN ? TrendingUp : Wallet,
      accent: userRole === UserRole.ADMIN ? D.red : D.green,
      iconBg: userRole === UserRole.ADMIN ? D.redDim : D.greenDim,
      iconColor: userRole === UserRole.ADMIN ? D.red : D.greenLight,
    },
    {
      show: isAdminOrReseller,
      label: 'Total Resellers',
      value: data.totalReseller.toLocaleString(),
      icon: Settings,
      accent: D.blue, iconBg: D.blueDim, iconColor: D.blue,
    },
    {
      show: isAdminOrReseller,
      label: 'Total Users',
      value: data.totalUsers.toLocaleString(),
      icon: Users,
      accent: D.amber, iconBg: D.amberDim, iconColor: D.amber,
    },
    {
      show: true,
      label: 'Total Campaigns',
      value: data.totalCampaigns.toLocaleString(),
      icon: Megaphone,
      accent: D.purple, iconBg: D.purpleDim, iconColor: D.purple,
    },
  ].filter(c => c.show);

  const cols = statCards.length;

  return (
    <>
      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
        @media (max-width:639px)  { .stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (min-width:640px)  { .stat-grid { grid-template-columns: repeat(${cols > 2 ? 2 : cols},1fr) !important; } }
        @media (min-width:1024px) { .stat-grid { grid-template-columns: repeat(${cols},1fr) !important; } }
        @media (min-width:1024px) { .main-grid { grid-template-columns: 3fr 2fr !important; } }
      `}</style>

      <div className="flex flex-col gap-5">

        {/* Page header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-fg m-0 leading-[1.2]">
              {greeting}, {data.companyName || 'there'} 👋
            </h1>
            <p className="text-[13px] text-fg-muted mt-1">
              Here's what's happening with your campaigns today.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-surface border border-line rounded-lg px-3 py-1.5">
            <div className="w-[7px] h-[7px] rounded-full bg-brand-light shrink-0" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
            <span className="text-xs text-fg-muted font-medium">{data.role || userRole}</span>
          </div>
        </div>

        {/* News ticker */}
        {data.latestNews ? (
          <div className="bg-[rgba(22,163,74,0.07)] border border-[rgba(22,163,74,0.18)] rounded-[10px] overflow-hidden flex items-center">
            <div className="flex items-center gap-1.5 px-3.5 py-[9px] border-r border-[rgba(22,163,74,0.18)] shrink-0">
              <Radio size={12} className="text-brand-light" />
              <span className="text-[11px] font-bold text-brand-light uppercase tracking-[0.08em]">Live</span>
            </div>
            <Marquee pauseOnHover gradient={false} speed={40} style={{ flex: 1 }}>
              <div className="flex items-center gap-8 px-5 py-[9px]">
                <span className="text-fg font-medium text-[13px]">{data.latestNews.title}</span>
                <span className="text-fg-muted text-[13px]">— {data.latestNews.description}</span>
                <span className="text-fg-subtle text-xs">
                  {new Date(data.latestNews.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </Marquee>
          </div>
        ) : (
          <div className="px-4 py-[9px] bg-warning-dim border border-[rgba(251,191,36,0.2)] rounded-[10px]">
            <p className="text-warning text-[13px] font-medium">No announcements at this time.</p>
          </div>
        )}

        {/* Stat cards */}
        <div className="stat-grid grid gap-3.5">
          {statCards.map(c => (
            <div
              key={c.label}
              className="group bg-surface hover:bg-surface2 border border-line rounded-xl overflow-hidden transition-colors"
            >
              <div className="h-[3px] rounded-t-xl" style={{ background: c.accent }} />
              <div className="px-5 py-[18px] flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-fg-muted font-semibold uppercase tracking-[0.07em] mb-2">{c.label}</p>
                  <p className="text-[26px] font-bold text-fg leading-none">{c.value}</p>
                </div>
                <div className="w-[46px] h-[46px] rounded-xl flex items-center justify-center shrink-0" style={{ background: c.iconBg }}>
                  <c.icon size={20} color={c.iconColor} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Table */}
        <div className="main-grid grid grid-cols-1 gap-4">

          {/* Bar chart */}
          <div className="bg-surface border border-line rounded-xl">
            <div className="pt-5 px-6 flex items-start justify-between flex-wrap gap-2.5">
              <div>
                <p className="text-[15px] font-semibold text-fg m-0">Weekly Activity</p>
                <p className="text-xs text-fg-muted mt-[3px]">Campaign & message volume · last 2 months</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-[3px] bg-info" />
                  <span className="text-[11px] text-fg-muted">Campaigns</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-[3px] bg-brand" />
                  <span className="text-[11px] text-fg-muted">Messages</span>
                </div>
              </div>
            </div>
            <div className="pt-4 px-2 pb-2 overflow-x-auto">
              <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={data.weeklyStats} margin={{ top: 4, right: 16, left: -12, bottom: isMobile ? 50 : 4 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="weekRange" stroke="transparent" tick={{ fill: D.textSubtle, fontSize: isMobile ? 9 : 11 }} angle={isMobile ? -40 : 0} textAnchor={isMobile ? 'end' : 'middle'} height={isMobile ? 60 : 28} />
                  <YAxis stroke="transparent" tick={{ fill: D.textSubtle, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="totalCampaigns" fill={D.blue}  radius={[4, 4, 0, 0]} name="Campaigns" />
                  <Bar dataKey="totalMessages"  fill={D.green} radius={[4, 4, 0, 0]} name="Messages" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent campaigns */}
          <div className="bg-surface border border-line rounded-xl">
            <div className="pt-5 px-6 pb-4 flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-fg m-0">Recent Campaigns</p>
                <p className="text-xs text-fg-muted mt-[3px]">Top 5 by activity</p>
              </div>
              <MessageSquare size={16} className="text-fg-subtle" />
            </div>
            <div className="h-px bg-line mx-6" />

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto py-2">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['#', 'Campaign', 'Msgs', 'Status'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-[10px] text-fg-subtle font-bold uppercase tracking-[0.08em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topFiveCampaigns.map((c, i) => {
                    const sc = statusColor(c.status);
                    return (
                      <tr key={c._id} className="group cursor-default">
                        <td className="px-4 py-2.5 text-xs text-fg-subtle group-hover:bg-white/[0.025]">{i + 1}</td>
                        <td className="px-4 py-2.5 text-[13px] text-fg font-medium max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap group-hover:bg-white/[0.025]">{c.campaignName}</td>
                        <td className="px-4 py-2.5 text-[13px] text-fg-muted group-hover:bg-white/[0.025]">
                          <span className="flex items-center gap-1">
                            <ArrowUpRight size={12} className="text-brand-light" />
                            {c.numberCount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 group-hover:bg-white/[0.025]">
                          <Badge label={c.status || 'None'} color={sc.color} bg={sc.bg} />
                        </td>
                      </tr>
                    );
                  })}
                  {data.topFiveCampaigns.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-fg-subtle text-[13px]">No campaigns yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden flex flex-col gap-2 px-4 py-3">
              {data.topFiveCampaigns.map((c, i) => {
                const sc = statusColor(c.status);
                return (
                  <div key={c._id} className="px-3.5 py-3 bg-surface2 border border-line rounded-lg">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-[11px] text-fg-subtle font-semibold">#{i + 1}</span>
                      <Badge label={c.status || 'None'} color={sc.color} bg={sc.bg} />
                    </div>
                    <p className="text-[13px] text-fg font-medium mb-1 overflow-hidden text-ellipsis whitespace-nowrap">{c.campaignName}</p>
                    <p className="text-xs text-fg-muted">{c.numberCount.toLocaleString()} messages</p>
                  </div>
                );
              })}
              {data.topFiveCampaigns.length === 0 && (
                <p className="text-center text-fg-subtle text-[13px] p-5">No campaigns yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
