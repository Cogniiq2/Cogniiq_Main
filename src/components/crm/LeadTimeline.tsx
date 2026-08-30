import {
  ArrowRightLeft, CalendarClock, CheckCircle2, FileSignature, Mail, MessageSquare,
  Phone, Plug, StickyNote, Trophy, Users, XCircle, type LucideIcon,
} from 'lucide-react';

import { border, text } from '@/components/dashboard';
import { cn } from '@/lib/utils';
import { activityChannelLabel } from '@/lib/ownerCrm/catalog';
import { formatLocalDateTimeDe } from '@/lib/ownerCrm/format';
import type { LeadActivity } from '@/lib/ownerCrm/types';

/**
 * The sales timeline: manually logged contact and the system events the CRM
 * records for itself.
 *
 * It renders what is stored and nothing else. There is no inferred entry, no
 * "probably contacted" and no filler for quiet periods — an empty timeline is an
 * honest answer.
 */

const ICONS: Record<string, LucideIcon> = {
  lead_created: Users,
  lead_updated: StickyNote,
  lead_archived: XCircle,
  lead_restored: CheckCircle2,
  stage_changed: ArrowRightLeft,
  lead_won: Trophy,
  lead_lost: XCircle,
  lead_converted: Users,
  note_added: StickyNote,
  contact_logged: MessageSquare,
  follow_up_created: CalendarClock,
  follow_up_updated: CalendarClock,
  follow_up_completed: CheckCircle2,
  follow_up_cancelled: XCircle,
  integration_check_updated: Plug,
  task_created: CheckCircle2,
  task_completed: CheckCircle2,
  task_cancelled: XCircle,
  task_deleted: XCircle,
  task_status_changed: CheckCircle2,
  offer_created: FileSignature,
};

const CHANNEL_ICONS: Record<string, LucideIcon> = {
  call: Phone, email: Mail, meeting: Users, note: StickyNote, other: MessageSquare,
};

function iconFor(activity: LeadActivity): LucideIcon {
  if (activity.channel && CHANNEL_ICONS[activity.channel]) return CHANNEL_ICONS[activity.channel];
  return ICONS[activity.event_type] ?? MessageSquare;
}

/** Events that changed the deal, rather than describing it. */
const EMPHASISED = new Set(['lead_won', 'lead_lost', 'lead_converted', 'stage_changed']);

export function LeadTimeline({ activity }: { activity: LeadActivity[] }) {
  if (activity.length === 0) {
    return <p className={text.hint}>Noch keine Aktivität erfasst.</p>;
  }

  return (
    <ol className="space-y-0">
      {activity.map((entry, index) => {
        const Icon = iconFor(entry);
        const last = index === activity.length - 1;
        return (
          <li key={entry.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  border.hairline,
                  EMPHASISED.has(entry.event_type)
                    ? 'bg-[var(--cq-fg)] text-[var(--cq-surface)]'
                    : 'bg-[var(--cq-surface)] text-[var(--cq-fg-subtle)]',
                )}
              >
                <Icon size={12} aria-hidden="true" />
              </span>
              {!last ? <span className="w-px flex-1 bg-[var(--cq-border-subtle)]" aria-hidden="true" /> : null}
            </div>
            <div className={cn('min-w-0 flex-1', last ? 'pb-0' : 'pb-4')}>
              <p className={cn('break-words', EMPHASISED.has(entry.event_type) ? text.bodyStrong : 'text-[13px] leading-5')}>
                {entry.summary}
              </p>
              <p className={text.hint}>
                {formatLocalDateTimeDe(entry.occurred_at)}
                {entry.channel ? ` · ${activityChannelLabel[entry.channel]}` : ''}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
