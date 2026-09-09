/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { describe, expect, it } from 'vitest';
import {
  parsePastedCoordinates, parsePosition, positionFromLatLon, positionFromLatLonStrings,
  positionFromLonLat, positionKey, roundPosition
} from './geo';

/** Cape Town city hall, the fixture every provider below is checked against. */
const CAPE_TOWN = { lon: 18.4172, lat: -33.9288 };

const unwrap = <T,>(r: { ok: true; value: T } | { ok: false; error: string }): T => {
  if (!r.ok) throw new Error(r.error);
  return r.value;
};

describe('the coordinate boundary', () => {
  it('reads a GeoJSON pair as lon then lat', () => {
    expect(unwrap(parsePosition([CAPE_TOWN.lon, CAPE_TOWN.lat]))).toEqual([18.4172, -33.9288]);
  });

  it('agrees across every provider shape', () => {
    const fromGeoJson = unwrap(parsePosition([CAPE_TOWN.lon, CAPE_TOWN.lat]));
    const fromLonLat = unwrap(positionFromLonLat(CAPE_TOWN.lon, CAPE_TOWN.lat));
    const fromLatLon = unwrap(positionFromLatLon(CAPE_TOWN.lat, CAPE_TOWN.lon));
    const fromStrings = unwrap(positionFromLatLonStrings('-33.9288', '18.4172'));
    expect(fromLonLat).toEqual(fromGeoJson);
    expect(fromLatLon).toEqual(fromGeoJson);
    expect(fromStrings).toEqual(fromGeoJson);
  });

  it('catches a swapped pair when the latitude cannot be one', () => {
    const swapped = parsePosition([CAPE_TOWN.lat, CAPE_TOWN.lon]);
    expect(swapped.ok).toBe(true);

    const swappedJohannesburg = parsePosition([-26.2041, 128.0473]);
    expect(swappedJohannesburg.ok).toBe(false);
    if (!swappedJohannesburg.ok) expect(swappedJohannesburg.error).toContain('swapped');
  });

  it('rejects a latitude past the pole whichever door it comes in', () => {
    expect(positionFromLonLat(18, 91).ok).toBe(false);
    expect(positionFromLatLon(91, 18).ok).toBe(false);
    expect(positionFromLatLonStrings('91', '18').ok).toBe(false);
  });

  it('rejects malformed input rather than coercing it', () => {
    expect(parsePosition(null).ok).toBe(false);
    expect(parsePosition([18]).ok).toBe(false);
    expect(parsePosition([18, -33, 5]).ok).toBe(false);
    expect(parsePosition(['18.4', '-33.9']).ok).toBe(false);
    expect(parsePosition([18, Number.NaN]).ok).toBe(false);
    expect(positionFromLatLonStrings('south', 'east').ok).toBe(false);
  });
});

describe('cache-key rounding', () => {
  it('rounds to five places, about a metre', () => {
    expect(roundPosition([18.41723456, -33.92881234])).toEqual([18.41723, -33.92881]);
  });

  it('gives a jittered drag the same key', () => {
    expect(positionKey([18.417230001, -33.928810001])).toBe(positionKey([18.4172300009, -33.9288100004]));
  });

  it('keeps distinct places distinct', () => {
    expect(positionKey([18.4172, -33.9288])).not.toBe(positionKey([18.4173, -33.9288]));
  });
});

describe('pasted coordinates', () => {
  it('reads the latitude-first order the map apps copy', () => {
    expect(unwrap(parsePastedCoordinates('-33.9288, 18.4172'))).toEqual([18.4172, -33.9288]);
    expect(unwrap(parsePastedCoordinates('-33.9288 18.4172'))).toEqual([18.4172, -33.9288]);
    expect(unwrap(parsePastedCoordinates('  -33.9288,18.4172  '))).toEqual([18.4172, -33.9288]);
  });

  it('rejects a pair that cannot be a latitude first', () => {
    expect(parsePastedCoordinates('128.0473, -26.2041').ok).toBe(false);
  });

  it('rejects anything that is not two numbers', () => {
    for (const raw of ['', 'Cape Town', '18.4172', '1,2,3', '1, two']) {
      expect(parsePastedCoordinates(raw).ok).toBe(false);
    }
  });
});
