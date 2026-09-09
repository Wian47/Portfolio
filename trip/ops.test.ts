/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { describe, expect, it } from 'vitest';
import { createTrip } from './ids';
import type { DayId, HhMm, OrderKey, Stop, StopId, StopKind, Trip } from './model';
import { applyAll, applyOp, resolveSlot, type StopSlot, type TripOp } from './ops';
import { isOrderKey, orderKeyBetween, sortByOrder } from './order';
import { parseTrip } from './validate';

const CAPE_TOWN = 'cape-town' as StopId;
const BARRYDALE = 'barrydale' as StopId;
const GHOST = 'ghost' as StopId;
const DAY_TWO = 'day-two' as DayId;

const stopAt = (id: StopId, dayId: DayId, order: OrderKey, kind: StopKind): Stop => ({
  id,
  dayId,
  order,
  place: { name: id, at: [20.7167, -33.9] },
  kind,
  dwellMinutes: null,
  booking: { kind: 'none' }
});

/** One day, two stops, exactly as `createTrip` would leave it after two inserts. */
const fixture = (): Trip => {
  const trip = createTrip('Cape Town to Oudtshoorn');
  const dayId = trip.days[0].id;
  const first = orderKeyBetween(null, null);
  const second = orderKeyBetween(first, null);
  return {
    ...trip,
    stops: [
      stopAt(CAPE_TOWN, dayId, first, 'overnight'),
      stopAt(BARRYDALE, dayId, second, 'meal')
    ]
  };
};

const dayOne = (trip: Trip): DayId => trip.days[0].id;

const slot = (dayId: DayId, after: StopId | null, before: StopId | null = null): StopSlot =>
  ({ dayId, after, before });

const stop = (trip: Trip, id: StopId): Stop => {
  const found = trip.stops.find((s) => s.id === id);
  if (found === undefined) throw new Error(`no stop ${id}`);
  return found;
};

const orderOf = (trip: Trip, dayId: DayId): StopId[] =>
  sortByOrder(trip.stops.filter((s) => s.dayId === dayId)).map((s) => s.id);

const addStop = (id: StopId, at: StopSlot, kind: StopKind = 'sight'): TripOp =>
  ({ kind: 'stop.add', id, slot: at, place: { name: id, at: [19.45, -33.65] }, stopKind: kind });

describe('resolveSlot', () => {
  it('puts a null `after` at the head of the day', () => {
    const trip = fixture();
    const key = resolveSlot(trip, slot(dayOne(trip), null));
    expect(key < stop(trip, CAPE_TOWN).order).toBe(true);
  });

  it('re-derives the far neighbour from `after` and ignores the hint', () => {
    const trip = fixture();
    const lied = { ...slot(dayOne(trip), CAPE_TOWN), before: GHOST };
    const key = resolveSlot(trip, lied);
    expect(stop(trip, CAPE_TOWN).order < key).toBe(true);
    expect(key < stop(trip, BARRYDALE).order).toBe(true);
  });

  it('appends when `after` names a stop that is gone', () => {
    const trip = fixture();
    const key = resolveSlot(trip, slot(dayOne(trip), GHOST));
    expect(isOrderKey(key)).toBe(true);
    expect(stop(trip, BARRYDALE).order < key).toBe(true);
  });

  it('appends when `after` names a stop on another day', () => {
    const trip = applyOp(fixture(), { kind: 'day.add', id: DAY_TWO, after: null, date: null, departAt: '07:00' as HhMm });
    const key = resolveSlot(trip, slot(DAY_TWO, CAPE_TOWN));
    expect(isOrderKey(key)).toBe(true);
  });

  it('mints a key for a day with no stops at all', () => {
    const trip = fixture();
    expect(isOrderKey(resolveSlot(trip, slot(DAY_TWO, null)))).toBe(true);
  });
});

describe('applyOp', () => {
  it('inserts a stop into the gap the slot names', () => {
    const trip = fixture();
    const next = applyOp(trip, addStop('worcester' as StopId, slot(dayOne(trip), CAPE_TOWN), 'fuel'));
    expect(orderOf(next, dayOne(trip))).toEqual([CAPE_TOWN, 'worcester', BARRYDALE]);
    expect(parseTrip(next).ok).toBe(true);
  });

  it('overwrites a stop id already present rather than duplicating it', () => {
    const trip = fixture();
    const again = addStop(BARRYDALE, slot(dayOne(trip), null), 'admin');
    const next = applyOp(trip, again);
    expect(next.stops).toHaveLength(2);
    expect(stop(next, BARRYDALE).kind).toBe('admin');
    expect(stop(next, BARRYDALE).order).toBe(stop(trip, BARRYDALE).order);
  });

  it('moves a stop to another day', () => {
    const withDay = applyOp(fixture(), { kind: 'day.add', id: DAY_TWO, after: null, date: null, departAt: '07:00' as HhMm });
    const next = applyOp(withDay, { kind: 'stop.move', id: BARRYDALE, slot: slot(DAY_TWO, null) });
    expect(stop(next, BARRYDALE).dayId).toBe(DAY_TWO);
    expect(orderOf(next, dayOne(next))).toEqual([CAPE_TOWN]);
    expect(parseTrip(next).ok).toBe(true);
  });

  it('appends a move whose `after` was deleted instead of throwing', () => {
    const trip = fixture();
    const gone = applyOp(trip, { kind: 'stop.remove', id: CAPE_TOWN });
    const next = applyOp(gone, { kind: 'stop.move', id: BARRYDALE, slot: slot(dayOne(trip), CAPE_TOWN) });
    expect(orderOf(next, dayOne(trip))).toEqual([BARRYDALE]);
    expect(parseTrip(next).ok).toBe(true);
  });

  it('leaves the document alone when the target is gone', () => {
    const trip = fixture();
    const noops: TripOp[] = [
      { kind: 'stop.move', id: GHOST, slot: slot(dayOne(trip), null) },
      { kind: 'stop.patch', id: GHOST, patch: { notes: 'nothing' } },
      { kind: 'stop.remove', id: GHOST },
      { kind: 'day.patch', id: DAY_TWO, patch: { title: 'nothing' } },
      { kind: 'day.remove', id: DAY_TWO },
      addStop('stranded' as StopId, slot(DAY_TWO, null)),
      { kind: 'stop.move', id: CAPE_TOWN, slot: slot(DAY_TWO, null) }
    ];
    for (const op of noops) expect(applyOp(trip, op)).toBe(trip);
  });

  it('cascades a day removal to the stops on it', () => {
    const trip = fixture();
    const next = applyOp(trip, { kind: 'day.remove', id: dayOne(trip) });
    expect(next.days).toHaveLength(0);
    expect(next.stops).toHaveLength(0);
    expect(parseTrip(next).ok).toBe(true);
  });

  it('leaves the stops on other days alone', () => {
    const trip = applyAll(fixture(), [
      { kind: 'day.add', id: DAY_TWO, after: null, date: null, departAt: '07:00' as HhMm },
      addStop('oudtshoorn' as StopId, slot(DAY_TWO, null), 'overnight')
    ]);
    const next = applyOp(trip, { kind: 'day.remove', id: dayOne(trip) });
    expect(next.stops.map((s) => s.id)).toEqual(['oudtshoorn']);
  });

  it('patches only the fields the patch carries', () => {
    const trip = fixture();
    const next = applyOp(trip, { kind: 'stop.patch', id: BARRYDALE, patch: { costCents: 32_000 } });
    expect(stop(next, BARRYDALE).costCents).toBe(32_000);
    expect(stop(next, BARRYDALE).place).toEqual(stop(trip, BARRYDALE).place);
  });

  it('inserts a day after the one it names', () => {
    const trip = fixture();
    const next = applyAll(trip, [
      { kind: 'day.add', id: DAY_TWO, after: dayOne(trip), date: null, departAt: '07:00' as HhMm },
      { kind: 'day.add', id: 'day-mid' as DayId, after: dayOne(trip), date: null, departAt: '08:00' as HhMm }
    ]);
    expect(sortByOrder(next.days).map((d) => d.id)).toEqual([dayOne(trip), 'day-mid', DAY_TWO]);
    expect(parseTrip(next).ok).toBe(true);
  });
});

describe('applyAll', () => {
  it('gives two inserts into the same gap two distinct valid keys', () => {
    const trip = fixture();
    const next = applyAll(trip, [
      addStop('ronnies' as StopId, slot(dayOne(trip), CAPE_TOWN)),
      addStop('worcester' as StopId, slot(dayOne(trip), CAPE_TOWN), 'fuel')
    ]);
    const first = stop(next, 'ronnies' as StopId).order;
    const second = stop(next, 'worcester' as StopId).order;
    expect(first).not.toBe(second);
    expect(isOrderKey(first) && isOrderKey(second)).toBe(true);
    expect(orderOf(next, dayOne(trip))).toEqual([CAPE_TOWN, 'worcester', 'ronnies', BARRYDALE]);
    expect(parseTrip(next).ok).toBe(true);
  });

  /** The 409 path: `stale` keeps the whole log and folds it onto whatever came back. */
  it('lands on the same document when the log is replayed onto its own result', () => {
    const trip = fixture();
    const log: TripOp[] = [
      { kind: 'day.add', id: DAY_TWO, after: dayOne(trip), date: null, departAt: '07:00' as HhMm },
      addStop('huisrivier' as StopId, slot(dayOne(trip), BARRYDALE)),
      { kind: 'stop.patch', id: BARRYDALE, patch: { costCents: 32_000 } },
      { kind: 'stop.move', id: 'huisrivier' as StopId, slot: slot(DAY_TWO, null) },
      addStop('worcester' as StopId, slot(dayOne(trip), CAPE_TOWN, BARRYDALE), 'fuel'),
      { kind: 'day.patch', id: DAY_TWO, patch: { title: 'Over the pass' } },
      { kind: 'trip.patch', patch: { title: 'Cape Town to Oudtshoorn, the long way' } },
      { kind: 'stop.remove', id: GHOST }
    ];

    const once = applyAll(trip, log);
    const twice = applyAll(once, log);
    expect(twice).toEqual(once);
    expect(parseTrip(once).ok).toBe(true);
  });

  it('is a no-op for an empty log', () => {
    const trip = fixture();
    expect(applyAll(trip, [])).toBe(trip);
  });
});
