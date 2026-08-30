import { FileSignature, FileText, Plus, Receipt, UserPlus } from 'lucide-react';

import type { CommandItem } from '@/components/dashboard';
import { getSubNavForModule, listModulesForCommands } from '@/pages/admin/internalNavigation';
import { customerDisplayName } from '@/lib/ownerFinance/customerLabels';

/**
 * What ⌘K can reach.
 *
 * Navigation entries are derived from the same module definitions the rail uses, so a
 * destination can never exist in one and not the other — including the owner-only
 * filtering, which is applied here exactly as the rail applies it. Hidden modules
 * (Oura, the standalone task OS) are reachable here on purpose: they left the rail to
 * free a top-level slot, not to become unreachable.
 *
 * Actions are routes, never mutations. "Neuer Kunde" opens the customers workspace with
 * its create dialog; nothing is written from the palette.
 */

export function buildCommandItems(opts: { isOwner: boolean }): CommandItem[] {
  const items: CommandItem[] = [];

  for (const module of listModulesForCommands({ isOwner: opts.isOwner })) {
    const subNav = getSubNavForModule(module.key, { isOwner: opts.isOwner });
    if (subNav.length === 0) {
      items.push({
        id: `nav-${module.key}`,
        label: module.label,
        group: 'Navigation',
        to: module.href,
        icon: module.icon,
        keywords: module.keywords,
      });
      continue;
    }
    for (const group of subNav) {
      for (const item of group.items) {
        items.push({
          id: `nav-${module.key}-${item.key}`,
          label: item.label,
          hint: [module.label, group.label].filter(Boolean).join(' › '),
          group: 'Navigation',
          to: item.href,
          icon: item.icon,
          keywords: module.keywords,
        });
      }
    }
  }

  if (opts.isOwner) {
    items.push(
      { id: 'act-offer', label: 'Neues Angebot erstellen', group: 'Aktionen', to: '/admin/finance/offers/new', icon: FileSignature, keywords: 'angebot offer neu erstellen' },
      { id: 'act-invoice', label: 'Neue Rechnung', hint: 'Öffnet die Rechnungsliste mit dem Composer', group: 'Aktionen', to: '/admin/finance/invoices', icon: FileText, keywords: 'rechnung invoice neu' },
      { id: 'act-customer', label: 'Neuen Kunden anlegen', group: 'Aktionen', to: '/admin/finance/customers', icon: UserPlus, keywords: 'kunde customer neu anlegen' },
      { id: 'act-expense', label: 'Ausgabe erfassen', group: 'Aktionen', to: '/admin/finance/expenses', icon: Receipt, keywords: 'ausgabe beleg kosten' },
    );
  }
  items.push({
    id: 'act-client',
    label: 'Portalzugang anlegen',
    hint: 'Neue Organisation im Kundenportal',
    group: 'Aktionen',
    to: '/admin/clients/new',
    icon: Plus,
    keywords: 'portal organisation client neu',
  });

  return items;
}

/**
 * Customers as palette results.
 *
 * A real read against owner_list_customers, run once when the palette is first opened —
 * not a fabricated index and not a per-keystroke query. A non-owner has no access, so
 * the read fails and the palette silently keeps navigation and actions only.
 */
export async function loadCustomerCommandItems(): Promise<CommandItem[]> {
  // Imported here rather than at module scope: this module is pulled in by the workspace
  // shell, and a static import would construct the Supabase client (and demand its
  // environment) on every /admin render, including the ones that never open ⌘K.
  const [{ loadActiveEntity }, { loadCustomers }] = await Promise.all([
    import('@/lib/ownerFinance/api'),
    import('@/lib/ownerFinance/customersApi'),
  ]);
  const entity = await loadActiveEntity();
  if (!entity) return [];
  const customers = await loadCustomers(entity.id);
  return customers
    .filter((customer) => customer.status !== 'archived')
    .map((customer) => ({
      id: `cust-${customer.id}`,
      label: customerDisplayName(customer),
      hint: [customer.city, customer.email].filter(Boolean).join(' · ') || 'Kunde',
      group: 'Kunden',
      to: `/admin/finance/customers/${customer.id}`,
      keywords: [customer.contact_name, customer.email, customer.phone, customer.city].filter(Boolean).join(' '),
    }));
}
