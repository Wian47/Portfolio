/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { Position } from './model';
import { fail, ok, parseFiniteNumber, type Parsed } from './parse';

/**
 * The coordinate boundary. MapLibre, OpenRouteService and Photon all speak
 * [longitude, latitude]; Nominatim answers with `lat` and `lon` as strings.
 * Every one of those shapes converts here and nowhere else, because a silent
 * swap does not throw, it just puts Cape Town in the Indian Ocean.
 */

export const MAX_LAT = 90;
export const MAX_LON = 180;

export const parsePosition = (v: unknown): Parsed<Position> => {
  if (!Array.isArray(v) || v.length !== 2) return fail('expected [lon, lat]');
  const lon = parseFiniteNumber(v[0]);
  if (!lon.ok) return fail(`lon: ${lon.error}`);
  const lat = parseFiniteNumber(v[1]);
  if (!lat.ok) return fail(`lat: ${lat.error}`);
  return positionFromLonLat(lon.value, lat.value);
};

export const positionFromLonLat = (lon: number, lat: number): Parsed<Position> => {
  if (Math.abs(lat) > MAX_LAT) return fail(`lat ${lat} is outside ±90, arguments look swapped`);
  if (Math.abs(lon) > MAX_LON) return fail(`lon ${lon} is outside ±180`);
  return ok([lon, lat] as Position);
};

/** For providers that answer latitude first. */
export const positionFromLatLon = (lat: number, lon: number): Parsed<Position> =>
  positionFromLonLat(lon, lat);

/** For Nominatim, which sends both as strings. */
export const positionFromLatLonStrings = (lat: string, lon: string): Parsed<Position> => {
  const parsedLat = Number(lat);
  const parsedLon = Number(lon);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLon)) {
    return fail(`unparseable coordinate pair "${lat}", "${lon}"`);
  }
  return positionFromLonLat(parsedLon, parsedLat);
};

/**
 * Five decimal places is roughly a metre, which is finer than any pin you can
 * place by hand and coarse enough that a jittered drag reuses the cached leg.
 */
export const roundPosition = ([lon, lat]: Position): Position =>
  [Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5] as Position;

export const positionKey = (p: Position): string => {
  const [lon, lat] = roundPosition(p);
  return `${lon.toFixed(5)},${lat.toFixed(5)}`;
};

/**
 * A coordinate pair off the clipboard. Google Maps and Apple Maps both copy
 * latitude first, so that is the order accepted here, and it is the one place
 * in the app where a pair is not lon-first.
 */
export const parsePastedCoordinates = (raw: string): Parsed<Position> => {
  const match = /^\s*(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(raw);
  if (match === null) return fail('expected "latitude, longitude"');
  return positionFromLatLon(Number(match[1]), Number(match[2]));
};
