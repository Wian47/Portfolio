/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { describe, expect, it } from 'vitest';
import type { Place } from './model';
import { parsePhotonFeature, parsePhotonPlaces } from './photon';

/**
 * The fixtures are the property sets Photon actually answered with on
 * 2026-09-09, not an idealised shape. The village result has no `street` and no
 * `housenumber`, because Photon only sends those for an addressed result.
 */

const feature = (coordinates: unknown, properties: Record<string, unknown>) =>
  ({ type: 'Feature', geometry: { type: 'Point', coordinates }, properties });

const collection = (...features: unknown[]) => ({ type: 'FeatureCollection', features });

const village = feature([20.7175, -33.9053], {
  osm_id: 26744017, osm_key: 'place', osm_value: 'village', type: 'district',
  countrycode: 'ZA', name: 'Barrydale', city: 'Barrydale',
  county: 'Overberg District Municipality', postcode: '6750',
  state: 'Western Cape', country: 'South Africa'
});

const house = feature([22.2013, -33.5923], {
  osm_id: 1120384, osm_key: 'building', osm_value: 'yes', type: 'house',
  countrycode: 'ZA', housenumber: '12', street: 'Baron van Reede Street',
  city: 'Oudtshoorn', postcode: '6625', state: 'Western Cape', country: 'South Africa'
});

const museum = feature([22.2036, -33.5895], {
  osm_id: 4470137, osm_key: 'tourism', osm_value: 'museum', type: 'house',
  countrycode: 'ZA', name: 'CP Nel Museum', housenumber: '3',
  street: 'Baron van Reede Street', city: 'Oudtshoorn',
  state: 'Western Cape', country: 'South Africa'
});

const places = (v: unknown): Place[] => {
  const parsed = parsePhotonPlaces(v);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
};

const only = (v: unknown): Place => {
  const all = places(v);
  expect(all).toHaveLength(1);
  return all[0];
};

describe('a village, which Photon answers without a street', () => {
  it('takes its name from the name property', () => {
    expect(only(collection(village)).name).toBe('Barrydale');
  });

  it('reads the coordinate pair longitude first', () => {
    expect(only(collection(village)).at).toEqual([20.7175, -33.9053]);
  });

  it('describes it by what is left after the name', () => {
    expect(only(collection(village)).address)
      .toBe('Overberg District Municipality, Western Cape, South Africa');
  });
});

describe('an addressed result', () => {
  it('names a house by its street line when Photon sends no name', () => {
    expect(only(collection(house)).name).toBe('12 Baron van Reede Street');
  });

  it('does not repeat that street line in the address', () => {
    expect(only(collection(house)).address).toBe('Oudtshoorn, Western Cape, South Africa');
  });

  it('keeps a named place named, and puts its street in the address', () => {
    const place = only(collection(museum));
    expect(place.name).toBe('CP Nel Museum');
    expect(place.address).toBe('3 Baron van Reede Street, Oudtshoorn, Western Cape, South Africa');
  });

  it('drops a house number with no street to hang it on', () => {
    const orphan = feature([22.2, -33.5], { name: 'Somewhere', housenumber: '12', city: 'George' });
    expect(only(collection(orphan)).address).toBe('George');
  });
});

describe('the address line', () => {
  it('never says the same thing twice', () => {
    const repetitive = feature([22.2042, -33.5903], {
      name: 'Oudtshoorn', city: 'Oudtshoorn', county: 'Oudtshoorn',
      state: 'Western Cape', country: 'South Africa'
    });
    const place = only(collection(repetitive));
    expect(place.address).toBe('Western Cape, South Africa');

    const parts = place.address?.split(', ') ?? [];
    expect(new Set([place.name, ...parts]).size).toBe(parts.length + 1);
  });

  it('ignores a difference of case when deciding something was already said', () => {
    const shouty = feature([22.2, -33.5], { name: 'George', city: 'GEORGE', state: 'Western Cape' });
    expect(only(collection(shouty)).address).toBe('Western Cape');
  });

  it('is absent rather than empty when Photon knows nothing but the name', () => {
    expect(only(collection(feature([22.2, -33.5], { name: 'Nowhere' }))).address).toBeUndefined();
  });

  it('holds the fields the live reverse lookup returned for Oudtshoorn', () => {
    const reversed = feature([22.204206, -33.5902954], {
      name: 'Oudtshoorn', city: 'George', state: 'Western Cape', country: 'South Africa'
    });
    const place = only(collection(reversed));
    expect(place.address).toBe('George, Western Cape, South Africa');
    expect(place.at).toEqual([22.204206, -33.5902954]);
  });
});

describe('a query that matched nothing', () => {
  it('parses to no places rather than failing', () => {
    expect(places(collection())).toEqual([]);
  });
});

describe('a coordinate the boundary refuses', () => {
  it('rejects a swapped pair whose latitude cannot be one', () => {
    const swapped = feature([-33.9288, 118.4172], { name: 'Somewhere in Australia' });
    expect(parsePhotonFeature(swapped).ok).toBe(false);
    expect(places(collection(swapped))).toEqual([]);
  });

  it('drops the broken feature and keeps the good one', () => {
    const kept = places(collection(feature([18.4], { name: 'Truncated' }), village));
    expect(kept.map((p) => p.name)).toEqual(['Barrydale']);
  });

  it('refuses coordinates sent as strings, rather than coercing them', () => {
    expect(parsePhotonFeature(feature(['20.7175', '-33.9053'], { name: 'Barrydale' })).ok).toBe(false);
  });

  it('refuses a geometry that is not a point', () => {
    const line = { type: 'Feature', geometry: { type: 'LineString', coordinates: [[18, -33], [19, -34]] }, properties: { name: 'A road' } };
    expect(parsePhotonFeature(line).ok).toBe(false);
    expect(places(collection(line))).toEqual([]);
  });

  it('refuses a feature with no geometry at all', () => {
    expect(parsePhotonFeature({ type: 'Feature', properties: { name: 'Nowhere' } }).ok).toBe(false);
  });
});

describe('a payload that is not a Photon answer', () => {
  it('refuses anything but a FeatureCollection', () => {
    expect(parsePhotonPlaces(null).ok).toBe(false);
    expect(parsePhotonPlaces('barrydale').ok).toBe(false);
    expect(parsePhotonPlaces({ type: 'Feature', features: [] }).ok).toBe(false);
    expect(parsePhotonPlaces({ type: 'FeatureCollection' }).ok).toBe(false);
    expect(parsePhotonPlaces({ type: 'FeatureCollection', features: {} }).ok).toBe(false);
  });

  it('refuses a feature with nothing to name it by', () => {
    expect(parsePhotonFeature(feature([18.4172, -33.9288], { osm_id: 7, postcode: '8001' })).ok).toBe(false);
  });

  it('ignores properties that are not text', () => {
    const numeric = feature([18.4172, -33.9288], { name: 'Cape Town', city: 7, state: null, country: 'South Africa' });
    expect(only(collection(numeric)).address).toBe('South Africa');
  });

  it('caps how many features one answer can contribute', () => {
    const many = collection(...Array.from({ length: 50 }, () => village));
    expect(places(many).length).toBe(20);
  });
});
