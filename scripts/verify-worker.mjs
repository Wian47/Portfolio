/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Drives the Worker's API against a local D1 database and a local key server,
 * so the Access verification, the version check and the idempotency replay are
 * all exercised for real before anything is deployed.
 *
 * The key server mints RS256 assertions with a keypair generated per run and
 * serves the matching JWKS, which is the same path Cloudflare's certs endpoint
 * takes. Nothing here talks to Cloudflare, the internet, or production.
 *
 *   node scripts/verify-worker.mjs
 */

import { randomUUID } from 'node:crypto';
import {
  PHOTON_PORT, WORKER_PORT, applyMigrations, resetLocalState, startKeyServer, startPhotonStub,
  startWorker
} from './dev-stack.mjs';

const BASE = `http://127.0.0.1:${WORKER_PORT}`;

let mint = null;

let failures = 0;
let checks = 0;

const check = (label, condition, detail = '') => {
  checks += 1;
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}${detail ? ` -- ${detail}` : ''}`);
  }
};

const call = async (path, { method = 'GET', token = undefined, body, headers = {} } = {}) => {
  const assertion = token === undefined ? mint() : token;
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(assertion === null ? {} : { 'cf-access-jwt-assertion': assertion }),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let json = null;
  try { json = text.length > 0 ? JSON.parse(text) : null; } catch { json = null; }
  return { status: response.status, headers: response.headers, text, json };
};

const sampleTrip = (id) => ({
  id,
  title: 'Cape Town to Oudtshoorn',
  currency: 'ZAR',
  vehicle: { label: 'CX-3 2.0', consumptionL100km: 7.2, tankLitres: 44, fuelPriceCentsPerLitre: 2199 },
  defaultRoutePref: { profile: 'fastest', avoid: [] },
  days: [{ id: 'day-1', order: 'V', date: null, departAt: '07:00' }],
  stops: [{
    id: 'stop-1',
    dayId: 'day-1',
    order: 'V',
    place: { name: 'Cape Town', at: [18.4172, -33.9288] },
    kind: 'overnight',
    dwellMinutes: null,
    booking: { kind: 'none' }
  }],
  createdAt: '2026-09-09T05:00:00Z',
  updatedAt: '2026-09-09T05:00:00Z'
});

let worker = null;
let keys = null;
let photon = null;

const run = async () => {
  console.log('access');
  check('no assertion is refused', (await call('/build/api/trips', { token: null })).status === 403);
  check('tampered signature is refused', (await call('/build/api/trips', { token: mint({}, { tamper: true }) })).status === 403);
  check('unknown signing key is refused', (await call('/build/api/trips', { token: mint({}, { kid: 'nope' }) })).status === 403);
  check('wrong audience is refused', (await call('/build/api/trips', { token: mint({ aud: ['someone-else'] }) })).status === 403);
  check('wrong issuer is refused', (await call('/build/api/trips', { token: mint({ iss: 'https://evil.example' }) })).status === 403);
  check('expired assertion is refused', (await call('/build/api/trips', { token: mint({ exp: Math.floor(Date.now() / 1000) - 3600 }) })).status === 403);
  check('another signed-in account is refused', (await call('/build/api/trips', { token: mint({ email: 'someone@example.com' }) })).status === 403);
  const forbidden = await call('/build/api/trips', { token: null });
  check('a refusal has no body to learn from', forbidden.text.length === 0);
  check('the owner is let in', (await call('/build/api/trips')).status === 200);
  check('the cookie Access sets also works', (await call('/build/api/trips', {
    token: null, headers: { cookie: `CF_Authorization=${mint()}` }
  })).status === 200);

  console.log('routing');
  check('an unknown API route is 404', (await call('/build/api/nope')).status === 404);
  check('a wrong method is 405', (await call('/build/api/trips', { method: 'DELETE' })).status === 405);
  const asset = await fetch(`${BASE}/`);
  check('the portfolio still serves from the asset store', asset.status === 200,
    `got ${asset.status}`);

  console.log('trips');
  const id = randomUUID();
  const created = await call('/build/api/trips', { method: 'POST', body: sampleTrip(id) });
  check('create returns 201 at version 1', created.status === 201 && created.json?.version === 1,
    `status ${created.status} ${created.text.slice(0, 200)}`);
  check('create sets an ETag', created.headers.get('etag') === '"1"');

  const rejected = await call('/build/api/trips', {
    method: 'POST',
    body: { ...sampleTrip(randomUUID()), stops: [{ ...sampleTrip('x').stops[0], place: { name: 'swapped', at: [-26.2041, 128.0473] } }] }
  });
  check('a swapped coordinate pair is refused', rejected.status === 422, rejected.text.slice(0, 200));

  const duplicate = await call('/build/api/trips', { method: 'POST', body: sampleTrip(id) });
  check('creating the same id twice is a conflict', duplicate.status === 409);

  const fetched = await call(`/build/api/trips/${id}`);
  check('the document round-trips intact',
    fetched.status === 200 && fetched.json?.trip?.stops?.[0]?.place?.at?.[0] === 18.4172,
    fetched.text.slice(0, 200));

  const listed = await call('/build/api/trips');
  check('the trip appears in the list', listed.json?.trips?.some((t) => t.id === id));

  console.log('concurrency');
  const edited = { ...sampleTrip(id), title: 'Cape Town to Knysna' };
  check('a write with no If-Match is refused',
    (await call(`/build/api/trips/${id}`, { method: 'PUT', body: edited })).status === 428);

  const stale = await call(`/build/api/trips/${id}`, {
    method: 'PUT', body: edited, headers: { 'if-match': '"99"' }
  });
  check('a stale version is a 409', stale.status === 409);
  check('the 409 carries the current document back', stale.json?.version === 1,
    stale.text.slice(0, 200));

  const replaced = await call(`/build/api/trips/${id}`, {
    method: 'PUT', body: edited, headers: { 'if-match': '"1"' }
  });
  check('a matching version writes and bumps to 2', replaced.status === 200 && replaced.json?.version === 2,
    replaced.text.slice(0, 200));

  const wrongId = await call(`/build/api/trips/${id}`, {
    method: 'PUT', body: sampleTrip(randomUUID()), headers: { 'if-match': '"2"' }
  });
  check('a body whose id differs from the path is refused', wrongId.status === 400);

  const invalid = await call(`/build/api/trips/${id}`, {
    method: 'PUT', body: { ...edited, days: [] }, headers: { 'if-match': '"2"' }
  });
  check('a stop on a deleted day is refused', invalid.status === 422, invalid.text.slice(0, 200));

  console.log('idempotency');
  const mutationId = randomUUID();
  const once = await call(`/build/api/trips/${id}`, {
    method: 'PUT', body: { ...edited, title: 'Retried' },
    headers: { 'if-match': '"2"', 'x-mutation-id': mutationId }
  });
  const twice = await call(`/build/api/trips/${id}`, {
    method: 'PUT', body: { ...edited, title: 'Retried' },
    headers: { 'if-match': '"2"', 'x-mutation-id': mutationId }
  });
  check('the first attempt writes', once.status === 200 && once.json?.version === 3, once.text.slice(0, 200));
  check('the retry replays rather than reapplying',
    twice.status === 200 && twice.json?.version === 3 && twice.headers.get('x-idempotent-replay') === '1',
    `${twice.status} replay=${twice.headers.get('x-idempotent-replay')}`);
  const afterRetry = await call(`/build/api/trips/${id}`);
  check('the version did not advance twice', afterRetry.json?.version === 3,
    afterRetry.text.slice(0, 200));

  console.log('archive');
  check('archiving returns 204', (await call(`/build/api/trips/${id}`, { method: 'DELETE' })).status === 204);
  check('an archived trip is gone', (await call(`/build/api/trips/${id}`)).status === 404);
  const afterArchive = await call('/build/api/trips');
  check('an archived trip leaves the list', !afterArchive.json?.trips?.some((t) => t.id === id));
  check('archiving twice is 404', (await call(`/build/api/trips/${id}`, { method: 'DELETE' })).status === 404);

  console.log('geocode');
  check('an unauthenticated search is refused',
    (await call('/build/api/geocode?q=Barrydale', { token: null })).status === 403);
  check('nothing was asked of Photon on the way to that refusal', photon.seen.length === 0);

  const found = await call('/build/api/geocode?q=Barrydale');
  const place = found.json?.places?.[0];
  check('a search returns places', found.status === 200 && found.json?.places?.length === 1,
    found.text.slice(0, 200));
  check('the coordinate comes back longitude first',
    place?.at?.[0] === 20.7175 && place?.at?.[1] === -33.9053, JSON.stringify(place?.at));
  check('the place keeps the name Photon gave it', place?.name === 'Barrydale');
  check('the address says where it is without repeating its name',
    place?.address === 'Overberg District Municipality, Western Cape, South Africa', place?.address);

  const asked = photon.seen.at(-1);
  check('the search went to Photon once', photon.seen.length === 1);
  check('the result count is capped at 8', asked?.query.get('limit') === '8');
  check('the User-Agent identifies the site',
    asked?.userAgent.includes('wianschoeman.com'), asked?.userAgent);
  check('the User-Agent carries no email address',
    !asked?.userAgent.includes('@'), asked?.userAgent);

  const repeated = await call('/build/api/geocode?q=%20%20BARRYDALE%20');
  check('the same query in another case and spacing is served from KV',
    repeated.status === 200 && photon.seen.length === 1,
    `${photon.seen.length} upstream requests`);
  check('the cached answer is the answer that was cached', repeated.text === found.text);

  const biased = await call('/build/api/geocode?q=Barrydale&near=18.42,-33.93');
  const withBias = photon.seen.at(-1);
  check('a bias point is a different question, and is asked', biased.status === 200 && photon.seen.length === 2);
  check('the bias reaches Photon as lat and lon',
    withBias?.query.get('lat') === '-33.93' && withBias?.query.get('lon') === '18.42',
    String(withBias?.query));

  const nothing = await call('/build/api/geocode?q=nowhere%20at%20all');
  check('a query that matches nothing is an empty list, not an error',
    nothing.status === 200 && Array.isArray(nothing.json?.places) && nothing.json.places.length === 0,
    nothing.text.slice(0, 200));

  check('a blank q is refused', (await call('/build/api/geocode?q=%20%20')).status === 400);
  check('a missing q is refused', (await call('/build/api/geocode')).status === 400);
  check('an oversized q is refused', (await call(`/build/api/geocode?q=${'a'.repeat(500)}`)).status === 400);
  check('a half-written near is refused', (await call('/build/api/geocode?q=Barrydale&near=18.42')).status === 400);
  check('a near past the pole is refused', (await call('/build/api/geocode?q=Barrydale&near=18.42,-99')).status === 400);
  check('a refused request never reached Photon', photon.seen.length === 3,
    `${photon.seen.length} upstream requests`);

  console.log('geocode upstream failure (the Worker error logged below is the point)');
  const broken = await call('/build/api/geocode?q=boom');
  check('an upstream failure is a 502, not a 500',
    broken.status === 502 && broken.json?.error === 'geocode_upstream', broken.text.slice(0, 200));
  const afterFailure = photon.seen.length;
  const retried = await call('/build/api/geocode?q=boom');
  check('a failure is not cached, so the retry tries again',
    retried.status === 502 && photon.seen.length === afterFailure + 1,
    `${photon.seen.length - afterFailure} upstream requests`);

  console.log('reverse');
  const reversed = await call('/build/api/reverse?at=22.204206,-33.59029');
  check('reverse names the point', reversed.status === 200 && reversed.json?.place?.name === 'Oudtshoorn',
    reversed.text.slice(0, 200));
  check('reverse keeps the coordinate longitude first',
    reversed.json?.place?.at?.[0] === 22.204206 && reversed.json?.place?.at?.[1] === -33.5902954,
    JSON.stringify(reversed.json?.place?.at));
  check('reverse describes it without repeating the name',
    reversed.json?.place?.address === 'George, Western Cape, South Africa',
    reversed.json?.place?.address);

  const reverseCalls = photon.seen.length;
  check('the same point again is served from KV',
    (await call('/build/api/reverse?at=22.204206,-33.59029')).status === 200
      && photon.seen.length === reverseCalls);

  const empty = await call('/build/api/reverse?at=0,0');
  check('a point with nothing near it is a null place',
    empty.status === 200 && empty.json?.place === null, empty.text.slice(0, 200));

  check('a malformed at is refused', (await call('/build/api/reverse?at=nonsense')).status === 400);
  check('half a coordinate is refused', (await call('/build/api/reverse?at=22.2')).status === 400);
  check('an empty coordinate is refused', (await call('/build/api/reverse?at=%2C')).status === 400);
  check('a latitude past the pole is refused', (await call('/build/api/reverse?at=22.2,120')).status === 400);
  check('a missing at is refused', (await call('/build/api/reverse')).status === 400);
};

const main = async () => {
  await resetLocalState();
  await applyMigrations();
  keys = await startKeyServer();
  mint = keys.mint;
  photon = await startPhotonStub();
  worker = await startWorker({ photonPort: PHOTON_PORT });
  await run();
};

main()
  .catch((error) => {
    failures += 1;
    console.error(error);
  })
  .finally(() => {
    worker?.stop();
    keys?.close();
    photon?.close();
    console.log(`\n${checks - failures}/${checks} checks passed`);
    process.exit(failures === 0 ? 0 : 1);
  });
