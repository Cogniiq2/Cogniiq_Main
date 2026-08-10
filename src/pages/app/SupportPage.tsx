import { useMemo } from 'react';
import { LifeBuoy, Mail, UserRound } from 'lucide-react';

import { appFocusRing } from '@/components/app/CustomerAppPrimitives';
import { useOrganizationSolutions } from '@/hooks/useOrganizationSolutions';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useSharedCustomerProjects } from '@/hooks/useCustomerProjectsContext';
import { isActiveCustomerProject } from '@/lib/customerPlatform/types';
import { cn } from '@/lib/utils';

// Support.
//
// Personal where the data supports it, honest where it does not. The named contacts are
// the VERIFIED ones the customer project RPC returns — a row only carries a name, role
// and business address when the referenced profile currently holds an internal Cogniiq
// role, so nothing here is a guess at who someone is.
//
// Deliberately absent, because no customer-safe field backs them:
//   - a response time or SLA ("innerhalb von 24 Stunden") — the product stores none, so
//     stating one would be a promise it cannot keep;
//   - live-chat or phone availability — there is no availability record to read;
//   - a ticket form — there is no customer-side ticket write path in this release, and a
//     form that silently goes nowhere is worse than an email address that works.

// The premium shell is mounted once by CustomerPortalBoundary for the whole /app subtree,
// so this page renders content only. Wrapping it in its own shell here would remount the
// sidebar on every navigation and duplicate the portal-access bootstrap.
export function SupportPage() {
  return <SupportContent />;
}

function SupportContent() {
  const { portalSettings } = useOrganizationSolutions();
  const { activeOrganization } = useOrganizations();
  const { projects } = useSharedCustomerProjects();

  const supportContact = portalSettings?.support_contact ?? 'support@cogniiq.de';

  // One entry per distinct verified contact, preferring an active project.
  const contacts = useMemo(() => {
    const seen = new Map<string, { name: string; role: string | null; email: string | null; project: string }>();
    const ordered = [
      ...projects.filter(isActiveCustomerProject),
      ...projects.filter((project) => !isActiveCustomerProject(project)),
    ];
    for (const project of ordered) {
      if (!project.contact_display_name) continue;
      const key = project.contact_business_email ?? project.contact_display_name;
      if (seen.has(key)) continue;
      seen.set(key, {
        name: project.contact_display_name,
        role: project.contact_role_label,
        email: project.contact_business_email,
        project: project.title,
      });
    }
    return [...seen.values()];
  }, [projects]);

  const mailtoSubject = encodeURIComponent(
    activeOrganization ? `Supportanfrage – ${activeOrganization.name}` : 'Supportanfrage',
  );

  return (
    <>
      <header className="mb-8 border-b border-hairline pb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Portal</p>
        <h1 className="mt-2.5 text-[28px] font-semibold leading-[1.12] tracking-[-0.02em] text-gray-950 sm:text-[34px]">
          Wir sind für Sie da
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-gray-600">
          Fragen zu Ihrem Projekt, Ihren Unterlagen oder einer Lösung? Schreiben Sie uns —
          Ihre Anfrage landet direkt bei den Menschen, die Ihr Projekt betreuen.
        </p>
      </header>

      <div className="space-y-9">
        {/* --------------------------------------------- primary contact action */}
        <section
          aria-labelledby="support-primary-heading"
          className="rounded-panel border border-hairline bg-white p-6 shadow-card sm:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <p
                id="support-primary-heading"
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500"
              >
                <LifeBuoy size={13} aria-hidden="true" />
                Direkter Draht
              </p>
              <p className="mt-2.5 break-all text-[19px] font-semibold leading-snug tracking-[-0.015em] text-gray-950">
                {supportContact}
              </p>
              <p className="mt-2.5 max-w-xl text-[13px] leading-6 text-gray-600">
                Beschreiben Sie Ihr Anliegen so konkret wie möglich — Projektname, worum es geht
                und, falls vorhanden, die betroffene Rechnungs- oder Dokumentbezeichnung. Das
                erspart Ihnen eine Rückfrage.
              </p>
            </div>
            <a
              href={`mailto:${supportContact}?subject=${mailtoSubject}`}
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control bg-gray-950 px-5 text-[13.5px] font-semibold text-white',
                'transition-[background-color,transform] duration-fast ease-premium hover:bg-gray-800',
                'active:scale-[0.985] motion-reduce:active:scale-100',
                appFocusRing,
              )}
            >
              <Mail size={15} aria-hidden="true" />
              E-Mail schreiben
            </a>
          </div>
        </section>

        {/* --------------------------------------------- named contacts */}
        {contacts.length ? (
          <section aria-labelledby="support-contacts-heading">
            <h2
              id="support-contacts-heading"
              className="text-[19px] font-semibold tracking-[-0.015em] text-gray-950"
            >
              Ihre Ansprechpartner
            </h2>
            <p className="mt-1.5 text-[13.5px] leading-6 text-gray-600">
              Diese Personen betreuen Ihre Projekte bei Cogniiq.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {contacts.map((contact) => (
                <div
                  key={contact.email ?? contact.name}
                  className="rounded-card border border-hairline bg-white p-5 shadow-card"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-hairline bg-gray-50 text-gray-500">
                      <UserRound size={18} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-[14px] font-semibold leading-snug text-gray-950">
                        {contact.name}
                      </p>
                      {contact.role ? (
                        <p className="mt-0.5 text-[12.5px] text-gray-500">{contact.role}</p>
                      ) : null}
                      <p className="mt-1 break-words text-[11.5px] text-gray-400">{contact.project}</p>
                    </div>
                  </div>
                  {contact.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      className={cn(
                        'mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-700',
                        'transition-colors duration-fast ease-premium hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950',
                        appFocusRing,
                      )}
                    >
                      <Mail size={14} aria-hidden="true" />
                      Nachricht schreiben
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* --------------------------------------------- escalation */}
        <section
          aria-labelledby="support-escalation-heading"
          className="rounded-card border border-hairline bg-gray-50/70 p-6"
        >
          <h2
            id="support-escalation-heading"
            className="text-[15px] font-semibold tracking-tight text-gray-950"
          >
            Wenn etwas dringend ist
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-6 text-gray-600">
            Kommt Ihr Projekt nicht voran oder bleibt eine Rückmeldung aus, schreiben Sie an{' '}
            <a
              href={`mailto:${supportContact}?subject=${encodeURIComponent('Eskalation')}%20${mailtoSubject}`}
              className={cn(
                'rounded font-semibold text-gray-950 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-950',
                appFocusRing,
              )}
            >
              {supportContact}
            </a>{' '}
            mit „Eskalation" im Betreff. Diese Nachrichten werden bei Cogniiq bevorzugt gelesen.
          </p>
        </section>
      </div>
    </>
  );
}

export default SupportPage;
