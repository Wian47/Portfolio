/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * The trip domain. Pure TypeScript: no React, no DOM, no fetch. Both the browser
 * bundle and the Worker import this file, so it is also the contract between
 * them.
 */

/** GeoJSON order, longitude first. Every external payload converts at the boundary. */
export type Position = readonly [lon: number, lat: number];

export type TripId = string & { readonly __brand: 'TripId' };
export type DayId = string & { readonly __brand: 'DayId' };
export type StopId = string & { readonly __brand: 'StopId' };

/** Lexicographic fractional index. Reordering writes one field, never a whole array. */
export type OrderKey = string & { readonly __brand: 'OrderKey' };

/** `YYYY-MM-DD`. */
export type IsoDate = string & { readonly __brand: 'IsoDate' };
/** `HH:MM` on a 24 hour clock. */
export type HhMm = string & { readonly __brand: 'HhMm' };
/** RFC 3339 with a `Z` offset. */
export type IsoTimestamp = string & { readonly __brand: 'IsoTimestamp' };

export type StopKind =
  | 'overnight' | 'sight' | 'meal' | 'fuel' | 'activity' | 'admin' | 'waypoint';

export type BudgetCategory =
  | 'accommodation' | 'activities' | 'food' | 'fuel' | 'other';

export interface KindSpec {
  readonly label: string;
  /** Default minutes spent here when the stop does not override it. */
  readonly dwell: number;
  /** True for the places that shape the day. False for what you do on the way. */
  readonly anchor: boolean;
  readonly budget: BudgetCategory | null;
  /** Overpass tag filter for the along-the-leg search, so chips are stop kinds. */
  readonly overpass: string | null;
}

export const STOP_KIND = {
  overnight: { label: 'Overnight', dwell: 720, anchor: true,  budget: 'accommodation', overpass: 'tourism~"hotel|guest_house|camp_site"' },
  activity:  { label: 'Activity',  dwell: 120, anchor: true,  budget: 'activities',    overpass: 'tourism~"attraction|museum"' },
  sight:     { label: 'Sight',     dwell: 45,  anchor: false, budget: 'activities',    overpass: 'tourism~"viewpoint|attraction"' },
  meal:      { label: 'Meal',      dwell: 60,  anchor: false, budget: 'food',          overpass: 'amenity~"restaurant|cafe"' },
  fuel:      { label: 'Fuel',      dwell: 15,  anchor: false, budget: 'fuel',          overpass: 'amenity=fuel' },
  admin:     { label: 'Admin',     dwell: 30,  anchor: false, budget: 'other',         overpass: null },
  waypoint:  { label: 'Via',       dwell: 0,   anchor: false, budget: null,            overpass: null }
} as const satisfies Record<StopKind, KindSpec>;

export const STOP_KINDS = Object.keys(STOP_KIND) as readonly StopKind[];

export interface Place {
  /** What the itinerary shows. Editable, so it survives a provider changing its wording. */
  name: string;
  /** Provider's fuller description, kept for disambiguating two places of the same name. */
  address?: string;
  at: Position;
}

export type BookingState =
  | { kind: 'none' }
  | { kind: 'shortlisted'; url?: string }
  | { kind: 'held'; until: IsoDate; url?: string }
  | { kind: 'booked'; reference: string; paid: boolean; url?: string };

/** How you want to be routed *into* a stop. */
export interface RoutePref {
  profile: 'fastest' | 'shortest';
  avoid: readonly ('tollways' | 'highways' | 'ferries' | 'unpaved')[];
}

export interface Stop {
  id: StopId;
  dayId: DayId;
  order: OrderKey;
  place: Place;
  kind: StopKind;
  /** Minutes planned here. Null means fall back to the kind's default. */
  dwellMinutes: number | null;
  /** Hard constraint, such as a 14:00 check-in. Drives the conflict warnings. */
  arriveBy?: HhMm;
  /**
   * Routing preference for the leg arriving here. In an ordered list a leg is
   * uniquely identified by its destination, so leg-level authored data hangs
   * off the arriving stop and needs no composite key.
   */
  arriveVia?: RoutePref;
  notes?: string;
  costCents?: number;
  booking: BookingState;
}

export interface Day {
  id: DayId;
  order: OrderKey;
  /** Null for an undated trip you are still shaping. */
  date: IsoDate | null;
  title?: string;
  /** When you intend to roll out. Seeds the arrival schedule. */
  departAt: HhMm;
  notes?: string;
}

export interface VehicleProfile {
  label: string;
  consumptionL100km: number;
  tankLitres: number;
  fuelPriceCentsPerLitre: number;
}

export interface Trip {
  id: TripId;
  title: string;
  subtitle?: string;
  currency: 'ZAR';
  vehicle: VehicleProfile;
  defaultRoutePref: RoutePref;
  days: Day[];
  /** Flat. Ordered by (day.order, stop.order), never nested under a day. */
  stops: Stop[];
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}

/** What the trip list renders, without pulling every document down. */
export interface TripSummary {
  id: TripId;
  title: string;
  updatedAt: IsoTimestamp;
  version: number;
}

/** A trip as it crosses the wire, carrying the version `If-Match` needs. */
export interface VersionedTrip {
  trip: Trip;
  version: number;
}

/** A route between two consecutive stops. Derived from positions, never authored. */
export interface Leg {
  distanceM: number;
  durationS: number;
  geometry: Position[];
  provider: 'ors' | 'osrm';
  fetchedAt: IsoTimestamp;
}

export const dwellOf = (stop: Stop): number =>
  stop.dwellMinutes ?? STOP_KIND[stop.kind].dwell;

export const isAnchor = (stop: Stop): boolean => STOP_KIND[stop.kind].anchor;

export const DEFAULT_ROUTE_PREF: RoutePref = { profile: 'fastest', avoid: [] };

export const DEFAULT_VEHICLE: VehicleProfile = {
  label: 'CX-3 2.0',
  consumptionL100km: 7.2,
  tankLitres: 44,
  fuelPriceCentsPerLitre: 2199
};
