/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { groupByAnchor, type AnchorGroup } from '../../trip/anchors';
import { newStopId } from '../../trip/ids';
import type { Day, HhMm, IsoDate, Place, Stop, StopId, StopKind, Trip } from '../../trip/model';
import type { StopPatch, TripOp } from '../../trip/ops';
import { dayDropId } from './dnd';
import { SearchBox } from './SearchBox';
import { LABEL } from './Shell';
import { StopDetail } from './StopDetail';
import { StopRow } from './StopRow';

/** A run of vias is scaffolding for the route, not part of the plan, so it starts folded. */
const startsFolded = (group: AnchorGroup): boolean =>
  group.between.length > 0 && group.between.every((stop) => stop.kind === 'waypoint');

interface DayColumnProps {
  day: Day;
  index: number;
  trip: Trip;
  selected: StopId | null;
  onSelect: (id: StopId | null) => void;
  edit: (op: TripOp) => void;
  onSignedOut: () => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({
  day, index, trip, selected, onSelect, edit, onSignedOut
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: dayDropId(day.id) });
  const [openRuns, setOpenRuns] = useState<Record<number, boolean>>({});
  const groups = groupByAnchor(day.id, trip.stops);
  const last = groups.length > 0
    ? (groups[groups.length - 1].between.at(-1) ?? groups[groups.length - 1].anchor)
    : null;

  const patch = (id: StopId) => (p: StopPatch) => edit({ kind: 'stop.patch', id, patch: p });

  const row = (stop: Stop, anchor: boolean) => (
    <StopRow
      key={stop.id}
      stop={stop}
      anchor={anchor}
      selected={selected === stop.id}
      onSelect={() => onSelect(selected === stop.id ? null : stop.id)}
    >
      {selected === stop.id && (
        <StopDetail
          stop={stop}
          onPatch={patch(stop.id)}
          onRemove={() => { onSelect(null); edit({ kind: 'stop.remove', id: stop.id }); }}
        />
      )}
    </StopRow>
  );

  return (
    <section ref={setNodeRef} className={`mt-14 first:mt-0 ${isOver ? 'bg-ember/5' : ''}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <h2 className="font-display text-3xl text-paper">Day {index + 1}</h2>
          <input
            type="date"
            value={day.date ?? ''}
            aria-label={`Date of day ${index + 1}`}
            onChange={(e) => edit({
              kind: 'day.patch', id: day.id,
              patch: { date: e.target.value === '' ? null : e.target.value as IsoDate }
            })}
            className="border border-ink-line bg-transparent px-2 py-1 font-mono text-[10px] uppercase tracking-label tabular-nums text-paper-dim focus-visible:border-ember/40 focus-visible:outline-none"
          />
          <label className="flex items-center gap-2">
            <span className={LABEL}>Depart</span>
            <input
              type="time"
              value={day.departAt}
              onChange={(e) => edit({ kind: 'day.patch', id: day.id, patch: { departAt: e.target.value as HhMm } })}
              className="border border-ink-line bg-transparent px-2 py-1 font-mono text-[10px] tabular-nums text-paper-dim focus-visible:border-ember/40 focus-visible:outline-none"
            />
          </label>
        </div>

        {trip.days.length > 1 && (
          <button
            type="button"
            onClick={() => edit({ kind: 'day.remove', id: day.id })}
            data-hover="true"
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-label text-paper-faint transition-colors hover:text-ember"
          >
            <Trash2 className="h-3 w-3" />
            Remove day
          </button>
        )}
      </header>

      <ul className="mt-4">
        {groups.map((group, groupIndex) => {
          const open = openRuns[groupIndex] ?? !startsFolded(group);
          return (
            <React.Fragment key={group.anchor?.id ?? `run-${groupIndex}`}>
              {group.anchor !== null && row(group.anchor, true)}
              {group.between.length > 0 && !open && (
                <li>
                  <button
                    type="button"
                    onClick={() => setOpenRuns({ ...openRuns, [groupIndex]: true })}
                    className="flex items-center gap-2 py-2 pl-9 font-mono text-[10px] uppercase tracking-label text-paper-faint transition-colors hover:text-paper"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {group.between.length} {group.between.length === 1 ? 'stop' : 'stops'} on the way
                  </button>
                </li>
              )}
              {open && group.between.map((stop) => row(stop, false))}
              {group.between.length > 0 && open && (
                <li>
                  <button
                    type="button"
                    onClick={() => setOpenRuns({ ...openRuns, [groupIndex]: false })}
                    className="flex items-center gap-2 py-1 pl-9 font-mono text-[10px] uppercase tracking-label text-paper-faint transition-colors hover:text-paper"
                  >
                    <ChevronDown className="h-3 w-3" />
                    Fold these away
                  </button>
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ul>

      {groups.length === 0 && (
        <p className={`mt-4 pl-9 ${LABEL}`}>Nothing planned. Search below, or drag a stop in.</p>
      )}

      <SearchBox
        near={last?.place.at ?? null}
        onSignedOut={onSignedOut}
        onPick={(place: Place, kind: StopKind) => edit({
          kind: 'stop.add',
          id: newStopId(),
          slot: { dayId: day.id, after: last?.id ?? null, before: null },
          place,
          stopKind: kind
        })}
      />
    </section>
  );
};
