/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { STOP_KIND, dwellOf, type Stop } from '../../trip/model';
import { formatRand } from '../../trip/money';
import { stopDragId } from './dnd';
import { STOP_ICON } from './stopIcon';

/**
 * Anchors carry the day; the stops between them are what happens on the way. The
 * two render at different weights so a day reads as its destinations first, which
 * is section 7.1's whole point.
 */

interface StopRowProps {
  stop: Stop;
  anchor: boolean;
  selected: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
}

export const StopRow: React.FC<StopRowProps> = ({ stop, anchor, selected, onSelect, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stopDragId(stop.id) });
  const Icon = STOP_ICON[stop.kind];
  const dwell = dwellOf(stop);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`${anchor ? 'border-t border-ink-line' : ''} ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className={`flex items-center gap-3 ${anchor ? 'py-4' : 'py-2 pl-9'}`}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${stop.place.name}`}
          className="cursor-grab text-paper-faint transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={onSelect}
          data-hover="true"
          aria-expanded={selected}
          className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember"
        >
          <Icon className={`h-4 w-4 shrink-0 ${anchor ? 'text-ember' : 'text-paper-faint'}`} />
          <span className="min-w-0 flex-1">
            <span className={`block truncate ${anchor ? 'font-display text-xl text-paper' : 'text-[15px] text-paper-dim'}`}>
              {stop.place.name}
            </span>
            {stop.place.address !== undefined && (
              <span className="block truncate font-mono text-[10px] uppercase tracking-label text-paper-faint">
                {stop.place.address}
              </span>
            )}
          </span>
        </button>

        <span className="shrink-0 font-mono text-[10px] uppercase tracking-label tabular-nums text-paper-faint">
          {STOP_KIND[stop.kind].label}
          {dwell > 0 && ` · ${dwell}m`}
          {stop.costCents !== undefined && ` · ${formatRand(stop.costCents)}`}
        </span>
      </div>
      {children}
    </li>
  );
};
