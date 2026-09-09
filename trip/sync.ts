/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { Trip, VersionedTrip } from './model';
import { applyAll, type TripOp } from './ops';
import { parseTrip } from './validate';

/**
 * The sync policy, as a pure function. No React, no fetch, no timers, so the
 * one part of Phase 2 that is genuinely hard to get right is also the part
 * covered by unit tests rather than by clicking.
 *
 * The browser holds `base`, the last document the server confirmed, and `log`,
 * the edits made since. It renders `applyAll(base.trip, log)`. The server writes
 * `base`, the person writes `log`, and there is no third mutable document for
 * them to fight over. A 409 is then two assignments rather than a dialog:
 * `base` becomes the server's document and `log` replays on top of it.
 */

export type MutationId = string & { readonly __brand: 'MutationId' };

/** The only producer, so an id can never be typed by hand or reused by accident. */
export const newMutationId = (): MutationId => crypto.randomUUID() as MutationId;

/**
 * A frozen attempt. The id and the bytes are minted together and neither can
 * change, so "same id, same payload" is structurally true rather than a rule
 * somebody has to remember.
 *
 * That rule is the whole retry policy, and it is not the one the header's name
 * suggests. `rememberMutation` in `worker/cache.ts` stores every response below
 * 500, the 409 included, and replays it for 24 hours. So reusing an id after a
 * conflict replays that conflict until the KV entry expires. Reuse is correct
 * only while the payload is unchanged, which is exactly when the Worker never
 * committed to an answer.
 */
export interface Flush {
  readonly mutationId: MutationId;
  readonly body: string;
  readonly ifMatch: number;
  /** How many ops of the log this attempt covers, so a success drops exactly those. */
  readonly covers: number;
}

export type SyncState =
  | { kind: 'idle' }
  | { kind: 'saving'; flush: Flush }
  | { kind: 'retrying'; flush: Flush; attempt: number }
  /** The Access session lapsed. Only a sign-in fixes this, so retrying is pointless. */
  | { kind: 'signedOut' }
  /** The document the Worker refuses. Our bug, and the log is kept so nothing is lost. */
  | { kind: 'blocked'; reason: string };

export interface TripState {
  base: VersionedTrip;
  log: readonly TripOp[];
  sync: SyncState;
}

/**
 * What a flush attempt came back as. `unreachable` and `signedOut` are both a
 * thrown fetch: a lapsed Access session redirects cross-origin to
 * cloudflareaccess.com, CORS blocks reading it, and the browser reports the
 * same bare TypeError it reports when offline. Verified in a browser against
 * the live site on 2026-09-09. The two are told apart by a probe against an
 * ungated same-origin path, not by anything on the failed response.
 */
export type FlushOutcome =
  | { kind: 'applied'; server: VersionedTrip }
  | { kind: 'stale'; server: VersionedTrip }
  | { kind: 'unreachable' }
  | { kind: 'signedOut' }
  | { kind: 'rejected'; reason: string };

/**
 * Freezes the current log into an attempt, or returns null when there is
 * nothing to send. Runs `parseTrip` on the candidate document first: the client
 * and the Worker share that validator, so this is the server's own decision
 * taken locally, and a 422 becomes a local error with a field path instead of a
 * round trip and a mystery.
 */
export const planFlush = (state: TripState): Flush | { error: string } | null => {
  if (state.log.length === 0) return null;

  const parsed = parseTrip(applyAll(state.base.trip, state.log));
  if (!parsed.ok) return { error: parsed.error };

  return Object.freeze({
    mutationId: newMutationId(),
    body: JSON.stringify(parsed.value),
    ifMatch: state.base.version,
    covers: state.log.length
  });
};

const attemptsSoFar = (sync: SyncState): number => (sync.kind === 'retrying' ? sync.attempt : 0);

/** The single place an outcome moves `base`, `log` and the mutation id together. */
export const applyOutcome = (state: TripState, flush: Flush, outcome: FlushOutcome): TripState => {
  switch (outcome.kind) {
    case 'applied':
      return { base: outcome.server, log: state.log.slice(flush.covers), sync: { kind: 'idle' } };

    case 'stale':
      // A 409 means the write never landed, so the whole log survives, this
      // flush's ops included, and the next attempt is a different payload
      // under a different id.
      return { base: outcome.server, log: state.log, sync: { kind: 'idle' } };

    case 'unreachable':
      // The same `Flush`, so the same id over the same bytes. The Worker
      // remembers nothing it has not answered, so the retry either replays the
      // response we lost or applies for the first time.
      return { ...state, sync: { kind: 'retrying', flush, attempt: attemptsSoFar(state.sync) + 1 } };

    case 'signedOut':
      return { ...state, sync: { kind: 'signedOut' } };

    case 'rejected':
      return { ...state, sync: { kind: 'blocked', reason: outcome.reason } };
  }
};

export const viewOf = (state: TripState): Trip => applyAll(state.base.trip, state.log);

export const hasUnsavedWork = (state: TripState): boolean => state.log.length > 0;
