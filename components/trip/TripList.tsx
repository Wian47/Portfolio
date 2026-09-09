/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { archiveTrip, createTrip as postTrip, listTrips } from '../../trip/api';
import { createTrip as newTrip } from '../../trip/ids';
import type { TripId, TripSummary } from '../../trip/model';
import { CONTROL, LABEL, Loading, Notice } from './Shell';

interface TripListProps {
  onOpen: (id: TripId) => void;
  onSignedOut: () => void;
}

type ListState =
  | { kind: 'loading' }
  | { kind: 'ready'; trips: TripSummary[] }
  | { kind: 'failed' };

const when = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

export const TripList: React.FC<TripListProps> = ({ onOpen, onSignedOut }) => {
  const [state, setState] = useState<ListState>({ kind: 'loading' });
  const [creating, setCreating] = useState(false);

  const load = () => {
    listTrips().then((result) => {
      if (result.ok) setState({ kind: 'ready', trips: result.value });
      else if (result.signedOut) onSignedOut();
      else setState({ kind: 'failed' });
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const create = async () => {
    setCreating(true);
    const outcome = await postTrip(newTrip('Untitled trip'));
    setCreating(false);
    if (outcome.kind === 'applied') onOpen(outcome.server.trip.id);
    else if (outcome.kind === 'signedOut') onSignedOut();
  };

  const archive = async (id: TripId) => {
    const result = await archiveTrip(id);
    if (result === 'signedOut') onSignedOut();
    else if (result === 'archived') load();
  };

  if (state.kind === 'loading') return <Loading />;
  if (state.kind === 'failed') {
    return <Notice title="No answer">The trip list did not load. The connection may be down.</Notice>;
  }

  return (
    <>
      <h1 className="font-display text-5xl text-paper md:text-6xl">Trips</h1>

      {state.trips.length === 0 ? (
        <p className="mt-6 text-[16px] leading-relaxed text-paper-dim">
          Nothing planned yet. Start one and give it days.
        </p>
      ) : (
        <ul className="mt-12 border-t border-ink-line">
          {state.trips.map((trip) => (
            <li key={trip.id} className="flex items-center justify-between gap-6 border-b border-ink-line py-5">
              <button
                type="button"
                onClick={() => onOpen(trip.id)}
                data-hover="true"
                className="group flex min-w-0 flex-1 items-center gap-4 text-left"
              >
                <span className="min-w-0">
                  <span className="block truncate font-display text-2xl text-paper">{trip.title}</span>
                  <span className={`mt-1 block tabular-nums ${LABEL}`}>Edited {when(trip.updatedAt)}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-paper-faint transition-transform group-hover:translate-x-1 group-hover:text-ember" />
              </button>
              <button
                type="button"
                onClick={() => archive(trip.id)}
                data-hover="true"
                className="shrink-0 font-mono text-[10px] uppercase tracking-label text-paper-faint transition-colors hover:text-ember"
              >
                Archive
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={create} disabled={creating} data-hover="true" className={`mt-12 flex items-center gap-3 ${CONTROL}`}>
        <Plus className="h-3.5 w-3.5" />
        {creating ? 'Creating' : 'New trip'}
      </button>
    </>
  );
};
