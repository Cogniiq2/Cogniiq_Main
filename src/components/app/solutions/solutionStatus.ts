import type { LifecycleTone } from '@/components/app/customerPortalModel';
import type { OrganizationSolutionStatus } from '@/lib/clientPlatform/types';

export function solutionStatusDisplay(status: OrganizationSolutionStatus): {
  label: string;
  tone: LifecycleTone;
} {
  switch (status) {
    case 'active':
      return { label: 'Aktiv', tone: 'success' };
    case 'provisioning':
      return { label: 'Wird eingerichtet', tone: 'working' };
    case 'paused':
      return { label: 'Pausiert', tone: 'attention' };
    case 'disabled':
      return { label: 'Deaktiviert', tone: 'neutral' };
    default:
      return { label: status, tone: 'neutral' };
  }
}
