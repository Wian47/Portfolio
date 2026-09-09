/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { newDayId } from '../../trip/ids';
import { formatRand, tripTotals } from '../../trip/money';
import type { Day, Stop, StopId, Trip } from '../../trip/model';
import { sortByOrder } from '../../trip/order';
import type { TripOp } from '../../trip/ops';
import { DayColumn } from './DayColumn';
import { decodeDragId, slotFromDrop, stopDragId } from './dnd';
import { CONTROL, LABEL } from './Shell';

/**
 * One sortable list across every day. The flat stop model makes a move within a
 * day and a move across days the same operation, so there is no second code
 * path here and no special case for a drop that crossed a boundary.
 */

interface ItineraryProps {
  trip: Trip;
  edit: (op: TripOp) => void;
  onSignedOut: () => void;
}

const Figure: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="border-l border-ink-line px-5 first:border-l-0 first:pl-0">
    <p className={LABEL}>{label}</p>
    <p className="mt-2 font-display text-3xl tabular-nums text-paper">{value}</p>
  </div>
);

export const Itinerary: React.FC<ItineraryProps> = ({ trip, edit, onSignedOut }) => {
  const [selected, setSelected] = useState<StopId | null>(null);
  const days = sortByOrder<Day>(trip.days);
  const totals = tripTotals(trip);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const items = days.flatMap((day) =>
    sortByOrder<Stop>(trip.stops.filter((stop) => stop.dayId === day.id)).map((stop) => stopDragId(stop.id))
  );

  const onDragEnd = (event: DragEndEvent) => {
    const active = decodeDragId(String(event.active.id));
    const over = event.over === null ? null : decodeDragId(String(event.over.id));
    if (active === null || active.kind !== 'stop' || over === null) return;
    const slot = slotFromDrop(trip, active.id, over);
    if (slot !== null) edit({ kind: 'stop.move', id: active.id, slot });
  };

  return (
    <>
      <input
        value={trip.title}
        aria-label="Trip title"
        onChange={(e) => edit({ kind: 'trip.patch', patch: { title: e.target.value } })}
        className="w-full border-0 bg-transparent p-0 font-display text-5xl text-paper focus-visible:outline-none md:text-6xl"
      />

      <div className="mt-10 flex flex-wrap gap-y-6 border-y border-ink-line py-6">
        <Figure label="Days" value={String(days.length)} />
        <Figure label="Distance" value="—" />
        <Figure label="Driving" value="—" />
        <Figure label="Spend" value={formatRand(totals.totalCents)} />
      </div>
      <p className={`mt-3 ${LABEL}`}>Distance and driving time arrive with routing in phase four.</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {days.map((day, index) => (
            <DayColumn
              key={day.id}
              day={day}
              index={index}
              trip={trip}
              selected={selected}
              onSelect={setSelected}
              edit={edit}
              onSignedOut={onSignedOut}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={() => edit({
          kind: 'day.add',
          id: newDayId(),
          after: days.length > 0 ? days[days.length - 1].id : null,
          date: null,
          departAt: days.length > 0 ? days[days.length - 1].departAt : ('07:00' as Trip['days'][number]['departAt'])
        })}
        data-hover="true"
        className={`mt-14 flex items-center gap-3 ${CONTROL}`}
      >
        <Plus className="h-3.5 w-3.5" />
        Add a day
      </button>
    </>
  );
};
