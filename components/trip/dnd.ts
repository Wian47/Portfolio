/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { DayId, Stop, StopId, Trip } from '../../trip/model';
import { sortByOrder } from '../../trip/order';
import type { StopSlot } from '../../trip/ops';

/**
 * The only place dnd-kit's string ids exist. They are encoded here and decoded
 * back into domain values here, so nothing downstream ever sees a raw id.
 *
 * A move within a day and a move across days are the same call, because the
 * flat stop list makes them the same operation.
 */

export type DropTarget =
  | { kind: 'stop'; id: StopId }
  | { kind: 'day'; id: DayId };

export const stopDragId = (id: StopId): string => `stop:${id}`;
export const dayDropId = (id: DayId): string => `day:${id}`;

export const decodeDragId = (raw: string): DropTarget | null => {
  const cut = raw.indexOf(':');
  if (cut < 0) return null;
  const value = raw.slice(cut + 1);
  if (raw.startsWith('stop:')) return { kind: 'stop', id: value as StopId };
  if (raw.startsWith('day:')) return { kind: 'day', id: value as DayId };
  return null;
};

const stopsOf = (trip: Trip, dayId: DayId): Stop[] =>
  sortByOrder(trip.stops.filter((stop) => stop.dayId === dayId));

const slotAtEnd = (trip: Trip, dayId: DayId, moving: StopId): StopSlot => {
  const rest = stopsOf(trip, dayId).filter((stop) => stop.id !== moving);
  return { dayId, after: rest.length > 0 ? rest[rest.length - 1].id : null, before: null };
};

/**
 * Dropping on a stop takes its place. Which side that lands on depends on the
 * direction of travel: dragging down means past it, dragging up or in from
 * another day means before it, which is what a list drag looks like it does.
 */
export const slotFromDrop = (trip: Trip, moving: StopId, target: DropTarget): StopSlot | null => {
  if (target.kind === 'day') return slotAtEnd(trip, target.id, moving);

  const over = trip.stops.find((stop) => stop.id === target.id);
  if (over === undefined || over.id === moving) return null;

  const source = trip.stops.find((stop) => stop.id === moving);
  const ordered = stopsOf(trip, over.dayId);
  const overIndex = ordered.findIndex((stop) => stop.id === over.id);
  const fromIndex = ordered.findIndex((stop) => stop.id === moving);
  const goingDown = source !== undefined && source.dayId === over.dayId && fromIndex < overIndex;

  if (goingDown) return { dayId: over.dayId, after: over.id, before: null };

  const rest = ordered.filter((stop) => stop.id !== moving);
  const restIndex = rest.findIndex((stop) => stop.id === over.id);
  const above = restIndex > 0 ? rest[restIndex - 1] : null;
  return { dayId: over.dayId, after: above === null ? null : above.id, before: over.id };
};
