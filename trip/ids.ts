/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {
  DEFAULT_ROUTE_PREF, DEFAULT_VEHICLE,
  type DayId, type IsoTimestamp, type StopId, type Trip, type TripId
} from './model';
import { orderKeyBetween } from './order';

/**
 * Ids are minted on whichever side creates the thing, so an optimistic insert
 * in the browser keeps its id after the round trip and nothing has to be
 * reconciled.
 */
const uuid = (): string => crypto.randomUUID();

export const newTripId = (): TripId => uuid() as TripId;
export const newDayId = (): DayId => uuid() as DayId;
export const newStopId = (): StopId => uuid() as StopId;

export const nowTimestamp = (): IsoTimestamp =>
  new Date().toISOString().replace(/\.\d+Z$/, 'Z') as IsoTimestamp;

/** A new trip opens on one undated day, because an empty list has nothing to drag into. */
export const createTrip = (title: string, id: TripId = newTripId()): Trip => {
  const now = nowTimestamp();
  return {
    id,
    title,
    currency: 'ZAR',
    vehicle: { ...DEFAULT_VEHICLE },
    defaultRoutePref: { ...DEFAULT_ROUTE_PREF },
    days: [{ id: newDayId(), order: orderKeyBetween(null, null), date: null, departAt: '07:00' as Trip['days'][number]['departAt'] }],
    stops: [],
    createdAt: now,
    updatedAt: now
  };
};
