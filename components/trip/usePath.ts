/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useCallback, useEffect, useState } from 'react';
import type { TripId } from '../../trip/model';

/**
 * Two routes under `/build`: the list, and one trip. `history.pushState` plus a
 * `popstate` listener covers both, and a router dependency would be a bundle
 * the portfolio also pays for.
 */

const BASE = '/build';

export type Route = { kind: 'list' } | { kind: 'trip'; id: TripId };

export const pathOf = (route: Route): string =>
  route.kind === 'list' ? BASE : `${BASE}/${encodeURIComponent(route.id)}`;

export const routeOf = (pathname: string): Route => {
  const trimmed = pathname.replace(/\/+$/, '');
  if (!trimmed.startsWith(`${BASE}/`)) return { kind: 'list' };
  return { kind: 'trip', id: decodeURIComponent(trimmed.slice(BASE.length + 1)) as TripId };
};

export const usePath = (): { route: Route; navigate: (route: Route) => void } => {
  const [route, setRoute] = useState<Route>(() => routeOf(window.location.pathname));

  useEffect(() => {
    const onPop = () => setRoute(routeOf(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.history.pushState(null, '', pathOf(next));
    setRoute(next);
    window.scrollTo({ top: 0 });
  }, []);

  return { route, navigate };
};
