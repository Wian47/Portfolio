/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { describe, expect, it } from 'vitest';
import { createTrip } from './ids';
import type { Stop, Trip } from './model';
import { orderKeyBetween } from './order';
import { parseTrip } from './validate';

const fixture = (): Trip => {
  const trip = createTrip('Cape Town to Oudtshoorn');
  const dayId = trip.days[0].id;
  const first = orderKeyBetween(null, null);
  const second = orderKeyBetween(first, null);
  const stops: Stop[] = [
    {
      id: 'stop-a' as Stop['id'], dayId, order: first,
      place: { name: 'Cape Town', at: [18.4172, -33.9288] },
      kind: 'overnight', dwellMinutes: null, booking: { kind: 'none' }
    },
    {
      id: 'stop-b' as Stop['id'], dayId, order: second,
      place: { name: 'Barrydale', address: 'Diesel & Creme', at: [20.7167, -33.9] },
      kind: 'meal', dwellMinutes: 45, costCents: 32_000,
      arriveBy: '12:30' as Stop['arriveBy'],
      arriveVia: { profile: 'shortest', avoid: ['tollways'] },
      booking: { kind: 'booked', reference: 'DC-1188', paid: false }
    }
  ];
  return { ...trip, stops };
};

/** Round-trips through JSON, because that is how a document actually reaches the parser. */
const parseWire = (trip: unknown) => parseTrip(JSON.parse(JSON.stringify(trip)));

describe('parseTrip', () => {
  it('accepts a document it produced itself', () => {
    const result = parseWire(fixture());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.stops).toHaveLength(2);
  });

  it('accepts a brand new empty trip', () => {
    expect(parseWire(createTrip('Untitled')).ok).toBe(true);
  });

  it('names the field that failed', () => {
    const trip = fixture();
    trip.days[0].departAt = '7am' as Trip['days'][number]['departAt'];
    const result = parseWire(trip);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('departAt');
  });

  it('rejects a stop on a day that does not exist', () => {
    const trip = fixture();
    trip.stops[1] = { ...trip.stops[1], dayId: 'ghost' as Stop['dayId'] };
    const result = parseWire(trip);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('unknown day');
  });

  it('rejects two stops in the same slot', () => {
    const trip = fixture();
    trip.stops[1] = { ...trip.stops[1], order: trip.stops[0].order };
    const result = parseWire(trip);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('share slot');
  });

  it('rejects duplicate stop ids', () => {
    const trip = fixture();
    trip.stops[1] = { ...trip.stops[1], id: trip.stops[0].id };
    const result = parseWire(trip);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('duplicate id');
  });

  it('rejects an order key with a trailing zero', () => {
    const trip = fixture();
    trip.stops[0] = { ...trip.stops[0], order: 'A0' as Stop['order'] };
    expect(parseWire(trip).ok).toBe(false);
  });

  it('rejects a swapped coordinate pair it can detect', () => {
    const trip = fixture();
    trip.stops[0] = {
      ...trip.stops[0],
      place: { name: 'Johannesburg', at: [-26.2041, 128.0473] }
    };
    const result = parseWire(trip);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('swapped');
  });

  it('rejects a booking reference with no booking behind it', () => {
    const trip = fixture();
    const loose = { ...trip.stops[1], booking: { kind: 'booked', reference: 'X' } };
    trip.stops[1] = loose as Stop;
    const result = parseWire(trip);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('paid');
  });

  it('rejects a hold with no expiry', () => {
    const trip = fixture();
    trip.stops[1] = { ...trip.stops[1], booking: { kind: 'held' } as Stop['booking'] };
    expect(parseWire(trip).ok).toBe(false);
  });

  it('rejects a blank title', () => {
    const trip = { ...fixture(), title: '   ' };
    const result = parseWire(trip);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('title');
  });

  it('rejects fractional cents', () => {
    const trip = fixture();
    trip.stops[1] = { ...trip.stops[1], costCents: 32_000.5 };
    expect(parseWire(trip).ok).toBe(false);
  });

  it('rejects an unknown stop kind', () => {
    const trip = fixture();
    trip.stops[0] = { ...trip.stops[0], kind: 'brunch' as Stop['kind'] };
    expect(parseWire(trip).ok).toBe(false);
  });

  it('rejects more stops than the limit allows', () => {
    const trip = fixture();
    const dayId = trip.days[0].id;
    let order = orderKeyBetween(null, null);
    const many: Stop[] = [];
    for (let i = 0; i < 801; i += 1) {
      order = orderKeyBetween(order, null);
      many.push({
        id: `s${i}` as Stop['id'], dayId, order,
        place: { name: 'x', at: [18, -33] },
        kind: 'sight', dwellMinutes: null, booking: { kind: 'none' }
      });
    }
    expect(parseWire({ ...trip, stops: many }).ok).toBe(false);
  });

  it('rejects a non-object', () => {
    expect(parseTrip(null).ok).toBe(false);
    expect(parseTrip([]).ok).toBe(false);
    expect(parseTrip('{}').ok).toBe(false);
  });

  it('drops fields it does not know about', () => {
    const result = parseWire({ ...fixture(), injected: 'nope' });
    expect(result.ok).toBe(true);
    if (result.ok) expect('injected' in result.value).toBe(false);
  });
});
