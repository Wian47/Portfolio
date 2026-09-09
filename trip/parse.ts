/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Boundary parsing. Everything that arrives from the network, from D1 or from
 * localStorage passes through here once, and everything downstream of that
 * point works with types it can trust.
 */

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

export const ok = <T,>(value: T): Parsed<T> => ({ ok: true, value });
export const fail = <T = never,>(error: string): Parsed<T> => ({ ok: false, error });

/** Prefixes a failure with the field it came from, so errors name a path. */
export const at = <T,>(field: string, result: Parsed<T>): Parsed<T> =>
  result.ok ? result : fail(`${field}: ${result.error}`);

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const parseString = (v: unknown, max = 2000): Parsed<string> => {
  if (typeof v !== 'string') return fail('expected a string');
  if (v.length > max) return fail(`longer than ${max} characters`);
  return ok(v);
};

export const parseFiniteNumber = (v: unknown): Parsed<number> =>
  typeof v === 'number' && Number.isFinite(v) ? ok(v) : fail('expected a finite number');

export const parseInRange = (v: unknown, min: number, max: number): Parsed<number> => {
  const n = parseFiniteNumber(v);
  if (!n.ok) return n;
  if (n.value < min || n.value > max) return fail(`outside ${min}..${max}`);
  return ok(n.value);
};

export const parseArray = <T,>(v: unknown, item: (x: unknown) => Parsed<T>, max: number): Parsed<T[]> => {
  if (!Array.isArray(v)) return fail('expected an array');
  if (v.length > max) return fail(`more than ${max} items`);
  const out: T[] = [];
  for (let i = 0; i < v.length; i += 1) {
    const parsed = item(v[i]);
    if (!parsed.ok) return fail(`[${i}] ${parsed.error}`);
    out.push(parsed.value);
  }
  return ok(out);
};

export const parseEnum = <T extends string>(v: unknown, allowed: readonly T[]): Parsed<T> =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v)
    ? ok(v as T)
    : fail(`expected one of ${allowed.join(', ')}`);

/** Absent stays absent. Present must parse. */
export const parseOptional = <T,>(v: unknown, parse: (x: unknown) => Parsed<T>): Parsed<T | undefined> =>
  v === undefined || v === null ? ok(undefined) : parse(v);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export const parsePattern = (v: unknown, pattern: RegExp, what: string): Parsed<string> => {
  const s = parseString(v, 64);
  if (!s.ok) return s;
  return pattern.test(s.value) ? ok(s.value) : fail(`expected ${what}`);
};

export const parseIsoDate = (v: unknown) => parsePattern(v, ISO_DATE, 'YYYY-MM-DD');
export const parseHhMm = (v: unknown) => parsePattern(v, HH_MM, 'HH:MM');
export const parseIsoTimestamp = (v: unknown) => parsePattern(v, ISO_TIMESTAMP, 'an ISO timestamp');
