import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe, CheckCircle, AlertCircle, Trash2, Copy, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
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

/** Copyable value — registrars need these pasted exactly. */
function CopyRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-fg-subtle">{label}</span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setDone(true); toast.success(`${label} copied`);
            setTimeout(() => setDone(false), 1500);
          } catch { toast.error('Could not copy'); }
        }}
        className="group flex items-center gap-2 bg-surface border border-line hover:border-line-strong rounded-md px-2.5 py-2 text-left transition-colors"
      >
        <code className="flex-1 min-w-0 text-[12px] font-mono text-fg truncate" title={value}>{value}</code>
        {done
          ? <Check size={13} className="text-brand-light shrink-0" />
          : <Copy size={13} className="text-fg-subtle group-hover:text-fg shrink-0" />}
      </button>
      {hint && <span className="text-[10px] text-fg-subtle">{hint}</span>}
    </div>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className={cn(
        "w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold border",
        done ? "bg-brand border-brand text-white" : "bg-surface2 border-line text-fg-muted",
      )}>
        {done ? <Check size={13} /> : n}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-fg mb-1.5">{title}</p>
        {children}
      </div>
    </div>
  );
}

/**
 * White-label domain setup, as three explicit steps: claim a host, point its
 * CNAME at the platform, then verify. Verification is what makes the domain
 * resolve for branding and what triggers its certificate.
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
  const saved = !!data?.domain;
  const verified = !!data?.verified;
  // Most registrars want only the subdomain label in the Name field. Before the
  // domain is saved we preview the record from whatever they're typing, so the
  // step isn't an empty box — that's the part people get stuck on.
  const shownHost = (saved ? data?.domain : host) || 'panel.yourbrand.com';
  const label = shownHost.split('.')[0];

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-line bg-surface2">
        <Globe size={16} className="text-brand-light" />
        <p className="text-sm font-semibold text-fg">Custom Domain</p>
        <span className={cn(
          "ml-auto flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full",
          verified ? "text-brand-light bg-brand-dim"
            : saved ? "text-warning bg-warning-dim"
            : "text-fg-subtle bg-white/[0.05]",
        )}>
          {verified ? <><CheckCircle size={12} /> Verified</>
            : saved ? <><Clock size={12} /> Awaiting DNS</>
            : 'Not set up'}
        </span>
      </div>

      <div className="p-5 flex flex-col gap-5">
        <p className="text-xs text-fg-muted leading-[1.6]">
          Run the panel on your own web address. Use a subdomain like <code className="text-fg font-mono">panel.yourbrand.com</code> —
          a root domain (<code className="font-mono">yourbrand.com</code>) can't hold a CNAME record.
        </p>

        {/* Step 1 — claim the host */}
        <Step n={1} title="Enter your subdomain" done={saved}>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="panel.yourbrand.com"
              disabled={busy}
              className={cn(fieldCls, "flex-1 min-w-[200px]")}
            />
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={busy || !host || host === data?.domain}
              className={cn(btnCls, "bg-brand hover:bg-brand-hover text-white")}
            >
              {save.isPending ? 'Saving…' : saved ? 'Update' : 'Save'}
            </button>
          </div>
        </Step>

        {/* Step 2 — the DNS record */}
        <Step n={2} title="Add this record at your domain registrar" done={verified}>
          <div className={cn("rounded-lg border p-3", saved ? "bg-surface2 border-line" : "bg-surface2/50 border-dashed border-line")}>
            {!saved && (
              <p className="text-[11px] text-fg-subtle mb-2.5">
                <span className="font-semibold text-warning">Example</span> — this is the record you'll add. Save your subdomain to confirm it.
              </p>
            )}
            <div className="grid gap-2.5 sm:grid-cols-[minmax(0,7rem)_minmax(0,9rem)_minmax(0,1fr)]">
              <CopyRow label="Type" value="CNAME" />
              <CopyRow label="Name" value={label} hint="Some registrars want the full host" />
              <CopyRow label="Value" value={data?.cnameTarget ?? '—'} />
            </div>
            <p className="text-[11px] text-fg-subtle mt-2.5 leading-[1.6]">
              Points <code className="font-mono text-fg-muted">{shownHost}</code> at our servers.
              Leave TTL at its default, and don't add an A record — only a CNAME verifies.
            </p>
          </div>
        </Step>

        {/* Step 3 — verify */}
        <Step n={3} title="Verify the record" done={verified}>
          <p className="text-xs text-fg-subtle mb-2">
            DNS changes can take a few minutes to a few hours to spread. Come back and check any time.
          </p>
          <button
            type="button"
            onClick={() => verify.mutate()}
            disabled={busy || !saved}
            className={cn(btnCls, "bg-surface2 border border-line text-fg hover:bg-surface")}
          >
            {verify.isPending ? 'Checking DNS…' : verified ? 'Re-check' : 'Verify now'}
          </button>
        </Step>

        {error && (
          <div className="flex items-start gap-2 text-[13px] text-danger bg-danger-dim border border-danger-border rounded-lg px-3 py-2.5">
            <AlertCircle size={14} className="shrink-0 mt-px" /> {error}
          </div>
        )}
        {notice && !error && (
          <div className="flex items-start gap-2 text-[13px] text-brand-light bg-brand-dim border border-brand-border rounded-lg px-3 py-2.5">
            <CheckCircle size={14} className="shrink-0 mt-px" /> {notice}
          </div>
        )}

        {saved && (
          <button
            type="button"
            onClick={() => remove.mutate()}
            disabled={busy}
            className={cn(btnCls, "self-start flex items-center gap-1.5 text-danger hover:bg-danger-dim -ml-1")}
          >
            <Trash2 size={13} /> Remove domain
          </button>
        )}
      </div>
    </div>
  );
}
