import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { api, getErrorMessage } from '../../api/client';
import { QK } from '../../lib/queryKeys';
import { fieldCls } from '../../theme/classes';
import { cn } from '../../lib/utils';

type DomainState = {
  domain: string | null;
  verified: boolean;
  cnameTarget: string | null;
};

const btnCls =
  "px-4 py-2 text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * White-label domain setup: claim a host, point its CNAME at the platform,
 * then verify. Verification is what makes the domain resolve for branding and
 * what triggers its certificate.
 */
export default function CustomDomainCard() {
  const qc = useQueryClient();
  const [host, setHost] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const { data } = useQuery({
    queryKey: QK.domain(),
    queryFn: async (): Promise<DomainState> => (await api.get('/api/domain')).data.data,
  });

  useEffect(() => {
    if (data?.domain) setHost(data.domain);
  }, [data?.domain]);

  const settled = {
    onSuccess: (r: { data: { message?: string } }) => {
      setError('');
      setNotice(r.data.message ?? '');
      qc.invalidateQueries({ queryKey: QK.domain() });
    },
    onError: (e: unknown) => {
      setNotice('');
      setError(getErrorMessage(e));
    },
  };

  const save = useMutation({ mutationFn: () => api.put('/api/domain', { host }), ...settled });
  const verify = useMutation({ mutationFn: () => api.post('/api/domain/verify'), ...settled });
  const remove = useMutation({ mutationFn: () => api.delete('/api/domain'), ...settled });

  const busy = save.isPending || verify.isPending || remove.isPending;

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-line bg-surface2">
        <Globe size={16} className="text-brand-light" />
        <p className="text-sm font-semibold text-fg">Custom Domain</p>
        {data?.verified && (
          <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-brand-light">
            <CheckCircle size={12} /> Verified
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3">
        <p className="text-xs text-fg-subtle">
          Run the panel on your own address. Add this DNS record at your registrar,
          then verify — a subdomain is required, a root domain cannot hold a CNAME.
        </p>

        <div className="text-[12px] font-mono bg-surface2 border border-line rounded-lg px-3 py-2 text-fg-muted break-all">
          {host || 'panel.yourbrand.com'} &nbsp;CNAME&nbsp; {data?.cnameTarget ?? '—'}
        </div>

        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="panel.yourbrand.com"
          disabled={busy}
          className={fieldCls}
        />

        {error && (
          <div className="flex items-center gap-2 text-[13px] text-danger">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}
        {notice && !error && (
          <div className="flex items-center gap-2 text-[13px] text-brand-light">
            <CheckCircle size={14} className="shrink-0" /> {notice}
          </div>
        )}

        <div className="flex gap-2 flex-wrap items-center">
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={busy || !host || host === data?.domain}
            className={cn(btnCls, "bg-brand hover:bg-brand-hover text-white")}
          >
            {save.isPending ? 'Saving…' : 'Save domain'}
          </button>
          <button
            type="button"
            onClick={() => verify.mutate()}
            disabled={busy || !data?.domain}
            className={cn(btnCls, "bg-surface2 border border-line text-fg hover:bg-surface")}
          >
            {verify.isPending ? 'Checking DNS…' : data?.verified ? 'Re-check' : 'Verify'}
          </button>
          {data?.domain && (
            <button
              type="button"
              onClick={() => remove.mutate()}
              disabled={busy}
              className={cn(btnCls, "ml-auto flex items-center gap-1.5 text-danger hover:bg-danger-dim")}
            >
              <Trash2 size={13} /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
