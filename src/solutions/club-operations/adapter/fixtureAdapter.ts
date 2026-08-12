// Fixture adapter — the only adapter implementation in this phase.
//
// It reads from local fixture arrays. It performs no network request, opens no client, reads no
// environment variable and accepts no credential. Replacing it with a gateway adapter later is a
// one-line change at the call site, because both satisfy `ClubOperationsAdapter`.
//
// Scenarios make every UI state reachable deterministically, which is what lets the states be
// tested and inspected without a server:
//
//   populated — the full fixture set
//   empty     — a successful response that happens to contain nothing
//   error     — a typed failure, for the error state
//   loading   — never settles, for inspecting the loading state
//
// `latencyMs` defaults to 0 so tests resolve on the microtask queue rather than on timers.

import { filterBookings } from '../filtering';
import { fixtureBookings } from '../fixtures/bookings';
import { buildOverview } from '../fixtures/overview';
import type { BookingPage, BookingQuery, OverviewQuery, OverviewSnapshot } from '../types';
import {
  ClubOperationsError,
  type ClubOperationsAdapter,
  type ClubOperationsErrorCode,
} from './ClubOperationsAdapter';

export type FixtureScenario = 'populated' | 'empty' | 'error' | 'loading';

export interface FixtureAdapterOptions {
  scenario?: FixtureScenario;
  /** Artificial delay in ms. 0 keeps tests off the timer queue. */
  latencyMs?: number;
  /** Which failure the `error` scenario produces. */
  errorCode?: ClubOperationsErrorCode;
}

function settle<T>(value: T, latencyMs: number): Promise<T> {
  if (latencyMs <= 0) return Promise.resolve(value);
  return new Promise((resolve) => setTimeout(() => resolve(value), latencyMs));
}

export function createFixtureAdapter(options: FixtureAdapterOptions = {}): ClubOperationsAdapter {
  const { scenario = 'populated', latencyMs = 0, errorCode = 'unavailable' } = options;

  function guard<T>(produce: () => T): Promise<T> {
    if (scenario === 'loading') return new Promise<T>(() => {});
    if (scenario === 'error') {
      return Promise.reject(
        new ClubOperationsError(errorCode, `Fixture-Szenario "${scenario}" (${errorCode})`),
      );
    }
    return settle(produce(), latencyMs);
  }

  const source = () => (scenario === 'empty' ? [] : fixtureBookings);

  return {
    id: `fixture:${scenario}`,

    getOverview(query: OverviewQuery): Promise<OverviewSnapshot> {
      return guard(() => buildOverview(source(), query.period));
    },

    listBookings(query: BookingQuery): Promise<BookingPage> {
      return guard(() => {
        const bookings = filterBookings(source(), query);
        return { bookings, total: bookings.length };
      });
    },
  };
}
