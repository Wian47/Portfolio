/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initPerfTier } from './utils/perf';

// Decide the rendering tier before the first paint so the CSS hook is already in place.
initPerfTier();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

/**
 * The private pages are a dynamic import rather than a branch inside App, so the
 * portfolio bundle everyone downloads carries none of their markup. Cloudflare
 * Workers serves index.html for these paths via `not_found_handling`, which is
 * why no router is needed for a handful of routes.
 *
 * The patterns are prefixes rather than exact paths, because the planner puts
 * the trip id in the URL and every route under `/build` has to resolve to it.
 */
const PRIVATE_ROUTES: [RegExp, () => Promise<{ default: React.ComponentType }>][] = [
  [/^\/build(\/.*)?$/, () => import('./components/trip/TripPage')]
];

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const matched = PRIVATE_ROUTES.find(([pattern]) => pattern.test(path));
const loadPrivate = matched === undefined ? undefined : matched[1];

if (loadPrivate) {
  loadPrivate().then(({ default: Page }) => {
    root.render(
      <React.StrictMode>
        <Page />
      </React.StrictMode>
    );
  });
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
