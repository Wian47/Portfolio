/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { describe, expect, it } from 'vitest';
import type { OrderKey } from './model';
import { isOrderKey, orderKeyBetween, orderKeySequence, sortByOrder } from './order';

const key = (s: string) => s as OrderKey;

describe('orderKeyBetween', () => {
  it('mints a key for an empty list', () => {
    const first = orderKeyBetween(null, null);
    expect(isOrderKey(first)).toBe(true);
  });

  it('appends after the tail', () => {
    const a = orderKeyBetween(null, null);
    const b = orderKeyBetween(a, null);
    expect(a < b).toBe(true);
  });

  it('prepends before the head', () => {
    const a = orderKeyBetween(null, null);
    const b = orderKeyBetween(null, a);
    expect(b < a).toBe(true);
  });

  it('lands strictly between two keys', () => {
    const a = orderKeyBetween(null, null);
    const c = orderKeyBetween(a, null);
    const b = orderKeyBetween(a, c);
    expect(a < b && b < c).toBe(true);
  });

  it('survives repeated insertion into the same gap', () => {
    const low = orderKeyBetween(null, null);
    const high = orderKeyBetween(low, null);
    let cursor = high;
    for (let i = 0; i < 200; i += 1) {
      const next = orderKeyBetween(low, cursor);
      expect(low < next).toBe(true);
      expect(next < cursor).toBe(true);
      expect(isOrderKey(next)).toBe(true);
      cursor = next;
    }
  });

  it('survives repeated appending', () => {
    let cursor = orderKeyBetween(null, null);
    for (let i = 0; i < 500; i += 1) {
      const next = orderKeyBetween(cursor, null);
      expect(cursor < next).toBe(true);
      cursor = next;
    }
  });

  it('survives repeated prepending', () => {
    let cursor = orderKeyBetween(null, null);
    for (let i = 0; i < 500; i += 1) {
      const next = orderKeyBetween(null, cursor);
      expect(next < cursor).toBe(true);
      expect(isOrderKey(next)).toBe(true);
      cursor = next;
    }
  });

  it('splits keys that share a long prefix', () => {
    const a = key('AzzzzzY');
    const b = key('Azzzzzz');
    const mid = orderKeyBetween(a, b);
    expect(a < mid && mid < b).toBe(true);
  });

  it('rejects arguments in the wrong order', () => {
    const a = orderKeyBetween(null, null);
    const b = orderKeyBetween(a, null);
    expect(() => orderKeyBetween(b, a)).toThrow(RangeError);
    expect(() => orderKeyBetween(a, a)).toThrow(RangeError);
  });

  it('rejects a key with a trailing zero, which has no gap below it', () => {
    expect(() => orderKeyBetween(key('A0'), null)).toThrow(RangeError);
    expect(isOrderKey('A0')).toBe(false);
    expect(isOrderKey('')).toBe(false);
    expect(isOrderKey('A-')).toBe(false);
  });

  it('never mints a key with a trailing zero', () => {
    let cursor: OrderKey | null = null;
    const seen: OrderKey[] = [];
    for (let i = 0; i < 300; i += 1) {
      cursor = orderKeyBetween(cursor, null);
      seen.push(cursor);
    }
    for (const k of seen) expect(k.endsWith('0')).toBe(false);
  });
});

describe('orderKeySequence', () => {
  it('returns ascending keys inside the bounds', () => {
    const low = orderKeyBetween(null, null);
    const high = orderKeyBetween(low, null);
    const keys = orderKeySequence(low, high, 7);
    expect(keys).toHaveLength(7);
    const all = [low, ...keys, high];
    for (let i = 1; i < all.length; i += 1) expect(all[i - 1] < all[i]).toBe(true);
  });
});

describe('sortByOrder', () => {
  it('orders by key and leaves the input alone', () => {
    const items = [{ order: key('c') }, { order: key('a') }, { order: key('b') }];
    expect(sortByOrder(items).map((i) => i.order)).toEqual(['a', 'b', 'c']);
    expect(items[0].order).toBe('c');
  });
});
