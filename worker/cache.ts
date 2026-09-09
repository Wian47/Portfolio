/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * KV holds only derived data: provider answers that cost money or goodwill to
 * fetch, and the replayable result of a mutation. Nothing here is a source of
 * truth, so eventual consistency is harmless. Trip documents live in D1.
 */

export const getOrFetch = async <T,>(
  kv: KVNamespace,
  key: string,
  ttlSeconds: number,
  produce: () => Promise<T>
): Promise<T> => {
  const cached = await kv.get(key, 'json');
  if (cached !== null) return cached as T;
  const fresh = await produce();
  await kv.put(key, JSON.stringify(fresh), { expirationTtl: Math.max(60, ttlSeconds) });
  return fresh;
};

/** A response frozen so a retry on a dropped connection replays rather than reapplies. */
interface StoredResponse {
  status: number;
  body: string | null;
  headers: [string, string][];
}

const MUTATION_TTL_SECONDS = 60 * 60 * 24;

const mutationKey = (id: string): string => `mutation:${id}`;

export const replayMutation = async (
  kv: KVNamespace,
  mutationId: string
): Promise<Response | null> => {
  const stored = await kv.get(mutationKey(mutationId), 'json') as StoredResponse | null;
  if (stored === null) return null;
  const headers = new Headers(stored.headers);
  headers.set('x-idempotent-replay', '1');
  return new Response(stored.body, { status: stored.status, headers });
};

/**
 * Server errors are not remembered. A 500 that happened to be transient must be
 * allowed to succeed on the retry, which is the whole point of retrying.
 */
export const rememberMutation = async (
  kv: KVNamespace,
  mutationId: string,
  response: Response
): Promise<Response> => {
  if (response.status >= 500) return response;
  const clone = response.clone();
  const body = response.status === 204 ? null : await clone.text();
  const stored: StoredResponse = {
    status: response.status,
    body,
    headers: [...clone.headers].filter(([name]) => name !== 'content-length')
  };
  await kv.put(mutationKey(mutationId), JSON.stringify(stored), {
    expirationTtl: MUTATION_TTL_SECONDS
  });
  return response;
};
