/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { Place, Position, Trip, TripId, TripSummary, VersionedTrip } from './model';
import { newMutationId, type Flush, type FlushOutcome } from './sync';
import { parseTrip } from './validate';

/**
 * The only file in `trip/` that mentions HTTP. Everything above it works in
 * domain types and outcome unions, so no component ever reads a status code.
 */

const BASE = '/build/api';

export type ReadResult<T> = { ok: true; value: T } | { ok: false; signedOut: boolean };

/**
 * A lapsed Cloudflare Access session and a dead network are the same event to
 * `fetch`. Access redirects a gated request cross-origin to
 * cloudflareaccess.com, CORS forbids reading that response, and the browser
 * reports a bare TypeError, byte for byte what it reports with no connection at
 * all. Verified in a browser against the live site on 2026-09-09.
 *
 * So the two are told apart afterwards, by asking for something ungated. If
 * that arrives, the network is fine and the session is what lapsed.
 */
const probeReachable = async (): Promise<boolean> => {
  try {
    await fetch('/favicon.ico', { cache: 'no-store', credentials: 'same-origin' });
    return true;
  } catch {
    return false;
  }
};

const call = async (path: string, init: RequestInit = {}): Promise<Response | null> => {
  try {
    return await fetch(`${BASE}${path}`, { credentials: 'same-origin', ...init });
  } catch {
    return null;
  }
};

const readFailed = async (response: Response | null): Promise<{ ok: false; signedOut: boolean }> => ({
  ok: false,
  signedOut: response === null ? await probeReachable() : response.status === 403
});

const versioned = (body: unknown): VersionedTrip | null => {
  if (typeof body !== 'object' || body === null) return null;
  const { trip, version } = body as { trip?: unknown; version?: unknown };
  const parsed = parseTrip(trip);
  return parsed.ok && typeof version === 'number' ? { trip: parsed.value, version } : null;
};

/**
 * Shared by both writes. A 5xx is `unreachable` rather than `rejected` on
 * purpose: `rememberMutation` in the Worker does not store those, so the same
 * frozen payload under the same id is exactly what should be sent again.
 */
const writeOutcome = async (response: Response | null, expect: number): Promise<FlushOutcome> => {
  if (response === null) {
    return (await probeReachable()) ? { kind: 'signedOut' } : { kind: 'unreachable' };
  }
  if (response.status === 403) return { kind: 'signedOut' };
  if (response.status >= 500) return { kind: 'unreachable' };

  const body = await response.json().catch(() => null) as unknown;

  if (response.status === expect) {
    const server = versioned(body);
    return server === null
      ? { kind: 'rejected', reason: 'the server sent back a document this app cannot read' }
      : { kind: 'applied', server };
  }

  if (response.status === 409) {
    const server = versioned(body);
    if (server !== null) return { kind: 'stale', server };
  }

  const { error, detail } = (body ?? {}) as { error?: string; detail?: string };
  return { kind: 'rejected', reason: detail ?? error ?? `unexpected status ${response.status}` };
};

export const listTrips = async (): Promise<ReadResult<TripSummary[]>> => {
  const response = await call('/trips');
  if (response === null || !response.ok) return readFailed(response);
  const body = await response.json().catch(() => null) as { trips?: TripSummary[] } | null;
  return { ok: true, value: body?.trips ?? [] };
};

export const fetchTrip = async (id: TripId): Promise<ReadResult<VersionedTrip> & { missing?: boolean }> => {
  const response = await call(`/trips/${encodeURIComponent(id)}`);
  if (response !== null && response.status === 404) return { ok: false, signedOut: false, missing: true };
  if (response === null || !response.ok) return readFailed(response);
  const server = versioned(await response.json().catch(() => null));
  return server === null ? { ok: false, signedOut: false } : { ok: true, value: server };
};

export const createTrip = async (trip: Trip): Promise<FlushOutcome> =>
  writeOutcome(
    await call('/trips', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-mutation-id': newMutationId() },
      body: JSON.stringify(trip)
    }),
    201
  );

export const sendFlush = async (id: TripId, flush: Flush): Promise<FlushOutcome> =>
  writeOutcome(
    await call(`/trips/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'if-match': `"${flush.ifMatch}"`,
        'x-mutation-id': flush.mutationId
      },
      body: flush.body
    }),
    200
  );

export const archiveTrip = async (id: TripId): Promise<'archived' | 'signedOut' | 'failed'> => {
  const response = await call(`/trips/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { 'x-mutation-id': newMutationId() }
  });
  if (response === null) return (await probeReachable()) ? 'signedOut' : 'failed';
  if (response.status === 403) return 'signedOut';
  return response.status === 204 ? 'archived' : 'failed';
};

export const geocode = async (query: string, near: Position | null): Promise<ReadResult<Place[]>> => {
  const params = new URLSearchParams({ q: query });
  if (near !== null) params.set('near', `${near[0]},${near[1]}`);
  const response = await call(`/geocode?${params.toString()}`);
  if (response === null || !response.ok) return readFailed(response);
  const body = await response.json().catch(() => null) as { places?: Place[] } | null;
  return { ok: true, value: body?.places ?? [] };
};
