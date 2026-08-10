import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import {
  Building2, CreditCard, FileText, Headphones, HeartPulse, LayoutGrid, Settings, UserRound, Wallet,
} from 'lucide-react';

import { PremiumShell, type ShellNavGroup } from '../../src/components/shell/PremiumShell';
import '../../src/index.css';

/**
 * Browser QA harness for the premium dashboard shell.
 *
 * NOT part of the application bundle and NOT reachable from any route: it is served only by the
 * dev server that `.github/scripts/qa-dashboard-shell.mjs` starts, so real Tailwind breakpoints,
 * real layout and real scrollbars can be measured at real viewport sizes — none of which jsdom
 * can do. The navigation models below mirror what the two shells actually build so the QA run
 * exercises the same widths, the same long German labels and the same grouping.
 */

const params = new URLSearchParams(window.location.search);
const surface = params.get('surface') === 'owner' ? 'owner' : 'customer';
const activePath = params.get('active') ?? (surface === 'owner' ? '/admin/finance/invoices' : '/app/documents');

const ownerGroups: ShellNavGroup[] = [
  {
    id: 'areas',
    label: 'Bereiche',
    items: [
      { key: 'tasks', label: 'Task Dashboard', href: '/admin', icon: LayoutGrid, active: false },
      { key: 'oura', label: 'Oura Analytics', href: '/admin/oura-analytics', icon: HeartPulse, active: false },
      { key: 'crm', label: 'Client CRM', href: '/admin/clients', icon: Building2, active: false },
      { key: 'finance', label: 'Finance & Steuern', href: '/admin/finance/overview', icon: Wallet, active: true },
    ],
  },
  {
    id: 'module',
    label: 'Finance & Steuern',
    items: [
      { key: 'overview', label: 'Übersicht', href: '/admin/finance/overview', icon: LayoutGrid, active: false },
      { key: 'customers', label: 'Kunden & Aufgaben', href: '/admin/finance/customers', icon: UserRound, active: false },
      { key: 'invoices', label: 'Rechnungen', href: '/admin/finance/invoices', icon: FileText, active: true },
      { key: 'expenses', label: 'Ausgaben', href: '/admin/finance/expenses', icon: CreditCard, active: false },
      { key: 'settings', label: 'Einstellungen', href: '/admin/finance/settings', icon: Settings, active: false },
    ],
  },
];

const customerGroups: ShellNavGroup[] = [
  {
    id: 'portal',
    label: 'Portal',
    items: [
      { key: '/app', label: 'Übersicht', href: '/app', icon: LayoutGrid, active: false },
      { key: '/app/documents', label: 'Dokumente', href: '/app/documents', icon: FileText, active: true },
      { key: '/app/billing', label: 'Abrechnung', href: '/app/billing', icon: CreditCard, active: false },
      { key: '/app/solutions', label: 'Meine Lösungen', href: '/app/solutions', icon: Headphones, active: false },
      { key: '/app/support', label: 'Support', href: '/app/support', icon: UserRound, active: false },
      { key: '/app/settings', label: 'Einstellungen', href: '/app/settings', icon: Settings, active: false },
    ],
  },
  {
    id: 'svh',
    label: 'Vereinsverwaltung Heinersreuth',
    items: [
      // Deliberately the longest German labels in the product — the truncation check depends on them.
      { key: 'members', label: 'Mitgliederverwaltung', href: '/app/solutions/svh/members', icon: UserRound, active: false },
      { key: 'applications', label: 'Aufnahmeanträge prüfen', href: '/app/solutions/svh/applications', icon: FileText, active: false },
      { key: 'facilities', label: 'Sportanlagenverwaltung', href: '/app/solutions/svh/facilities', icon: Building2, active: false },
    ],
  },
];

function Harness() {
  const owner = surface === 'owner';
  return (
    <MemoryRouter initialEntries={[activePath]}>
      <PremiumShell
        brandTitle="Cogniiq"
        brandSubtitle={owner ? 'Finance & Steuern' : 'Kundenbereich'}
        brandHref={owner ? undefined : '/'}
        groups={owner ? ownerGroups : customerGroups}
        navLabel={owner ? 'Interne Navigation' : 'Kundenbereich Navigation'}
        indicatorId={owner ? 'owner-shell' : 'customer-shell'}
        storageKey={`qa.${surface}.collapsed`}
        contextSlot={
          owner ? undefined : (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <p className="block text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">Organisation</p>
              <select
                aria-label="Organisation auswählen"
                data-testid="customer-organization-select"
                className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700"
              >
                <option>SV Heinersreuth</option>
                <option>Pankofer Fahrzeugtechnik GmbH</option>
              </select>
            </div>
          )
        }
        identity={{
          displayName: 'Maria Musterfrau',
          email: 'maria.musterfrau@sv-heinersreuth.de',
          organizationName: owner ? 'Cogniiq Workspace' : 'SV Heinersreuth',
          menuItems: owner
            ? undefined
            : [
                { key: 'settings', label: 'Profil & Konto', href: '/app/settings', icon: Settings },
                { key: 'website', label: 'Zur Website', href: '/', icon: Building2 },
              ],
          onSignOut: () => {},
        }}
      >
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Inhaltsbereich</h1>
          <p className="text-sm text-gray-600">
            Dieser Block dient ausschließlich der Layoutprüfung: er misst, ob der Inhalt korrekt neben
            der Navigation liegt und nicht darunter verschwindet.
          </p>
          <div data-testid="qa-content-block" className="h-64 rounded-2xl border border-gray-200 bg-white" />
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <tbody>
              {['Rechnung', 'Angebot', 'Vertrag'].map((row) => (
                <tr key={row}>
                  <td className="border-b border-gray-100 py-3">{row}</td>
                  <td className="border-b border-gray-100 py-3">Sonderzahlungsvereinbarung</td>
                  <td className="border-b border-gray-100 py-3">2026-08-10</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PremiumShell>
    </MemoryRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>
);
