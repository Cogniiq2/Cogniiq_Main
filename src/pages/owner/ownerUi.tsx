import { type BadgeTone } from '@/components/dashboard';

// Owner-finance status-tone maps over the shared badge palette. The finance pages render inside the
// unified InternalWorkspaceLayout shell (at /admin/finance/*), so this module no longer owns a shell,
// header or navigation — only these domain tone maps remain.

// Owner-domain status tones mapped onto the shared badge palette.
export const invoiceStatusTone: Record<string, BadgeTone> = {
  draft: 'neutral', issued: 'info', partially_paid: 'warning', paid: 'success',
  overdue: 'danger', void: 'neutral', cancelled: 'neutral', credited: 'neutral',
};

export const expenseReviewTone: Record<string, BadgeTone> = {
  reviewed: 'success', pending: 'warning', needs_info: 'warning',
};

export const paymentStatusTone: Record<string, BadgeTone> = {
  unpaid: 'neutral', partially_paid: 'warning', paid: 'success', void: 'neutral',
};

export const lifecycleTone: Record<string, BadgeTone> = {
  lead: 'neutral', qualified: 'info', active: 'success', paused: 'warning', churned: 'danger', archived: 'neutral',
};
