/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import type { OrderKey } from './model';

/**
 * Fractional indexing. A key is a base-62 fraction with an implied leading
 * "0.", written in an alphabet whose ASCII order matches its digit order, so
 * plain string comparison is numeric comparison and SQLite, JavaScript and a
 * human reading the JSON all agree on the sort.
 *
 * Inserting between two stops mints one new key and writes one field. Nothing
 * else in the list is touched, which is what makes cross-day drag a two-field
 * update instead of a renumbering pass over two arrays.
 */

const DIGITS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BASE = DIGITS.length;

/**
 * A trailing zero would make two different strings the same fraction, and then
 * no key could sit between them.
 */
export const isOrderKey = (value: unknown): value is OrderKey =>
  typeof value === 'string' &&
  value.length > 0 &&
  !value.endsWith('0') &&
  [...value].every((c) => DIGITS.includes(c));

const midpoint = (a: string, b: string | null): string => {
  if (b !== null && a >= b) throw new RangeError(`order keys out of sequence: ${a} >= ${b}`);

  if (b !== null) {
    let shared = 0;
    while ((a[shared] ?? '0') === b[shared]) shared += 1;
    if (shared > 0) return b.slice(0, shared) + midpoint(a.slice(shared), b.slice(shared));
  }

  const low = a.length > 0 ? DIGITS.indexOf(a[0]) : 0;
  const high = b !== null ? DIGITS.indexOf(b[0]) : BASE;

  if (high - low > 1) return DIGITS[Math.round((low + high) / 2)];
  if (b !== null && b.length > 1) return b.slice(0, 1);
  return DIGITS[low] + midpoint(a.slice(1), null);
};

/**
 * A key strictly between `before` and `after`, either of which may be null for
 * the head or tail of the list.
 */
export const orderKeyBetween = (
  before: OrderKey | null,
  after: OrderKey | null
): OrderKey => {
  if (before !== null && !isOrderKey(before)) throw new RangeError(`not an order key: ${before}`);
  if (after !== null && !isOrderKey(after)) throw new RangeError(`not an order key: ${after}`);
  return midpoint(before ?? '', after) as OrderKey;
};

/** `count` keys in ascending sequence, for seeding a run of days at once. */
export const orderKeySequence = (
  before: OrderKey | null,
  after: OrderKey | null,
  count: number
): OrderKey[] => {
  const keys: OrderKey[] = [];
  let low = before;
  for (let i = 0; i < count; i += 1) {
    low = orderKeyBetween(low, after);
    keys.push(low);
  }
  return keys;
};

export const byOrder = <T extends { order: OrderKey }>(a: T, b: T): number =>
  a.order < b.order ? -1 : a.order > b.order ? 1 : 0;

export const sortByOrder = <T extends { order: OrderKey }>(items: readonly T[]): T[] =>
  [...items].sort(byOrder);
