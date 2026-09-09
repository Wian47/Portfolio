/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { STOP_KIND, type BudgetCategory, type Stop, type VehicleProfile } from './model';

/**
 * Integer cents, ZAR, everywhere. No float reaches a total. Fuel is derived from
 * the vehicle and the distance actually routed, never typed in, because a fuel
 * figure that disagrees with the route is worse than none.
 */

export type Cents = number;

export const sumCents = (values: readonly (Cents | undefined)[]): Cents =>
  values.reduce<Cents>((total, v) => total + (v ?? 0), 0);

/** Distance in metres burned at the profile's rate, rounded to the cent. */
export const fuelCostCents = (distanceM: number, vehicle: VehicleProfile): Cents =>
  Math.round((distanceM / 100_000) * vehicle.consumptionL100km * vehicle.fuelPriceCentsPerLitre);

export const fuelLitres = (distanceM: number, vehicle: VehicleProfile): number =>
  (distanceM / 100_000) * vehicle.consumptionL100km;

/** 0.85, because nobody plans to arrive on fumes. */
export const USABLE_TANK_FRACTION = 0.85;

export const usableRangeM = (vehicle: VehicleProfile): number =>
  ((vehicle.tankLitres * USABLE_TANK_FRACTION) / vehicle.consumptionL100km) * 100_000;

export type BudgetTotals = Record<BudgetCategory, Cents>;

const EMPTY_BUDGET: BudgetTotals = {
  accommodation: 0, activities: 0, food: 0, fuel: 0, other: 0
};

/**
 * Authored spend per category. Fuel is added by the caller from the routed
 * distance, so a `kind: 'fuel'` stop with a typed-in cost still lands in the
 * fuel column beside it.
 */
export const budgetByCategory = (stops: readonly Stop[]): BudgetTotals => {
  const totals = { ...EMPTY_BUDGET };
  for (const stop of stops) {
    const category = STOP_KIND[stop.kind].budget;
    if (category !== null) totals[category] += stop.costCents ?? 0;
  }
  return totals;
};

export const formatRand = (cents: Cents): string => {
  const sign = cents < 0 ? '−' : '';
  const whole = Math.round(Math.abs(cents) / 100);
  return `${sign}R ${whole.toLocaleString('en-ZA')}`;
};

export const formatRandExact = (cents: Cents): string => {
  const sign = cents < 0 ? '−' : '';
  const abs = Math.abs(cents);
  const body = (abs / 100).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${sign}R ${body}`;
};
