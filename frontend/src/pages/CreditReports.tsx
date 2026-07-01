import { useState, useEffect, useCallback } from 'react';
import { Calendar, Wallet, TrendingUp, TrendingDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { api, getErrorMessage } from '../api/client';
import { D } from '../theme/tokens';
import { Paginator } from '../components/ui/Paginator';
import { PageHeader } from '../components/ui/PageHeader';
import { Spinner } from '../components/ui/Spinner';

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

const dateInputCls =
  "bg-surface2 border border-line rounded-[7px] text-fg text-[13px] px-3 py-2 outline-none [color-scheme:dark]";

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
    } catch (err) {
      setError(getErrorMessage(err));
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

  if (loading) return <Spinner label="Loading transactions…" />;

  if (error) return (
    <div className="px-4 py-3 bg-danger-dim border border-danger-border rounded-[10px]">
      <p className="text-danger text-sm">{error}</p>
    </div>
  );

  if (!transactionData) return null;

  return (
    <>
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
      `}</style>

      <div className="flex flex-col gap-[18px]">
        <PageHeader title="Credit Reports" subtitle="Last 100 transactions · your wallet history" />

        {/* ── Summary stat cards ── */}
        <div className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
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
            <div key={c.label} className="bg-surface border border-line rounded-xl overflow-hidden">
              <div className="h-[3px]" style={{ background: c.accent }} />
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-fg-muted font-semibold uppercase tracking-[0.07em] mb-1.5">{c.label}</p>
                  <p className="text-[22px] font-bold text-fg leading-none">{c.value}</p>
                </div>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center" style={{ background: c.iconBg }}>
                  <c.icon size={18} color={c.iconColor} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-surface border border-line rounded-xl px-5 py-4">
          <div className="flex items-center flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-fg-muted" />
              <span className="text-xs font-semibold text-fg-muted uppercase tracking-[0.07em]">Filter</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-fg-subtle font-semibold uppercase tracking-[0.06em]">From</span>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={dateInputCls} />
              </div>
              <span className="text-fg-subtle text-[13px] mt-3.5">→</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-fg-subtle font-semibold uppercase tracking-[0.06em]">To</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={dateInputCls} />
              </div>
            </div>

            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="flex items-center gap-[5px] px-3 py-1.5 bg-surface2 border border-line-strong rounded-[7px] cursor-pointer text-fg-muted text-xs font-medium"
              >
                <X size={12} /> Clear
              </button>
            )}

            <span className="ml-auto text-xs text-fg-subtle">
              {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </span>
          </div>
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden md:block bg-surface border border-line rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line">
                  {['#', 'User / Campaign', 'Amount', 'Type', 'Created By', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] text-fg-subtle font-bold uppercase tracking-[0.08em] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-fg-subtle text-[13px]">
                      No transactions found. Try adjusting your date filters.
                    </td>
                  </tr>
                ) : paginated.map((t, i) => (
                  <tr key={t.transactionId} className="group border-b border-line/50 cursor-default">
                    <td className="px-4 py-3 text-xs text-fg-subtle group-hover:bg-white/[0.025]">{startIdx + i + 1}</td>
                    <td className="px-4 py-3 text-[13px] text-fg font-medium max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap group-hover:bg-white/[0.025]">
                      {t.userOrCampaign}
                    </td>
                    <td className="px-4 py-3 group-hover:bg-white/[0.025]">
                      <span className={t.type === 'credit' ? 'text-sm font-bold text-brand-light' : 'text-sm font-bold text-danger'}>
                        {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 group-hover:bg-white/[0.025]">
                      <span className={
                        t.type === 'credit'
                          ? 'inline-flex items-center gap-[5px] text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px] text-brand-light bg-brand-dim border border-brand-border'
                          : 'inline-flex items-center gap-[5px] text-[11px] font-semibold px-[9px] py-[3px] rounded-[20px] text-warning bg-warning-dim border border-[rgba(251,191,36,0.25)]'
                      }>
                        {t.type === 'credit'
                          ? <TrendingUp  size={10} />
                          : <TrendingDown size={10} />
                        }
                        {t.type === 'credit' ? 'Credit' : 'Debit'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-fg-muted max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap group-hover:bg-white/[0.025]">
                      {t.createdBy}
                    </td>
                    <td className="px-4 py-3 text-xs text-fg-muted whitespace-nowrap group-hover:bg-white/[0.025]">
                      {formatDate(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Mobile cards ── */}
        <div className="md:hidden flex flex-col gap-2">
          {paginated.length === 0 ? (
            <div className="p-8 text-center bg-surface border border-line rounded-xl">
              <p className="text-fg-subtle text-[13px]">No transactions found.</p>
            </div>
          ) : paginated.map((t, i) => (
            <div key={t.transactionId} className="bg-surface border border-line rounded-[10px] px-3.5 py-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-fg-subtle">#{startIdx + i + 1}</span>
                  <span className={
                    t.type === 'credit'
                      ? 'inline-flex items-center gap-1 text-[10px] font-semibold px-[7px] py-0.5 rounded-[20px] text-brand-light bg-brand-dim'
                      : 'inline-flex items-center gap-1 text-[10px] font-semibold px-[7px] py-0.5 rounded-[20px] text-warning bg-warning-dim'
                  }>
                    {t.type === 'credit' ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {t.type === 'credit' ? 'Credit' : 'Debit'}
                  </span>
                </div>
                <span className={t.type === 'credit' ? 'text-[15px] font-bold text-brand-light' : 'text-[15px] font-bold text-danger'}>
                  {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                </span>
              </div>
              <p className="text-[13px] text-fg font-medium mb-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                {t.userOrCampaign}
              </p>
              <div className="flex justify-between pt-2 border-t border-line">
                <span className="text-[11px] text-fg-subtle">By: <span className="text-fg-muted">{t.createdBy}</span></span>
                <span className="text-[11px] text-fg-subtle">{format(new Date(t.createdAt), 'dd MMM, hh:mm a')}</span>
              </div>
            </div>
          ))}
        </div>

        <Paginator page={currentPage} total={totalPages} onChange={goToPage} />

      </div>
    </>
  );
};

export default CreditReports;
