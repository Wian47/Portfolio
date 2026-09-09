/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { describe, expect, it } from 'vitest';
import { flattenGroups, groupByAnchor } from './anchors';
import type { DayId, Stop, StopId, StopKind } from './model';
import { orderKeyBetween } from './order';

const DAY = 'day-1' as DayId;
const OTHER = 'day-2' as DayId;

const day = (kinds: readonly StopKind[], dayId: DayId = DAY): Stop[] => {
  let order = orderKeyBetween(null, null);
  return kinds.map((kind, index) => {
    if (index > 0) order = orderKeyBetween(order, null);
    return {
      id: `${dayId}-${index}` as StopId,
      dayId,
      order,
      place: { name: kind, at: [18, -33] },
      kind,
      dwellMinutes: null,
      booking: { kind: 'none' }
    } satisfies Stop;
  });
};

const shape = (stops: Stop[]) =>
  groupByAnchor(DAY, stops).map((g) => [g.anchor?.kind ?? null, g.between.map((s) => s.kind)]);

describe('groupByAnchor', () => {
  it('hangs each run of intermediate stops off the anchor it follows', () => {
    expect(shape(day(['overnight', 'fuel', 'meal', 'sight', 'overnight']))).toEqual([
      ['overnight', ['fuel', 'meal', 'sight']],
      ['overnight', []]
    ]);
  });

  it('opens an anchorless run for stops before the first anchor', () => {
    expect(shape(day(['fuel', 'overnight']))).toEqual([
      [null, ['fuel']],
      ['overnight', []]
    ]);
  });

  it('puts consecutive anchors in their own groups', () => {
    expect(shape(day(['activity', 'overnight']))).toEqual([
      ['activity', []],
      ['overnight', []]
    ]);
  });

  it('handles a day of nothing but vias', () => {
    expect(shape(day(['waypoint', 'waypoint']))).toEqual([[null, ['waypoint', 'waypoint']]]);
  });

  it('handles a day with no anchor at all', () => {
    expect(shape(day(['fuel', 'meal', 'sight']))).toEqual([[null, ['fuel', 'meal', 'sight']]]);
  });

  it('returns nothing for an empty day', () => {
    expect(groupByAnchor(DAY, [])).toEqual([]);
    expect(groupByAnchor(DAY, day(['overnight'], OTHER))).toEqual([]);
  });

  it('ignores stops belonging to another day', () => {
    const mixed = [...day(['overnight', 'fuel']), ...day(['overnight'], OTHER)];
    expect(shape(mixed)).toEqual([['overnight', ['fuel']]]);
  });

  it('reads back in document order', () => {
    const stops = day(['fuel', 'overnight', 'meal', 'activity']);
    const flat = flattenGroups(groupByAnchor(DAY, stops));
    expect(flat.map((s) => s.id)).toEqual(stops.map((s) => s.id));
  });
});
