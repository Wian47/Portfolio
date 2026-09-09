/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { describe, expect, it } from 'vitest';
import { DEFAULT_VEHICLE, type Stop, type VehicleProfile } from './model';
import {
  budgetByCategory, formatRand, fuelCostCents, fuelLitres, sumCents, usableRangeM
} from './money';

const vehicle: VehicleProfile = {
  label: 'CX-3 2.0', consumptionL100km: 7.2, tankLitres: 44, fuelPriceCentsPerLitre: 2199
};

const stop = (kind: Stop['kind'], costCents?: number): Stop => ({
  id: 's' as Stop['id'],
  dayId: 'd' as Stop['dayId'],
  order: 'a' as Stop['order'],
  place: { name: 'x', at: [18, -33] },
  kind,
  dwellMinutes: null,
  costCents,
  booking: { kind: 'none' }
});

describe('fuel derivation', () => {
  it('costs a 100km leg at exactly one consumption figure of fuel', () => {
    expect(fuelLitres(100_000, vehicle)).toBeCloseTo(7.2, 10);
    expect(fuelCostCents(100_000, vehicle)).toBe(Math.round(7.2 * 2199));
  });

  it('returns an integer number of cents', () => {
    for (const metres of [1, 999, 12_345, 318_000, 1_000_001]) {
      expect(Number.isInteger(fuelCostCents(metres, vehicle))).toBe(true);
    }
  });

  it('costs nothing for no distance', () => {
    expect(fuelCostCents(0, vehicle)).toBe(0);
  });

  it('prices Cape Town to Oudtshoorn in the right order of magnitude', () => {
    const cents = fuelCostCents(318_000, vehicle);
    expect(cents).toBeGreaterThan(45_000);
    expect(cents).toBeLessThan(55_000);
  });
});

describe('usableRangeM', () => {
  it('is 85 percent of a full tank', () => {
    expect(usableRangeM(vehicle)).toBeCloseTo((44 * 0.85 / 7.2) * 100_000, 6);
  });

  it('is shorter than the theoretical full-tank range', () => {
    const full = (vehicle.tankLitres / vehicle.consumptionL100km) * 100_000;
    expect(usableRangeM(vehicle)).toBeLessThan(full);
  });

  it('shrinks when the car drinks more', () => {
    const thirsty = { ...vehicle, consumptionL100km: 14.4 };
    expect(usableRangeM(thirsty)).toBeCloseTo(usableRangeM(vehicle) / 2, 6);
  });

  it('agrees with the default profile shipped with a new trip', () => {
    expect(usableRangeM(DEFAULT_VEHICLE)).toBeGreaterThan(400_000);
  });
});

describe('budgetByCategory', () => {
  it('files each stop under its kind and ignores kinds with no budget', () => {
    const totals = budgetByCategory([
      stop('overnight', 120_000),
      stop('meal', 24_500),
      stop('meal', 15_000),
      stop('fuel', 90_000),
      stop('waypoint', 999_999),
      stop('sight')
    ]);
    expect(totals).toEqual({
      accommodation: 120_000, activities: 0, food: 39_500, fuel: 90_000, other: 0
    });
  });
});

describe('cents formatting', () => {
  it('sums undefined costs as zero', () => {
    expect(sumCents([100, undefined, 250])).toBe(350);
  });

  it('renders rand with a minus sign that is not a hyphen', () => {
    expect(formatRand(51_200)).toBe('R 512');
    expect(formatRand(-51_200).startsWith('−')).toBe(true);
  });
});
