/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { Day, DayId, IsoDate, HhMm, OrderKey, Place, Stop, StopId, StopKind, Trip } from './model';
import { orderKeyBetween, sortByOrder } from './order';

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

type Gap = readonly [lower: OrderKey | null, upper: OrderKey | null];

/**
 * The keys either side of the position just after `after`. An `after` the list
 * no longer holds resolves to the tail, so a slot naming a deleted neighbour
 * still yields a key instead of throwing.
 */
const gapAfter = <T extends { id: string; order: OrderKey }>(
  items: readonly T[],
  after: string | null
): Gap => {
  const ordered = sortByOrder(items);
  const found = after === null ? -1 : ordered.findIndex((item) => item.id === after);
  const cut = after !== null && found === -1 ? ordered.length : found + 1;
  return [
    cut > 0 ? ordered[cut - 1].order : null,
    cut < ordered.length ? ordered[cut].order : null
  ];
};

const inGap = (order: OrderKey, [lower, upper]: Gap): boolean =>
  (lower === null || order > lower) && (upper === null || order < upper);

/**
 * `moving` is left out of the reckoning, so a stop resolved back into the gap
 * it already occupies is measured against the same neighbours its key was
 * minted from rather than against itself.
 */
const gapFor = (trip: Trip, slot: StopSlot, moving: StopId | null): Gap =>
  gapAfter(trip.stops.filter((s) => s.dayId === slot.dayId && s.id !== moving), slot.after);

/**
 * Resolves a slot against the document being applied to. `after` wins and the
 * far neighbour is re-derived from it, which is what makes `orderKeyBetween`'s
 * RangeError unreachable rather than something to guard against.
 */
export const resolveSlot = (trip: Trip, slot: StopSlot): Stop['order'] =>
  orderKeyBetween(...gapFor(trip, slot, null));

const dayOf = (trip: Trip, id: DayId): Day | undefined => trip.days.find((d) => d.id === id);

const withStop = (trip: Trip, next: Stop): Trip => ({
  ...trip,
  stops: trip.stops.map((s) => (s.id === next.id ? next : s))
});

const withDay = (trip: Trip, next: Day): Trip => ({
  ...trip,
  days: trip.days.map((d) => (d.id === next.id ? next : d))
});

export const applyOp = (trip: Trip, op: TripOp): Trip => {
  switch (op.kind) {
    case 'stop.add': {
      // A second fold must not move what the first one placed, so a re-add keeps its slot.
      const present = trip.stops.find((s) => s.id === op.id);
      if (present !== undefined) {
        return withStop(trip, { ...present, place: op.place, kind: op.stopKind });
      }
      if (dayOf(trip, op.slot.dayId) === undefined) return trip;
      const stop: Stop = {
        id: op.id,
        dayId: op.slot.dayId,
        order: resolveSlot(trip, op.slot),
        place: op.place,
        kind: op.stopKind,
        dwellMinutes: null,
        booking: { kind: 'none' }
      };
      return { ...trip, stops: [...trip.stops, stop] };
    }

    case 'stop.move': {
      const stop = trip.stops.find((s) => s.id === op.id);
      if (stop === undefined || dayOf(trip, op.slot.dayId) === undefined) return trip;
      const gap = gapFor(trip, op.slot, op.id);
      // Re-minting for a stop already in the gap would nudge it on every replay.
      if (stop.dayId === op.slot.dayId && inGap(stop.order, gap)) return trip;
      return withStop(trip, { ...stop, dayId: op.slot.dayId, order: orderKeyBetween(...gap) });
    }

    case 'stop.patch': {
      const stop = trip.stops.find((s) => s.id === op.id);
      return stop === undefined ? trip : withStop(trip, { ...stop, ...op.patch });
    }

    case 'stop.remove':
      return trip.stops.some((s) => s.id === op.id)
        ? { ...trip, stops: trip.stops.filter((s) => s.id !== op.id) }
        : trip;

    case 'day.add': {
      const present = dayOf(trip, op.id);
      if (present !== undefined) {
        return withDay(trip, { ...present, date: op.date, departAt: op.departAt });
      }
      const day: Day = {
        id: op.id,
        order: orderKeyBetween(...gapAfter(trip.days, op.after)),
        date: op.date,
        departAt: op.departAt
      };
      return { ...trip, days: [...trip.days, day] };
    }

    case 'day.patch': {
      const day = dayOf(trip, op.id);
      return day === undefined ? trip : withDay(trip, { ...day, ...op.patch });
    }

    case 'day.remove':
      // A stop left on a day that is gone is a document `parseTrip` refuses.
      return dayOf(trip, op.id) === undefined
        ? trip
        : {
            ...trip,
            days: trip.days.filter((d) => d.id !== op.id),
            stops: trip.stops.filter((s) => s.dayId !== op.id)
          };

    case 'trip.patch':
      return { ...trip, ...op.patch };
  }
};

export const applyAll = (trip: Trip, log: readonly TripOp[]): Trip =>
  log.reduce(applyOp, trip);
