/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { TripId } from '../trip/model';
import { nowTimestamp } from '../trip/ids';
import { parseTrip } from '../trip/validate';
import { verifyAccess, type Identity } from './access';
import { replayMutation, rememberMutation } from './cache';
import { json, noContent, problem, readJson, type Env } from './http';
import { archiveTrip, getTrip, insertTrip, listTrips, replaceTrip } from './trips';

/**
 * The API lives under `/build/api/*` so it inherits the Cloudflare Access rule
 * already protecting `/build`. A sibling path would need a second Access
 * destination and a second chance to misconfigure it.
 */
const API_PREFIX = '/build/api/';

interface Ctx {
  request: Request;
  env: Env;
  params: readonly string[];
  identity: Identity;
}

interface Route {
  method: string;
  pattern: RegExp;
  handler: (ctx: Ctx) => Promise<Response>;
}

const etag = (version: number): string => `"${version}"`;

const handleList = async ({ env }: Ctx): Promise<Response> =>
  json({ trips: await listTrips(env.DB) });

const handleCreate = async ({ request, env }: Ctx): Promise<Response> => {
  const body = await readJson(request);
  const parsed = parseTrip(body);
  if (!parsed.ok) return problem(422, 'invalid_trip', parsed.error);

  const trip = { ...parsed.value, updatedAt: nowTimestamp() };
  const created = await insertTrip(env.DB, trip);
  if (!created) return problem(409, 'trip_exists', `${trip.id} already exists`);

  return json({ trip, version: 1 }, { status: 201, headers: { etag: etag(1) } });
};

const handleGet = async ({ env, params }: Ctx): Promise<Response> => {
  const found = await getTrip(env.DB, params[0] as TripId);
  if (found === null) return problem(404, 'no_such_trip');
  return json(found, { headers: { etag: etag(found.version) } });
};

const handleReplace = async ({ request, env, params }: Ctx): Promise<Response> => {
  const id = params[0] as TripId;

  const ifMatch = request.headers.get('if-match');
  if (ifMatch === null) return problem(428, 'if_match_required');
  const expected = Number(ifMatch.replace(/^W\//, '').replace(/"/g, ''));
  if (!Number.isInteger(expected) || expected < 1) return problem(400, 'bad_if_match', ifMatch);

  const parsed = parseTrip(await readJson(request));
  if (!parsed.ok) return problem(422, 'invalid_trip', parsed.error);
  if (parsed.value.id !== id) return problem(400, 'id_mismatch', 'body id differs from the path');

  const trip = { ...parsed.value, updatedAt: nowTimestamp() };
  const result = await replaceTrip(env.DB, id, trip, expected);

  switch (result.kind) {
    case 'replaced':
      return json({ trip, version: result.version }, { headers: { etag: etag(result.version) } });
    case 'missing':
      return problem(404, 'no_such_trip');
    case 'conflict':
      return json(result.current, {
        status: 409,
        headers: { etag: etag(result.current.version) }
      });
  }
};

const handleArchive = async ({ env, params }: Ctx): Promise<Response> => {
  const archived = await archiveTrip(env.DB, params[0] as TripId, nowTimestamp());
  return archived ? noContent() : problem(404, 'no_such_trip');
};

/**
 * A table rather than a switch, so the whole surface is readable in one place
 * and adding a route cannot forget its method.
 */
const ROUTES: readonly Route[] = [
  { method: 'GET', pattern: /^\/build\/api\/trips$/, handler: handleList },
  { method: 'POST', pattern: /^\/build\/api\/trips$/, handler: handleCreate },
  { method: 'GET', pattern: /^\/build\/api\/trips\/([^/]+)$/, handler: handleGet },
  { method: 'PUT', pattern: /^\/build\/api\/trips\/([^/]+)$/, handler: handleReplace },
  { method: 'DELETE', pattern: /^\/build\/api\/trips\/([^/]+)$/, handler: handleArchive }
];

const MUTATING = new Set(['POST', 'PUT', 'DELETE']);

const handleApi = async (request: Request, env: Env, pathname: string): Promise<Response> => {
  const access = await verifyAccess(request, env);
  if (!access.ok) return problem(403, 'forbidden');

  let pathMatched = false;
  for (const route of ROUTES) {
    const match = route.pattern.exec(pathname);
    if (match === null) continue;
    pathMatched = true;
    if (route.method !== request.method) continue;

    const ctx: Ctx = {
      request,
      env,
      params: match.slice(1).map(decodeURIComponent),
      identity: access.identity
    };

    const mutationId = request.headers.get('x-mutation-id');
    if (!MUTATING.has(request.method) || mutationId === null) return route.handler(ctx);

    const replayed = await replayMutation(env.CACHE, mutationId);
    if (replayed !== null) return replayed;
    return rememberMutation(env.CACHE, mutationId, await route.handler(ctx));
  }

  return pathMatched ? problem(405, 'method_not_allowed') : problem(404, 'no_such_route');
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith(API_PREFIX)) return env.ASSETS.fetch(request);

    try {
      return await handleApi(request, env, pathname);
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof RangeError) {
        return problem(400, 'bad_request', error.message);
      }
      console.error('unhandled', error);
      return problem(500, 'internal_error');
    }
  }
} satisfies ExportedHandler<Env>;
