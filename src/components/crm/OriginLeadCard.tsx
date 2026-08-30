import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Target } from 'lucide-react';

import { Card, StatusBadge, text } from '@/components/dashboard';
import { cn } from '@/lib/utils';
import { loadOriginLead, type OriginLead } from '@/lib/ownerCrm/api';
import { leadStageLabel, leadStageTone } from '@/lib/ownerCrm/catalog';
import { formatDateDe } from '@/lib/ownerFinance/exports';
import type { LeadStage } from '@/lib/ownerCrm/types';

/**
 * "Herkunft" on the customer workspace: the prospect this customer came from,
 * and a way back to the sales history.
 *
 * It shows provenance only. Estimated value, probability and internal sales
 * notes live on the lead page — this card exists so the owner can find that
 * history, not so the customer workspace starts carrying it around.
 *
 * Renders nothing at all when the customer was created directly, which is a
 * perfectly normal way for a customer to exist.
 */
export function OriginLeadCard({ customerId }: { customerId: string }) {
  const [lead, setLead] = useState<OriginLead | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    // A missing origin is not an error condition, and neither is a CRM backend
    // that has not been migrated yet — the card simply does not appear.
    loadOriginLead(customerId)
      .then((r) => { if (active) setLead(r); })
      .catch(() => { if (active) setLead(null); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [customerId]);

  if (!loaded || !lead) return null;

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-gray-950">Herkunft</h3>
        <Target size={14} className="text-[var(--cq-fg-subtle)]" aria-hidden="true" />
      </div>
      <Link
        to={`/admin/finance/leads/${lead.id}`}
        className="group block rounded-[10px] border border-[var(--cq-border-subtle)] px-3 py-2.5 hover:border-[var(--cq-border-strong)]"
      >
        <div className="flex items-start justify-between gap-2">
          <span className={text.bodyStrong}>{lead.display_name}</span>
          <ArrowUpRight size={14} className="mt-0.5 shrink-0 text-[var(--cq-fg-subtle)]" aria-hidden="true" />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <StatusBadge
            label={leadStageLabel[lead.stage as LeadStage] ?? lead.stage}
            tone={leadStageTone[lead.stage as LeadStage] ?? 'neutral'}
          />
          <span className={text.hint}>{lead.activity_count} Einträge im Verlauf</span>
        </div>
        <p className={cn('mt-1', text.hint)}>
          Erfasst am {formatDateDe(lead.created_at)}
          {lead.converted_at ? ` · umgewandelt am ${formatDateDe(lead.converted_at)}` : ''}
          {lead.source ? ` · Quelle: ${lead.source}` : ''}
        </p>
      </Link>
    </Card>
  );
}
