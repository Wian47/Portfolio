/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { Place } from './model';
import { parsePosition } from './geo';
import { at, fail, isRecord, ok, type Parsed } from './parse';
import { LIMITS } from './validate';

/**
 * Photon's GeoJSON, converted into places. Photon fills in whichever fields it
 * happens to know: a village answer carries no `street`, a house answer carries
 * no `name`, and both shapes come back from the same endpoint. Nothing here may
 * assume a property exists.
 */

/** A hostile or broken upstream does not get to hand the Worker an unbounded list. */
const MAX_FEATURES = 20;

const TEXT_KEYS = [
  'name', 'housenumber', 'street', 'district', 'locality',
  'city', 'county', 'state', 'country'
] as const;

type PhotonText = Partial<Record<(typeof TEXT_KEYS)[number], string>>;

const readText = (v: unknown): PhotonText => {
  const text: PhotonText = {};
  if (!isRecord(v)) return text;
  for (const key of TEXT_KEYS) {
    const value = v[key];
    if (typeof value === 'string' && value.trim().length > 0) text[key] = value.trim();
  }
  return text;
};

/** A house number locates nothing on its own, so it only appears beside its street. */
const streetLine = (t: PhotonText): string | undefined =>
  t.street === undefined
    ? undefined
    : t.housenumber === undefined
      ? t.street
      : `${t.housenumber} ${t.street}`;

/** Photon leaves `name` out of a plain street address, where the street is the name. */
const NAME_PARTS: readonly ((t: PhotonText) => string | undefined)[] = [
  (t) => t.name,
  streetLine,
  (t) => t.city,
  (t) => t.county,
  (t) => t.state,
  (t) => t.country
];

/**
 * Decreasing specificity. Photon answers a village with the same word in `name`
 * and `city`, and sometimes in `county` as well, so the line is these parts in
 * order minus everything already said.
 */
const ADDRESS_PARTS: readonly ((t: PhotonText) => string | undefined)[] = [
  streetLine,
  (t) => t.district,
  (t) => t.locality,
  (t) => t.city,
  (t) => t.county,
  (t) => t.state,
  (t) => t.country
];

const firstPresent = (
  parts: readonly ((t: PhotonText) => string | undefined)[],
  text: PhotonText
): string | undefined => {
  for (const part of parts) {
    const value = part(text);
    if (value !== undefined) return value;
  }
  return undefined;
};

const addressLine = (text: PhotonText, name: string): string | undefined => {
  const said = new Set([name.toLowerCase()]);
  const line: string[] = [];
  for (const part of ADDRESS_PARTS) {
    const value = part(text);
    if (value === undefined) continue;
    if (said.has(value.toLowerCase())) continue;
    said.add(value.toLowerCase());
    line.push(value);
  }
  return line.length === 0 ? undefined : line.join(', ');
};

export const parsePhotonFeature = (v: unknown): Parsed<Place> => {
  if (!isRecord(v)) return fail('expected an object');
  if (!isRecord(v.geometry)) return fail('geometry: expected an object');
  if (v.geometry.type !== 'Point') {
    return fail(`geometry: expected a Point, got ${String(v.geometry.type)}`);
  }

  const position = at('geometry.coordinates', parsePosition(v.geometry.coordinates));
  if (!position.ok) return position;

  const text = readText(v.properties);
  const name = firstPresent(NAME_PARTS, text);
  if (name === undefined) return fail('properties: nothing here names the place');
  if (name.length > LIMITS.title) return fail(`properties: name is longer than ${LIMITS.title} characters`);

  return ok({ name, address: addressLine(text, name), at: position.value });
};

/**
 * One unusable feature drops out rather than failing the search. A provider that
 * answers one of eight results with a broken geometry costs that result, not the
 * whole query.
 */
export const parsePhotonPlaces = (v: unknown): Parsed<Place[]> => {
  if (!isRecord(v)) return fail('expected a GeoJSON object');
  if (v.type !== 'FeatureCollection') {
    return fail(`expected a FeatureCollection, got ${String(v.type)}`);
  }
  if (!Array.isArray(v.features)) return fail('features: expected an array');

  const places: Place[] = [];
  for (const feature of v.features.slice(0, MAX_FEATURES)) {
    const parsed = parsePhotonFeature(feature);
    if (parsed.ok) places.push(parsed.value);
  }
  return ok(places);
};
