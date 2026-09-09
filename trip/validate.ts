/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {
  STOP_KINDS,
  type BookingState, type Day, type DayId, type HhMm, type IsoDate, type IsoTimestamp,
  type OrderKey, type Place, type RoutePref, type Stop, type StopId, type StopKind,
  type Trip, type TripId, type VehicleProfile
} from './model';
import { isOrderKey } from './order';
import { parsePosition } from './geo';
import {
  at, fail, isRecord, ok, parseArray, parseEnum, parseHhMm, parseInRange, parseIsoDate,
  parseIsoTimestamp, parseOptional, parseString, type Parsed
} from './parse';

/**
 * The trip document as it crosses into storage. The Worker refuses anything
 * that does not parse here, so a row in D1 is always a document the client can
 * render. The limits are deliberately generous but finite: one user cannot
 * exhaust a Worker's memory by accident, and a runaway loop in the browser
 * cannot write a hundred megabytes of JSON.
 */

export const LIMITS = {
  days: 90,
  stops: 800,
  title: 120,
  notes: 4000,
  url: 2000,
  /** Cents. A road trip that costs more than ten million rand is a typo. */
  cost: 1_000_000_000
} as const;

const parseOrderKey = (v: unknown): Parsed<OrderKey> =>
  isOrderKey(v) ? ok(v) : fail('expected a base-62 order key with no trailing zero');

const parseRoutePref = (v: unknown): Parsed<RoutePref> => {
  if (!isRecord(v)) return fail('expected an object');
  const profile = at('profile', parseEnum(v.profile, ['fastest', 'shortest'] as const));
  if (!profile.ok) return profile;
  const avoid = at('avoid', parseArray(
    v.avoid,
    (x) => parseEnum(x, ['tollways', 'highways', 'ferries', 'unpaved'] as const),
    4
  ));
  if (!avoid.ok) return avoid;
  return ok({ profile: profile.value, avoid: avoid.value });
};

const parsePlace = (v: unknown): Parsed<Place> => {
  if (!isRecord(v)) return fail('expected an object');
  const name = at('name', parseString(v.name, LIMITS.title));
  if (!name.ok) return name;
  const address = at('address', parseOptional(v.address, (x) => parseString(x, LIMITS.notes)));
  if (!address.ok) return address;
  const position = at('at', parsePosition(v.at));
  if (!position.ok) return position;
  return ok({ name: name.value, address: address.value, at: position.value });
};

const parseBooking = (v: unknown): Parsed<BookingState> => {
  if (!isRecord(v)) return fail('expected an object');
  const kind = at('kind', parseEnum(v.kind, ['none', 'shortlisted', 'held', 'booked'] as const));
  if (!kind.ok) return kind;

  const url = at('url', parseOptional(v.url, (x) => parseString(x, LIMITS.url)));
  if (!url.ok) return url;

  switch (kind.value) {
    case 'none':
      return ok({ kind: 'none' });
    case 'shortlisted':
      return ok({ kind: 'shortlisted', url: url.value });
    case 'held': {
      const until = at('until', parseIsoDate(v.until));
      if (!until.ok) return until;
      return ok({ kind: 'held', until: until.value as IsoDate, url: url.value });
    }
    case 'booked': {
      const reference = at('reference', parseString(v.reference, LIMITS.title));
      if (!reference.ok) return reference;
      if (typeof v.paid !== 'boolean') return fail('paid: expected a boolean');
      return ok({ kind: 'booked', reference: reference.value, paid: v.paid, url: url.value });
    }
  }
};

const parseDay = (v: unknown): Parsed<Day> => {
  if (!isRecord(v)) return fail('expected an object');
  const id = at('id', parseString(v.id, 64));
  if (!id.ok) return id;
  const order = at('order', parseOrderKey(v.order));
  if (!order.ok) return order;
  const date = at('date', parseOptional(v.date, parseIsoDate));
  if (!date.ok) return date;
  const title = at('title', parseOptional(v.title, (x) => parseString(x, LIMITS.title)));
  if (!title.ok) return title;
  const departAt = at('departAt', parseHhMm(v.departAt));
  if (!departAt.ok) return departAt;
  const notes = at('notes', parseOptional(v.notes, (x) => parseString(x, LIMITS.notes)));
  if (!notes.ok) return notes;

  return ok({
    id: id.value as DayId,
    order: order.value,
    date: (date.value ?? null) as IsoDate | null,
    title: title.value,
    departAt: departAt.value as HhMm,
    notes: notes.value
  });
};

const parseStop = (v: unknown): Parsed<Stop> => {
  if (!isRecord(v)) return fail('expected an object');
  const id = at('id', parseString(v.id, 64));
  if (!id.ok) return id;
  const dayId = at('dayId', parseString(v.dayId, 64));
  if (!dayId.ok) return dayId;
  const order = at('order', parseOrderKey(v.order));
  if (!order.ok) return order;
  const place = at('place', parsePlace(v.place));
  if (!place.ok) return place;
  const kind = at('kind', parseEnum(v.kind, STOP_KINDS));
  if (!kind.ok) return kind;
  const dwell = at('dwellMinutes', parseOptional(v.dwellMinutes, (x) => parseInRange(x, 0, 60 * 24 * 30)));
  if (!dwell.ok) return dwell;
  const arriveBy = at('arriveBy', parseOptional(v.arriveBy, parseHhMm));
  if (!arriveBy.ok) return arriveBy;
  const arriveVia = at('arriveVia', parseOptional(v.arriveVia, parseRoutePref));
  if (!arriveVia.ok) return arriveVia;
  const notes = at('notes', parseOptional(v.notes, (x) => parseString(x, LIMITS.notes)));
  if (!notes.ok) return notes;
  const costCents = at('costCents', parseOptional(v.costCents, (x) => parseInRange(x, 0, LIMITS.cost)));
  if (!costCents.ok) return costCents;
  if (costCents.value !== undefined && !Number.isInteger(costCents.value)) {
    return fail('costCents: expected whole cents');
  }
  const booking = at('booking', parseBooking(v.booking));
  if (!booking.ok) return booking;

  return ok({
    id: id.value as StopId,
    dayId: dayId.value as DayId,
    order: order.value,
    place: place.value,
    kind: kind.value as StopKind,
    dwellMinutes: dwell.value ?? null,
    arriveBy: arriveBy.value as HhMm | undefined,
    arriveVia: arriveVia.value,
    notes: notes.value,
    costCents: costCents.value,
    booking: booking.value
  });
};

const parseVehicle = (v: unknown): Parsed<VehicleProfile> => {
  if (!isRecord(v)) return fail('expected an object');
  const label = at('label', parseString(v.label, LIMITS.title));
  if (!label.ok) return label;
  const consumption = at('consumptionL100km', parseInRange(v.consumptionL100km, 0.1, 100));
  if (!consumption.ok) return consumption;
  const tank = at('tankLitres', parseInRange(v.tankLitres, 1, 1000));
  if (!tank.ok) return tank;
  const price = at('fuelPriceCentsPerLitre', parseInRange(v.fuelPriceCentsPerLitre, 1, 100_000));
  if (!price.ok) return price;
  return ok({
    label: label.value,
    consumptionL100km: consumption.value,
    tankLitres: tank.value,
    fuelPriceCentsPerLitre: price.value
  });
};

/**
 * Shape first, then the invariants a shape cannot express: unique ids, unique
 * positions within a day, and no stop stranded on a day that was deleted.
 */
export const parseTrip = (v: unknown): Parsed<Trip> => {
  if (!isRecord(v)) return fail('expected an object');

  const id = at('id', parseString(v.id, 64));
  if (!id.ok) return id;
  const title = at('title', parseString(v.title, LIMITS.title));
  if (!title.ok) return title;
  if (title.value.trim().length === 0) return fail('title: cannot be blank');
  const subtitle = at('subtitle', parseOptional(v.subtitle, (x) => parseString(x, LIMITS.title)));
  if (!subtitle.ok) return subtitle;
  const currency = at('currency', parseEnum(v.currency, ['ZAR'] as const));
  if (!currency.ok) return currency;
  const vehicle = at('vehicle', parseVehicle(v.vehicle));
  if (!vehicle.ok) return vehicle;
  const defaultRoutePref = at('defaultRoutePref', parseRoutePref(v.defaultRoutePref));
  if (!defaultRoutePref.ok) return defaultRoutePref;
  const days = at('days', parseArray(v.days, parseDay, LIMITS.days));
  if (!days.ok) return days;
  const stops = at('stops', parseArray(v.stops, parseStop, LIMITS.stops));
  if (!stops.ok) return stops;
  const createdAt = at('createdAt', parseIsoTimestamp(v.createdAt));
  if (!createdAt.ok) return createdAt;
  const updatedAt = at('updatedAt', parseIsoTimestamp(v.updatedAt));
  if (!updatedAt.ok) return updatedAt;

  const dayIds = new Set<string>();
  const dayOrders = new Set<string>();
  for (const day of days.value) {
    if (dayIds.has(day.id)) return fail(`days: duplicate id ${day.id}`);
    if (dayOrders.has(day.order)) return fail(`days: duplicate order key ${day.order}`);
    dayIds.add(day.id);
    dayOrders.add(day.order);
  }

  const stopIds = new Set<string>();
  const slots = new Set<string>();
  for (const stop of stops.value) {
    if (stopIds.has(stop.id)) return fail(`stops: duplicate id ${stop.id}`);
    stopIds.add(stop.id);
    if (!dayIds.has(stop.dayId)) return fail(`stops: ${stop.id} belongs to unknown day ${stop.dayId}`);
    const slot = `${stop.dayId}/${stop.order}`;
    if (slots.has(slot)) return fail(`stops: two stops share slot ${slot}`);
    slots.add(slot);
  }

  return ok({
    id: id.value as TripId,
    title: title.value,
    subtitle: subtitle.value,
    currency: currency.value,
    vehicle: vehicle.value,
    defaultRoutePref: defaultRoutePref.value,
    days: days.value,
    stops: stops.value,
    createdAt: createdAt.value as IsoTimestamp,
    updatedAt: updatedAt.value as IsoTimestamp
  });
};
