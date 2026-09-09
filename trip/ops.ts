/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { Day, DayId, IsoDate, HhMm, Place, Stop, StopId, StopKind, Trip } from './model';

/**
 * An edit, recorded as intent rather than as a result.
 *
 * A drag records "put this after Barrydale", not the `OrderKey` that would put
 * it there. The key is minted inside `applyOp`, against whichever document is
 * being applied to. That is what makes replaying the log onto a document that
 * changed underneath us safe: replaying "after Barrydale" onto a day that
 * gained a stop in that gap mints a different, still-valid key, where a stored
 * key would collide on the `(dayId, order)` slot that `parseTrip` refuses and
 * the Worker answers with a 422.
 *
 * Every op is total and idempotent. Applying one whose target is gone returns
 * the document unchanged, and `stop.add` for an id already present overwrites
 * rather than duplicating. So `applyAll(base, log)` is correct against any
 * base, any number of times, which is the property the whole sync layer rests
 * on. Ops never cross the wire; the wire carries whole documents. So this union
 * carries no compatibility debt.
 */

/** Where a stop goes, named by its neighbours rather than by a key. */
export interface StopSlot {
  dayId: DayId;
  /** The stop this one follows, or null for the head of the day. */
  after: StopId | null;
  /** A hint only. `after` wins and `before` is re-derived from the document. */
  before: StopId | null;
}

/** The fields of a stop a person can edit. Server-owned fields are absent by construction. */
export type StopPatch = Partial<
  Pick<Stop, 'place' | 'kind' | 'dwellMinutes' | 'arriveBy' | 'arriveVia' | 'notes' | 'costCents' | 'booking'>
>;

export type DayPatch = Partial<Pick<Day, 'date' | 'title' | 'departAt' | 'notes'>>;

export type TripOp =
  | { kind: 'stop.add'; id: StopId; slot: StopSlot; place: Place; stopKind: StopKind }
  | { kind: 'stop.move'; id: StopId; slot: StopSlot }
  | { kind: 'stop.patch'; id: StopId; patch: StopPatch }
  | { kind: 'stop.remove'; id: StopId }
  | { kind: 'day.add'; id: DayId; after: DayId | null; date: IsoDate | null; departAt: HhMm }
  | { kind: 'day.patch'; id: DayId; patch: DayPatch }
  | { kind: 'day.remove'; id: DayId }
  | { kind: 'trip.patch'; patch: Partial<Pick<Trip, 'title' | 'subtitle' | 'vehicle' | 'defaultRoutePref'>> };

/**
 * Resolves a slot against the document being applied to. `after` wins and the
 * far neighbour is re-derived from it, which is what makes `orderKeyBetween`'s
 * RangeError unreachable rather than something to guard against.
 */
export const resolveSlot = (trip: Trip, slot: StopSlot): Stop['order'] => {
  throw new Error('not implemented');
};

export const applyOp = (trip: Trip, op: TripOp): Trip => {
  throw new Error('not implemented');
};

export const applyAll = (trip: Trip, log: readonly TripOp[]): Trip =>
  log.reduce(applyOp, trip);
