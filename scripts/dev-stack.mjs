/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Runs the whole stack locally: a local Access key server, the Worker against a
 * local D1, and the built site served from the same origin as the API, which is
 * how production is arranged.
 *
 * Cloudflare Access does not exist locally, so the browser has no
 * CF_Authorization cookie and every API call would be refused. This mints one
 * against a keypair generated for the run and prints the single line to paste
 * into the browser console to install it. Nothing here weakens the Worker: the
 * signature, audience, issuer, expiry and owner-email checks all run exactly as
 * they do in production, against a key server that happens to be on localhost.
 *
 *   npm run build && node scripts/dev-stack.mjs
 */

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { generateKeyPairSync, createSign, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';

export const WORKER_PORT = 8788;
export const JWKS_PORT = 8799;
export const PHOTON_PORT = 8797;
export const TEAM_DOMAIN = 'dev-local.cloudflareaccess.com';
export const AUD = 'aud-for-local-development';
export const OWNER = 'wian.schoeman1@gmail.com';
/**
 * Unique per run. The Worker caches a JWKS by key id, and local KV survives
 * between runs, so a fixed id would let a previous run's public key shadow this
 * run's and every assertion would fail its signature check for no visible
 * reason. Cost an afternoon once.
 */
const KID = `dev-key-${randomUUID().slice(0, 8)}`;

const b64 = (value) => Buffer.from(value).toString('base64url');

/** Generates a keypair, serves the matching JWKS, and mints owner assertions. */
export const startKeyServer = async (port = JWKS_PORT) => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: KID, alg: 'RS256', use: 'sig' };

  const server = createServer((req, res) => {
    if (req.url === '/certs') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ keys: [jwk] }));
      return;
    }
    res.writeHead(404).end();
  });
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  const mint = (claims = {}, { kid = KID, tamper = false } = {}) => {
    const now = Math.floor(Date.now() / 1000);
    const header = b64(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }));
    const payload = b64(JSON.stringify({
      aud: [AUD], email: OWNER, iss: `https://${TEAM_DOMAIN}`,
      iat: now, nbf: now - 10, exp: now + 60 * 60 * 8, ...claims
    }));
    const signature = b64(
      createSign('RSA-SHA256').update(`${header}.${payload}`).end().sign(privateKey)
    );
    return `${header}.${payload}.${tamper ? `${signature.slice(0, -2)}AA` : signature}`;
  };

  return { server, mint, close: () => server.close() };
};

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

const photonFeature = (coordinates, properties) =>
  ({ type: 'Feature', geometry: { type: 'Point', coordinates }, properties });

const photonCollection = (...features) => ({ type: 'FeatureCollection', features });

/**
 * The property sets Photon really answered with on 2026-09-09: a village with no
 * street, and the reverse lookup that named Oudtshoorn but put it in the city of
 * George. Keyed by the normalised query, so a check that changes the case or the
 * spacing of its query must still land here.
 */
const PHOTON_ANSWERS = new Map([
  ['barrydale', photonCollection(photonFeature([20.7175, -33.9053], {
    osm_id: 26744017, osm_key: 'place', osm_value: 'village', type: 'district',
    countrycode: 'ZA', name: 'Barrydale', city: 'Barrydale',
    county: 'Overberg District Municipality', postcode: '6750',
    state: 'Western Cape', country: 'South Africa'
  }))]
]);

const PHOTON_REVERSED = photonCollection(photonFeature([22.204206, -33.5902954], {
  osm_id: 26744031, osm_key: 'place', osm_value: 'town', type: 'district',
  countrycode: 'ZA', name: 'Oudtshoorn', city: 'George',
  state: 'Western Cape', country: 'South Africa'
}));

/** The query that makes the stub fall over, so the 502 path is exercised too. */
const PHOTON_BREAKS_ON = 'boom';

/** Photon's two endpoints. The table is also the allowlist, so the two cannot drift. */
const PHOTON_ROUTES = new Map([
  ['/api/', (params) => {
    const q = params.get('q') ?? '';
    return q === PHOTON_BREAKS_ON
      ? [500, { message: 'the stub is pretending to be down' }]
      : [200, PHOTON_ANSWERS.get(q) ?? photonCollection()];
  }],
  ['/reverse', (params) => [
    200,
    `${params.get('lon')},${params.get('lat')}` === '0,0' ? photonCollection() : PHOTON_REVERSED
  ]]
]);

/**
 * Stands in for Photon. Every question asked of it is recorded, so a check can
 * prove that a repeated search never left the Worker and that the outbound
 * headers say who is asking without saying who the owner is.
 *
 * Only Photon's own two paths are recorded. A localhost port attracts unrelated
 * probes, and one of those landing mid-run must not read as a request the Worker
 * made.
 */
export const startPhotonStub = async (port = PHOTON_PORT) => {
  const seen = [];

  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const answer = PHOTON_ROUTES.get(url.pathname);
    if (answer === undefined) {
      res.writeHead(404).end();
      return;
    }

    seen.push({
      path: url.pathname,
      query: url.searchParams,
      userAgent: req.headers['user-agent'] ?? ''
    });

    const [status, body] = answer(url.searchParams);
    sendJson(res, status, body);
  });
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  return { server, seen, close: () => server.close() };
};

/**
 * Boots `wrangler dev` pointed at the local key server. Resolves once it answers.
 * A `photonPort` points geocoding at the stub, which is what the verification run
 * wants; leaving it out lets a browser session search the real Photon.
 */
export const startWorker = async ({
  port = WORKER_PORT, jwksPort = JWKS_PORT, photonPort = null, quiet = true
} = {}) => {
  const child = spawn('npx', [
    'wrangler', 'dev',
    '--port', String(port),
    '--ip', '127.0.0.1',
    '--var', `ACCESS_TEAM_DOMAIN:${TEAM_DOMAIN}`,
    '--var', `ACCESS_AUD:${AUD}`,
    '--var', `OWNER_EMAIL:${OWNER}`,
    '--var', `ACCESS_JWKS_URL:http://127.0.0.1:${jwksPort}/certs`,
    ...(photonPort === null ? [] : ['--var', `GEOCODE_UPSTREAM:http://127.0.0.1:${photonPort}`])
  ], { stdio: ['ignore', quiet ? 'ignore' : 'inherit', 'inherit'] });

  const base = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      await fetch(`${base}/build/api/trips`);
      return { child, base, stop: () => child.kill('SIGTERM') };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  child.kill('SIGTERM');
  throw new Error('wrangler dev never came up');
};

export const applyMigrations = async () =>
  new Promise((resolve, reject) => {
    const child = spawn(
      'npx',
      ['wrangler', 'd1', 'execute', 'portfolio-trips', '--local', '--file=migrations/0001_trips.sql'],
      { stdio: ['ignore', 'ignore', 'inherit'] }
    );
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`d1 execute exited ${code}`))));
  });

export const resetLocalState = async () => {
  for (const store of ['d1', 'kv', 'cache']) {
    await rm(`.wrangler/state/v3/${store}`, { recursive: true, force: true });
  }
};

const main = async () => {
  if (!existsSync('dist/index.html')) {
    console.error('dist/index.html is missing. Run `npm run build` first.');
    process.exit(1);
  }

  await applyMigrations();
  const keys = await startKeyServer();
  const worker = await startWorker({ quiet: false });

  console.log(`\n  ${worker.base}\n`);
  console.log('  Paste this into the browser console once, then reload:\n');
  console.log(`    document.cookie = 'CF_Authorization=${keys.mint()}; path=/'\n`);
  console.log('  Ctrl-C to stop.\n');

  const stop = () => {
    worker.stop();
    keys.close();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
};

if (process.argv[1]?.endsWith('dev-stack.mjs')) main().catch((error) => {
  console.error(error);
  process.exit(1);
});
