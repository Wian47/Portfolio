/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Trash2 } from 'lucide-react';
import { STOP_KIND, STOP_KINDS, type BookingState, type HhMm, type IsoDate, type Stop } from '../../trip/model';
import type { StopPatch } from '../../trip/ops';
import { LABEL } from './Shell';

/**
 * Booking is a state machine in the domain, so it is a state machine here: the
 * reference field cannot exist without a booking and the expiry cannot exist
 * without a hold, because the form never renders them together.
 */

const FIELD =
  'w-full border border-ink-line bg-transparent px-3 py-2 text-[14px] text-paper ' +
  'placeholder:text-paper-faint focus-visible:border-ember/40 focus-visible:outline-none';

interface StopDetailProps {
  stop: Stop;
  onPatch: (patch: StopPatch) => void;
  onRemove: () => void;
}

const today = (): IsoDate => new Date().toISOString().slice(0, 10) as IsoDate;

const bookingFor = (kind: BookingState['kind'], current: BookingState): BookingState => {
  const url = 'url' in current ? current.url : undefined;
  switch (kind) {
    case 'none': return { kind: 'none' };
    case 'shortlisted': return { kind: 'shortlisted', url };
    case 'held': return { kind: 'held', until: current.kind === 'held' ? current.until : today(), url };
    case 'booked': return { kind: 'booked', reference: current.kind === 'booked' ? current.reference : '', paid: false, url };
  }
};

export const StopDetail: React.FC<StopDetailProps> = ({ stop, onPatch, onRemove }) => (
  <div className="mb-4 ml-9 border-l border-ink-line pl-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block">
        <span className={LABEL}>Name</span>
        <input
          className={`mt-2 ${FIELD}`}
          value={stop.place.name}
          onChange={(e) => onPatch({ place: { ...stop.place, name: e.target.value } })}
        />
      </label>

      <label className="block">
        <span className={LABEL}>Kind</span>
        <select
          className={`mt-2 ${FIELD}`}
          value={stop.kind}
          onChange={(e) => onPatch({ kind: e.target.value as Stop['kind'] })}
        >
          {STOP_KINDS.map((kind) => (
            <option key={kind} value={kind} className="bg-ink">{STOP_KIND[kind].label}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={LABEL}>Minutes here</span>
        <input
          type="number"
          min={0}
          className={`mt-2 tabular-nums ${FIELD}`}
          placeholder={String(STOP_KIND[stop.kind].dwell)}
          value={stop.dwellMinutes ?? ''}
          onChange={(e) => onPatch({ dwellMinutes: e.target.value === '' ? null : Number(e.target.value) })}
        />
      </label>

      <label className="block">
        <span className={LABEL}>Cost in rand</span>
        <input
          type="number"
          min={0}
          step={1}
          className={`mt-2 tabular-nums ${FIELD}`}
          value={stop.costCents === undefined ? '' : stop.costCents / 100}
          onChange={(e) => onPatch({ costCents: e.target.value === '' ? undefined : Math.round(Number(e.target.value) * 100) })}
        />
      </label>

      <label className="block">
        <span className={LABEL}>Be there by</span>
        <input
          type="time"
          className={`mt-2 tabular-nums ${FIELD}`}
          value={stop.arriveBy ?? ''}
          onChange={(e) => onPatch({ arriveBy: e.target.value === '' ? undefined : e.target.value as HhMm })}
        />
      </label>

      <label className="block">
        <span className={LABEL}>Booking</span>
        <select
          className={`mt-2 ${FIELD}`}
          value={stop.booking.kind}
          onChange={(e) => onPatch({ booking: bookingFor(e.target.value as BookingState['kind'], stop.booking) })}
        >
          <option value="none" className="bg-ink">Nothing yet</option>
          <option value="shortlisted" className="bg-ink">Shortlisted</option>
          <option value="held" className="bg-ink">Held</option>
          <option value="booked" className="bg-ink">Booked</option>
        </select>
      </label>

      {stop.booking.kind === 'held' && (
        <label className="block">
          <span className={LABEL}>Held until</span>
          <input
            type="date"
            className={`mt-2 tabular-nums ${FIELD}`}
            value={stop.booking.until}
            onChange={(e) => onPatch({ booking: { ...stop.booking, until: e.target.value as IsoDate } })}
          />
        </label>
      )}

      {stop.booking.kind === 'booked' && (
        <label className="block">
          <span className={LABEL}>Reference</span>
          <input
            className={`mt-2 ${FIELD}`}
            value={stop.booking.reference}
            onChange={(e) => onPatch({ booking: { ...stop.booking, reference: e.target.value } })}
          />
        </label>
      )}
    </div>

    <label className="mt-4 block">
      <span className={LABEL}>Notes</span>
      <textarea
        rows={2}
        className={`mt-2 resize-y ${FIELD}`}
        value={stop.notes ?? ''}
        onChange={(e) => onPatch({ notes: e.target.value === '' ? undefined : e.target.value })}
      />
    </label>

    <button
      type="button"
      onClick={onRemove}
      data-hover="true"
      className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-label text-paper-faint transition-colors hover:text-ember"
    >
      <Trash2 className="h-3 w-3" />
      Remove this stop
    </button>
  </div>
);
