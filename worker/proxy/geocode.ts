/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { Place, Position } from '../../trip/model';
import { positionFromLonLat, positionKey, roundPosition } from '../../trip/geo';
import { fail, ok, type Parsed } from '../../trip/parse';
import { parsePhotonPlaces } from '../../trip/photon';
import { getOrFetch } from '../cache';
import { json, problem, type Env } from '../http';

/**
 * Photon publishes a fair-use policy rather than a quota, so every answer is
 * cached and every request says who is asking. A forward search is cached for a
 * week. A reverse lookup names a fixed point on the earth and is cached for a
 * month.
 */

const DEFAULT_UPSTREAM = 'https://photon.komoot.io';

/** Identifies the site to Photon's operators. Carries no contact address on purpose. */
const USER_AGENT = 'wianschoeman.com trip planner';

const TIMEOUT_MS = 5_000;
const FORWARD_TTL_SECONDS = 60 * 60 * 24 * 7;
const REVERSE_TTL_SECONDS = 60 * 60 * 24 * 30;
const RESULT_LIMIT = 8;
const MAX_QUERY_LENGTH = 200;

/** These two need the request and the bindings, and nothing the router knows. */
interface ProxyCtx {
  request: Request;
  env: Env;
}

/**
 * The normalised query is both the cache key and the string sent upstream, so
 * "Barrydale " and "barrydale" cost one fetch between them rather than one each.
 */
const normaliseQuery = (raw: string | null): Parsed<string> => {
  if (raw === null) return fail('q is required');
  const query = raw.trim().replace(/\s+/g, ' ').toLowerCase();
  if (query.length === 0) return fail('q is blank');
  if (query.length > MAX_QUERY_LENGTH) return fail(`q is longer than ${MAX_QUERY_LENGTH} characters`);
  return ok(query);
};

/** Rounded here so the key and the coordinate actually asked about cannot disagree. */
const parseLonLat = (raw: string): Parsed<Position> => {
  const parts = raw.split(',').map((part) => part.trim());
  if (parts.length !== 2 || parts.some((part) => part.length === 0)) {
    return fail('expected "lon,lat"');
  }
  const lon = Number(parts[0]);
  const lat = Number(parts[1]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return fail(`unreadable pair "${raw}"`);
  const position = positionFromLonLat(lon, lat);
  return position.ok ? ok(roundPosition(position.value)) : position;
};

const parseBias = (raw: string | null): Parsed<Position | undefined> =>
  raw === null ? ok(undefined) : parseLonLat(raw);

const origin = (env: Env): string => (env.GEOCODE_UPSTREAM ?? DEFAULT_UPSTREAM).replace(/\/+$/, '');

const forwardUrl = (env: Env, query: string, near: Position | undefined): string => {
  const url = new URL(`${origin(env)}/api/`);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', String(RESULT_LIMIT));
  if (near !== undefined) {
    url.searchParams.set('lon', String(near[0]));
    url.searchParams.set('lat', String(near[1]));
  }
  return url.toString();
};

const reverseUrl = (env: Env, at: Position): string => {
  const url = new URL(`${origin(env)}/reverse`);
  url.searchParams.set('lon', String(at[0]));
  url.searchParams.set('lat', String(at[1]));
  return url.toString();
};

/**
 * Throws on anything short of a parsed answer, which is what keeps a failure out
 * of KV: `getOrFetch` stores what this returns, and it returned nothing.
 */
const fetchPlaces = async (url: string): Promise<Place[]> => {
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`photon answered ${response.status}`);
  const parsed = parsePhotonPlaces(await response.json());
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
};

export const handleGeocode = async ({ request, env }: ProxyCtx): Promise<Response> => {
  const params = new URL(request.url).searchParams;

  const query = normaliseQuery(params.get('q'));
  if (!query.ok) return problem(400, 'bad_query', query.error);
  const near = parseBias(params.get('near'));
  if (!near.ok) return problem(400, 'bad_near', near.error);

  const key = near.value === undefined
    ? `geocode:${query.value}`
    : `geocode:${query.value}@${positionKey(near.value)}`;
  const upstream = forwardUrl(env, query.value, near.value);

  try {
    const places = await getOrFetch(env.CACHE, key, FORWARD_TTL_SECONDS, () => fetchPlaces(upstream));
    return json({ places });
  } catch (error) {
    console.error('geocode', error);
    return problem(502, 'geocode_upstream');
  }
};

export const handleReverse = async ({ request, env }: ProxyCtx): Promise<Response> => {
  const raw = new URL(request.url).searchParams.get('at');
  if (raw === null) return problem(400, 'bad_at', 'at is required');
  const at = parseLonLat(raw);
  if (!at.ok) return problem(400, 'bad_at', at.error);

  const upstream = reverseUrl(env, at.value);

  try {
    const places = await getOrFetch(
      env.CACHE, `reverse:${positionKey(at.value)}`, REVERSE_TTL_SECONDS, () => fetchPlaces(upstream)
    );
    return json({ place: places[0] ?? null });
  } catch (error) {
    console.error('reverse', error);
    return problem(502, 'geocode_upstream');
  }
};
