import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import Marquee from "react-fast-marquee";
import {
  Wallet, Users, Settings, TrendingUp,
  Megaphone, MessageSquare, ArrowUpRight, Radio,
} from "lucide-react";
import { getUserRole } from "../utils/Auth";
import { UserRole } from "../constants/Roles";
import { api } from "../api/client";

/* ── design tokens ── */
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
  blue:        '#3b82f6',
  blueDim:     'rgba(59,130,246,0.12)',
  amber:       '#fbbf24',
  amberDim:    'rgba(251,191,36,0.12)',
  purple:      '#a78bfa',
  purpleDim:   'rgba(167,139,250,0.12)',
  red:         '#f87171',
  redDim:      'rgba(248,113,113,0.12)',
};

interface DashboardData {
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
  latestNews: { title: string; description: string; status: string; createdAt: string };
}

/* ── small reusable pieces ── */
const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: D.surface, border: `1px solid ${D.border}`,
    borderRadius: 12, ...style,
  }}>
    {children}
  </div>
);

const Badge = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <span style={{
    fontSize: 11, fontWeight: 600, color, background: bg,
    padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap',
    border: `1px solid ${color}33`,
  }}>
    {label}
  </span>
);

const statusColor = (status: string) => {
  const s = status?.toLowerCase();
  if (s === 'completed' || s === 'success') return { color: D.greenLight, bg: D.greenDim };
  if (s === 'pending')                      return { color: D.amber,      bg: D.amberDim };
  if (s === 'failed'  || s === 'error')     return { color: D.red,        bg: D.redDim };
  return { color: D.textMuted, bg: 'rgba(255,255,255,0.06)' };
};

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { weekRange: string; totalCampaigns: number; totalMessages: number }; value: number; dataKey: string }>;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: D.surface2, border: `1px solid ${D.border2}`,
      borderRadius: 8, padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{ fontSize: 11, color: D.textSubtle, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.weekRange}</p>
      <p style={{ fontSize: 13, color: D.blue,       fontWeight: 600, marginBottom: 3 }}>Campaigns: {d.totalCampaigns}</p>
      <p style={{ fontSize: 13, color: D.greenLight, fontWeight: 600 }}>Messages: {d.totalMessages}</p>
    </div>
  );
};

/* ── main component ── */
const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [chartHeight, setChartHeight]     = useState(300);
  const userRole = getUserRole();

  useEffect(() => {
    const handle = () => setChartHeight(window.innerWidth < 640 ? 200 : window.innerWidth < 1024 ? 240 : 300);
    window.addEventListener("resize", handle);
    handle();
    return () => window.removeEventListener("resize", handle);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: result } = await api.get<{ success: boolean; message?: string; data: DashboardData }>("/api/dashboard/home");
      if (result.success) setDashboardData(result.data);
      else setError(result.message || "Failed to load dashboard data");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: `3px solid ${D.border}`, borderTopColor: D.green,
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: D.textMuted, fontSize: 13 }}>Loading dashboard…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '12px 16px', background: D.redDim, border: `1px solid ${D.red}44`, borderRadius: 10 }}>
        <p style={{ color: D.red, fontSize: 14 }}>{error}</p>
      </div>
    );
  }

  if (!dashboardData) return null;

  const isAdminOrReseller = userRole === UserRole.ADMIN || userRole === UserRole.RESELLER;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    {
      show: true,
      label: userRole === UserRole.ADMIN ? 'Total Messages' : 'Available Balance',
      value: userRole === UserRole.ADMIN ? dashboardData.totalMessages.toLocaleString() : `₹${dashboardData.balance.toLocaleString()}`,
      icon: userRole === UserRole.ADMIN ? TrendingUp : Wallet,
      accent: userRole === UserRole.ADMIN ? D.red       : D.green,
      iconBg:  userRole === UserRole.ADMIN ? D.redDim   : D.greenDim,
      iconColor: userRole === UserRole.ADMIN ? D.red    : D.greenLight,
    },
    {
      show: isAdminOrReseller,
      label: 'Total Resellers',
      value: dashboardData.totalReseller.toLocaleString(),
      icon: Settings,
      accent: D.blue,
      iconBg:    D.blueDim,
      iconColor: D.blue,
    },
    {
      show: isAdminOrReseller,
      label: 'Total Users',
      value: dashboardData.totalUsers.toLocaleString(),
      icon: Users,
      accent: D.amber,
      iconBg:    D.amberDim,
      iconColor: D.amber,
    },
    {
      show: true,
      label: 'Total Campaigns',
      value: dashboardData.totalCampaigns.toLocaleString(),
      icon: Megaphone,
      accent: D.purple,
      iconBg:    D.purpleDim,
      iconColor: D.purple,
    },
  ].filter(c => c.show);

  const cols = statCards.length;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.5)} }
        .stat-card:hover { background: ${D.surface2} !important; }
        .campaign-row:hover td { background: rgba(255,255,255,0.025) !important; }
        @media (max-width:639px)  { .stat-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (min-width:640px)  { .stat-grid { grid-template-columns: repeat(${cols > 2 ? 2 : cols},1fr) !important; } }
        @media (min-width:1024px) { .stat-grid { grid-template-columns: repeat(${cols},1fr) !important; } }
        @media (min-width:1024px) { .main-grid { grid-template-columns: 3fr 2fr !important; } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: D.text, margin: 0, lineHeight: 1.2 }}>
              {greeting}, {dashboardData.companyName || 'there'} 👋
            </h1>
            <p style={{ fontSize: 13, color: D.textMuted, marginTop: 4 }}>
              Here's what's happening with your campaigns today.
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: D.surface, border: `1px solid ${D.border}`,
            borderRadius: 8, padding: '6px 12px',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', background: D.greenLight,
              animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: D.textMuted, fontWeight: 500 }}>
              {dashboardData.role || userRole}
            </span>
          </div>
        </div>

        {/* ── News ticker ── */}
        {dashboardData.latestNews ? (
          <div style={{
            background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.18)',
            borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', borderRight: '1px solid rgba(22,163,74,0.18)',
              flexShrink: 0,
            }}>
              <Radio size={12} style={{ color: D.greenLight }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: D.greenLight, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live</span>
            </div>
            <Marquee pauseOnHover gradient={false} speed={40} style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '9px 20px' }}>
                <span style={{ color: D.text, fontWeight: 500, fontSize: 13 }}>{dashboardData.latestNews.title}</span>
                <span style={{ color: D.textMuted, fontSize: 13 }}>— {dashboardData.latestNews.description}</span>
                <span style={{ color: D.textSubtle, fontSize: 12 }}>
                  {new Date(dashboardData.latestNews.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </Marquee>
          </div>
        ) : (
          <div style={{
            padding: '9px 16px', background: D.amberDim,
            border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10,
          }}>
            <p style={{ color: D.amber, fontSize: 13, fontWeight: 500 }}>No announcements at this time.</p>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="stat-grid" style={{ display: 'grid', gap: 14 }}>
          {statCards.map(c => (
            <div
              key={c.label}
              className="stat-card"
              style={{
                background: D.surface, border: `1px solid ${D.border}`,
                borderRadius: 12, overflow: 'hidden',
                transition: 'background 0.15s',
              }}
            >
              {/* accent top bar */}
              <div style={{ height: 3, background: c.accent, borderRadius: '12px 12px 0 0' }} />
              <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 11, color: D.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                    {c.label}
                  </p>
                  <p style={{ fontSize: 26, fontWeight: 700, color: D.text, lineHeight: 1 }}>{c.value}</p>
                </div>
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <c.icon size={20} color={c.iconColor} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Chart + Table ── */}
        <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>

          {/* Bar chart */}
          <Card>
            <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: D.text, margin: 0 }}>Weekly Activity</p>
                <p style={{ fontSize: 12, color: D.textMuted, marginTop: 3 }}>Campaign & message volume · last 2 months</p>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: D.blue }} />
                  <span style={{ fontSize: 11, color: D.textMuted }}>Campaigns</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: D.green }} />
                  <span style={{ fontSize: 11, color: D.textMuted }}>Messages</span>
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 8px 8px', overflowX: 'auto' }}>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={dashboardData.weeklyStats}
                  margin={{ top: 4, right: 16, left: -12, bottom: window.innerWidth < 640 ? 50 : 4 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="weekRange"
                    stroke="transparent"
                    tick={{ fill: D.textSubtle, fontSize: window.innerWidth < 640 ? 9 : 11 }}
                    angle={window.innerWidth < 640 ? -40 : 0}
                    textAnchor={window.innerWidth < 640 ? 'end' : 'middle'}
                    height={window.innerWidth < 640 ? 60 : 28}
                  />
                  <YAxis stroke="transparent" tick={{ fill: D.textSubtle, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="totalCampaigns" fill={D.blue}  radius={[4,4,0,0]} name="Campaigns" />
                  <Bar dataKey="totalMessages"  fill={D.green} radius={[4,4,0,0]} name="Messages" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent campaigns */}
          <Card>
            <div style={{ padding: '20px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: D.text, margin: 0 }}>Recent Campaigns</p>
                <p style={{ fontSize: 12, color: D.textMuted, marginTop: 3 }}>Top 5 by activity</p>
              </div>
              <MessageSquare size={16} style={{ color: D.textSubtle }} />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: D.border, margin: '0 24px' }} />

            {/* Desktop table */}
            <div className="hidden sm:block" style={{ overflowX: 'auto', padding: '8px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['#', 'Campaign', 'Msgs', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '8px 16px', textAlign: 'left',
                        fontSize: 10, color: D.textSubtle, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.topFiveCampaigns.map((c, i) => {
                    const sc = statusColor(c.status);
                    return (
                      <tr key={c._id} className="campaign-row" style={{ cursor: 'default' }}>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: D.textSubtle }}>{i + 1}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: D.text, fontWeight: 500, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.campaignName}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: D.textMuted }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ArrowUpRight size={12} style={{ color: D.greenLight }} />
                            {c.numberCount.toLocaleString()}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <Badge label={c.status || 'None'} color={sc.color} bg={sc.bg} />
                        </td>
                      </tr>
                    );
                  })}
                  {dashboardData.topFiveCampaigns.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: D.textSubtle, fontSize: 13 }}>
                        No campaigns yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px' }}>
              {dashboardData.topFiveCampaigns.map((c, i) => {
                const sc = statusColor(c.status);
                return (
                  <div key={c._id} style={{
                    padding: '12px 14px', background: D.surface2,
                    border: `1px solid ${D.border}`, borderRadius: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: D.textSubtle, fontWeight: 600 }}>#{i + 1}</span>
                      <Badge label={c.status || 'None'} color={sc.color} bg={sc.bg} />
                    </div>
                    <p style={{ fontSize: 13, color: D.text, fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.campaignName}
                    </p>
                    <p style={{ fontSize: 12, color: D.textMuted }}>
                      {c.numberCount.toLocaleString()} messages
                    </p>
                  </div>
                );
              })}
              {dashboardData.topFiveCampaigns.length === 0 && (
                <p style={{ textAlign: 'center', color: D.textSubtle, fontSize: 13, padding: 20 }}>No campaigns yet</p>
              )}
            </div>
          </Card>
        </div>

      </div>
    </>
  );
};

export default Dashboard;
