/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { geocode } from '../../trip/api';
import { parsePastedCoordinates } from '../../trip/geo';
import { STOP_KIND, STOP_KINDS, type Place, type Position, type StopKind } from '../../trip/model';
import { LABEL } from './Shell';

/**
 * Photon publishes a fair-use policy rather than a quota, so the debounce here
 * is part of the contract with it and not only a nicety. A pasted coordinate
 * pair skips the network entirely.
 */
const DEBOUNCE_MS = 300;

interface SearchBoxProps {
  /** Biases results toward the day being planned. */
  near: Position | null;
  onPick: (place: Place, kind: StopKind) => void;
  onSignedOut: () => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ near, onPick, onSignedOut }) => {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<StopKind>('sight');
  const [places, setPlaces] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const latest = useRef(0);

  const pasted = parsePastedCoordinates(query);

  useEffect(() => {
    if (pasted.ok || query.trim().length < 2) {
      setPlaces([]);
      return undefined;
    }

    const timer = window.setTimeout(async () => {
      const ticket = latest.current + 1;
      latest.current = ticket;
      setSearching(true);
      const result = await geocode(query.trim(), near);
      if (latest.current !== ticket) return;
      setSearching(false);
      if (result.ok) setPlaces(result.value);
      else if (result.signedOut) onSignedOut();
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, near]);

  const take = (place: Place) => {
    onPick(place, kind);
    setQuery('');
    setPlaces([]);
  };

  return (
    <div className="mt-4 ml-9">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-paper-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              if (pasted.ok) take({ name: 'Pinned location', at: pasted.value });
              else if (places.length > 0) take(places[0]);
            }}
            placeholder="Add a place, or paste latitude, longitude"
            aria-label="Add a stop to this day"
            className="w-full border border-ink-line bg-transparent py-2 pl-9 pr-3 text-[14px] text-paper placeholder:text-paper-faint focus-visible:border-ember/40 focus-visible:outline-none"
          />
        </div>

        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as StopKind)}
          aria-label="Kind of stop to add"
          className="border border-ink-line bg-transparent px-3 py-2 font-mono text-[10px] uppercase tracking-label text-paper-dim focus-visible:border-ember/40 focus-visible:outline-none"
        >
          {STOP_KINDS.map((k) => (
            <option key={k} value={k} className="bg-ink">{STOP_KIND[k].label}</option>
          ))}
        </select>
      </div>

      {pasted.ok && (
        <button
          type="button"
          onClick={() => take({ name: 'Pinned location', at: pasted.value })}
          className="mt-2 flex w-full items-center gap-3 border border-ember/30 bg-ember/5 px-3 py-2 text-left transition-colors hover:bg-ember/10"
        >
          <MapPin className="h-3.5 w-3.5 text-ember" />
          <span className="font-mono text-[10px] uppercase tracking-label tabular-nums text-paper-dim">
            Pin {pasted.value[1].toFixed(5)}, {pasted.value[0].toFixed(5)}
          </span>
        </button>
      )}

      {searching && <p className={`mt-2 ${LABEL}`}>Searching</p>}

      {places.length > 0 && (
        <ul className="mt-2 border border-ink-line">
          {places.map((place, index) => (
            <li key={`${place.name}-${index}`}>
              <button
                type="button"
                onClick={() => take(place)}
                className="block w-full border-b border-ink-line px-3 py-2 text-left last:border-b-0 transition-colors hover:bg-ember/5"
              >
                <span className="block text-[14px] text-paper">{place.name}</span>
                {place.address !== undefined && (
                  <span className="block font-mono text-[10px] uppercase tracking-label text-paper-faint">
                    {place.address}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
