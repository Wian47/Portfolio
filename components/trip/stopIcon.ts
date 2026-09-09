/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {
  Bed, CornerDownRight, Eye, FileText, Fuel, Ticket, Utensils, type LucideIcon
} from 'lucide-react';
import type { StopKind } from '../../trip/model';

/**
 * The one column of `STOP_KIND` that could not live in `trip/`, because a
 * lucide icon is a React component and the domain has to stay importable by the
 * Worker. `satisfies` keeps the two in step: adding a kind without an icon is a
 * compile error, not a blank pin.
 */
export const STOP_ICON = {
  overnight: Bed,
  activity: Ticket,
  sight: Eye,
  meal: Utensils,
  fuel: Fuel,
  admin: FileText,
  waypoint: CornerDownRight
} as const satisfies Record<StopKind, LucideIcon>;
