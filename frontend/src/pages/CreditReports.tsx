import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Wallet, TrendingUp, TrendingDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../api/client';

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
  greenBorder: 'rgba(22,163,74,0.3)',
  red:         '#f87171',
  redDim:      'rgba(248,113,113,0.1)',
  redBorder:   'rgba(248,113,113,0.25)',
  amber:       '#fbbf24',
  amberDim:    'rgba(251,191,36,0.1)',
};

interface Transaction {
  transactionId: string;
  userOrCampaign: string;
  amount: number;
  type: 'credit' | 'debit';
  createdBy: string;
  createdAt: string;
  status: string;
  balanceBefore: number;
  balanceAfter: number;
}

interface TransactionData {
  currentBalance: number;
  totalTransactions: number;
  transactions: Transaction[];
}

const ITEMS_PER_PAGE = 10;

const inputStyle: React.CSSProperties = {
  background: D.surface2,
  border: `1px solid ${D.border}`,
  borderRadius: 7,
  color: D.text,
  fontSize: 13,
  padding: '8px 12px',
  outline: 'none',
  colorScheme: 'dark',
};

const CreditReports = () => {
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');

  const fetchTransactionData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: result } = await api.get<{ success: boolean; message?: string; data: TransactionData }>('/api/dashboard/transaction');
      if (result.success) setTransactionData(result.data);
      else setError(result.message || 'Failed to load transaction data');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactionData(); }, [fetchTransactionData]);
  useEffect(() => { setCurrentPage(1); }, [startDate, endDate]);

  const getFiltered = () => {
    if (!transactionData) return [];
    let list = transactionData.transactions;
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate); e.setHours(23, 59, 59, 999);
      list = list.filter(t => { const d = new Date(t.createdAt); return d >= s && d <= e; });
    }
    return list;
  };

  const filtered     = getFiltered();
  const totalPages   = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const startIdx     = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated    = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const goToPage = (p: number) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const formatDate = (s: string) => { try { return format(new Date(s), 'dd MMM yyyy, hh:mm a'); } catch { return s; } };

  /* ── derived stats ── */
  const totalCredit = transactionData?.transactions.filter(t => t.type === 'credit').reduce((a, t) => a + t.amount, 0) ?? 0;
  const totalDebit  = transactionData?.transactions.filter(t => t.type === 'debit' ).reduce((a, t) => a + t.amount, 0) ?? 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${D.border}`, borderTopColor: D.green, animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: D.textMuted, fontSize: 13 }}>Loading transactions…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: '12px 16px', background: D.redDim, border: `1px solid ${D.redBorder}`, borderRadius: 10 }}>
      <p style={{ color: D.red, fontSize: 14 }}>{error}</p>
    </div>
  );

  if (!transactionData) return null;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .txn-row:hover td { background: rgba(255,255,255,0.025) !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Page header ── */}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: D.text, margin: 0 }}>Credit Reports</h1>
          <p style={{ fontSize: 13, color: D.textMuted, marginTop: 4 }}>Last 100 transactions · your wallet history</p>
        </div>

        {/* ── Summary stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {[
            {
              label: 'Current Balance',
              value: `₹${transactionData.currentBalance.toLocaleString()}`,
              icon: Wallet,
              accent: D.green, iconBg: D.greenDim, iconColor: D.greenLight,
            },
            {
              label: 'Total Credits',
              value: `+₹${totalCredit.toLocaleString()}`,
              icon: TrendingUp,
              accent: D.green, iconBg: D.greenDim, iconColor: D.greenLight,
            },
            {
              label: 'Total Debits',
              value: `-₹${totalDebit.toLocaleString()}`,
              icon: TrendingDown,
              accent: D.red, iconBg: D.redDim, iconColor: D.red,
            },
          ].map(c => (
            <div key={c.label} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ height: 3, background: c.accent }} />
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 11, color: D.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{c.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: D.text, lineHeight: 1 }}>{c.value}</p>
                </div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <c.icon size={18} color={c.iconColor} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} style={{ color: D.textMuted }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: D.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Filter</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>From</span>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
              </div>
              <span style={{ color: D.textSubtle, fontSize: 13, marginTop: 14 }}>→</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, color: D.textSubtle, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>To</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: D.surface2, border: `1px solid ${D.border2}`, borderRadius: 7, cursor: 'pointer', color: D.textMuted, fontSize: 12, fontWeight: 500 }}
              >
                <X size={12} /> Clear
              </button>
            )}

            <span style={{ marginLeft: 'auto', fontSize: 12, color: D.textSubtle }}>
              {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </span>
          </div>
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden md:block" style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${D.border}` }}>
                  {['#', 'User / Campaign', 'Amount', 'Type', 'Created By', 'Date'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 10, color: D.textSubtle, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 16px', textAlign: 'center', color: D.textSubtle, fontSize: 13 }}>
                      No transactions found. Try adjusting your date filters.
                    </td>
                  </tr>
                ) : paginated.map((t, i) => (
                  <tr key={t.transactionId} className="txn-row" style={{ borderBottom: `1px solid rgba(39,39,42,0.5)`, cursor: 'default' }}>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: D.textSubtle }}>{startIdx + i + 1}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: D.text, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.userOrCampaign}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: t.type === 'credit' ? D.greenLight : D.red }}>
                        {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                        color:       t.type === 'credit' ? D.greenLight : D.amber,
                        background:  t.type === 'credit' ? D.greenDim   : D.amberDim,
                        border: `1px solid ${t.type === 'credit' ? D.greenBorder : 'rgba(251,191,36,0.25)'}`,
                      }}>
                        {t.type === 'credit'
                          ? <TrendingUp  size={10} />
                          : <TrendingDown size={10} />
                        }
                        {t.type === 'credit' ? 'Credit' : 'Debit'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: D.textMuted, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.createdBy}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: D.textMuted, whiteSpace: 'nowrap' }}>
                      {formatDate(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mobile cards ── */}
        <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {paginated.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12 }}>
              <p style={{ color: D.textSubtle, fontSize: 13 }}>No transactions found.</p>
            </div>
          ) : paginated.map((t, i) => (
            <div key={t.transactionId} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: D.textSubtle }}>#{startIdx + i + 1}</span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                    color:      t.type === 'credit' ? D.greenLight : D.amber,
                    background: t.type === 'credit' ? D.greenDim   : D.amberDim,
                  }}>
                    {t.type === 'credit' ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {t.type === 'credit' ? 'Credit' : 'Debit'}
                  </span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: t.type === 'credit' ? D.greenLight : D.red }}>
                  {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                </span>
              </div>
              <p style={{ fontSize: 13, color: D.text, fontWeight: 500, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.userOrCampaign}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${D.border}` }}>
                <span style={{ fontSize: 11, color: D.textSubtle }}>By: <span style={{ color: D.textMuted }}>{t.createdBy}</span></span>
                <span style={{ fontSize: 11, color: D.textSubtle }}>{format(new Date(t.createdAt), 'dd MMM, hh:mm a')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 12, padding: '14px 20px' }}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ padding: '6px 8px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 7, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, display: 'flex' }}
            >
              <ChevronLeft size={16} style={{ color: D.textMuted }} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5)         p = i + 1;
              else if (currentPage <= 3)   p = i + 1;
              else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
              else p = currentPage - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  style={{
                    width: 34, height: 34, borderRadius: 7, fontSize: 13, fontWeight: 600,
                    border: `1px solid ${currentPage === p ? D.green : D.border}`,
                    background: currentPage === p ? D.green : D.surface2,
                    color: currentPage === p ? '#fff' : D.textMuted,
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ padding: '6px 8px', background: D.surface2, border: `1px solid ${D.border}`, borderRadius: 7, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, display: 'flex' }}
            >
              <ChevronRight size={16} style={{ color: D.textMuted }} />
            </button>
          </div>
        )}

      </div>
    </>
  );
};

export default CreditReports;
