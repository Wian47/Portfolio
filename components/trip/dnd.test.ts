/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { describe, expect, it } from 'vitest';
import type { DayId, Stop, StopId, Trip } from '../../trip/model';
import { createTrip } from '../../trip/ids';
import { orderKeyBetween } from '../../trip/order';
import { decodeDragId, slotFromDrop, stopDragId } from './dnd';

const DAY_A = 'day-a' as DayId;
const DAY_B = 'day-b' as DayId;

const trip = (): Trip => {
  const seed = createTrip('t');
  let order = orderKeyBetween(null, null);
  const stops: Stop[] = ['one', 'two', 'three'].map((name, index) => {
    if (index > 0) order = orderKeyBetween(order, null);
    return {
      id: name as StopId, dayId: DAY_A, order,
      place: { name, at: [18, -33] }, kind: 'sight', dwellMinutes: null, booking: { kind: 'none' }
    };
  });
  return {
    ...seed,
    days: [
      { id: DAY_A, order: orderKeyBetween(null, null), date: null, departAt: seed.days[0].departAt },
      { id: DAY_B, order: orderKeyBetween(orderKeyBetween(null, null), null), date: null, departAt: seed.days[0].departAt }
    ],
    stops
  };
};

describe('drag ids', () => {
  it('round-trips a stop id, including one with a colon in it', () => {
    const id = 'a:b:c' as StopId;
    expect(decodeDragId(stopDragId(id))).toEqual({ kind: 'stop', id });
  });

  it('refuses a string it did not write', () => {
    expect(decodeDragId('nonsense')).toBeNull();
  });
});

describe('slotFromDrop', () => {
  it('lands past the target when dragging down', () => {
    const slot = slotFromDrop(trip(), 'one' as StopId, { kind: 'stop', id: 'three' as StopId });
    expect(slot).toEqual({ dayId: DAY_A, after: 'three', before: null });
  });

  it('lands before the target when dragging up', () => {
    const slot = slotFromDrop(trip(), 'three' as StopId, { kind: 'stop', id: 'two' as StopId });
    expect(slot).toEqual({ dayId: DAY_A, after: 'one', before: 'two' });
  });

  it('takes the head when dropped on the first row', () => {
    const slot = slotFromDrop(trip(), 'three' as StopId, { kind: 'stop', id: 'one' as StopId });
    expect(slot).toEqual({ dayId: DAY_A, after: null, before: 'one' });
  });

  it('appends when dropped on an empty day', () => {
    expect(slotFromDrop(trip(), 'two' as StopId, { kind: 'day', id: DAY_B }))
      .toEqual({ dayId: DAY_B, after: null, before: null });
  });

  it('appends after the last stop when dropped on a populated day', () => {
    expect(slotFromDrop(trip(), 'two' as StopId, { kind: 'day', id: DAY_A }))
      .toEqual({ dayId: DAY_A, after: 'three', before: null });
  });

  it('ignores a drop on the row being dragged', () => {
    expect(slotFromDrop(trip(), 'two' as StopId, { kind: 'stop', id: 'two' as StopId })).toBeNull();
  });
});
