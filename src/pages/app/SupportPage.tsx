import { LifeBuoy, Mail } from 'lucide-react';

import { CustomerAppShell } from '@/components/app/CustomerAppShell';
import { AppCard, AppPageHeader, AppSection } from '@/components/app/CustomerAppPrimitives';
import { useOrganizationSolutions } from '@/hooks/useOrganizationSolutions';

export function SupportPage() {
  return (
    <CustomerAppShell>
      <SupportContent />
    </CustomerAppShell>
  );
}

function SupportContent() {
  const { portalSettings } = useOrganizationSolutions();
  const supportContact = portalSettings?.support_contact ?? 'support@cogniiq.de';

  return (
    <>
      <AppPageHeader eyebrow="Portal" title="Support" description="Fragen zu Ihrem Cogniiq-Portal oder Ihren Lösungen? Wir helfen gerne." />
      <AppSection eyebrow="Kontakt" title="So erreichen Sie uns">
        <div className="grid gap-4 md:grid-cols-2">
          <AppCard>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600">
              <Mail size={18} aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-gray-950">E-Mail</p>
            <a href={`mailto:${supportContact}`} className="mt-2 inline-block text-[15px] font-medium text-gray-700 underline decoration-gray-300 underline-offset-4 hover:text-gray-950">
              {supportContact}
            </a>
          </AppCard>
          <AppCard>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600">
              <LifeBuoy size={18} aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-gray-950">Hilfe</p>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
              Beschreiben Sie Ihr Anliegen möglichst konkret. Unser Team meldet sich zeitnah zurück.
            </p>
          </AppCard>
        </div>
      </AppSection>
    </>
  );
}
