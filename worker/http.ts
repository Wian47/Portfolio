/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ASSETS: Fetcher;
  /** `<team>.cloudflareaccess.com`. */
  ACCESS_TEAM_DOMAIN: string;
  /** The Access application's audience tag. */
  ACCESS_AUD: string;
  OWNER_EMAIL: string;
  /**
   * Overrides the JWKS endpoint derived from the team domain. Exists so the
   * verification path can be exercised against a local key server; production
   * leaves it unset and uses the derived URL.
   */
  ACCESS_JWKS_URL?: string;
  ORS_API_KEY?: string;
}

const NO_STORE = 'private, no-store';

export const json = (body: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': NO_STORE,
      ...(init.headers as Record<string, string> | undefined)
    }
  });

/**
 * Errors carry a stable machine-readable code and never echo the request. A
 * 403 in particular gets no body at all, so a prober learns nothing about
 * whether the path, the token or the account was the problem.
 */
export const problem = (status: number, code: string, detail?: string): Response =>
  status === 403 || status === 401
    ? new Response(null, { status, headers: { 'cache-control': NO_STORE } })
    : json({ error: code, detail }, { status });

export const noContent = (): Response =>
  new Response(null, { status: 204, headers: { 'cache-control': NO_STORE } });

export const readJson = async (request: Request, maxBytes = 2_000_000): Promise<unknown> => {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > maxBytes) throw new RangeError('body too large');
  const text = await request.text();
  if (text.length > maxBytes) throw new RangeError('body too large');
  return JSON.parse(text) as unknown;
};
