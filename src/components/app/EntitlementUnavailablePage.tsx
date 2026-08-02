import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

// Shown instead of a silent redirect when a customer opens a product surface their
// organization is not entitled to (bookmarked link, shared URL, entitlement not yet
// provisioned). A bare <Navigate> reads as a broken link; this explains the state and
// offers a real way forward. This is UX only — access itself is denied by RLS in the
// database and by the route guard, never by this page.
export function EntitlementUnavailablePage({
  title = 'Dieser Bereich ist noch nicht freigeschaltet',
  description = 'Ihre Organisation hat für diesen Bereich aktuell keine aktive Lösung. Sobald Cogniiq die Lösung für Sie eingerichtet hat, erscheint sie automatisch in Ihrer Navigation.',
  supportEmail,
}: {
  title?: string;
  description?: string;
  supportEmail?: string | null;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-md rounded-card border border-gray-200 bg-white p-7 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <Lock size={18} aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-lg font-semibold text-gray-950">{title}</h1>
        <p className="mb-6 text-sm leading-6 text-gray-600">{description}</p>
        <div className="flex flex-col gap-2">
          <Link
            to="/app"
            className="inline-flex items-center justify-center rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2"
          >
            Zur Übersicht
          </Link>
          {supportEmail ? (
            <a
              href={`mailto:${supportEmail}`}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950/25 focus-visible:ring-offset-2"
            >
              Frage an Cogniiq senden
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default EntitlementUnavailablePage;
