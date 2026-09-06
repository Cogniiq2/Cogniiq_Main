import { Link } from 'react-router-dom';

import { PrivateBarShell } from './PrivateBarShell';
import { strings } from '../../private-bar/strings';

/**
 * The return surface for an abandoned payment.
 *
 * Restrained by design: no alarm colour, no error iconography. The only way out
 * leads back into the bar — never into Cogniiq.
 */
export function PrivateBarCancelPage() {
  return (
    <PrivateBarShell title={strings.documentTitles.cancel}>
      <div className="pb-status">
        <p className="pb-status__mark pb-enter pb-enter--1">{strings.brand.wordmark}</p>
        <p className="pb-status__product pb-enter pb-enter--1">{strings.brand.product}</p>

        <h1 className="pb-status__heading pb-enter pb-enter--2">{strings.cancel.heading}</h1>
        <p className="pb-status__body pb-enter pb-enter--3">{strings.cancel.body}</p>

        <Link className="pb-link pb-enter pb-enter--4" to="/private-bar">
          {strings.cancel.back}
        </Link>
      </div>
    </PrivateBarShell>
  );
}
