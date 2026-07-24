import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../constants/Roles';
import { getUserRole } from '../utils/Auth';
import { cn } from '../lib/utils';
import { PageHeader } from '../components/ui/PageHeader';
import WhatsAppReports from './WhatsAppReports';
import AllCampaigns from './AllCampaigns';

// Merged Reports page: "My Campaigns" (own) + "All Campaigns" (org-wide) as
// tabs, so users aren't confused by two separate sidebar links. The All tab is
// gated to ADMIN/RESELLER — same roles the old /all-campaign nav item allowed.
export default function Reports() {
  const navigate = useNavigate();
  const role = getUserRole();
  const canSeeAll = role === UserRole.ADMIN || role === UserRole.RESELLER;
  const [tab, setTab] = useState<'mine' | 'all'>('mine');

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="WhatsApp Reports"
        action={
          <button onClick={() => navigate('/send-whatsapp')} className="flex items-center gap-[7px] px-4 py-[9px] bg-brand text-white font-semibold text-[13px] border-none rounded-lg cursor-pointer">
            <Plus size={15} /> New Campaign
          </button>
        }
      />

      {canSeeAll && (
        <div className="flex gap-1 bg-surface border border-line rounded-[10px] p-1 w-fit">
          {([['mine', 'My Campaigns'], ['all', 'All Campaigns']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "px-4 py-[7px] rounded-[7px] text-[13px] font-semibold cursor-pointer border-none transition-colors",
                tab === key ? "bg-brand text-white" : "bg-transparent text-fg-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {canSeeAll && tab === 'all' ? <AllCampaigns embedded /> : <WhatsAppReports embedded />}
    </div>
  );
}
