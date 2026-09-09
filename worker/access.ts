/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { Env } from './http';

/**
 * Cloudflare Access already gates the `/build` path at the edge. This verifies
 * the assertion anyway, because the edge rule is one dashboard field away from
 * being wrong and the failure mode is the whole trip database served to the
 * internet. The Worker trusts nothing but a signature it checked itself.
 */

export interface Identity {
  email: string;
}

export type AccessResult =
  | { ok: true; identity: Identity }
  | { ok: false; reason: string };

interface AccessClaims {
  aud?: string | string[];
  email?: string;
  exp?: number;
  nbf?: number;
  iss?: string;
}

interface Jwk {
  kid?: string;
  kty?: string;
  alg?: string;
  n?: string;
  e?: string;
}

const JWKS_TTL_SECONDS = 60 * 60;
/** Tolerates the clock skew between Cloudflare's signer and this isolate. */
const SKEW_SECONDS = 60;

const deny = (reason: string): AccessResult => ({ ok: false, reason });

const decodeBase64Url = (value: string): Uint8Array => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const decodeJsonSegment = <T,>(segment: string): T | null => {
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(segment))) as T;
  } catch {
    return null;
  }
};

/**
 * The header is what Access sends to an origin. The cookie is what a browser
 * carries on a same-origin fetch from the page, which is how the client calls
 * this API.
 */
const readToken = (request: Request): string | null => {
  const header = request.headers.get('cf-access-jwt-assertion');
  if (header !== null && header.length > 0) return header;
  const cookie = request.headers.get('cookie');
  if (cookie === null) return null;
  const match = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(cookie);
  return match === null ? null : match[1];
};

const jwksUrl = (env: Env): string =>
  env.ACCESS_JWKS_URL ?? `https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`;

const fetchJwks = async (env: Env): Promise<Jwk[]> => {
  const response = await fetch(jwksUrl(env), { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`JWKS fetch returned ${response.status}`);
  const body = await response.json() as { keys?: Jwk[] };
  return body.keys ?? [];
};

const cacheKey = (env: Env): string => `access:jwks:${jwksUrl(env)}`;

/**
 * Cached for an hour, but a `kid` the cache does not know forces one refetch.
 * Without that, a key rotation locks the owner out until the TTL expires.
 */
const findKey = async (env: Env, kid: string): Promise<Jwk | null> => {
  const cached = await env.CACHE.get(cacheKey(env), 'json') as Jwk[] | null;
  const hit = cached?.find((key) => key.kid === kid);
  if (hit !== undefined) return hit;

  const fresh = await fetchJwks(env);
  await env.CACHE.put(cacheKey(env), JSON.stringify(fresh), {
    expirationTtl: JWKS_TTL_SECONDS
  });
  return fresh.find((key) => key.kid === kid) ?? null;
};

const verifySignature = async (jwk: Jwk, signed: string, signature: Uint8Array): Promise<boolean> => {
  if (jwk.kty !== 'RSA' || jwk.n === undefined || jwk.e === undefined) return false;
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  return crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    signature,
    new TextEncoder().encode(signed)
  );
};

export const verifyAccess = async (request: Request, env: Env): Promise<AccessResult> => {
  if (env.ACCESS_AUD.length === 0 || env.OWNER_EMAIL.length === 0) {
    return deny('worker is misconfigured, refusing rather than opening');
  }

  const token = readToken(request);
  if (token === null) return deny('no Access assertion');

  const parts = token.split('.');
  if (parts.length !== 3) return deny('malformed assertion');

  const header = decodeJsonSegment<{ alg?: string; kid?: string }>(parts[0]);
  if (header === null) return deny('unreadable header');
  if (header.alg !== 'RS256') return deny(`unexpected algorithm ${String(header.alg)}`);
  if (typeof header.kid !== 'string') return deny('no key id');

  const jwk = await findKey(env, header.kid);
  if (jwk === null) return deny('unknown signing key');

  const valid = await verifySignature(jwk, `${parts[0]}.${parts[1]}`, decodeBase64Url(parts[2]));
  if (!valid) return deny('bad signature');

  const claims = decodeJsonSegment<AccessClaims>(parts[1]);
  if (claims === null) return deny('unreadable claims');

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== 'number' || claims.exp + SKEW_SECONDS < now) return deny('expired');
  if (typeof claims.nbf === 'number' && claims.nbf - SKEW_SECONDS > now) return deny('not yet valid');

  const audiences = Array.isArray(claims.aud) ? claims.aud : claims.aud === undefined ? [] : [claims.aud];
  if (!audiences.includes(env.ACCESS_AUD)) return deny('wrong audience');

  if (claims.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return deny('wrong issuer');

  const email = typeof claims.email === 'string' ? claims.email.toLowerCase() : '';
  if (email !== env.OWNER_EMAIL.toLowerCase()) return deny('not the owner');

  return { ok: true, identity: { email } };
};
