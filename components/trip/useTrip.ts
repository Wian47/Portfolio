/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Trip, TripId } from '../../trip/model';
import type { TripOp } from '../../trip/ops';
import { fetchTrip, sendFlush } from '../../trip/api';
import {
  applyOutcome, hasUnsavedWork, planFlush, viewOf, type SyncState, type TripState
} from '../../trip/sync';

/**
 * Timers, effects and one request in flight. Every decision about what an
 * outcome means lives in `trip/sync.ts`, which is pure and tested; this file
 * only decides when to call it.
 */

/** Long enough that a drag through five positions is one write, short enough to feel saved. */
const DEBOUNCE_MS = 800;
const MAX_BACKOFF_MS = 30_000;

const backoffFor = (attempt: number): number => Math.min(MAX_BACKOFF_MS, 2 ** attempt * 500);

export type TripView =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'signedOut' }
  | { kind: 'ready'; trip: Trip; sync: SyncState; unsaved: boolean };

export interface TripHandle {
  view: TripView;
  edit: (op: TripOp) => void;
  retry: () => void;
}

export const useTrip = (id: TripId): TripHandle => {
  const [view, setView] = useState<TripView>({ kind: 'loading' });
  const state = useRef<TripState | null>(null);
  const inFlight = useRef(false);

  const commit = useCallback((next: TripState) => {
    state.current = next;
    setView({ kind: 'ready', trip: viewOf(next), sync: next.sync, unsaved: hasUnsavedWork(next) });
  }, []);

  useEffect(() => {
    let live = true;
    state.current = null;
    setView({ kind: 'loading' });

    fetchTrip(id).then((result) => {
      if (!live) return;
      if (result.ok) {
        commit({ base: result.value, log: [], sync: { kind: 'idle' } });
      } else {
        setView({ kind: result.signedOut ? 'signedOut' : 'missing' });
      }
    });

    return () => { live = false; };
  }, [id, commit]);

  const flush = useCallback(async () => {
    const current = state.current;
    if (inFlight.current || current === null) return;

    const pending = current.sync.kind === 'retrying' ? current.sync.flush : planFlush(current);
    if (pending === null) return;
    if ('error' in pending) {
      commit({ ...current, sync: { kind: 'blocked', reason: pending.error } });
      return;
    }

    inFlight.current = true;
    // A retry keeps its own state, because that is where the attempt count lives.
    if (current.sync.kind === 'idle') commit({ ...current, sync: { kind: 'saving', flush: pending } });

    const outcome = await sendFlush(id, pending);
    inFlight.current = false;

    const latest = state.current;
    if (latest !== null) commit(applyOutcome(latest, pending, outcome));
  }, [id, commit]);

  useEffect(() => {
    if (view.kind !== 'ready') return;
    const { sync, unsaved } = view;

    if (sync.kind === 'retrying') {
      const timer = window.setTimeout(flush, backoffFor(sync.attempt));
      return () => window.clearTimeout(timer);
    }
    if (sync.kind === 'idle' && unsaved) {
      const timer = window.setTimeout(flush, DEBOUNCE_MS);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [view, flush]);

  useEffect(() => {
    if (view.kind !== 'ready' || !view.unsaved) return undefined;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [view]);

  const edit = useCallback((op: TripOp) => {
    const current = state.current;
    if (current === null) return;
    // A fresh edit is also the answer to a document the Worker refused.
    const sync = current.sync.kind === 'blocked' ? { kind: 'idle' as const } : current.sync;
    commit({ ...current, log: [...current.log, op], sync });
  }, [commit]);

  const retry = useCallback(() => {
    const current = state.current;
    if (current === null) return;
    commit({ ...current, sync: { kind: 'idle' } });
  }, [commit]);

  return { view, edit, retry };
};
