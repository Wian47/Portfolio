/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { describe, expect, it } from 'vitest';
import { createTrip } from './ids';
import type { DayId, StopId, Trip, VersionedTrip } from './model';
import type { TripOp } from './ops';
import {
  applyOutcome, hasUnsavedWork, planFlush, viewOf,
  type Flush, type TripState
} from './sync';
import { parseTrip } from './validate';

const stopOp = (id: string, dayId: DayId): TripOp => ({
  kind: 'stop.add',
  id: id as StopId,
  slot: { dayId, after: null, before: null },
  place: { name: id, at: [18.4172, -33.9288] },
  stopKind: 'overnight'
});

const seed = (version = 3): TripState => {
  const trip = createTrip('Cape Town to Oudtshoorn');
  return {
    base: { trip, version },
    log: [
      stopOp('cape-town', trip.days[0].id),
      { kind: 'trip.patch', patch: { subtitle: 'the long way' } }
    ],
    sync: { kind: 'idle' }
  };
};

/** Narrows the three answers `planFlush` can give down to the one a test wants. */
const planned = (state: TripState): Flush => {
  const flush = planFlush(state);
  if (flush === null || 'error' in flush) throw new Error(`expected a flush, got ${JSON.stringify(flush)}`);
  return flush;
};

/** What the Worker sends back, `updatedAt` stamped by it rather than by us. */
const serverAnswer = (state: TripState, version: number): VersionedTrip => ({
  trip: { ...viewOf(state), updatedAt: '2026-09-09T12:00:00Z' as Trip['updatedAt'] },
  version
});

describe('planFlush', () => {
  it('has nothing to send with an empty log', () => {
    expect(planFlush({ ...seed(), log: [] })).toBe(null);
  });

  it('carries the base version, the op count and the folded document', () => {
    const state = seed();
    const flush = planned(state);
    expect(flush.ifMatch).toBe(3);
    expect(flush.covers).toBe(2);
    expect(JSON.parse(flush.body)).toEqual(JSON.parse(JSON.stringify(viewOf(state))));
  });

  it('freezes the id and the bytes together', () => {
    expect(Object.isFrozen(planned(seed()))).toBe(true);
  });

  it('mints a new id for every attempt, because the payload is a new one', () => {
    const state = seed();
    expect(planned(state).mutationId).not.toBe(planned(state).mutationId);
  });

  it('refuses a document parseTrip would refuse, before it is sent', () => {
    const state: TripState = {
      ...seed(),
      log: [{ kind: 'trip.patch', patch: { title: '   ' } }]
    };
    const flush = planFlush(state);
    expect(flush).not.toBe(null);
    if (flush !== null && 'error' in flush) expect(flush.error).toContain('title');
    else expect.unreachable('a blank title should not be sendable');
  });

  it('refuses by the same validator the Worker writes with, not an approximation', () => {
    const state: TripState = {
      ...seed(),
      log: [{ kind: 'trip.patch', patch: { title: '   ' } }]
    };
    expect(parseTrip(viewOf(state)).ok).toBe(false);
  });
});

describe('applyOutcome', () => {
  it('applied adopts the server document and drops exactly the ops it covered', () => {
    const state = seed();
    const flush = planned(state);
    const kept = stopOp('barrydale', state.base.trip.days[0].id);
    const later: TripState = { ...state, log: [...state.log, kept] };
    const server = serverAnswer(state, 4);

    const next = applyOutcome(later, flush, { kind: 'applied', server });
    expect(next.base).toBe(server);
    expect(next.log).toEqual([kept]);
    expect(next.sync).toEqual({ kind: 'idle' });
  });

  it('stale adopts the server document and keeps the whole log to replay', () => {
    const state = seed();
    const flush = planned(state);
    const server: VersionedTrip = { trip: createTrip('Written by the other device'), version: 9 };

    const next = applyOutcome(state, flush, { kind: 'stale', server });
    expect(next.base).toBe(server);
    expect(next.log).toEqual(state.log);
    expect(hasUnsavedWork(next)).toBe(true);
  });

  it('stale flushes again under a new id, because the conflict is cached against the old one', () => {
    const state = seed();
    const flush = planned(state);
    const server: VersionedTrip = { trip: createTrip('Written by the other device'), version: 9 };

    const next = applyOutcome(state, flush, { kind: 'stale', server });
    const retry = planned(next);
    expect(retry.mutationId).not.toBe(flush.mutationId);
    expect(retry.ifMatch).toBe(9);
    expect(retry.body).not.toBe(flush.body);
  });

  it('unreachable changes nothing and keeps the same id over the same bytes', () => {
    const state = seed();
    const flush = planned(state);

    const next = applyOutcome(state, flush, { kind: 'unreachable' });
    expect(next.base).toBe(state.base);
    expect(next.log).toBe(state.log);
    expect(next.sync).toEqual({ kind: 'retrying', flush, attempt: 1 });
    if (next.sync.kind === 'retrying') {
      expect(next.sync.flush.mutationId).toBe(flush.mutationId);
      expect(next.sync.flush.body).toBe(flush.body);
    }
  });

  it('counts the attempts a retry has already cost', () => {
    const state = seed();
    const flush = planned(state);
    const once = applyOutcome(state, flush, { kind: 'unreachable' });
    const twice = applyOutcome(once, flush, { kind: 'unreachable' });
    expect(twice.sync).toEqual({ kind: 'retrying', flush, attempt: 2 });
  });

  it('signedOut changes nothing, because only a sign-in helps', () => {
    const state = seed();
    const next = applyOutcome(state, planned(state), { kind: 'signedOut' });
    expect(next.base).toBe(state.base);
    expect(next.log).toBe(state.log);
    expect(next.sync).toEqual({ kind: 'signedOut' });
  });

  it('rejected changes nothing and keeps the reason where a person can read it', () => {
    const state = seed();
    const next = applyOutcome(state, planned(state), { kind: 'rejected', reason: 'invalid_trip: title: cannot be blank' });
    expect(next.base).toBe(state.base);
    expect(next.log).toBe(state.log);
    expect(next.sync).toEqual({ kind: 'blocked', reason: 'invalid_trip: title: cannot be blank' });
  });
});

describe('viewOf', () => {
  it('renders the base with the log folded on top', () => {
    const state = seed();
    const view = viewOf(state);
    expect(view.stops.map((s) => s.id)).toEqual(['cape-town']);
    expect(view.subtitle).toBe('the long way');
    expect(state.base.trip.stops).toHaveLength(0);
  });

  it('returns the same document every time it is asked', () => {
    const state = seed();
    expect(viewOf(state)).toEqual(viewOf(state));
  });

  it('is the base itself once the log has drained', () => {
    const state = seed();
    expect(viewOf({ ...state, log: [] })).toBe(state.base.trip);
  });
});
