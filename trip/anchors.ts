/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { isAnchor, type DayId, type Stop } from './model';
import { sortByOrder } from './order';

/**
 * A day is not a list of places. It is a few destinations with a run of stops
 * between each pair, which is section 7.1 of the spec and the reason
 * `STOP_KIND` carries an `anchor` column.
 *
 * This grouping is derived on every render and never stored. Promoting a via to
 * a real sight is then a change of one field, not a migration of a nested
 * shape.
 */

export interface AnchorGroup {
  /** Null for the run that precedes the day's first anchor, or a day with none. */
  anchor: Stop | null;
  /** What happens on the way to the next anchor. */
  between: Stop[];
}

export const groupByAnchor = (dayId: DayId, stops: readonly Stop[]): AnchorGroup[] => {
  const ordered = sortByOrder(stops.filter((stop) => stop.dayId === dayId));
  if (ordered.length === 0) return [];

  const groups: AnchorGroup[] = [];
  let current: AnchorGroup = { anchor: null, between: [] };

  for (const stop of ordered) {
    if (!isAnchor(stop)) {
      current.between.push(stop);
      continue;
    }
    if (current.anchor !== null || current.between.length > 0) groups.push(current);
    current = { anchor: stop, between: [] };
  }

  groups.push(current);
  return groups;
};

/** Every stop of the day, back in the order the rail draws them. */
export const flattenGroups = (groups: readonly AnchorGroup[]): Stop[] =>
  groups.flatMap((group) => (group.anchor === null ? group.between : [group.anchor, ...group.between]));
