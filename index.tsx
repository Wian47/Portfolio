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
 */
const PRIVATE_ROUTES: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  '/build': () => import('./components/BuildPage')
};

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const loadPrivate = PRIVATE_ROUTES[path];

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
